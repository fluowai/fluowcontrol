import { Client } from 'ssh2'
import { decryptSecret } from './crypto.js'
import prisma from '../lib/prisma.js'

interface SshCredentials {
  host: string
  port: number
  username: string
  password?: string | null
  privateKey?: string | null
}

interface VpsMetricsSnapshot {
  cpuPercent: number | null
  ramUsedGb: number | null
  ramTotalGb: number | null
  diskUsedGb: number | null
  diskTotalGb: number | null
  diskUsedPct: number | null
  loadAverage: number[]
  uptimeSeconds: number | null
}

const COLLECT_COMMAND = `
set -o pipefail 2>/dev/null || true
echo "__DISK__"
df -P -B1 /
echo "__MEM__"
free -b
echo "__LOAD__"
cat /proc/loadavg
echo "__UPTIME__"
cat /proc/uptime
echo "__CPU__"
awk 'function readcpu(){getline < "/proc/stat"; idle=$5; total=0; for(i=2;i<=8;i++) total+=$i; close("/proc/stat")} BEGIN{readcpu(); idle1=idle; total1=total; system("sleep 1"); readcpu(); idle2=idle; total2=total; dt=total2-total1; di=idle2-idle1; if(dt>0) printf "%.2f\\n", (100*(dt-di)/dt); else print "0"}'
`.trim()

function connectAndRun(credentials: SshCredentials, command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    let stdout = ''
    let stderr = ''

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            conn.end()
            reject(err)
            return
          }

          stream
            .on('close', (code: number) => {
              conn.end()
              if (code && code !== 0 && stderr) {
                reject(new Error(stderr.trim()))
              } else {
                resolve(stdout)
              }
            })
            .on('data', (data: Buffer) => {
              stdout += data.toString()
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString()
            })
        })
      })
      .on('error', reject)
      .connect({
        host: credentials.host,
        port: credentials.port || 22,
        username: credentials.username,
        password: credentials.password || undefined,
        privateKey: credentials.privateKey || undefined,
        readyTimeout: 15000,
      })
  })
}

function section(raw: string, marker: string): string {
  const start = raw.indexOf(marker)
  if (start < 0) return ''
  const next = raw.indexOf('__', start + marker.length)
  return raw.slice(start + marker.length, next < 0 ? undefined : next).trim()
}

function bytesToGb(value: number): number {
  return Math.round((value / 1024 / 1024 / 1024) * 100) / 100
}

function parseMetrics(raw: string): VpsMetricsSnapshot {
  const diskLines = section(raw, '__DISK__').split(/\r?\n/).filter(Boolean)
  const diskParts = diskLines[1]?.trim().split(/\s+/) || []
  const diskTotal = Number(diskParts[1] || 0)
  const diskUsed = Number(diskParts[2] || 0)
  const diskPct = Number((diskParts[4] || '').replace('%', '')) || null

  const memLines = section(raw, '__MEM__').split(/\r?\n/).filter(Boolean)
  const memParts = memLines.find((line) => line.startsWith('Mem:'))?.trim().split(/\s+/) || []
  const memTotal = Number(memParts[1] || 0)
  const memUsed = Number(memParts[2] || 0)

  const loadAverage = section(raw, '__LOAD__')
    .split(/\s+/)
    .slice(0, 3)
    .map(Number)
    .filter((value) => Number.isFinite(value))

  const uptimeSeconds = Math.floor(Number(section(raw, '__UPTIME__').split(/\s+/)[0] || 0)) || null
  const cpuPercent = Number(section(raw, '__CPU__').split(/\s+/)[0])

  return {
    cpuPercent: Number.isFinite(cpuPercent) ? cpuPercent : null,
    ramUsedGb: memUsed ? bytesToGb(memUsed) : null,
    ramTotalGb: memTotal ? bytesToGb(memTotal) : null,
    diskUsedGb: diskUsed ? bytesToGb(diskUsed) : null,
    diskTotalGb: diskTotal ? bytesToGb(diskTotal) : null,
    diskUsedPct: diskPct,
    loadAverage,
    uptimeSeconds,
  }
}

export async function testVpsConnection(credentials: SshCredentials): Promise<{ ok: boolean; output?: string; error?: string }> {
  try {
    const output = await connectAndRun(credentials, 'hostname && uname -sr')
    return { ok: true, output: output.trim() }
  } catch (error: any) {
    return { ok: false, error: error.message || 'Falha ao conectar via SSH' }
  }
}

export async function collectVpsMetrics(hostId: string) {
  const host = await prisma.vpsHost.findUnique({ where: { id: hostId } })
  if (!host) throw new Error('VPS nao encontrada')

  try {
    const raw = await connectAndRun({
      host: host.host,
      port: host.port,
      username: host.username,
      password: decryptSecret(host.passwordEncrypted),
      privateKey: decryptSecret(host.privateKeyEncrypted),
    }, COLLECT_COMMAND)

    const metrics = parseMetrics(raw)
    const saved = await prisma.vpsMetric.create({
      data: {
        hostId,
        cpuPercent: metrics.cpuPercent,
        ramUsedGb: metrics.ramUsedGb,
        ramTotalGb: metrics.ramTotalGb,
        diskUsedGb: metrics.diskUsedGb,
        diskTotalGb: metrics.diskTotalGb,
        diskUsedPct: metrics.diskUsedPct,
        loadAverage: metrics.loadAverage,
        uptimeSeconds: metrics.uptimeSeconds,
        collectedAt: new Date(),
      },
    })

    await prisma.vpsHost.update({
      where: { id: hostId },
      data: { status: 'online', lastError: null, lastSeenAt: new Date() },
    })

    return saved
  } catch (error: any) {
    await prisma.vpsHost.update({
      where: { id: hostId },
      data: { status: 'offline', lastError: error.message || 'Falha ao coletar metricas por SSH' },
    })
    throw error
  }
}

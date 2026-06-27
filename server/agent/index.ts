import express from 'express'
import { execSync, exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'
import helmet from 'helmet'

const execAsync = promisify(exec)
const app = express()
const PORT = parseInt(process.env.FLUOW_AGENT_PORT || process.env.AGENT_PORT || '3001', 10)
const API_KEY = process.env.FLUOW_AGENT_API_KEY || ''
const DOCKER_TIMEOUT = parseInt(process.env.DOCKER_TIMEOUT_MS || '30000', 10)

app.use(express.json())
app.use(helmet())

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) return next()
  const key = req.headers['x-api-key']
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', status: 401 })
  }
  next()
}

app.use(auth)

// ─── Docker helpers ───────────────────────────────────────────────────────────

async function dockerCmd<T = any>(args: string, timeout?: number): Promise<T | null> {
  try {
    const { stdout } = await execAsync(`docker ${args}`, { timeout: timeout ?? DOCKER_TIMEOUT })
    return JSON.parse(stdout.trim()) as T
  } catch {
    return null
  }
}

async function dockerRaw(args: string, timeout?: number): Promise<string> {
  try {
    const { stdout } = await execAsync(`docker ${args}`, { timeout: timeout ?? DOCKER_TIMEOUT })
    return stdout.trim()
  } catch {
    return ''
  }
}

interface DockerContainerRaw {
  Id: string
  Names: string[]
  Image: string
  Status: string
  State: string
  Ports: Array<{ IP?: string; PrivatePort: number; PublicPort?: number; Type: string }>
  RestartCount: number
}

interface DockerStatsRaw {
  id: string
  name: string
  CPUPerc: string
  MemUsage: string
  MemPerc: string
  NetIO: string
}

function parseSize(s: string): number {
  if (!s) return 0
  const units: Record<string, number> = { B: 1, KB: 1024, MB: 1024 ** 2, GB: 1024 ** 3, TB: 1024 ** 4, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4 }
  const m = s.trim().match(/^([\d.]+)\s*([A-Za-z]+)?$/)
  if (!m) return 0
  return parseFloat(m[1]) * (units[m[2]] || 1)
}

function parsePercent(s: string): number {
  if (!s) return 0
  return parseFloat(s.replace('%', '')) || 0
}

async function getRealContainers() {
  // List containers
  const containers = await dockerCmd<DockerContainerRaw[]>('ps -a --format json --no-trunc 2>/dev/null || docker ps -a --format "{{json .}}" 2>/dev/null')
    ?? await (async () => {
      const raw = await dockerRaw('ps -a --format "{{json .}}"')
      if (!raw) return []
      try {
        return raw.split('\n').filter(Boolean).map(l => JSON.parse(l))
      } catch {
        return []
      }
    })()

  // Get stats (non-streaming)
  const statsRaw = await dockerRaw('stats --no-stream --format "{{json .}}"')
  const statsMap = new Map<string, DockerStatsRaw>()
  if (statsRaw) {
    statsRaw.split('\n').filter(Boolean).forEach(line => {
      try {
        const s = JSON.parse(line)
        statsMap.set(s.ID || s.id || s.Container, s)
      } catch {}
    })
  }

  return containers.map((c: any) => {
    const id = c.ID || c.Id || ''
    const name = (c.Names || c.Name || '').replace(/^\//, '')
    const state = (c.State || c.Status || '').toLowerCase()
    const isRunning = state === 'running' || (c.Status || '').toLowerCase().startsWith('up')

    const stats = statsMap.get(id) || statsMap.get(id.slice(0, 12)) || null
    const cpuPercent = stats ? parsePercent(stats.CPUPerc) : 0
    const memParts = stats?.MemUsage?.split('/') || []
    const memUsedBytes = memParts[0] ? parseSize(memParts[0].trim()) : 0
    const memLimitBytes = memParts[1] ? parseSize(memParts[1].trim()) : 0
    const netParts = stats?.NetIO?.split('/') || []
    const netRxBytes = netParts[0] ? parseSize(netParts[0].trim()) : 0
    const netTxBytes = netParts[1] ? parseSize(netParts[1].trim()) : 0

    // Parse ports
    let ports: Array<{ hostPort: number; containerPort: number; protocol: string }> = []
    if (typeof c.Ports === 'string' && c.Ports) {
      // e.g. "0.0.0.0:9000->9000/tcp, 0.0.0.0:9001->9001/tcp"
      ports = c.Ports.split(',').flatMap((p: string) => {
        const m = p.trim().match(/(\d+)->(\d+)\/(tcp|udp)/)
        if (m) return [{ hostPort: parseInt(m[1]), containerPort: parseInt(m[2]), protocol: m[3] }]
        return []
      })
    } else if (Array.isArray(c.Ports)) {
      ports = c.Ports.filter((p: any) => p.PublicPort).map((p: any) => ({
        hostPort: p.PublicPort || 0,
        containerPort: p.PrivatePort || 0,
        protocol: p.Type || 'tcp',
      }))
    }

    // Uptime from status string "Up 3 days" → seconds
    let uptimeSeconds = 0
    const uptimeMatch = (c.Status || '').match(/Up\s+((\d+)\s+(second|minute|hour|day|week|month)s?)/)
    if (uptimeMatch) {
      const n = parseInt(uptimeMatch[2])
      const u = uptimeMatch[3]
      const mul: Record<string, number> = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000 }
      uptimeSeconds = n * (mul[u] || 1)
    }

    const stateNorm = isRunning ? 'running'
      : state.includes('exit') ? 'exited'
      : state.includes('restart') ? 'restarting'
      : state.includes('paus') ? 'paused'
      : state.includes('creat') ? 'created'
      : state.includes('dead') ? 'dead'
      : 'exited'

    return {
      containerId: id.slice(0, 12),
      name,
      image: c.Image || '',
      status: c.Status || state,
      state: stateNorm,
      ports,
      cpuPercent: Math.round(cpuPercent * 10) / 10,
      memoryUsageMb: Math.round(memUsedBytes / (1024 * 1024) * 10) / 10,
      memoryLimitMb: Math.round(memLimitBytes / (1024 * 1024) * 10) / 10,
      networkRxMb: Math.round(netRxBytes / (1024 * 1024) * 10) / 10,
      networkTxMb: Math.round(netTxBytes / (1024 * 1024) * 10) / 10,
      uptimeSeconds,
      restartCount: c.RestartCount || 0,
      lastError: stateNorm === 'exited' ? (c.Status || null) : null,
      collectedAt: new Date().toISOString(),
    }
  })
}

function getHostMetrics() {
  const cpus = os.cpus()
  const ramTotal = os.totalmem()
  const ramFree = os.freemem()
  const ramUsed = ramTotal - ramFree
  const loadAvg = os.loadavg()
  const uptimeSeconds = Math.floor(os.uptime())

  // CPU usage: average of all cores idle
  let cpuPercent = 0
  try {
    const cpuTimes = cpus.map(c => c.times)
    const total = cpuTimes.reduce((s, t) => s + t.user + t.nice + t.sys + t.idle + t.irq, 0)
    const idle = cpuTimes.reduce((s, t) => s + t.idle, 0)
    cpuPercent = Math.round((1 - idle / total) * 100 * 10) / 10
  } catch {}

  // Disk usage via df
  let diskUsedGb = 0
  let diskTotalGb = 0
  try {
    const df = execSync('df -B1 / 2>/dev/null || df -BK / 2>/dev/null', { timeout: 3000 }).toString()
    const lines = df.trim().split('\n')
    const parts = lines[1]?.trim().split(/\s+/)
    if (parts && parts.length >= 4) {
      diskTotalGb = Math.round(parseInt(parts[1]) / (1024 ** 3) * 100) / 100
      diskUsedGb = Math.round(parseInt(parts[2]) / (1024 ** 3) * 100) / 100
    }
  } catch {}

  return {
    hostName: os.hostname(),
    cpuPercent,
    ramUsedGb: Math.round(ramUsed / (1024 ** 3) * 100) / 100,
    ramTotalGb: Math.round(ramTotal / (1024 ** 3) * 100) / 100,
    diskUsedGb,
    diskTotalGb,
    loadAverage: loadAvg.map(l => Math.round(l * 100) / 100),
    uptimeSeconds,
  }
}

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agent: 'fluow-agent', version: '2.0.0', uptime: process.uptime(), mode: 'real' })
})

app.get('/host/metrics', (_req, res) => {
  try {
    const metrics = getHostMetrics()
    // Expose both naming conventions for compatibility
    res.json({
      ...metrics,
      host_name: metrics.hostName,
      cpu_percent: metrics.cpuPercent,
      ram_used_gb: metrics.ramUsedGb,
      ram_total_gb: metrics.ramTotalGb,
      disk_used_gb: metrics.diskUsedGb,
      disk_total_gb: metrics.diskTotalGb,
      load_average: metrics.loadAverage,
      uptime_seconds: metrics.uptimeSeconds,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/containers', async (_req, res) => {
  try {
    const containers = await getRealContainers()
    res.json(containers)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/containers/:id', async (req, res) => {
  try {
    const containers = await getRealContainers()
    const container = containers.find(c => c.containerId === req.params.id || c.name === req.params.id || c.containerId.startsWith(req.params.id))
    if (!container) return res.status(404).json({ error: 'Container not found', status: 404 })
    res.json(container)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/containers/:id/logs', async (req, res) => {
  try {
    const lines = req.query.lines ? Math.min(Number(req.query.lines), 200) : 50
    const { stdout } = await execAsync(`docker logs --tail ${lines} --timestamps ${req.params.id} 2>&1`)
    res.json(stdout.split('\n').filter(Boolean))
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/containers/:id/restart', async (req, res) => {
  try {
    await execAsync(`docker restart ${req.params.id}`)
    res.json({ success: true, message: `Container ${req.params.id} restarted` })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/containers/:id/stop', async (req, res) => {
  try {
    await execAsync(`docker stop ${req.params.id}`)
    res.json({ success: true, message: `Container ${req.params.id} stopped` })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/containers/:id/start', async (req, res) => {
  try {
    await execAsync(`docker start ${req.params.id}`)
    res.json({ success: true, message: `Container ${req.params.id} started` })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

app.post('/prune', async (req, res) => {
  try {
    const { stdout } = await execAsync('docker system prune -af')
    res.json({ success: true, message: 'Docker system prune executado com sucesso', output: stdout })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})


app.get('/networks', async (_req, res) => {
  try {
    const raw = await dockerRaw('network ls --format "{{json .}}"')
    const networks = raw.split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line) } catch { return null }
    }).filter(Boolean).map((n: any) => ({
      id: n.ID || n.id,
      name: n.Name || n.name,
      driver: n.Driver || n.driver,
      scope: n.Scope || n.scope,
      subnet: '',
      gateway: '',
      containers: 0,
    }))
    res.json(networks)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/volumes', async (_req, res) => {
  try {
    const raw = await dockerRaw('volume ls --format "{{json .}}"')
    const volumes = raw.split('\n').filter(Boolean).map(line => {
      try { return JSON.parse(line) } catch { return null }
    }).filter(Boolean).map((v: any) => ({
      name: v.Name || v.name,
      driver: v.Driver || v.driver,
      mountpoint: v.Mountpoint || '',
      size: 0,
      status: 'in use',
    }))
    res.json(volumes)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`[FluowAgent] Running on port ${PORT} - MODE: REAL DOCKER`)
  console.log(`[FluowAgent] API key: ${API_KEY ? 'configured' : 'DISABLED (insecure)'}`)
})

export default app

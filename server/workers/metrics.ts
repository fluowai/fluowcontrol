import * as DockerService from '../services/docker.js'
import { PostgresService } from '../services/postgres.js'
import { SupabaseService } from '../services/supabase.js'
import { MinioService } from '../services/minio.js'
import prisma from '../lib/prisma.js'
const postgres = new PostgresService()
const supabase = new SupabaseService()
const minio = new MinioService()

export const CONTAINERS_INTERVAL = 10_000
export const HOST_INTERVAL = 30_000
export const POSTGRES_INTERVAL = 60_000
export const SUPABASE_INTERVAL = 60_000
export const MINIO_INTERVAL = 300_000
export const BILLING_INTERVAL = 900_000
export const HEALTHCHECK_INTERVAL = 120_000

export async function collectContainerMetrics(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const containers = await DockerService.getContainers()
    for (const c of containers) {
      await prisma.dockerContainer.upsert({
        where: { containerId: c.containerId },
        update: {
          name: c.name,
          image: c.image,
          status: c.status,
          state: c.state as any,
          ports: c.ports as any,
          cpuPercent: c.cpuPercent,
          memoryUsageMb: c.memoryUsageMb,
          memoryLimitMb: c.memoryLimitMb,
          networkRxMb: c.networkRxMb,
          networkTxMb: c.networkTxMb,
          uptimeSeconds: c.uptimeSeconds,
          restartCount: c.restartCount,
          lastError: c.lastError,
          collectedAt: new Date(),
        },
        create: {
          containerId: c.containerId,
          name: c.name,
          image: c.image,
          status: c.status,
          state: c.state as any,
          ports: c.ports as any,
          cpuPercent: c.cpuPercent,
          memoryUsageMb: c.memoryUsageMb,
          memoryLimitMb: c.memoryLimitMb,
          networkRxMb: c.networkRxMb,
          networkTxMb: c.networkTxMb,
          uptimeSeconds: c.uptimeSeconds,
          restartCount: c.restartCount,
          lastError: c.lastError,
          collectedAt: new Date(),
        },
      })
    }
    console.log(`[Metrics] ${ts} Container metrics collected: ${containers.length} containers`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectContainerMetrics failed:`, error)
  }
}

export async function collectHostMetrics(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const host = await DockerService.getHostMetrics()
    if (!host) {
      console.warn(`[Metrics] ${ts} No host metrics returned`)
      return
    }
    await prisma.infrastructureMetric.create({
      data: {
        hostName: host.hostName,
        cpuPercent: host.cpuPercent,
        ramUsedGb: host.ramUsedGb,
        ramTotalGb: host.ramTotalGb,
        diskUsedGb: host.diskUsedGb,
        diskTotalGb: host.diskTotalGb,
        loadAverage: host.loadAverage as any,
        uptimeSeconds: host.uptimeSeconds,
        collectedAt: new Date(),
      },
    })
    console.log(`[Metrics] ${ts} Host metrics collected: CPU ${host.cpuPercent}%`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectHostMetrics failed:`, error)
  }
}

export async function collectPostgresMetrics(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const metrics = await postgres.getAllMetrics()
    await prisma.postgresMetric.create({
      data: {
        databaseName: metrics.databaseName,
        sizeMb: metrics.sizeMb,
        activeConnections: metrics.activeConnections,
        idleConnections: metrics.idleConnections,
        maxConnections: metrics.maxConnections,
        slowQueries: metrics.slowQueries,
        cacheHitRatio: metrics.cacheHitRatio,
        locksCount: metrics.locksCount,
        collectedAt: new Date(),
      },
    })
    console.log(`[Metrics] ${ts} PostgreSQL metrics collected: ${metrics.activeConnections} active connections`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectPostgresMetrics failed:`, error)
  }
}

export async function collectSupabaseMetrics(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const metrics = await supabase.getAllMetrics()
    await prisma.supabaseMetric.create({
      data: {
        authUsers: metrics.authUsers,
        realtimeConnections: metrics.realtimeConnections,
        storageObjects: metrics.storageObjects,
        apiRequests1h: metrics.apiRequests1h,
        apiErrors1h: metrics.apiErrors1h,
        edgeInvocations1h: metrics.edgeInvocations1h,
        collectedAt: new Date(),
      },
    })
    console.log(`[Metrics] ${ts} Supabase metrics collected: ${metrics.authUsers} users`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectSupabaseMetrics failed:`, error)
  }
}

export async function collectMinioMetrics(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const buckets = await minio.listBuckets()
    for (const bucket of buckets) {
      const existing = await prisma.minioBucket.findFirst({
        where: { bucketName: bucket.name },
      })
      if (existing) {
        await prisma.minioBucket.update({
          where: { id: existing.id },
          data: {
            totalObjects: bucket.objects ?? 0,
            sizeMb: bucket.size ?? 0,
            collectedAt: new Date(),
          },
        })
      } else {
        await prisma.minioBucket.create({
          data: {
            bucketName: bucket.name,
            totalObjects: bucket.objects ?? 0,
            sizeMb: bucket.size ?? 0,
            status: 'active',
            collectedAt: new Date(),
          },
        })
      }
    }
    console.log(`[Metrics] ${ts} MinIO metrics collected: ${buckets.length} buckets`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectMinioMetrics failed:`, error)
  }
}

export async function collectHealthChecks(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const services = await prisma.service.findMany({
      where: { healthcheckUrl: { not: null } },
    })
    let checked = 0
    for (const service of services) {
      if (!service.healthcheckUrl) continue
      try {
        const start = Date.now()
        const response = await fetch(service.healthcheckUrl, { signal: AbortSignal.timeout(10_000) })
        const elapsed = Date.now() - start
        await prisma.apiHealthCheck.create({
          data: {
            serviceId: service.id,
            url: service.healthcheckUrl,
            method: 'GET',
            statusCode: response.status,
            responseTimeMs: elapsed,
            isOnline: response.ok,
            checkedAt: new Date(),
          },
        })
        checked++
      } catch (err) {
        await prisma.apiHealthCheck.create({
          data: {
            serviceId: service.id,
            url: service.healthcheckUrl,
            method: 'GET',
            statusCode: null,
            responseTimeMs: null,
            isOnline: false,
            errorMessage: (err as Error).message,
            checkedAt: new Date(),
          },
        })
        checked++
      }
    }
    console.log(`[Metrics] ${ts} Health checks completed: ${checked} services`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectHealthChecks failed:`, error)
  }
}

export async function collectBillingMetrics(): Promise<void> {
  const ts = new Date().toISOString()
  try {
    const now = new Date()
    const overdueInvoices = await prisma.invoice.updateMany({
      where: {
        status: 'pending',
        dueDate: { lt: now },
      },
      data: { status: 'overdue' },
    })
    if (overdueInvoices.count > 0) {
      const overdueOrgs = await prisma.invoice.findMany({
        where: { status: 'overdue', dueDate: { lt: now } },
        select: { organizationId: true },
        distinct: ['organizationId'],
      })
      for (const inv of overdueOrgs) {
        await prisma.organization.update({
          where: { id: inv.organizationId },
          data: { status: 'overdue' },
        })
      }
    }
    console.log(`[Metrics] ${ts} Billing metrics collected: ${overdueInvoices.count} invoices marked overdue`)
  } catch (error) {
    console.error(`[Metrics] ${ts} collectBillingMetrics failed:`, error)
  }
}

export async function collectAll(): Promise<void> {
  await Promise.all([
    collectContainerMetrics(),
    collectHostMetrics(),
    collectPostgresMetrics(),
    collectSupabaseMetrics(),
    collectMinioMetrics(),
    collectHealthChecks(),
    collectBillingMetrics(),
  ])
}

export function runMetricsWorker(): () => void {
  const intervals: NodeJS.Timeout[] = []

  const start = (fn: () => Promise<void>, ms: number, label: string) => {
    fn().catch((err) => console.error(`[Metrics] Initial ${label} failed:`, err))
    const id = setInterval(() => {
      fn().catch((err) => console.error(`[Metrics] Interval ${label} failed:`, err))
    }, ms)
    intervals.push(id)
  }

  start(collectContainerMetrics, CONTAINERS_INTERVAL, 'containers')
  start(collectHostMetrics, HOST_INTERVAL, 'host')
  start(collectPostgresMetrics, POSTGRES_INTERVAL, 'postgres')
  start(collectSupabaseMetrics, SUPABASE_INTERVAL, 'supabase')
  start(collectMinioMetrics, MINIO_INTERVAL, 'minio')
  start(collectHealthChecks, HEALTHCHECK_INTERVAL, 'healthchecks')
  start(collectBillingMetrics, BILLING_INTERVAL, 'billing')

  console.log('[Metrics] Worker started with all collection intervals')

  return () => {
    for (const id of intervals) clearInterval(id)
    console.log('[Metrics] Worker stopped')
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runMetricsWorker()
}

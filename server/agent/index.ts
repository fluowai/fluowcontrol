import express from 'express'
import crypto from 'crypto'

const app = express()
const PORT = parseInt(process.env.AGENT_PORT || '3001', 10)
const API_KEY = process.env.FLUOW_AGENT_API_KEY || ''

app.use(express.json())

function auth(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!API_KEY) return next()
  const key = req.headers['x-api-key']
  if (!key || key !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', status: 401 })
  }
  next()
}

app.use(auth)

const containers = [
  {
    containerId: 'c001',
    name: 'postgres-01',
    image: 'postgres:16-alpine',
    status: 'Up 14 days',
    state: 'running' as const,
    ports: [{ hostPort: 5432, containerPort: 5432, protocol: 'tcp' }],
    cpuPercent: 12.3,
    memoryUsageMb: 1840.5,
    memoryLimitMb: 4096,
    networkRxMb: 3421.8,
    networkTxMb: 1256.3,
    uptimeSeconds: 1209600,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c002',
    name: 'minio-01',
    image: 'minio/minio:latest',
    status: 'Up 14 days',
    state: 'running' as const,
    ports: [{ hostPort: 9000, containerPort: 9000, protocol: 'tcp' }, { hostPort: 9001, containerPort: 9001, protocol: 'tcp' }],
    cpuPercent: 8.7,
    memoryUsageMb: 512.2,
    memoryLimitMb: 2048,
    networkRxMb: 8920.4,
    networkTxMb: 15678.2,
    uptimeSeconds: 1209600,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c003',
    name: 'redis-cache',
    image: 'redis:7-alpine',
    status: 'Up 14 days',
    state: 'running' as const,
    ports: [{ hostPort: 6379, containerPort: 6379, protocol: 'tcp' }],
    cpuPercent: 4.1,
    memoryUsageMb: 128.0,
    memoryLimitMb: 1024,
    networkRxMb: 4500.2,
    networkTxMb: 3200.1,
    uptimeSeconds: 1209600,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c004',
    name: 'nexus-api',
    image: 'fluowai/nexus-api:2.4.1',
    status: 'Up 7 days',
    state: 'running' as const,
    ports: [{ hostPort: 3000, containerPort: 3000, protocol: 'tcp' }],
    cpuPercent: 22.8,
    memoryUsageMb: 356.7,
    memoryLimitMb: 1024,
    networkRxMb: 2150.6,
    networkTxMb: 1800.3,
    uptimeSeconds: 604800,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c005',
    name: 'gabinete-api',
    image: 'fluowai/gabinete-api:1.8.0',
    status: 'Up 3 days',
    state: 'running' as const,
    ports: [{ hostPort: 3001, containerPort: 3001, protocol: 'tcp' }],
    cpuPercent: 15.4,
    memoryUsageMb: 280.3,
    memoryLimitMb: 1024,
    networkRxMb: 980.4,
    networkTxMb: 720.1,
    uptimeSeconds: 259200,
    restartCount: 2,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c006',
    name: 'wooapi-instance-01',
    image: 'fluowai/wooapi:1.2.0',
    status: 'Up 14 days',
    state: 'running' as const,
    ports: [{ hostPort: 4001, containerPort: 4000, protocol: 'tcp' }],
    cpuPercent: 10.2,
    memoryUsageMb: 190.5,
    memoryLimitMb: 512,
    networkRxMb: 1200.0,
    networkTxMb: 890.5,
    uptimeSeconds: 1209600,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c007',
    name: 'wooapi-instance-02',
    image: 'fluowai/wooapi:1.2.0',
    status: 'Up 10 days',
    state: 'running' as const,
    ports: [{ hostPort: 4002, containerPort: 4000, protocol: 'tcp' }],
    cpuPercent: 9.8,
    memoryUsageMb: 175.2,
    memoryLimitMb: 512,
    networkRxMb: 980.3,
    networkTxMb: 650.8,
    uptimeSeconds: 864000,
    restartCount: 1,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c008',
    name: 'whatsapp-connector',
    image: 'fluowai/whatsapp-connector:3.0.1',
    status: 'Exited (137) 2 hours ago',
    state: 'exited' as const,
    ports: [{ hostPort: 5000, containerPort: 5000, protocol: 'tcp' }],
    cpuPercent: 0,
    memoryUsageMb: 0,
    memoryLimitMb: 1024,
    networkRxMb: 0,
    networkTxMb: 0,
    uptimeSeconds: 0,
    restartCount: 8,
    lastError: 'Exit code 137 - Out of memory',
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c009',
    name: 'fluow-control-center',
    image: 'fluowai/control-center:1.5.2',
    status: 'Up 14 days',
    state: 'running' as const,
    ports: [{ hostPort: 8080, containerPort: 80, protocol: 'tcp' }],
    cpuPercent: 18.5,
    memoryUsageMb: 420.0,
    memoryLimitMb: 1024,
    networkRxMb: 5670.2,
    networkTxMb: 4320.8,
    uptimeSeconds: 1209600,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c010',
    name: 'rabbitmq',
    image: 'rabbitmq:3.13-management',
    status: 'Up 14 days',
    state: 'running' as const,
    ports: [{ hostPort: 5672, containerPort: 5672, protocol: 'tcp' }, { hostPort: 15672, containerPort: 15672, protocol: 'tcp' }],
    cpuPercent: 6.3,
    memoryUsageMb: 280.0,
    memoryLimitMb: 2048,
    networkRxMb: 8900.0,
    networkTxMb: 7650.0,
    uptimeSeconds: 1209600,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c011',
    name: 'pgadmin',
    image: 'dpage/pgadmin4:latest',
    status: 'Restarting (1) 5 seconds ago',
    state: 'restarting' as const,
    ports: [{ hostPort: 5050, containerPort: 80, protocol: 'tcp' }],
    cpuPercent: 0.5,
    memoryUsageMb: 45.0,
    memoryLimitMb: 256,
    networkRxMb: 12.0,
    networkTxMb: 8.0,
    uptimeSeconds: 60,
    restartCount: 12,
    lastError: 'Restarting container',
    collectedAt: new Date().toISOString(),
  },
  {
    containerId: 'c012',
    name: 'nexus-worker',
    image: 'fluowai/nexus-worker:2.4.1',
    status: 'Up 7 days',
    state: 'running' as const,
    ports: [],
    cpuPercent: 35.2,
    memoryUsageMb: 520.8,
    memoryLimitMb: 2048,
    networkRxMb: 320.5,
    networkTxMb: 180.2,
    uptimeSeconds: 604800,
    restartCount: 0,
    lastError: null,
    collectedAt: new Date().toISOString(),
  },
]

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', agent: 'fluow-agent', version: '1.0.0', uptime: process.uptime() })
})

app.get('/host/metrics', (_req, res) => {
  const jitter = () => (Math.random() - 0.5) * 10
  res.json({
    host_name: 'fluow-server-01',
    cpu_percent: Math.round((45.2 + jitter()) * 10) / 10,
    ram_used_gb: Math.round((28.4 + (Math.random() - 0.5) * 4) * 10) / 10,
    ram_total_gb: 64.0,
    disk_used_gb: Math.round((1120.5 + (Math.random() - 0.5) * 20) * 10) / 10,
    disk_total_gb: 2500.0,
    load_average: [
      Math.round((1.2 + (Math.random() - 0.5) * 0.6) * 10) / 10,
      Math.round((0.8 + (Math.random() - 0.5) * 0.4) * 10) / 10,
      Math.round((0.5 + (Math.random() - 0.5) * 0.3) * 10) / 10,
    ],
    uptime_seconds: 1333200 + Math.floor(Math.random() * 100),
  })
})

app.get('/containers', (_req, res) => {
  const jittered = containers.map((c) => ({
    ...c,
    cpuPercent: c.state === 'running'
      ? Math.round((c.cpuPercent + (Math.random() - 0.5) * 6) * 10) / 10
      : c.cpuPercent,
    memoryUsageMb: c.state === 'running'
      ? Math.round((c.memoryUsageMb + (Math.random() - 0.5) * 40) * 10) / 10
      : c.memoryUsageMb,
    collectedAt: new Date().toISOString(),
  }))
  res.json(jittered)
})

app.get('/containers/:id', (req, res) => {
  const container = containers.find((c) => c.containerId === req.params.id || c.name === req.params.id)
  if (!container) {
    return res.status(404).json({ error: 'Container not found', status: 404 })
  }
  res.json({
    ...container,
    cpuPercent: container.state === 'running'
      ? Math.round((container.cpuPercent + (Math.random() - 0.5) * 6) * 10) / 10
      : container.cpuPercent,
    memoryUsageMb: container.state === 'running'
      ? Math.round((container.memoryUsageMb + (Math.random() - 0.5) * 40) * 10) / 10
      : container.memoryUsageMb,
    collectedAt: new Date().toISOString(),
  })
})

app.get('/containers/:id/logs', (req, res) => {
  const container = containers.find((c) => c.containerId === req.params.id || c.name === req.params.id)
  if (!container) {
    return res.status(404).json({ error: 'Container not found', status: 404 })
  }

  const lines = req.query.lines ? Math.min(Number(req.query.lines), 50) : 30
  const logSources = [
    `INFO  [${container.name}] Server started on port ${container.ports[0]?.containerPort ?? 3000}`,
    `INFO  [${container.name}] Database connection established`,
    `INFO  [${container.name}] Loading configuration from environment`,
    `DEBUG [${container.name}] Cache initialized with 0 entries`,
    `INFO  [${container.name}] Health check passed`,
    `INFO  [${container.name}] Request GET /api/status 200 12ms`,
    `INFO  [${container.name}] Request POST /api/data 201 45ms`,
    `DEBUG [${container.name}] Query executed in 3.2ms`,
    `WARN  [${container.name}] Memory usage at 75% of limit`,
    `INFO  [${container.name}] Scheduled job completed: cleanup`,
    `ERROR [${container.name}] Failed to connect to external service, retrying`,
    `INFO  [${container.name}] Retry attempt 1/3 succeeded`,
    `INFO  [${container.name}] Request GET /api/users 200 8ms`,
    `DEBUG [${container.name}] Processing queue item #${Math.floor(Math.random() * 1000)}`,
    `INFO  [${container.name}] WebSocket connection opened`,
    `INFO  [${container.name}] Request POST /api/sync 202 120ms`,
    `WARN  [${container.name}] Slow query detected: SELECT * FROM large_table (2300ms)`,
    `INFO  [${container.name}] Cache refreshed: ${Math.floor(Math.random() * 500)} entries`,
    `DEBUG [${container.name}] Worker pool: 4 active / 8 total`,
    `INFO  [${container.name}] Health check passed`,
  ]

  const logs: string[] = []
  const startTs = Date.now() - lines * 60000
  for (let i = 0; i < lines; i++) {
    const ts = new Date(startTs + i * 60000).toISOString()
    const msg = logSources[Math.floor(Math.random() * logSources.length)]
    logs.push(`${ts} ${msg}`)
  }

  res.json(logs)
})

app.post('/containers/:id/restart', (req, res) => {
  const container = containers.find((c) => c.containerId === req.params.id || c.name === req.params.id)
  if (!container) {
    return res.status(404).json({ error: 'Container not found', status: 404 })
  }
  res.json({ success: true, message: `Container ${container.name} restarted`, containerId: container.containerId })
})

app.post('/containers/:id/stop', (req, res) => {
  const container = containers.find((c) => c.containerId === req.params.id || c.name === req.params.id)
  if (!container) {
    return res.status(404).json({ error: 'Container not found', status: 404 })
  }
  res.json({ success: true, message: `Container ${container.name} stopped`, containerId: container.containerId })
})

app.post('/containers/:id/start', (req, res) => {
  const container = containers.find((c) => c.containerId === req.params.id || c.name === req.params.id)
  if (!container) {
    return res.status(404).json({ error: 'Container not found', status: 404 })
  }
  res.json({ success: true, message: `Container ${container.name} started`, containerId: container.containerId })
})

app.get('/networks', (_req, res) => {
  res.json([
    { id: 'net-01', name: 'fluow-bridge', driver: 'bridge', scope: 'local', subnet: '172.18.0.0/16', gateway: '172.18.0.1', containers: 12 },
    { id: 'net-02', name: 'fluow-frontend', driver: 'overlay', scope: 'swarm', subnet: '10.0.1.0/24', gateway: '10.0.1.1', containers: 4 },
    { id: 'net-03', name: 'fluow-backend', driver: 'overlay', scope: 'swarm', subnet: '10.0.2.0/24', gateway: '10.0.2.1', containers: 8 },
    { id: 'net-04', name: 'fluow-storage', driver: 'bridge', scope: 'local', subnet: '172.19.0.0/16', gateway: '172.19.0.1', containers: 3 },
    { id: 'net-05', name: 'default', driver: 'bridge', scope: 'local', subnet: '172.17.0.0/16', gateway: '172.17.0.1', containers: 2 },
  ])
})

app.get('/volumes', (_req, res) => {
  res.json([
    { name: 'postgres-data', driver: 'local', mountpoint: '/var/lib/docker/volumes/postgres-data/_data', size: 45_820, status: 'in use' },
    { name: 'minio-data', driver: 'local', mountpoint: '/var/lib/docker/volumes/minio-data/_data', size: 1_245_600, status: 'in use' },
    { name: 'redis-data', driver: 'local', mountpoint: '/var/lib/docker/volumes/redis-data/_data', size: 1_280, status: 'in use' },
    { name: 'nexus-uploads', driver: 'local', mountpoint: '/var/lib/docker/volumes/nexus-uploads/_data', size: 89_400, status: 'in use' },
    { name: 'gabinete-files', driver: 'local', mountpoint: '/var/lib/docker/volumes/gabinete-files/_data', size: 56_200, status: 'in use' },
    { name: 'rabbitmq-data', driver: 'local', mountpoint: '/var/lib/docker/volumes/rabbitmq-data/_data', size: 12_800, status: 'in use' },
    { name: 'backups', driver: 'local', mountpoint: '/mnt/backups/docker', size: 512_000, status: 'in use' },
  ])
})

app.listen(PORT, () => {
  console.log(`[FluowAgent] Running on port ${PORT} with API key ${API_KEY ? 'configured' : 'DISABLED (insecure)'}`)
})

export default app

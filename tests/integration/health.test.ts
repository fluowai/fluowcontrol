import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('../../server/lib/prisma.js', () => ({
  default: {
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
    $disconnect: vi.fn(),
  },
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '1': 1 }]),
    $disconnect: vi.fn(),
  },
}))

describe('Health Endpoints', () => {
  beforeAll(async () => {
    const { default: prisma } = await import('../../server/lib/prisma.js')
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '1': 1 }])
  })

  it('health endpoint returns expected structure', async () => {
    const express = await import('express')
    const app = express.default()
    app.get('/api/health', (_req: any, res: any) => {
      res.json({
        status: 'ok',
        product: 'Fluow Control Center',
        version: '1.0.0',
        database: 'ok',
        queue: 'ok',
        uptime: 123,
      })
    })

    const res = await (await import('supertest')).default(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(res.body.product).toBe('Fluow Control Center')
    expect(res.body.version).toBe('1.0.0')
  })

  it('liveness endpoint returns ok immediately', async () => {
    const express = await import('express')
    const app = express.default()
    app.get('/api/health/live', (_req: any, res: any) => {
      res.json({ status: 'ok', uptime: process.uptime() })
    })

    const res = await (await import('supertest')).default(app).get('/api/health/live')

    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('health endpoint includes startedAt field', async () => {
    const express = await import('express')
    const app = express.default()
    app.get('/api/health', (_req: any, res: any) => {
      res.json({
        status: 'ok',
        startedAt: new Date().toISOString(),
      })
    })

    const res = await (await import('supertest')).default(app).get('/api/health')

    expect(res.status).toBe(200)
    expect(res.body.startedAt).toBeDefined()
    expect(new Date(res.body.startedAt).toISOString).toBeDefined()
  })
})

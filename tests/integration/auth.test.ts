import { describe, it, expect, vi, beforeAll } from 'vitest'

vi.mock('../../server/lib/prisma.js', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}))

describe('Auth Routes', () => {
  beforeAll(async () => {
    vi.resetModules()
    process.env.JWT_SECRET = 'fluow-test-jwt-secret-not-for-production'
  })

  it('POST /api/auth/login returns 400 when email is missing', async () => {
    const express = await import('express')
    const app = express.default()
    app.use(express.default.json())

    const { registerRoutes } = await import('../../server/api/routes/auth.js')
    registerRoutes(app)

    const res = await (await import('supertest')).default(app)
      .post('/api/auth/login')
      .send({ password: 'somepass' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('MISSING_FIELDS')
  })

  it('POST /api/auth/login returns 400 when password is missing', async () => {
    const express = await import('express')
    const app = express.default()
    app.use(express.default.json())

    const { registerRoutes } = await import('../../server/api/routes/auth.js')
    registerRoutes(app)

    const res = await (await import('supertest')).default(app)
      .post('/api/auth/login')
      .send({ email: 'test@test.com' })

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('MISSING_FIELDS')
  })

  it('POST /api/auth/login returns 401 with invalid credentials', async () => {
    const { default: prisma } = await import('../../server/lib/prisma.js')
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null)

    const express = await import('express')
    const app = express.default()
    app.use(express.default.json())

    const { registerRoutes } = await import('../../server/api/routes/auth.js')
    registerRoutes(app)

    const res = await (await import('supertest')).default(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@test.com', password: 'wrongpass' })

    expect(res.status).toBe(401)
    expect(res.body.code).toBe('INVALID_CREDENTIALS')
  })
})

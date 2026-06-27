import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { validateBody, validateQuery, validateParams } from '../../server/api/middleware/validation.js'

function createMockRes() {
  let statusCode = 200
  let body: any = null
  return {
    status: vi.fn((code: number) => {
      statusCode = code
      return { json: vi.fn((b: any) => { body = b }) }
    }),
    getStatusCode: () => statusCode,
    getBody: () => body,
  }
}

describe('Validation Middleware', () => {
  describe('validateBody', () => {
    it('passes through valid data', () => {
      const schema = z.object({ name: z.string(), age: z.number() })
      const middleware = validateBody(schema)
      const req = { body: { name: 'John', age: 30 } } as any
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.body).toEqual({ name: 'John', age: 30 })
    })

    it('returns 400 for invalid data', () => {
      const schema = z.object({ name: z.string(), age: z.number() })
      const middleware = validateBody(schema)
      const req = { body: { name: 'John', age: 'not-a-number' } } as any
      const mockRes = createMockRes()
      const res = mockRes as any
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).not.toHaveBeenCalled()
    })

    it('strips unknown fields', () => {
      const schema = z.object({ name: z.string() })
      const middleware = validateBody(schema)
      const req = { body: { name: 'John', extra: 'should-be-stripped' } } as any
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
      const next = vi.fn()

      middleware(req, res, next)

      expect(next).toHaveBeenCalled()
      expect(req.body).toEqual({ name: 'John' })
      expect((req.body as any).extra).toBeUndefined()
    })
  })

  describe('validateQuery', () => {
    it('passes through valid query params', () => {
      const schema = z.object({ page: z.coerce.number().optional() })
      const middleware = validateQuery(schema)
      const req = { query: { page: '2' } } as any
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
      const next = vi.fn()

      middleware(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('validateParams', () => {
    it('passes through valid params', () => {
      const schema = z.object({ id: z.string().uuid() })
      const middleware = validateParams(schema)
      const req = { params: { id: '550e8400-e29b-41d4-a716-446655440000' } } as any
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() } as any
      const next = vi.fn()

      middleware(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })
})

import { describe, it, expect } from 'vitest'
import { AppError, errorHandler, notFoundHandler } from '../../server/lib/error-handler.js'

describe('Error Handler', () => {
  describe('AppError', () => {
    it('creates error with correct statusCode and message', () => {
      const err = new AppError(400, 'Bad request', 'BAD_REQUEST')
      expect(err.statusCode).toBe(400)
      expect(err.message).toBe('Bad request')
      expect(err.code).toBe('BAD_REQUEST')
      expect(err).toBeInstanceOf(Error)
    })

    it('uses default code INTERNAL_ERROR when not specified', () => {
      const err = new AppError(500, 'Server error')
      expect(err.code).toBe('INTERNAL_ERROR')
    })

    it('stores optional details', () => {
      const details = { field: 'email', reason: 'already exists' }
      const err = new AppError(409, 'Conflict', 'CONFLICT', details)
      expect(err.details).toEqual(details)
    })
  })

  describe('notFoundHandler', () => {
    it('returns 404 with proper structure', () => {
      const mockReq = { method: 'GET', url: '/api/nonexistent' } as any
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(404)
          return { json: (body: any) => {
            expect(body.error).toContain('/api/nonexistent')
            expect(body.code).toBe('NOT_FOUND')
          }}
        }
      } as any

      notFoundHandler(mockReq, mockRes)
    })
  })

  describe('errorHandler', () => {
    it('handles AppError with correct status', () => {
      const err = new AppError(403, 'Forbidden', 'FORBIDDEN')
      const mockReq = {} as any
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(403)
          return { json: (body: any) => {
            expect(body.error).toBe('Forbidden')
            expect(body.code).toBe('FORBIDDEN')
          }}
        }
      } as any

      errorHandler(err, mockReq, mockRes, {} as any)
    })

    it('handles unknown error with 500 in production', () => {
      const prevEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'
      const err = new Error('Something broke')
      const mockReq = {} as any
      const mockRes = {
        status: (code: number) => {
          expect(code).toBe(500)
          return { json: (body: any) => {
            expect(body.error).toBe('Erro interno do servidor')
            expect(body.code).toBe('INTERNAL_ERROR')
          }}
        }
      } as any

      errorHandler(err, mockReq, mockRes, {} as any)
      process.env.NODE_ENV = prevEnv
    })
  })
})

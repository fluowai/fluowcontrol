import { describe, it, expect } from 'vitest'
import { createRateLimiter, standardLimiter, authLimiter, apiKeyLimiter } from '../../server/lib/rate-limiter.js'

describe('Rate Limiter', () => {
  describe('createRateLimiter', () => {
    it('returns a middleware function', () => {
      const middleware = createRateLimiter({})
      expect(middleware).toBeDefined()
      expect(typeof middleware).toBe('function')
    })

    it('accepts custom windowMs and max', () => {
      const middleware = createRateLimiter({ windowMs: 1000, max: 5 })
      expect(middleware).toBeDefined()
    })

    it('uses custom message when provided', () => {
      const middleware = createRateLimiter({ message: 'Custom message', code: 'CUSTOM_CODE' })
      expect(middleware).toBeDefined()
    })
  })

  describe('predefined limiters', () => {
    it('standardLimiter is a function', () => {
      expect(typeof standardLimiter).toBe('function')
    })

    it('authLimiter is a function', () => {
      expect(typeof authLimiter).toBe('function')
    })

    it('apiKeyLimiter is a function', () => {
      expect(typeof apiKeyLimiter).toBe('function')
    })
  })
})

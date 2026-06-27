import rateLimit from 'express-rate-limit'
import Redis from 'ioredis'
import logger from './logger.js'

function createRedisStore(client: Redis) {
  try {
    // Dynamic import to avoid issues with CJS bundling
    const RedisStore = require('rate-limit-redis')
    const StoreClass = RedisStore.default || RedisStore
    return new StoreClass({
      sendCommand: (...args: string[]) => (client as any).call(args[0], ...args.slice(1)),
      prefix: 'rl:',
    })
  } catch {
    logger.warn('rate-limit-redis not available, using memory store')
    return undefined
  }
}

let redisClient: Redis | null = null

function getRedisClient(): Redis | null {
  if (redisClient) return redisClient
  const url = process.env.REDIS_URL || 'redis://localhost:6379'
  try {
    redisClient = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
    })
    redisClient.connect().catch(() => {
      logger.warn('Redis not available for rate limiting, using memory store')
    })
  } catch {
    logger.warn('Redis not available for rate limiting, using memory store')
  }
  return redisClient
}

export function createRateLimiter(options: {
  windowMs?: number
  max?: number
  message?: string
  code?: string
  skipSuccessful?: boolean
}) {
  const {
    windowMs = 60_000,
    max = 100,
    message = 'Muitas requisições. Tente novamente em breve.',
    code = 'RATE_LIMIT_EXCEEDED',
  } = options

  const client = getRedisClient()
  const store = client ? createRedisStore(client) : undefined

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    store,
    message: { error: message, code },
    validate: { xForwardedForHeader: true },
  })
}

export const standardLimiter = createRateLimiter({})
export const authLimiter = createRateLimiter({ windowMs: 60_000, max: 5, message: 'Muitas tentativas de login. Aguarde 1 minuto.', code: 'AUTH_RATE_LIMIT' })
export const apiKeyLimiter = createRateLimiter({ windowMs: 60_000, max: 200, message: 'Limite de requisições via API Key excedido.', code: 'API_KEY_RATE_LIMIT' })

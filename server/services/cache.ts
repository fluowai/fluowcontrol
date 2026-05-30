import Redis from 'ioredis'

interface CacheEntry {
  value: string
  expiresAt: number | null
}

export class CacheService {
  private redis: Redis | null = null
  private memory: Map<string, CacheEntry> = new Map()
  private redisAvailable = false

  constructor(redisUrl?: string) {
    const url = redisUrl || process.env.REDIS_URL || 'redis://localhost:6379'
    try {
      this.redis = new Redis(url, {
        lazyConnect: true,
        retryStrategy: (times) => {
          if (times > 3) return null
          return Math.min(times * 200, 2000)
        },
      })
      this.redis.connect().catch(() => {
        this.redisAvailable = false
      })
      this.redis.on('ready', () => { this.redisAvailable = true })
      this.redis.on('error', () => { this.redisAvailable = false })
      this.redis.on('end', () => { this.redisAvailable = false })
    } catch {
      this.redisAvailable = false
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.redisAvailable && this.redis) {
      try {
        return await this.redis.get(key)
      } catch {
        return this.getFromMemory(key)
      }
    }
    return this.getFromMemory(key)
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        if (ttlSeconds !== undefined) {
          await this.redis.setex(key, ttlSeconds, value)
        } else {
          await this.redis.set(key, value)
        }
        return
      } catch {
        // fallthrough to memory
      }
    }
    this.setInMemory(key, value, ttlSeconds)
  }

  async del(key: string): Promise<void> {
    if (this.redisAvailable && this.redis) {
      try {
        await this.redis.del(key)
        return
      } catch {
        // fallthrough
      }
    }
    this.memory.delete(key)
  }

  async exists(key: string): Promise<boolean> {
    if (this.redisAvailable && this.redis) {
      try {
        const result = await this.redis.exists(key)
        return result === 1
      } catch {
        return this.existsInMemory(key)
      }
    }
    return this.existsInMemory(key)
  }

  private getFromMemory(key: string): string | null {
    const entry = this.memory.get(key)
    if (!entry) return null
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memory.delete(key)
      return null
    }
    return entry.value
  }

  private setInMemory(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds !== undefined ? Date.now() + ttlSeconds * 1000 : null
    this.memory.set(key, { value, expiresAt })
  }

  private existsInMemory(key: string): boolean {
    const entry = this.memory.get(key)
    if (!entry) return false
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.memory.delete(key)
      return false
    }
    return true
  }
}

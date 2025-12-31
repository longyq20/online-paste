import Redis from 'ioredis'

interface RoomData {
  content: string
  version: number
  lastModified: string
}

// Simple in-memory storage for local development
class LocalStorage {
  private storage: Map<string, RoomData> = new Map()

  async get<T>(key: string): Promise<T | null> {
    return (this.storage.get(key) as T) || null
  }

  async set(key: string, value: RoomData, options?: { ex?: number }): Promise<void> {
    this.storage.set(key, value)

    // Simulate expiration
    if (options?.ex) {
      setTimeout(() => {
        this.storage.delete(key)
      }, options.ex * 1000)
    }
  }
}

// Redis adapter to match KV interface
class RedisAdapter {
  private client: Redis

  constructor(url: string) {
    this.client = new Redis(url, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    this.client.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    this.client.on('connect', () => {
      console.log('Redis connected successfully')
    })
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (error) {
      console.error('Redis get error:', error)
      return null
    }
  }

  async set(key: string, value: RoomData, options?: { ex?: number }): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (options?.ex) {
        await this.client.setex(key, options.ex, serialized)
      } else {
        await this.client.set(key, serialized)
      }
    } catch (error) {
      console.error('Redis set error:', error)
      throw error
    }
  }
}

// Export appropriate storage based on environment
let kvInstance: LocalStorage | RedisAdapter

if (process.env.REDIS_URL) {
  // Use Redis in production
  console.log('Using Redis for storage')
  kvInstance = new RedisAdapter(process.env.REDIS_URL)
} else {
  // Use local storage in development
  console.log('Using local in-memory storage for development')
  kvInstance = new LocalStorage()
}

export const kv = kvInstance

// Simple in-memory storage for local development
interface RoomData {
  content: string
  version: number
  lastModified: string
}

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

// Export either Vercel KV or local storage based on environment
let kvInstance: any

if (process.env.KV_REST_API_URL) {
  // Use Vercel KV in production
  const { kv: vercelKv } = require('@vercel/kv')
  kvInstance = vercelKv
} else {
  // Use local storage in development
  console.log('Using local in-memory storage for development')
  kvInstance = new LocalStorage()
}

export const kv = kvInstance

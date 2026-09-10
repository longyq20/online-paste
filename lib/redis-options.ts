import type { RedisOptions } from 'ioredis'

// Passing a URL string to ioredis 5 invokes its deprecated url.parse() helper.
// Parse it here and pass an options object to both Redis clients instead.
export function redisOptionsFromUrl(connectionUrl: string): RedisOptions {
  try {
    const url = new URL(connectionUrl)
    if (!['redis:', 'rediss:'].includes(url.protocol) || !url.hostname) {
      throw new Error('Unsupported Redis URL')
    }

    // Preserve ioredis URL query options; explicit URL fields take precedence.
    const options: RedisOptions = {
      ...Object.fromEntries(url.searchParams),
      host: url.hostname.replace(/^\[|\]$/g, ''),
    }
    const port = url.port || options.port || 6379
    if (!/^\d+$/.test(String(port)) || Number(port) < 1 || Number(port) > 65535) {
      throw new Error('Invalid Redis port')
    }
    options.port = Number(port)

    if (url.username || url.password) {
      options.username = decodeURIComponent(url.username)
      options.password = decodeURIComponent(url.password)
    }

    const database = url.pathname.slice(1) || options.db || 0
    if (!/^\d+$/.test(String(database)) || !Number.isSafeInteger(Number(database))) {
      throw new Error('Invalid Redis database')
    }
    options.db = Number(database)

    if (options.family !== undefined) {
      const family = Number(options.family)
      if (![0, 4, 6].includes(family)) throw new Error('Invalid address family')
      options.family = family
    }
    if (url.protocol === 'rediss:') options.tls = {}

    return options
  } catch {
    // URL/decoding exceptions can include the input, which contains credentials.
    throw new Error('REDIS_URL must be a valid redis:// or rediss:// connection URL')
  }
}

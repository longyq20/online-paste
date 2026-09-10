import { NextRequest, NextResponse } from 'next/server'
import Redis from 'ioredis'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

function respond(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  })
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return respond({ ok: false, error: 'Cron is not configured' }, 503)
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return respond({ ok: false, error: 'Unauthorized' }, 401)
  }

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    return respond({ ok: false, error: 'Redis is not configured' }, 503)
  }

  let redis: Redis | undefined
  try {
    // A short-lived connection keeps cron failures bounded and avoids holding
    // a connection for the rest of the day. Only authenticated requests connect.
    redis = new Redis(redisUrl, {
      lazyConnect: true,
      connectTimeout: 5000,
      commandTimeout: 5000,
      maxRetriesPerRequest: 0,
      retryStrategy: () => null,
    })
    // Handle the client's error event without logging URLs or credentials.
    redis.on('error', () => {})

    const lastKeepAlive = new Date().toISOString()
    // Real write traffic resets inactivity. Overwrite one bounded key, separate
    // from room:* data, and let it expire if this deployment stops running.
    const result = await redis.set('online-paste:keepalive', lastKeepAlive, 'EX', 3 * 24 * 60 * 60)
    if (result !== 'OK') throw new Error('Heartbeat was not acknowledged')

    console.info('Redis keep-alive succeeded', lastKeepAlive)
    return respond({ ok: true, lastKeepAlive }, 200)
  } catch {
    console.error('Redis keep-alive failed')
    return respond({ ok: false, error: 'Redis keep-alive failed' }, 503)
  } finally {
    redis?.disconnect()
  }
}

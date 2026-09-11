import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

interface RoomData {
  content: string
  version: number
  lastModified: string
}
interface ChatUser { uid: string; ownerUid: string; id: number; name: string; color: string; text: string; status: 'editing' | 'done' }

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const mode = new URL(request.url).searchParams.get('mode') === 'chat' ? 'chat' : 'sync'
    const roomKey = `room:${mode}:${roomId}`
    if (mode === 'chat') return NextResponse.json({ mode, users: (await kv.get<ChatUser[]>(roomKey)) || [] })

    // Get room data from KV
    const roomData = await kv.get<RoomData>(roomKey)

    if (!roomData) {
      // Return empty room if it doesn't exist
      return NextResponse.json({
        content: '',
        version: 0,
        lastModified: new Date().toISOString(),
        mode,
      })
    }

      return NextResponse.json({ ...roomData, mode })
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json(
      { error: 'Failed to fetch room data' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ roomId: string }> }
) {
  try {
    const { roomId } = await context.params
    const body = await request.json()
    const { content } = body
    const mode = new URL(request.url).searchParams.get('mode') === 'chat' ? 'chat' : 'sync'
    const roomKey = `room:${mode}:${roomId}`
    if (mode === 'chat') {
      const users = (await kv.get<ChatUser[]>(roomKey)) || []
      const removeUids = Array.isArray(body.removeUids) ? body.removeUids.filter((uid: unknown) => typeof uid === 'string') : []
      const ownerUid = typeof body.ownerUid === 'string' ? body.ownerUid : ''
      const remaining = users.filter(user => !(removeUids.includes(user.uid) && user.ownerUid === ownerUid))
      const incoming = body.user && typeof body.user.uid === 'string' ? [body.user] : (Array.isArray(body.users) ? body.users.filter((user: ChatUser) => user && typeof user.uid === 'string') : [])
      const merged = new Map(remaining.map(user => [user.uid, user]))
      for (const user of incoming) merged.set(user.uid, user)
      const next = Array.from(merged.values())
      await kv.set(roomKey, next, { ex: 60 * 60 * 24 * 7 })
      return NextResponse.json({ mode, users: next })
    }

    // Get current version
    const currentData = await kv.get<RoomData>(roomKey)
    const newVersion = (currentData?.version || 0) + 1

    const roomData: RoomData = {
      content,
      version: newVersion,
      lastModified: new Date().toISOString(),
    }

    // Save to KV with 7 days expiration
    await kv.set(roomKey, roomData, { ex: 60 * 60 * 24 * 7 })

    return NextResponse.json({ ...roomData, mode })
  } catch (error) {
    console.error('Error saving room:', error)
    return NextResponse.json(
      { error: 'Failed to save room data' },
      { status: 500 }
    )
  }
}

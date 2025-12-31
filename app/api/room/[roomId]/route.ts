import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@/lib/kv'

interface RoomData {
  content: string
  version: number
  lastModified: string
}

export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params

    // Get room data from KV
    const roomData = await kv.get<RoomData>(`room:${roomId}`)

    if (!roomData) {
      // Return empty room if it doesn't exist
      return NextResponse.json({
        content: '',
        version: 0,
        lastModified: new Date().toISOString(),
      })
    }

    return NextResponse.json(roomData)
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
  { params }: { params: { roomId: string } }
) {
  try {
    const { roomId } = params
    const { content } = await request.json()

    // Get current version
    const currentData = await kv.get<RoomData>(`room:${roomId}`)
    const newVersion = (currentData?.version || 0) + 1

    const roomData: RoomData = {
      content,
      version: newVersion,
      lastModified: new Date().toISOString(),
    }

    // Save to KV with 7 days expiration
    await kv.set(`room:${roomId}`, roomData, { ex: 60 * 60 * 24 * 7 })

    return NextResponse.json(roomData)
  } catch (error) {
    console.error('Error saving room:', error)
    return NextResponse.json(
      { error: 'Failed to save room data' },
      { status: 500 }
    )
  }
}

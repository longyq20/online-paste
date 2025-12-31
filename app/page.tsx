'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function Home() {
  const [roomId, setRoomId] = useState('')
  const router = useRouter()

  const createRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 10)
    router.push(`/room/${newRoomId}`)
  }

  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim()) {
      router.push(`/room/${roomId.trim()}`)
    }
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>Online Paste</h1>
        <p className={styles.description}>
          Real-time clipboard sharing platform
        </p>

        <div className={styles.actions}>
          <button onClick={createRoom} className={styles.createButton}>
            Create New Room
          </button>

          <div className={styles.divider}>
            <span>OR</span>
          </div>

          <form onSubmit={joinRoom} className={styles.joinForm}>
            <input
              type="text"
              placeholder="Enter room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className={styles.input}
            />
            <button type="submit" className={styles.joinButton}>
              Join Room
            </button>
          </form>
        </div>

        <div className={styles.features}>
          <div className={styles.feature}>
            <h3>🚀 Real-time Sync</h3>
            <p>Changes sync instantly across all connected clients</p>
          </div>
          <div className={styles.feature}>
            <h3>🔒 Room-based</h3>
            <p>Private rooms with unique IDs for secure sharing</p>
          </div>
          <div className={styles.feature}>
            <h3>💾 Persistent</h3>
            <p>Content is saved and persists across sessions</p>
          </div>
        </div>
      </main>
    </div>
  )
}

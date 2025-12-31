'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import styles from './page.module.css'

export default function RoomPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [content, setContent] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [remoteVersion, setRemoteVersion] = useState(0)

  const contentRef = useRef(content)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const pollIntervalRef = useRef<NodeJS.Timeout>()

  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Fetch room content
  const fetchContent = useCallback(async (isInitial = false) => {
    try {
      const response = await fetch(`/api/room/${roomId}`)
      if (response.ok) {
        const data = await response.json()

        // Only update if version is newer and content is different
        if (data.version > remoteVersion || isInitial) {
          setRemoteVersion(data.version)

          // Only update content if it's different from current
          if (data.content !== contentRef.current) {
            setContent(data.content || '')
          }

          if (data.lastModified) {
            setLastSaved(new Date(data.lastModified))
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch content:', error)
    }
  }, [roomId, remoteVersion])

  // Save content to server
  const saveContent = useCallback(async (newContent: string) => {
    setIsSyncing(true)
    try {
      const response = await fetch(`/api/room/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newContent }),
      })

      if (response.ok) {
        const data = await response.json()
        setRemoteVersion(data.version)
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Failed to save content:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [roomId])

  // Handle content change with debounced save
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce save by 1 second
    saveTimeoutRef.current = setTimeout(() => {
      saveContent(newContent)
    }, 1000)
  }

  // Copy room ID to clipboard
  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Initial load
  useEffect(() => {
    fetchContent(true)
  }, [])

  // Set up polling for real-time sync
  useEffect(() => {
    pollIntervalRef.current = setInterval(() => {
      fetchContent()
    }, 2000) // Poll every 2 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [fetchContent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.roomInfo}>
          <h1 className={styles.roomTitle}>Room</h1>
          <div className={styles.roomId}>{roomId}</div>
          <button
            onClick={copyRoomId}
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          >
            {copied ? '✓ Copied!' : 'Copy ID'}
          </button>
        </div>
        <Link href="/" className={styles.backButton}>
          ← Back to Home
        </Link>
      </div>

      <div className={styles.editorContainer}>
        <div className={styles.editorHeader}>
          <h2 className={styles.editorTitle}>Shared Clipboard</h2>
          <div className={styles.status}>
            <div className={`${styles.statusDot} ${isSyncing ? styles.syncing : ''}`}></div>
            <span>{isSyncing ? 'Syncing...' : 'Synced'}</span>
          </div>
        </div>

        <textarea
          className={styles.textarea}
          value={content}
          onChange={handleContentChange}
          placeholder="Start typing... Your content will be synced in real-time with all users in this room."
        />

        <div className={styles.footer}>
          <div className={styles.charCount}>
            {content.length} characters
          </div>
          {lastSaved && (
            <div className={styles.lastSaved}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

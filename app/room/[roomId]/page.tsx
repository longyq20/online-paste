'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Icon from '../../components/ui-icon'
import styles from './page.module.css'

export default function RoomPage() {
  const params = useParams()
  const roomId = params.roomId as string

  const [content, setContent] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [copied, setCopied] = useState(false)
  const [remoteVersion, setRemoteVersion] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const [contentCopied, setContentCopied] = useState(false)
  const [contentCopyError, setContentCopyError] = useState(false)
  const syncError = loadError || saveError

  const contentRef = useRef(content)
  const saveTimeoutRef = useRef<NodeJS.Timeout>()
  const pollIntervalRef = useRef<NodeJS.Timeout>()
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout>>()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content
  }, [content])

  // Fetch room content
  const fetchContent = useCallback(async (isInitial = false) => {
    try {
      const response = await fetch(`/api/room/${roomId}`)
      if (!response.ok) throw new Error('Unable to load room')
      if (response.ok) {
        const data = await response.json()
        setLoaded(true)
        setLoadError(false)

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
      setLoadError(true)
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
      if (!response.ok) throw new Error('Unable to save room')

      if (response.ok) {
        const data = await response.json()
        setRemoteVersion(data.version)
        setLastSaved(new Date())
        setSaveError(false)
      }
    } catch (error) {
      setSaveError(true)
      console.error('Failed to save content:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [roomId])

  // Handle content change with debounced save
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    setIsSyncing(true)

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
      setCopyError(false)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      setCopyError(true)
      console.error('Failed to copy:', error)
    }
  }

  const copyContent = async () => {
    if (!content) return
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
    setContentCopied(false)
    setContentCopyError(false)
    try {
      await navigator.clipboard.writeText(content)
      setContentCopied(true)
      copiedTimeoutRef.current = setTimeout(() => setContentCopied(false), 2000)
    } catch {
      // Keep manual copying available when the browser denies clipboard access.
      textareaRef.current?.focus()
      textareaRef.current?.select()
      setContentCopyError(true)
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
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [])

  return (
    <main id="main-content" className={styles.container}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb"><Link href="/">Workspace</Link><span>/</span><span>Room</span></nav>
      <div className={styles.header}>
        <div>
          <div className={styles.eyebrow}>ONE ROOM. ALL YOUR DEVICES.</div>
          <h1 className={styles.roomTitle}><span className={styles.desktopTitle}>Your shared clipboard.</span><span className={styles.mobileTitle}>Clipboard</span></h1>
          <p className={styles.description}>Paste something here. Pick it up on your next device.</p>
        </div>
        <Link href="/" className={styles.backButton} aria-label="Back to Home"><Icon name="back" size={16} /><span className={styles.backLabel}>Back to Home</span></Link>
      </div>
      <div className={styles.roomBar}>
        <div className={styles.roomIdentity}><span className={styles.roomLabel}>ROOM ID</span><code className={styles.roomId}>{roomId}</code>
          <button
            onClick={copyRoomId}
            className={`${styles.copyButton} ${copied ? styles.copied : ''}`}
          >
            <Icon name={copied ? 'check' : 'copy'} size={15} />{copied ? 'Copied!' : 'Copy ID'}
          </button>
        </div>
        <span className={styles.shareHint}><Icon name="link" size={14} />Share this ID to connect another device</span>
      </div>
      {copyError && <p className={styles.error} role="alert">Could not copy. Select and copy the room ID above.</p>}

      <div className={styles.editorContainer}>
        <div className={styles.editorHeader}>
          <h2 className={styles.editorTitle}><Icon name="clipboard" size={17} />Editor</h2>
          <div className={styles.editorActions}>
            <div className={`${styles.status} ${syncError ? styles.statusError : ''}`} role="status">
              <div className={`${styles.statusDot} ${isSyncing || !loaded ? styles.syncing : ''}`}></div>
              <span>{syncError ? 'Connection error' : !loaded ? 'Connecting...' : isSyncing ? 'Saving...' : 'Synced'}</span>
            </div>
            <button
              type="button"
              onClick={copyContent}
              disabled={!content}
              className={`${styles.copyContentButton} ${contentCopied ? styles.copied : ''}`}
              aria-label={contentCopied ? 'Clipboard content copied' : 'Copy all text'}
              title="Copy all text"
            >
              <Icon name={contentCopied ? 'check' : 'copy'} size={15} />
              <span aria-live="polite">{contentCopied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
        {syncError && <p className={styles.error} role="alert">Unable to sync. Keep this page open and check your connection. Edit again to retry saving.</p>}
        {contentCopyError && <p className={styles.error} role="alert">Automatic copy was blocked. The text is selected; use your device’s Copy action.</p>}

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          aria-label="Shared Clipboard"
          value={content}
          onChange={handleContentChange}
          placeholder={'Start with a paste, a link, or a thought…\n\nEverything here is shared with your room.'}
        />

        <div className={styles.footer}>
          <div className={styles.charCount}>
            <span className={styles.plainText}>Plain text</span>{content.length.toLocaleString()} characters
          </div>
          {lastSaved && (
            <div className={styles.lastSaved}>
              Last saved: {lastSaved.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      <footer className={styles.pageFooter}><span><Icon name="sync" size={13} />Changes save automatically as you type.</span><span>Anyone with the room ID can view and edit.</span></footer>
    </main>
  )
}

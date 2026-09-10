'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from './components/ui-icon'
import styles from './page.module.css'

export default function Home() {
  const [roomId, setRoomId] = useState('')
  const router = useRouter()
  const createRoom = () => router.push(`/room/${Math.random().toString(36).substring(2, 10)}`)
  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim()) router.push(`/room/${encodeURIComponent(roomId.trim())}`)
  }
  return <main id="main-content" className={styles.main}>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.intro}>
        <div className={styles.eyebrow}><span /> ONE CLIPBOARD. ANY DEVICE.</div>
        <h1 id="hero-title" className={styles.title}>Your clipboard.<br /><span>Everywhere.</span></h1>
        <p className={styles.description}>A simple space for the things you want to share.<br className={styles.desktopBreak} /> Paste on one device. Pick it up on another.</p>
        <div className={styles.benefits}><span><Icon name="check" size={14} /> No sign-up</span><span><Icon name="check" size={14} /> Auto-saved</span><span><Icon name="check" size={14} /> Always in sync</span></div>
        <div className={styles.flow} aria-hidden="true"><div className={styles.device}><Icon name="monitor" size={19} /><span>Your laptop</span></div><div className={styles.connection}><span /><Icon name="sync" size={16} /><span /></div><div className={styles.device}><Icon name="clipboard" size={19} /><span>Any device</span></div></div>
      </div>
      <div className={styles.workspace}>
        <div className={styles.cardTop}><span className={styles.cardIcon}><Icon name="clipboard" size={20} /></span><span>YOUR SHARED SPACE</span><span className={styles.cardIndex}>01 /</span></div>
        <h2>Start sharing.</h2><p>Create a room. Bring your devices together.</p>
        <button onClick={createRoom} className={styles.createButton}><Icon name="plus" />Create New Room<Icon name="arrow" /></button>
        <div className={styles.divider}><span />or join an existing room<span /></div>
        <form onSubmit={joinRoom} className={styles.joinForm}><label htmlFor="room-id">Room ID</label><div className={styles.inputRow}><span className={styles.inputPrefix}>#</span><input id="room-id" type="text" placeholder="Enter room ID" value={roomId} onChange={(e) => setRoomId(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required /><button type="submit" disabled={!roomId.trim()}>Join<Icon name="arrow" size={16} /></button></div></form>
        <div className={styles.cardNote}><Icon name="link" size={14} /><span>The same room ID connects all your devices.</span></div>
      </div>
    </section>
    <section className={styles.features} aria-label="How Online Paste works">
      <article className={styles.feature}><div className={styles.featureTop}><Icon name="sync" size={21} /><span>01</span></div><h2>Less sending. More syncing.</h2><p>Text, links, or a quick thought. Changes automatically appear across devices.</p></article>
      <article className={styles.feature}><div className={styles.featureTop}><Icon name="link" size={21} /><span>02</span></div><h2>A room to connect.</h2><p>Share your room ID to get started. Anyone with the ID can view and edit.</p></article>
      <article className={styles.feature}><div className={styles.featureTop}><Icon name="clock" size={21} /><span>03</span></div><h2>Pick up where you left off.</h2><p>Your changes are saved automatically. Come back to the same room to continue.</p></article>
    </section>
    <footer className={styles.footer}><span>Online Paste <span className={styles.footerSlash}>/</span> A small tool for a smoother day.</span><span>Copy. Paste. Connected.</span></footer>
  </main>
}

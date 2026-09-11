'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Icon from './components/ui-icon'
import styles from './page.module.css'

export default function Home() {
  const [roomId, setRoomId] = useState('')
  const [joinMode, setJoinMode] = useState<'sync' | 'chat'>('sync')
  const router = useRouter()
  const createRoom = (mode: 'sync' | 'chat' = 'sync') => router.push(`/room/${Math.random().toString(36).substring(2, 10)}?mode=${mode}`)
  const joinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (roomId.trim()) router.push(`/room/${encodeURIComponent(roomId.trim())}?mode=${joinMode}`)
  }
  return <main id="main-content" className={styles.main}>
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.intro}>
        <div className={styles.eyebrow}><span /> 一段文字。随处可用。</div>
        <h1 id="hero-title" className={styles.title}>你的内容。<br /><span>随时随地。</span></h1>
        <p className={styles.description}>一个简单的共享空间。<br className={styles.desktopBreak} />在一台设备粘贴，在另一台设备取用。</p>
        <div className={styles.benefits}><span><Icon name="check" size={14} /> 无需注册</span><span><Icon name="check" size={14} /> 自动保存</span><span><Icon name="check" size={14} /> 始终同步</span></div>
        <div className={styles.flow} aria-hidden="true"><div className={styles.device}><Icon name="monitor" size={19} /><span>你的电脑</span></div><div className={styles.connection}><span /><Icon name="sync" size={16} /><span /></div><div className={styles.device}><Icon name="clipboard" size={19} /><span>任意设备</span></div></div>
      </div>
      <div className={styles.workspace}>
        <div className={styles.cardTop}><span className={styles.cardIcon}><Icon name="clipboard" size={20} /></span><span>选择工作区</span><span className={styles.cardIndex}>01 / 03</span></div>
        <h2>你想做什么？</h2><p>选择模式，通过一个房间链接邀请其他人。</p>
        <div className={styles.modeButtons}>
          <button onClick={() => createRoom('sync')} className={styles.modeButton}><span className={styles.modeIcon}><Icon name="sync" size={18} /></span><span><b>即时同步</b><small>跨设备同步同一段文本</small></span><Icon name="arrow" size={16} /></button>
          <button onClick={() => createRoom('chat')} className={`${styles.modeButton} ${styles.modeChat}`}><span className={styles.modeIcon}><Icon name="link" size={18} /></span><span><b>即时聊天</b><small>每个人拥有独立编辑器</small></span><Icon name="arrow" size={16} /></button>
          <button type="button" className={`${styles.modeButton} ${styles.modeSoon}`} disabled><span className={styles.modeIcon}><Icon name="clock" size={18} /></span><span><b>敬请期待</b><small>更多协作方式即将到来</small></span><span className={styles.soonTag}>SOON</span></button>
        </div>
        <div className={styles.divider}><span />或加入已有房间<span /></div>
        <form onSubmit={joinRoom} className={styles.joinForm}><label htmlFor="room-id">房间号</label><div className={styles.modeChoice} role="group" aria-label="选择房间模式"><button type="button" className={joinMode === 'sync' ? styles.modeChoiceActive : ''} onClick={() => setJoinMode('sync')}>即时同步</button><button type="button" className={joinMode === 'chat' ? styles.modeChoiceActive : ''} onClick={() => setJoinMode('chat')}>即时聊天</button></div><div className={styles.inputRow}><span className={styles.inputPrefix}>#</span><input id="room-id" type="text" placeholder="输入房间号" value={roomId} onChange={(e) => setRoomId(e.target.value)} autoComplete="off" autoCapitalize="none" spellCheck={false} required /><button type="submit" disabled={!roomId.trim()}>进入<Icon name="arrow" size={16} /></button></div></form>
        <div className={styles.cardNote}><Icon name="link" size={14} /><span>相同房间号可连接你的所有设备。</span></div>
      </div>
    </section>
    <section className={styles.features} aria-label="使用说明">
      <article className={styles.feature}><div className={styles.featureTop}><Icon name="sync" size={21} /><span>01</span></div><h2>少一些发送，多一些同步。</h2><p>文字、链接或灵感，修改后会自动出现在你的其他设备上。</p></article>
      <article className={styles.feature}><div className={styles.featureTop}><Icon name="link" size={21} /><span>02</span></div><h2>用房间连接彼此。</h2><p>分享房间号即可开始，拥有房间号的人都可以查看和编辑。</p></article>
      <article className={styles.feature}><div className={styles.featureTop}><Icon name="clock" size={21} /><span>03</span></div><h2>随时继续。</h2><p>内容会自动保存，回到同一个房间即可继续使用。</p></article>
    </section>
    <footer className={styles.footer}><span>Online Paste <span className={styles.footerSlash}>/</span> 让每一天更顺畅的小工具。</span><span>复制。粘贴。连接。</span></footer>
  </main>
}

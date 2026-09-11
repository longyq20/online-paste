'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import Icon from '../../components/ui-icon'
import styles from './page.module.css'

type Participant = { uid: string; ownerUid: string; id: number; name: string; color: string; text: string; status: 'editing' | 'done' }
const colors = ['#3b82f6', '#e879f9', '#22c55e', '#f97316', '#eab308', '#14b8a6']
// Keep identity generation compatible with older mobile browsers and plain HTTP.
const makeId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

export default function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const searchParams = useSearchParams()
  const [serverMode, setServerMode] = useState<string | null>(null)
  const requestedMode = searchParams.get('mode')
  const isChat = requestedMode ? requestedMode === 'chat' : serverMode === 'chat'
  const [ownUid, setOwnUid] = useState('local-self')
  const [users, setUsers] = useState<Participant[]>([{ uid: 'local-self', ownerUid: 'local-self', id: 1, name: '你', color: colors[0], text: '', status: 'editing' }])
  const [nextId, setNextId] = useState(2)
  const [copied, setCopied] = useState(false)
  const [copiedEditor, setCopiedEditor] = useState<number | null>(null)
  const [syncState, setSyncState] = useState<'syncing' | 'synced'>('syncing')
  const localVersion = useRef(0)
  const dirty = useRef(false)
  const total = useMemo(() => users.reduce((n, user) => n + user.text.length, 0), [users])
  useEffect(() => {
    const key = 'online-paste-user-id'
    let uid = ''
    try { uid = sessionStorage.getItem(key) || `user-${makeId()}`; sessionStorage.setItem(key, uid) } catch { uid = `user-${makeId()}` }
    setUsers(value => value.map(user => user.uid === 'local-self' ? { ...user, uid } : user))
    setUsers(value => value.map(user => user.ownerUid === 'local-self' ? { ...user, ownerUid: uid } : user))
    setOwnUid(uid)
  }, [])
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | undefined
    const load = async () => { try { const response = await fetch(`/api/room/${roomId}${isChat ? '?mode=chat' : ''}`, { cache: 'no-store' }); const data = await response.json(); if (data.mode) setServerMode(data.mode); if (isChat && Array.isArray(data.users) && data.users.length) setUsers(value => { const own = value.find(user => user.uid.startsWith(`user-`)); const remote = data.users.filter((user: Participant) => user.uid !== own?.uid); return own ? [...remote, own] : data.users }); else if (!isChat && typeof data.content === 'string' && typeof data.version === 'number' && data.version > localVersion.current && !dirty.current) { localVersion.current = data.version; setUsers(value => [{ ...value[0], text: data.content }]); setSyncState('synced') } } catch { /* keep editing offline */ } }
    load(); timer = setInterval(load, 2000); return () => timer && clearInterval(timer)
  }, [roomId, isChat])
  useEffect(() => {
    if (!isChat && !dirty.current) return
    const timer = setTimeout(async () => { const body = isChat ? { user: users.find(user => user.uid.startsWith('user-')) || users[0] } : { content: users[0]?.text || '' }; if (!isChat) setSyncState('syncing'); try { const response = await fetch(`/api/room/${roomId}${isChat ? '?mode=chat' : ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const data = await response.json(); if (!isChat && typeof data.version === 'number') localVersion.current = data.version; setSyncState('synced'); dirty.current = false } catch { /* retry on next local edit */ } }, 800)
    return () => clearTimeout(timer)
  }, [users, roomId, isChat])
  const copyRoomId = async () => { await navigator.clipboard.writeText(window.location.href); setCopied(true); window.setTimeout(() => setCopied(false), 1600) }
  const addUser = () => { const id = nextId; setNextId(id + 1); setUsers(value => [...value, { uid: `local-${makeId()}`, ownerUid: ownUid, id, name: `访客 ${id}`, color: colors[(id - 1) % colors.length], text: '', status: 'editing' }]) }
  const removeUser = (uid: string) => setUsers(value => value.filter(user => user.uid !== uid))
  const update = (id: number, text: string) => { if (isChat && !users.find(user => user.id === id && user.ownerUid === ownUid)) return; dirty.current = true; setUsers(value => value.map(user => user.id === id ? { ...user, text, status: 'editing' } : user)) }
  const finish = (id: number) => setUsers(value => value.map(user => user.id === id ? { ...user, status: 'done' } : user))
  const copyEditor = async (user: Participant) => { if (!user.text) return; await navigator.clipboard.writeText(user.text); setCopiedEditor(user.id); window.setTimeout(() => setCopiedEditor(null), 1600) }
  return <main id="main-content" className={styles.container}>
    <nav className={styles.breadcrumb} aria-label="面包屑"><Link href="/">工作区</Link><span>/</span><span>房间</span></nav>
    <div className={styles.header}><div><div className={styles.eyebrow}>{isChat ? '一个房间。多种声音。' : '一段文字。随处同步。'}</div><h1 className={styles.roomTitle}><span className={styles.desktopTitle}>{isChat ? '你的共享聊天板。' : '你的共享剪贴板。'}</span><span className={styles.mobileTitle}>{isChat ? '聊天板' : '剪贴板'}</span></h1><p className={styles.description}>{isChat ? '每个人都有独立编辑器，可以并排书写和查看。' : '在这里编辑，内容会自动同步到所有设备。'}</p></div><Link href="/" className={styles.backButton} aria-label="返回首页"><Icon name="back" size={16} /><span className={styles.backLabel}>返回首页</span></Link></div>
    <div className={styles.roomBar}><div className={styles.roomIdentity}><span className={styles.roomLabel}>房间号</span><code className={styles.roomId}>{roomId}</code><button onClick={copyRoomId} className={`${styles.copyButton} ${copied ? styles.copied : ''}`}><Icon name={copied ? 'check' : 'copy'} size={15} />{copied ? '已复制！' : '复制链接'}</button></div><span className={styles.shareHint}><Icon name="link" size={14} />分享链接邀请其他人</span></div>
    <section className={`${styles.editorContainer} ${isChat ? "" : styles.syncMode}`} aria-label={isChat ? '房间聊天板' : '共享剪贴板'}><div className={styles.editorHeader}><h2 className={styles.editorTitle}><Icon name="clipboard" size={17} />{isChat ? '编辑器' : '共享编辑器'} <span className={styles.countBadge}>{users.length}</span></h2><div className={styles.editorActions}>{!isChat && <div className={styles.status}><div className={`${styles.statusDot} ${syncState === "syncing" ? styles.syncing : ""}`} />{syncState === "syncing" ? "同步中…" : "已同步"}</div>}{isChat && <div className={styles.legend}>{users.map(user => <span className={styles.legendItem} key={user.id}><i style={{ backgroundColor: user.color }} />{user.id} {user.name}</span>)}</div>}{isChat ? <button type="button" className={styles.addButton} onClick={addUser}><span aria-hidden="true">+</span> 添加编辑器</button> : <button type="button" onClick={() => copyEditor(users[0])} disabled={!users[0]?.text} className={styles.copyEditorButton}><Icon name={copiedEditor === users[0]?.id ? "check" : "copy"} size={13} />{copiedEditor === users[0]?.id ? "已复制" : "复制全部"}</button>}</div></div>
      <div className={styles.editorGrid}>{users.map(user => <article className={`${styles.userEditor} ${user.status === 'done' ? styles.editorDone : ''}`} key={user.id} style={{ '--user-color': user.color } as React.CSSProperties}><header className={styles.userHeader}><span className={styles.userIdentity}><i className={styles.userDot} /><b>{user.id}</b> {user.name}</span><span className={user.status === 'done' ? styles.doneLabel : styles.liveLabel}>{user.status === 'done' ? '✓ 已完成' : <>编辑中<span className={styles.typingDots}>...</span></>}</span></header><textarea value={user.text} readOnly={isChat && user.ownerUid !== ownUid} onChange={event => (!isChat || user.ownerUid === ownUid) && update(user.id, event.target.value)} className={styles.textarea} aria-label={`${user.name}编辑器`} placeholder={user.id === 1 ? '写下你的内容……' : '访客可以在这里输入……'} /><footer className={styles.userFooter}><span>{user.text.length.toLocaleString()} 个字符</span><span className={styles.userActions}><button type="button" onClick={() => copyEditor(user)} disabled={!user.text} className={styles.copyEditorButton}><Icon name={copiedEditor === user.id ? 'check' : 'copy'} size={13} />{copiedEditor === user.id ? '已复制' : '复制'}</button><button type="button" className={styles.okButton} onClick={() => finish(user.id)} disabled={isChat && (user.ownerUid !== ownUid || user.status === 'done')}>{user.status === 'done' ? '已完成' : '确定'}</button>{isChat && user.ownerUid === ownUid && <button type="button" className={styles.removeButton} onClick={() => removeUser(user.uid)}>移除</button>}</span></footer></article>)}</div>
      <div className={styles.footer}><div className={styles.charCount}><span className={styles.plainText}>纯文本</span>{total.toLocaleString()} 个字符</div><div className={styles.lastSaved}>原型 · 本地状态</div></div></section>
    <footer className={styles.pageFooter}><span><Icon name="sync" size={13} />编辑器彼此独立，可同时查看。</span><span>当前 {users.length} 位参与者</span></footer>
  </main>
}










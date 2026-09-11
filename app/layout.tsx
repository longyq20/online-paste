import type { Metadata } from 'next'
import './globals.css'
import SiteHeader from './components/site-header'

// Resolve before paint to avoid flashing the wrong theme on reload.
const themeScript = `(function(){var p='system';try{var s=localStorage.getItem('online-paste-theme');if(s==='light'||s==='dark')p=s;}catch(e){}var d=document.documentElement;d.dataset.themePreference=p;d.dataset.theme=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;})();`

export const metadata: Metadata = {
  title: 'Online Paste - 即时共享',
  description: '通过房间即时共享和同步文字内容',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><a href="#main-content" className="skip-link">跳转到正文</a><SiteHeader />{children}</body>
    </html>
  )
}

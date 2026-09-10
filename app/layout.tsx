import type { Metadata } from 'next'
import './globals.css'
import SiteHeader from './components/site-header'

// Resolve before paint to avoid flashing the wrong theme on reload.
const themeScript = `(function(){var p='system';try{var s=localStorage.getItem('online-paste-theme');if(s==='light'||s==='dark')p=s;}catch(e){}var d=document.documentElement;d.dataset.themePreference=p;d.dataset.theme=p==='system'?(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):p;})();`

export const metadata: Metadata = {
  title: 'Online Paste - Real-time Clipboard Sharing',
  description: 'Share clipboard content in real-time with room-based synchronization',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
      <body><a href="#main-content" className="skip-link">Skip to content</a><SiteHeader />{children}</body>
    </html>
  )
}

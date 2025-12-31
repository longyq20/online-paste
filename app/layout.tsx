import type { Metadata } from 'next'
import './globals.css'

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
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

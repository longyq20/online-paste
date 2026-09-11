'use client'
import { useEffect, useState } from 'react'
import Icon from './ui-icon'

type Theme = 'light' | 'dark' | 'system'
const options = [
  { value: 'light', label: '浅色主题', icon: 'sun' },
  { value: 'dark', label: '深色主题', icon: 'moon' },
  { value: 'system', label: '跟随系统', icon: 'monitor' },
] as const

export default function ThemeSwitch() {
  const [theme, setTheme] = useState<Theme>('system')
  useEffect(() => {
    const saved = document.documentElement.dataset.themePreference
    if (saved === 'light' || saved === 'dark') setTheme(saved)
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemChange = () => {
      if (document.documentElement.dataset.themePreference === 'system') {
        document.documentElement.dataset.theme = media.matches ? 'dark' : 'light'
      }
    }
    media.addEventListener('change', onSystemChange)
    return () => media.removeEventListener('change', onSystemChange)
  }, [])
  const selectTheme = (value: Theme) => {
    setTheme(value)
    document.documentElement.dataset.themePreference = value
    document.documentElement.dataset.theme = value === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : value
    try { localStorage.setItem('online-paste-theme', value) } catch { /* Works without storage. */ }
  }
  return <div className="theme-switch" role="group" aria-label="颜色主题">{options.map(({ value, label, icon }) => (
    <button key={value} type="button" title={label} aria-label={label} aria-pressed={theme === value} onClick={() => selectTheme(value)}><Icon name={icon} size={16} /></button>
  ))}</div>
}

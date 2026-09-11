import Link from 'next/link'
import BrandMark from './brand-mark'
import ThemeSwitch from './theme-switch'
export default function SiteHeader() {
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label="Online Paste 首页"><BrandMark /><span>Online Paste<span className="brand-period">.</span></span></Link>
    <div className="header-actions"><span className="header-caption">让设备之间更近一步。</span><ThemeSwitch /></div>
  </div></header>
}

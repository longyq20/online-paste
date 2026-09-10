import Link from 'next/link'
import BrandMark from './brand-mark'
import ThemeSwitch from './theme-switch'
export default function SiteHeader() {
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label="Online Paste home"><BrandMark /><span>Online Paste<span className="brand-period">.</span></span></Link>
    <div className="header-actions"><span className="header-caption">A little closer. Across devices.</span><ThemeSwitch /></div>
  </div></header>
}

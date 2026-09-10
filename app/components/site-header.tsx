import Link from 'next/link'
import Icon from './ui-icon'
import ThemeSwitch from './theme-switch'
export default function SiteHeader() {
  return <header className="site-header"><div className="header-inner">
    <Link href="/" className="brand" aria-label="Online Paste home"><span className="brand-mark"><Icon name="clipboard" size={21} /></span><span>Online Paste<span className="brand-period">.</span></span></Link>
    <div className="header-actions"><span className="header-caption">A little closer. Across devices.</span><ThemeSwitch /></div>
  </div></header>
}

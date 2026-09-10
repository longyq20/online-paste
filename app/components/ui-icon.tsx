export type IconName = 'clipboard' | 'arrow' | 'plus' | 'sun' | 'moon' | 'monitor' | 'copy' | 'check' | 'link' | 'sync' | 'clock' | 'back'
const paths: Record<IconName, React.ReactNode> = {
  clipboard: <><rect x="7" y="4" width="10" height="4" rx="1" /><path d="M7 6H5v15h14V6h-2M9 12h6M9 16h4" /></>,
  arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" /></>,
  moon: <path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" />,
  monitor: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
  copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M16 8V3H3v13h5" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  link: <path d="m10 14 4-4m-5 7-1 1a4.2 4.2 0 0 1-6-6l4-4a4.2 4.2 0 0 1 6 0m0 8a4.2 4.2 0 0 0 6 0l4-4a4.2 4.2 0 0 0-6-6l-1 1" />,
  sync: <path d="M20 7h-5m5 0V2M4 17h5m-5 0v5M4.5 8a8 8 0 0 1 13-3L20 7M4 17l2.5 2a8 8 0 0 0 13-3" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  back: <path d="M20 12H5m6-6-6 6 6 6" />,
}
export default function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

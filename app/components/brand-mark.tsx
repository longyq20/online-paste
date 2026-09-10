// Clipboard sheets with opposing arrows: paste once, sync in both directions.
export default function BrandMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <rect width="64" height="64" rx="12" fill="#1765cf" />
      <path d="M16 24h-3v27a4 4 0 0 0 4 4h24v-3" stroke="#a8d3ff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="21" y="16" width="30" height="33" rx="4" stroke="white" strokeWidth="3.5" />
      <rect x="28" y="11" width="16" height="9" rx="2.5" fill="#1765cf" stroke="white" strokeWidth="3.5" />
      <path d="M28 30h15m-4-4 4 4-4 4M43 40H28m4-4-4 4 4 4" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

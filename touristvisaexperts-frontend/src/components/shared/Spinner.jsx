export default function Spinner({ size = 'md', color = '#3b82f6' }) {
  const dim = size === 'sm' ? 16 : size === 'lg' ? 40 : 24
  const stroke = size === 'sm' ? 2 : size === 'lg' ? 3 : 2.5
  return (
    <svg
      width={dim} height={dim}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      style={{ animation: 'spin 0.7s linear infinite' }}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" opacity="0.9"/>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </svg>
  )
}

export function PageSpinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: 280, gap: 14,
    }}>
      <Spinner size="lg" />
      <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Loading...</span>
    </div>
  )
}

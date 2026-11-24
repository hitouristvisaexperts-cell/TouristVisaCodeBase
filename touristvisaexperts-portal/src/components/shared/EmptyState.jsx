export default function EmptyState({ icon, title, description }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '64px 24px', textAlign: 'center',
    }}>
      {/* Icon container */}
      <div style={{
        width: 64, height: 64, borderRadius: 18,
        background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
        border: '1px solid #e2e8f0',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, marginBottom: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        {icon || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="8" y1="12" x2="16" y2="12"/>
          </svg>
        )}
      </div>

      <h3 style={{
        fontSize: 15, fontWeight: 700, color: '#334155',
        letterSpacing: '-0.02em', marginBottom: 6,
        fontFamily: 'var(--font-sans)',
      }}>
        {title}
      </h3>

      {description && (
        <p style={{ fontSize: 13.5, color: '#94a3b8', maxWidth: 280, lineHeight: 1.6 }}>
          {description}
        </p>
      )}
    </div>
  )
}

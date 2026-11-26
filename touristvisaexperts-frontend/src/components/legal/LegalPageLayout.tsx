import Navbar from '../Navbar'
import { Footer } from '../site/Footer'

export type LegalSection = {
  title: string
  content?: string
  list?: string[]
  listIntro?: string
  after?: string
}

interface Props {
  title: string
  intro?: string
  sections: LegalSection[]
}

const LAST_UPDATED = 'August 9, 2026' // hand-update only when legal content actually changes

export default function LegalPageLayout({ title, intro, sections }: Props) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />
      <div style={{
        background: 'linear-gradient(135deg,#0A1628 0%,#1a3060 55%,#0A1628 100%)',
        padding: '48px 24px 40px', textAlign: 'center', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-80px', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,0.07) 0%,transparent 65%)', pointerEvents: 'none' }} />
        <p style={{ color: '#F97316', fontSize: 11, fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: 8, position: 'relative' }}>Legal</p>
        <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 'clamp(24px,4vw,36px)', lineHeight: 1.2, margin: 0, position: 'relative', fontFamily: "'Plus Jakarta Sans',sans-serif" }}>
          {title}
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 12, position: 'relative' }}>Last updated: {LAST_UPDATED}</p>
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        {intro && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 28, marginBottom: 32, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            {intro.split('\n\n').map((p, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: '#334155', margin: i === 0 ? 0 : '16px 0 0' }}>{p}</p>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {sections.map((s, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, border: '1px solid #f1f5f9', padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: '0 0 16px', lineHeight: 1.3 }}>{s.title}</h2>
              {s.content && s.content.split('\n\n').map((para, pi) => {
                // Mode 1: "**Bold heading**\nBody text" — bold line followed by a body paragraph
                if (para.startsWith('**') && para.includes('**\n')) {
                  const [bold, ...rest] = para.split('\n')
                  return (
                    <div key={pi} style={{ marginBottom: 14 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                        {bold.replace(/\*\*/g, '')}
                      </p>
                      <p style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', margin: 0 }}>
                        {rest.join(' ')}
                      </p>
                    </div>
                  )
                }
                // Mode 2: "**Term** — definition" on a single line
                if (para.startsWith('**') && para.includes('**')) {
                  const boldMatch = para.match(/^\*\*(.+?)\*\*\s*[—–-]?\s*(.*)/)
                  if (boldMatch) {
                    return (
                      <div key={pi} style={{ marginTop: pi === 0 ? 0 : 12 }}>
                        <p style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', margin: 0 }}>
                          <strong style={{ color: '#0f172a' }}>{boldMatch[1]}</strong> — {boldMatch[2]}
                        </p>
                      </div>
                    )
                  }
                  // Mode 3: inline **bold** markers scattered through the paragraph
                  const parts = para.split(/\*\*/g)
                  return (
                    <p key={pi} style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', margin: pi === 0 ? 0 : '12px 0 0' }}>
                      {parts.map((part, ppi) => ppi % 2 === 1
                        ? <strong key={ppi} style={{ color: '#0f172a' }}>{part}</strong>
                        : <span key={ppi}>{part}</span>
                      )}
                    </p>
                  )
                }
                return (
                  <p key={pi} style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', margin: pi === 0 ? 0 : '12px 0 0' }}>{para}</p>
                )
              })}
              {s.listIntro && (
                <p style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', margin: s.content ? '14px 0 8px' : '0 0 8px' }}>{s.listIntro}</p>
              )}
              {s.list && (
                <ul style={{ margin: '12px 0 0 8px', padding: 0, listStyle: 'none' }}>
                  {s.list.map((item, li) => (
                    <li key={li} style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', display: 'flex', alignItems: 'baseline', gap: 10, padding: '3px 0' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#F97316', flexShrink: 0, marginTop: 8 }} />
                      {item}
                    </li>
                  ))}
                </ul>
              )}
              {s.after && s.after.split('\n\n').map((p, ai) => (
                <p key={ai} style={{ fontSize: 14, lineHeight: 1.8, color: '#475569', margin: '14px 0 0' }}>{p}</p>
              ))}
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  )
}

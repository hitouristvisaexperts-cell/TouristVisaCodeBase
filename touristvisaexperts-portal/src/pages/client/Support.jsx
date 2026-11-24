import { useState } from 'react'
import { sendSupport } from '../../api/client'

export default function ClientSupport() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!subject.trim()) return setError('Please enter a subject.')
    if (message.trim().length < 10) return setError('Message must be at least 10 characters.')

    setSubmitting(true)
    try {
      const res = await sendSupport({ subject, message })
      setSuccess(res.data.message)
      setSubject('')
      setMessage('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ maxWidth: 680 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>
          Contact Support
        </h1>
        <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14 }}>
          Have a question or need help? Send us a message and our team will get back to you.
        </p>
      </div>

      {/* Info card */}
      {/* Grid that wraps on phones (a single flex row pushed "Urgent Help" outside the box) */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, marginBottom: 28,
        background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
        border: '1px solid #ddd6fe', borderRadius: 14, padding: '16px 20px',
      }}>
        {[
          { icon: '📧', title: 'Email Support', desc: 'admin@touristvisaexperts.com' },
          { icon: '🕐', title: 'Response Time', desc: 'Within 24 hours' },
          { icon: '📞', title: 'Urgent Help', desc: 'Call your consultant directly' },
        ].map((item) => (
          <div key={item.title} style={{ minWidth: 0, overflowWrap: 'anywhere' }}>
            <div style={{ fontSize: 20, marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6d28d9', marginBottom: 2 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#7c3aed' }}>{item.desc}</div>
          </div>
        ))}
      </div>

      {/* Success banner */}
      {success && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 12, padding: '14px 18px',
          display: 'flex', alignItems: 'flex-start', gap: 12,
          marginBottom: 24,
        }}>
          <div style={{ fontSize: 20, flexShrink: 0 }}>✅</div>
          <div>
            <div style={{ fontWeight: 700, color: '#15803d', fontSize: 14, marginBottom: 2 }}>Message sent!</div>
            <div style={{ color: '#166534', fontSize: 13 }}>{success}</div>
          </div>
        </div>
      )}

      {/* Form */}
      <div style={{
        background: '#fff', border: '1px solid #f1f5f9',
        borderRadius: 16, padding: '28px 28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: '#475569', marginBottom: 8, letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Question about my documents"
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                padding: '11px 14px', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', color: '#0f172a',
                transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 700,
              color: '#475569', marginBottom: 8, letterSpacing: '0.02em',
              textTransform: 'uppercase',
            }}>
              Message
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your question or issue in detail..."
              rows={6}
              style={{
                width: '100%', boxSizing: 'border-box',
                border: '1.5px solid #e2e8f0', borderRadius: 10,
                padding: '11px 14px', fontSize: 14, outline: 'none',
                fontFamily: 'inherit', color: '#0f172a', resize: 'vertical',
                lineHeight: 1.6, transition: 'border-color 0.15s',
              }}
              onFocus={e => e.target.style.borderColor = '#8b5cf6'}
              onBlur={e => e.target.style.borderColor = '#e2e8f0'}
            />
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'right' }}>
              {message.length} characters
            </div>
          </div>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 10, padding: '11px 16px',
              fontSize: 13, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              background: submitting ? '#e2e8f0' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
              color: submitting ? '#94a3b8' : '#fff',
              border: 'none', borderRadius: 12, padding: '13px 24px',
              fontSize: 14, fontWeight: 700, cursor: submitting ? 'default' : 'pointer',
              boxShadow: submitting ? 'none' : '0 4px 16px rgba(139,92,246,0.35)',
              transition: 'all 0.2s', alignSelf: 'flex-start',
            }}
          >
            {submitting ? 'Sending…' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  )
}

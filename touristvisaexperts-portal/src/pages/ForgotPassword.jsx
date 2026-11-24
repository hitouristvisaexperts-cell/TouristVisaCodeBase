import { useState } from 'react'
import { Link } from 'react-router'
import { forgotPassword } from '../api/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [devLink, setDevLink] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setSent(true)
      if (res.data.resetUrl) setDevLink(res.data.resetUrl)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f7f4', padding: 24,
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" alt="Tourist Visa Experts" style={{ height: 44, objectFit: 'contain' }} />
        </div>

        <div style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 4px 32px rgba(249,115,22,0.08)',
          border: '1.5px solid rgba(249,115,22,0.15)',
        }}>
          {!sent ? (
            <>
              {/* Icon */}
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                border: '1px solid rgba(249,115,22,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Forgot password?
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, marginBottom: 24 }}>
                No worries. Enter your registered email and we'll send you a secure reset link.
              </p>

              {error && (
                <div style={{
                  background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10,
                  padding: '11px 14px', color: '#f43f5e', fontSize: 13, fontWeight: 500, marginBottom: 18,
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>
                    Email Address
                  </label>
                  <input
                    type="email" required
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={{
                      background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
                      padding: '13px 16px', fontSize: 14, width: '100%', outline: 'none',
                      fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0A1628',
                      transition: 'all 0.15s', boxSizing: 'border-box',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                  />
                </div>
                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#fdba74' : 'linear-gradient(135deg, #F97316, #f85c00)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {loading
                    ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Sending...</>
                    : 'Send Reset Link'
                  }
                </button>
              </form>
            </>
          ) : (
            /* Success state */
            <>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Check your email
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, marginBottom: 20 }}>
                We've sent a password reset link to <strong style={{ color: '#0A1628' }}>{email}</strong>. The link will expire in 1 hour.
              </p>

              {devLink && (
                <div style={{
                  background: '#fffbeb', borderRadius: 12, padding: '14px 16px',
                  border: '1px solid #fde68a', marginBottom: 16,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                    Dev Mode — Reset Link
                  </div>
                  <a href={devLink} style={{ fontSize: 12, color: '#F97316', wordBreak: 'break-all', lineHeight: 1.5 }}>{devLink}</a>
                </div>
              )}

              <button
                onClick={() => { setSent(false); setEmail(''); setDevLink('') }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 10,
                  border: '1.5px solid rgba(249,115,22,0.2)',
                  background: '#fff', color: '#0A1628', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >
                Send to a different email
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: '#94a3b8' }}>
          <Link to="/login" style={{ color: '#F97316', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
            Back to Sign In
          </Link>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

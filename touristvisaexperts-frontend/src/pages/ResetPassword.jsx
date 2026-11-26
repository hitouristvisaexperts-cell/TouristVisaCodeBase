import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { resetPassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'

export default function ResetPassword() {
  const { token } = useParams()
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)

  const inputStyle = {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '13px 16px', fontSize: 14, width: '100%', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0A1628', transition: 'all 0.15s',
    boxSizing: 'border-box',
  }

  const strength = (() => {
    const p = form.password
    if (!p) return { score: 0, label: '', color: '' }
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    const map = [
      { label: '', color: '' },
      { label: 'Weak', color: '#f43f5e' },
      { label: 'Fair', color: '#f59e0b' },
      { label: 'Good', color: '#F97316' },
      { label: 'Strong', color: '#16a34a' },
    ]
    return { score, ...map[score] }
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirm) return setError('Passwords do not match.')
    setLoading(true)
    try {
      const res = await resetPassword(token, form.password)
      setSuccess(true)
      loginUser(res.data.token, res.data.user)
      setTimeout(() => navigate('/client/status'), 2000)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  const EyeIcon = ({ visible }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {visible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      }
    </svg>
  )

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
          {!success ? (
            <>
              <div style={{
                width: 52, height: 52, borderRadius: 16,
                background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                border: '1px solid rgba(249,115,22,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Set new password
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, marginBottom: 24 }}>
                Create a strong password for your account.
              </p>

              {error && (
                <div style={{
                  background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10,
                  padding: '11px 14px', marginBottom: 18, display: 'flex', gap: 8, alignItems: 'flex-start',
                }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
                  </svg>
                  <span style={{ fontSize: 13, color: '#f43f5e', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      placeholder="Min. 8 characters"
                      value={form.password} required
                      onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      <EyeIcon visible={showPass} />
                    </button>
                  </div>

                  {/* Strength meter */}
                  {form.password && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} style={{
                            flex: 1, height: 3, borderRadius: 99,
                            background: i <= strength.score ? strength.color : '#f1f5f9',
                            transition: 'background 0.2s',
                          }} />
                        ))}
                      </div>
                      <span style={{ fontSize: 11.5, color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      placeholder="Repeat password"
                      value={form.confirm} required
                      onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                      onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                      onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      <EyeIcon visible={showConfirm} />
                    </button>
                  </div>
                  {form.confirm && form.password !== form.confirm && (
                    <p style={{ fontSize: 12, color: '#f43f5e', marginTop: 4 }}>Passwords do not match</p>
                  )}
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  background: loading ? '#fdba74' : 'linear-gradient(135deg, #F97316, #f85c00)',
                  color: '#fff', fontSize: 15, fontWeight: 700,
                  boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                  fontFamily: "'Plus Jakarta Sans', sans-serif", transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4,
                }}>
                  {loading
                    ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Resetting...</>
                    : 'Reset Password'
                  }
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18,
                background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                border: '1px solid #bbf7d0',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px', animation: 'popIn 0.4s ease-out',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Password reset!
              </h2>
              <p style={{ fontSize: 13.5, color: '#64748b', lineHeight: 1.65, marginBottom: 20 }}>
                Your password has been updated. Redirecting you to your dashboard...
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 5 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%', background: '#F97316',
                    animation: `bounce 0.6s ${i * 0.15}s ease-in-out infinite alternate`,
                  }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {!success && (
          <p style={{ textAlign: 'center', marginTop: 22, fontSize: 13.5, color: '#94a3b8' }}>
            <Link to="/login" style={{ color: '#F97316', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
              Back to Sign In
            </Link>
          </p>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn { from { transform: scale(0.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-7px); } }
      `}</style>
    </div>
  )
}

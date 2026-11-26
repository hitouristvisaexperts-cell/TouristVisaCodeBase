import { useState } from 'react'
import { useNavigate } from 'react-router'
import { changePassword } from '../api/auth'
import { useAuth } from '../context/AuthContext'

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  team: '/team/clients',
  client: '/client/status',
}

export default function ChangePassword() {
  const { user, loginUser } = useAuth()
  const navigate = useNavigate()
  const isFirstLogin = user?.isFirstLogin
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.newPassword !== form.confirm) {
      setError('New passwords do not match.')
      return
    }
    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    setLoading(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      // Update local user to clear isFirstLogin
      if (user) loginUser(localStorage.getItem('fv_token'), { ...user, isFirstLogin: false })
      navigate(ROLE_REDIRECT[user?.role] || '/login')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f8f7f4', fontFamily: "'Plus Jakarta Sans', sans-serif", padding: '24px 16px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {isFirstLogin && (
          <div style={{
            background: '#fff7ed', border: '1.5px solid rgba(249,115,22,0.3)',
            borderRadius: 14, padding: '16px 20px', marginBottom: 24,
            display: 'flex', gap: 12, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>👋</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#9a3412', marginBottom: 4 }}>
                Welcome! Please set your password
              </div>
              <div style={{ fontSize: 13, color: '#a16207', lineHeight: 1.6 }}>
                This is your first login. Set a new secure password to continue to your portal.
              </div>
            </div>
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
        }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0A1628', margin: '0 0 6px', letterSpacing: '-0.03em' }}>
            {isFirstLogin ? 'Set New Password' : 'Change Password'}
          </h2>
          <p style={{ fontSize: 13.5, color: '#94a3b8', margin: '0 0 28px' }}>
            {isFirstLogin ? 'Choose a strong password to secure your account.' : 'Update your account password below.'}
          </p>

          {error && (
            <div style={{
              background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 10,
              padding: '11px 14px', marginBottom: 18, fontSize: 13, color: '#f43f5e',
            }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { key: 'currentPassword', label: isFirstLogin ? 'Temporary Password' : 'Current Password', placeholder: '••••••••' },
              { key: 'newPassword', label: 'New Password', placeholder: 'Min 8 characters' },
              { key: 'confirm', label: 'Confirm New Password', placeholder: 'Repeat new password' },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>
                  {label}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    required
                    style={{
                      background: '#f8f7f4', border: '1.5px solid #e2e8f0', borderRadius: 12,
                      padding: '13px 44px 13px 16px', fontSize: 14, width: '100%', outline: 'none',
                      fontFamily: 'inherit', color: '#0A1628', boxSizing: 'border-box', transition: 'all 0.15s',
                    }}
                    onFocus={e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }}
                    onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }}
                  />
                  {key === 'confirm' && (
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0,
                    }} tabIndex={-1}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        {showPass
                          ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></>
                          : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                        }
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', marginTop: 8,
                background: loading ? '#fdba74' : 'linear-gradient(135deg,#F97316,#f85c00)',
                color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(249,115,22,0.4)',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Saving...' : isFirstLogin ? 'Set Password & Continue →' : 'Update Password'}
            </button>
          </form>

          {!isFirstLogin && (
            <button
              onClick={() => navigate(ROLE_REDIRECT[user?.role] || '/')}
              style={{
                width: '100%', marginTop: 12, padding: '12px',
                background: 'none', border: '1.5px solid #e2e8f0', borderRadius: 12,
                fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router'
import { adminLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import AuthLayout from '../components/AuthLayout'

const FONT = "'Plus Jakarta Sans', sans-serif"
const NAVY = '#0F172A'

const Icon = {
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6.5 9-6.5" /></>,
  lock: <><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M17.9 17.9A10.1 10.1 0 0 1 12 19.5C5.5 19.5 1.5 12 1.5 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.7A9.2 9.2 0 0 1 12 4.5c6.5 0 10.5 7.5 10.5 7.5a18.6 18.6 0 0 1-2.2 3.2" /><path d="m1.5 1.5 21 21" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  shield: <><path d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.3 7.5 10 4.3-1.7 7.5-5.4 7.5-10v-6z" /><path d="m9 12 2 2 4-4" /></>,
}

const Svg = ({ name, size = 18, color = 'currentColor', width = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{Icon[name]}</svg>
)

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>{label}</label>
      <div className="admin-field" style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: 14, transition: 'border-color .15s, box-shadow .15s',
      }}>
        <span style={{ position: 'absolute', left: 16, display: 'flex', color: '#64748b' }}><Svg name={icon} size={19} /></span>
        {children}
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', border: 'none', outline: 'none', background: 'transparent',
  padding: '15px 48px 15px 50px', fontSize: 15, color: '#0A1628', fontFamily: FONT, borderRadius: 14,
}

export default function AdminLogin() {
  const { user, loading: authLoading, loginUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  // Redirect if already authenticated
  if (!authLoading && user) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'client') return <Navigate to="/client/status" replace />
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />
    if (user.role === 'team') return <Navigate to="/team/clients" replace />
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await adminLogin(form.email, form.password)
      const data = res.data

      // Strict client-side verification as well: only admin role allowed
      if (data.user?.role !== 'admin') {
        setError('Invalid credentials or unauthorized access.')
        return
      }

      loginUser(data.token, data.user)
      if (data.user.isFirstLogin) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/admin/dashboard', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or unauthorized access.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 38px)', fontWeight: 800, color: '#0A1628', letterSpacing: '-0.035em', margin: '0 0 8px' }}>
        Admin Sign In
      </h2>
      <p style={{ fontSize: 15, color: '#64748b', margin: '0 0 26px', lineHeight: 1.5 }}>
        Restricted to verified administrators. Enter your credentials to manage applications, billing, and team operations.
      </p>

      {error && (
        <div role="alert" style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#e11d48', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>⚠️</span> {error}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Admin email address" icon="mail">
          <input
            type="email"
            placeholder="admin@touristvisaexperts.com"
            value={form.email}
            required
            autoComplete="email"
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
        </Field>

        <div>
          <Field label="Admin password" icon="lock">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              required
              autoComplete="current-password"
              onChange={e => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'flex' }}
            >
              <Svg name={showPass ? 'eyeOff' : 'eye'} size={19} />
            </button>
          </Field>
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Link to="/forgot-password" style={{ fontSize: 14, color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="admin-submit"
          style={{
            width: '100%', padding: '16px', border: 'none', borderRadius: 14, color: '#fff', fontFamily: FONT,
            fontSize: 16.5, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? '#64748b' : 'linear-gradient(135deg, #0F172A, #1E293B)',
            boxShadow: loading ? 'none' : '0 10px 24px rgba(15, 23, 42, 0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform .15s, box-shadow .15s',
          }}
        >
          {loading ? 'Authenticating…' : <>Sign In to Admin Dashboard <Svg name="arrow" size={19} width={2.2} /></>}
        </button>
      </form>

      <div style={{
        marginTop: 26, paddingTop: 18, borderTop: '1px solid #f1f5f9',
        display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: 14, color: '#64748b' }}>
          Are you a visa applicant?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 700, textDecoration: 'none' }}>
            Go to Client Login →
          </Link>
        </p>
        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Svg name="lock" size={13} /> Strict role verification active · IP logged for security
        </p>
      </div>

      <style>{`
        .admin-field:focus-within { border-color: #2563eb !important; box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.12); }
        .admin-submit:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(15, 23, 42, 0.45) !important; }
        .auth-card input::placeholder { color: #94a3b8; }
      `}</style>
    </AuthLayout>
  )
}

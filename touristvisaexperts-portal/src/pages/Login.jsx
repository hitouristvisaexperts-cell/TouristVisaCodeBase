import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router'
import { login } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import GoogleSignIn from '../components/GoogleSignIn'
import AuthLayout from '../components/AuthLayout'

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  team: '/team/clients',
  client: '/client/status',
}

const FONT = "'Plus Jakarta Sans', sans-serif"
const ORANGE = '#F97316'

// Small line icons (same stroke style as the rest of the portal)
const Icon = {
  mail: <><rect x="2.5" y="4.5" width="19" height="15" rx="2.5" /><path d="m3 6.5 9 6.5 9-6.5" /></>,
  lock: <><rect x="4" y="10.5" width="16" height="10.5" rx="2.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /></>,
  eye: <><path d="M1.5 12S5.5 4.5 12 4.5 22.5 12 22.5 12 18.5 19.5 12 19.5 1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M17.9 17.9A10.1 10.1 0 0 1 12 19.5C5.5 19.5 1.5 12 1.5 12a18.5 18.5 0 0 1 5.1-5.9M9.9 4.7A9.2 9.2 0 0 1 12 4.5c6.5 0 10.5 7.5 10.5 7.5a18.6 18.6 0 0 1-2.2 3.2" /><path d="m1.5 1.5 21 21" /></>,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
}
const Svg = ({ name, size = 18, color = 'currentColor', width = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{Icon[name]}</svg>
)

function Field({ label, icon, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0A1628', marginBottom: 8 }}>{label}</label>
      <div className="login-field" style={{
        position: 'relative', display: 'flex', alignItems: 'center',
        background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, transition: 'border-color .15s, box-shadow .15s',
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

export default function Login() {
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
      const res = await login(form.email, form.password, 'client')
      const data = res.data

      // Only clients may log in through the Client Login page
      if (data.user?.role === 'admin' || data.user?.role !== 'client') {
        setError('Invalid credentials or unauthorized access.')
        return
      }

      loginUser(data.token, data.user)
      if (data.user.isFirstLogin) {
        navigate('/change-password', { replace: true })
      } else {
        navigate('/client/status', { replace: true })
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or unauthorized access.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 style={{ fontSize: 'clamp(28px, 2.6vw, 38px)', fontWeight: 800, color: '#0A1628', letterSpacing: '-0.035em', margin: '0 0 8px' }}>Welcome back</h2>
      <p style={{ fontSize: 16, color: '#64748b', margin: '0 0 30px' }}>Sign in to access your client portal</p>

      {error && (
        <div role="alert" style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13.5, color: '#e11d48', fontWeight: 600 }}>
          {error}
        </div>
      )}

      <GoogleSignIn mode="signin" />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Email address" icon="mail">
          <input type="email" placeholder="you@example.com" value={form.email} required autoComplete="email"
            onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
        </Field>

        <div>
          <Field label="Password" icon="lock">
            <input type={showPass ? 'text' : 'password'} placeholder="••••••••" value={form.password} required autoComplete="current-password"
              onChange={e => setForm({ ...form, password: e.target.value })} style={inputStyle} />
            <button type="button" onClick={() => setShowPass(!showPass)} aria-label={showPass ? 'Hide password' : 'Show password'}
              style={{ position: 'absolute', right: 14, background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4, display: 'flex' }}>
              <Svg name={showPass ? 'eyeOff' : 'eye'} size={19} />
            </button>
          </Field>
          <div style={{ textAlign: 'right', marginTop: 12 }}>
            <Link to="/forgot-password" style={{ fontSize: 14, color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Forgot password?</Link>
          </div>
        </div>

        <button type="submit" disabled={loading} className="login-submit" style={{
          width: '100%', padding: '16px', border: 'none', borderRadius: 14, color: '#fff', fontFamily: FONT,
          fontSize: 17, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
          background: loading ? '#fdba74' : 'linear-gradient(135deg, #F97316, #EA580C)',
          boxShadow: loading ? 'none' : '0 10px 24px rgba(249,115,22,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform .15s, box-shadow .15s',
        }}>
          {loading ? 'Signing in…' : <>Sign In <Svg name="arrow" size={19} width={2.2} /></>}
        </button>
      </form>

      <p style={{ textAlign: 'center', margin: '26px 0 0', fontSize: 15, color: '#64748b' }}>
        Don't have an account?{' '}
        <Link to="/register" style={{ color: ORANGE, fontWeight: 700, textDecoration: 'none' }}>Create one free</Link>
      </p>
      <p style={{ margin: '14px 0 0', fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Svg name="lock" size={14} /> Protected by 256-bit SSL encryption
      </p>

      <style>{`
        .login-field:focus-within { border-color: #F97316 !important; box-shadow: 0 0 0 4px rgba(249,115,22,0.12); }
        .login-submit:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 14px 30px rgba(249,115,22,0.42) !important; }
        .auth-card input::placeholder { color: #94a3b8; }
      `}</style>
    </AuthLayout>
  )
}

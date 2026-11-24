import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { register, verifyRegistrationOtp, resendRegistrationOtp } from '../api/auth'
import { useAuth } from '../context/AuthContext'
import GoogleSignIn from '../components/GoogleSignIn'
import AuthLayout from '../components/AuthLayout'

// Name: letters (any language), spaces, . ' -   Phone (optional): 10 digits for India, or +country code and 8-15 digits
const NAME_RE = /^\p{L}[\p{L}\p{M} .'-]*$/u
function phoneProblem(raw) {
  const v = raw.trim()
  if (!v) return ''
  if (!/^\+?[\d\s()-]+$/.test(v)) return 'Phone number can only contain digits.'
  const digits = v.replace(/\D/g, '')
  if (!v.startsWith('+') || v.startsWith('+91')) {
    const local = v.startsWith('+91') ? digits.slice(2) : digits
    return /^[6-9]\d{9}$/.test(local) ? '' : 'Please enter a valid 10-digit mobile number.'
  }
  return digits.length >= 8 && digits.length <= 15 ? '' : 'Please enter a valid phone number with country code.'
}

export default function Register() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // 'form' | 'otp'
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
  })
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [dataProtectionAgreed, setDataProtectionAgreed] = useState(false)
  const [termsRefundAgreed, setTermsRefundAgreed] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://touristvisaexperts.com'

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const name = form.name.trim()
    if (!NAME_RE.test(name) || name.replace(/[^\p{L}]/gu, '').length < 2) return setError('Please enter a valid full name (letters only).')
    if (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(form.email.trim())) return setError('Please enter a valid email address.')
    const phoneErr = phoneProblem(form.phone)
    if (phoneErr) return setError(phoneErr)
    if (form.password.length < 8) return setError('Password must be at least 8 characters.')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match.')
    if (!dataProtectionAgreed) return setError('Please accept the data-protection terms to continue.')
    if (!termsRefundAgreed) return setError('Please accept the Terms & Refund Policy to continue.')
    if (!ageConfirmed) return setError('You must confirm you are 18 years of age or older to register.')
    setLoading(true)
    try {
      await register({
        name: form.name, email: form.email, phone: form.phone,
        password: form.password,
        dataProtectionConsent: dataProtectionAgreed,
        termsRefundConsent: termsRefundAgreed,
        ageConfirmed,
      })
      setStep('otp')
      setResendCooldown(30)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await verifyRegistrationOtp(form.email, otp)
      loginUser(res.data.token, res.data.user)
      navigate('/client/status')
    } catch (err) {
      setError(err.response?.data?.message || 'Incorrect code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCooldown > 0) return
    setError('')
    try {
      await resendRegistrationOtp(form.email)
      setResendCooldown(30)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not resend code. Please try again.')
    }
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const inputStyle = {
    background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12,
    padding: '13px 16px', fontSize: 14, width: '100%', outline: 'none',
    fontFamily: "'Plus Jakarta Sans', sans-serif", color: '#0A1628', transition: 'all 0.15s',
    boxSizing: 'border-box',
  }

  const focusOrange = e => { e.target.style.borderColor = '#F97316'; e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.1)' }
  const blurNormal = e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none' }

  const EyeIcon = ({ visible }) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      {visible
        ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></>
        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></>
      }
    </svg>
  )

  return (
    <AuthLayout>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 'clamp(26px, 2.4vw, 34px)', fontWeight: 800, color: '#0A1628', letterSpacing: '-0.035em', margin: 0, marginBottom: 8 }}>
              {step === 'otp' ? 'Confirm your email' : 'Create your account'}
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', margin: 0 }}>
              {step === 'otp'
                ? <>We sent a 6-digit code to <strong style={{ color: '#0A1628' }}>{form.email}</strong></>
                : 'Tell us a little about yourself to get started.'}
            </p>
          </div>

          {error && (
            <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5" />
              </svg>
              <span style={{ fontSize: 13, color: '#f43f5e', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {step === 'form' && <GoogleSignIn mode="signup" />}

          {step === 'form' && (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Full Name *</label>
              <input style={inputStyle} placeholder="John Doe" value={form.name} required onChange={e => set('name', e.target.value)} onFocus={focusOrange} onBlur={blurNormal} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Email Address *</label>
              <input type="email" style={inputStyle} placeholder="you@example.com" value={form.email} required onChange={e => set('email', e.target.value)} onFocus={focusOrange} onBlur={blurNormal} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Phone Number</label>
              <input type="tel" style={inputStyle} placeholder="+91 98765 43210" value={form.phone} inputMode="tel" maxLength={16} onChange={e => set('phone', e.target.value.replace(/[^\d+ ]/g, '').replace(/(?!^)\+/g, ''))} onFocus={focusOrange} onBlur={blurNormal} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 44 }} placeholder="Min. 8 characters" value={form.password} required onChange={e => set('password', e.target.value)} onFocus={focusOrange} onBlur={blurNormal} />
                <button type="button" onClick={() => setShowPass(!showPass)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <EyeIcon visible={showPass} />
                </button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>Confirm Password *</label>
              <div style={{ position: 'relative' }}>
                <input type={showConfirm ? 'text' : 'password'} style={{ ...inputStyle, paddingRight: 44 }} placeholder="Repeat password" value={form.confirmPassword} required onChange={e => set('confirmPassword', e.target.value)} onFocus={focusOrange} onBlur={blurNormal} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} tabIndex={-1}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <EyeIcon visible={showConfirm} />
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p style={{ fontSize: 12, color: '#f43f5e', marginTop: 4 }}>Passwords do not match</p>
              )}
            </div>

            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${dataProtectionAgreed ? '#F97316' : '#e2e8f0'}`,
              background: dataProtectionAgreed ? '#fff7ed' : '#fff',
            }}>
              <input type="checkbox" checked={dataProtectionAgreed} onChange={e => setDataProtectionAgreed(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: '#F97316', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
                I agree to the <a href={`${MARKETING_URL}/privacy`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Privacy Policy</a> and consent to Tourist Visa Experts processing my personal data (including passport and travel documents) for visa assistance purposes, including where applicable by staff in the UK and India under equivalent data-protection safeguards, and retained as described in the <a href={`${MARKETING_URL}/data-retention`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Data Retention Policy</a>.
              </span>
            </label>

            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${termsRefundAgreed ? '#F97316' : '#e2e8f0'}`,
              background: termsRefundAgreed ? '#fff7ed' : '#fff',
            }}>
              <input type="checkbox" checked={termsRefundAgreed} onChange={e => setTermsRefundAgreed(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: '#F97316', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
                I agree to the <a href={`${MARKETING_URL}/terms`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Terms &amp; Conditions</a> and <a href={`${MARKETING_URL}/refund-policy`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Refund &amp; Cancellation Policy</a>. I understand that payments are non-refundable except under the 100% Refund Guarantee plan, and that embassy appointments cannot be rescheduled once booked.
              </span>
            </label>

            <label style={{
              display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer',
              padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${ageConfirmed ? '#F97316' : '#e2e8f0'}`,
              background: ageConfirmed ? '#fff7ed' : '#fff',
            }}>
              <input type="checkbox" checked={ageConfirmed} onChange={e => setAgeConfirmed(e.target.checked)}
                style={{ marginTop: 2, width: 16, height: 16, accentColor: '#F97316', flexShrink: 0 }} />
              <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>
                I confirm that I am 18 years of age or older.
              </span>
            </label>

            <button type="submit" disabled={loading || !dataProtectionAgreed || !termsRefundAgreed || !ageConfirmed} style={{
              width: '100%', padding: '14px',
              background: (loading || !dataProtectionAgreed || !termsRefundAgreed || !ageConfirmed) ? '#fdba74' : 'linear-gradient(135deg, #F97316, #f85c00)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: (loading || !dataProtectionAgreed || !termsRefundAgreed || !ageConfirmed) ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
              transition: 'all 0.15s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Creating account...</>
                : 'Create Account'
              }
            </button>
          </form>
          )}

          {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0A1628', marginBottom: 6 }}>6-digit code</label>
              <input
                type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6}
                placeholder="000000" value={otp} required autoComplete="one-time-code"
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                style={{ ...inputStyle, fontSize: 22, letterSpacing: '10px', textAlign: 'center', fontWeight: 700 }}
                onFocus={focusOrange} onBlur={blurNormal}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: -4 }}>
              <button type="button" onClick={() => { setStep('form'); setOtp(''); setError('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#94a3b8', fontWeight: 600, padding: 0 }}>
                ← Back
              </button>
              <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
                style={{ background: 'none', border: 'none', padding: 0, fontSize: 13, fontWeight: 600, color: resendCooldown > 0 ? '#cbd5e1' : '#F97316', cursor: resendCooldown > 0 ? 'default' : 'pointer' }}>
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
              </button>
            </div>

            <button type="submit" disabled={loading || otp.length !== 6} style={{
              width: '100%', padding: '14px',
              background: (loading || otp.length !== 6) ? '#fdba74' : 'linear-gradient(135deg, #F97316, #f85c00)',
              color: '#fff', border: 'none', borderRadius: 12,
              fontSize: 15, fontWeight: 700,
              cursor: (loading || otp.length !== 6) ? 'not-allowed' : 'pointer',
              letterSpacing: '-0.01em',
              boxShadow: (loading || otp.length !== 6) ? 'none' : '0 4px 16px rgba(249,115,22,0.4)',
              transition: 'all 0.15s',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              {loading
                ? <><span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Verifying...</>
                : 'Verify & Create Account'
              }
            </button>
          </form>
          )}

          {step === 'form' && (
          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13.5, color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#F97316', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
          </p>
          )}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AuthLayout>
  )
}

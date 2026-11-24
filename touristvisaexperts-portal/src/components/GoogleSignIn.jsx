import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { googleLogin } from '../api/auth'
import { useAuth } from '../context/AuthContext'

/* "Continue with Google" for clients (Login + Register pages).
   Google's button gives us an ID token; the backend checks it and logs the client in.
   The first time, the client accepts the same three consents as the sign-up form. */

// Public OAuth client ID (Google Cloud → Google Auth Platform → Clients)
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
  || '255901629118-q32ejsi969n0haqdc2quc0thru3dikce.apps.googleusercontent.com'
const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://touristvisaexperts.com'

const ROLE_REDIRECT = {
  admin: '/admin/dashboard',
  manager: '/manager/dashboard',
  team: '/team/clients',
  client: '/client/status',
}

let gisPromise
function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = resolve
      s.onerror = () => { gisPromise = null; reject(new Error('Google sign-in could not load')) }
      document.head.appendChild(s)
    })
  }
  return gisPromise
}

export default function GoogleSignIn({ mode = 'signin' }) {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const btnRef = useRef(null)
  const handlerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [consent, setConsent] = useState(null) // { credential, name, email } while asking
  const [agreed, setAgreed] = useState({ dataProtection: false, termsRefund: false, ageConfirmed: false })

  const finish = (data) => {
    loginUser(data.token, data.user)
    navigate(ROLE_REDIRECT[data.user.role] || '/login')
  }

  const send = async (credential, consents) => {
    setBusy(true); setError('')
    try {
      const res = await googleLogin(credential, consents)
      setConsent(null)
      finish(res.data)
    } catch (err) {
      const d = err.response?.data
      if (err.response?.status === 428 && d?.needsConsent) {
        setAgreed({ dataProtection: false, termsRefund: false, ageConfirmed: false })
        setConsent({ credential, name: d.name, email: d.email })
      } else {
        setConsent(null)
        setError(d?.message || 'Google sign-in failed. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }
  handlerRef.current = (resp) => { if (resp?.credential) send(resp.credential) }

  useEffect(() => {
    let cancelled = false
    loadGis().then(() => {
      if (cancelled || !btnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (resp) => handlerRef.current(resp),
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      })
      const width = Math.max(200, Math.min(400, Math.round(btnRef.current.offsetWidth || 400)))
      window.google.accounts.id.renderButton(btnRef.current, {
        type: 'standard', theme: 'outline', size: 'large', shape: 'pill', logo_alignment: 'center',
        text: mode === 'signup' ? 'signup_with' : 'continue_with', width,
      })
      setReady(true)
    }).catch(() => { if (!cancelled) setUnavailable(true) })
    return () => { cancelled = true }
  }, [mode])

  if (unavailable) return null
  const allAgreed = agreed.dataProtection && agreed.termsRefund && agreed.ageConfirmed

  return (
    <div>
      <div style={{ position: 'relative', minHeight: 44, display: 'flex', justifyContent: 'center' }}>
        <div ref={btnRef} style={{ width: '100%', display: 'flex', justifyContent: 'center', opacity: busy ? 0.5 : 1, pointerEvents: busy ? 'none' : 'auto' }} />
        {!ready && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 99, border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13.5, color: '#94a3b8' }}>
            Loading Google sign-in…
          </div>
        )}
      </div>
      {error && <p role="alert" style={{ marginTop: 8, fontSize: 12.5, color: '#f43f5e', fontWeight: 600, textAlign: 'center' }}>{error}</p>}

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{mode === 'signup' ? 'or sign up with email' : 'or sign in with email'}</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

      {/* First Google sign-in: accept the same terms as the sign-up form */}
      {consent && (
        <div role="dialog" aria-modal="true" aria-labelledby="g-consent-title"
          onMouseDown={e => { if (e.target === e.currentTarget && !busy) setConsent(null) }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(10,22,40,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 24px 60px rgba(10,22,40,0.35)', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <h3 id="g-consent-title" style={{ fontSize: 19, fontWeight: 800, color: '#0A1628', margin: 0 }}>Create your account</h3>
            <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 16px' }}>
              Signing up as <strong style={{ color: '#0A1628' }}>{consent.name}</strong> ({consent.email}). Please accept the following to continue.
            </p>
            {[
              ['dataProtection', <>I agree to the <a href={`${MARKETING_URL}/privacy`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Privacy Policy</a> and consent to Tourist Visa Experts processing my personal data (including passport and travel documents) for visa assistance purposes, including where applicable by staff in the UK and India under equivalent data-protection safeguards, and retained as described in the <a href={`${MARKETING_URL}/data-retention`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Data Retention Policy</a>.</>],
              ['termsRefund', <>I agree to the <a href={`${MARKETING_URL}/terms`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Terms &amp; Conditions</a> and <a href={`${MARKETING_URL}/refund-policy`} target="_blank" rel="noreferrer" style={{ color: '#F97316' }}>Refund &amp; Cancellation Policy</a>. I understand that payments are non-refundable except under the 100% Refund Guarantee plan, and that embassy appointments cannot be rescheduled once booked.</>],
              ['ageConfirmed', <>I confirm that I am 18 years of age or older.</>],
            ].map(([key, text]) => (
              <label key={key} style={{
                display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 10,
                padding: '12px 14px', borderRadius: 10,
                border: `1.5px solid ${agreed[key] ? '#F97316' : '#e2e8f0'}`,
                background: agreed[key] ? '#fff7ed' : '#fff',
              }}>
                <input type="checkbox" checked={agreed[key]} onChange={e => setAgreed(a => ({ ...a, [key]: e.target.checked }))}
                  style={{ marginTop: 2, width: 16, height: 16, accentColor: '#F97316', flexShrink: 0 }} />
                <span style={{ fontSize: 12.5, color: '#334155', lineHeight: 1.55 }}>{text}</span>
              </label>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button type="button" onClick={() => setConsent(null)} disabled={busy}
                style={{ flex: 1, padding: 13, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                Cancel
              </button>
              <button type="button" disabled={!allAgreed || busy} onClick={() => send(consent.credential, agreed)}
                style={{ flex: 2, padding: 13, borderRadius: 12, border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, fontFamily: 'inherit',
                  background: (!allAgreed || busy) ? '#fdba74' : 'linear-gradient(135deg, #F97316, #f85c00)',
                  cursor: (!allAgreed || busy) ? 'not-allowed' : 'pointer' }}>
                {busy ? 'Creating account…' : 'Create account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

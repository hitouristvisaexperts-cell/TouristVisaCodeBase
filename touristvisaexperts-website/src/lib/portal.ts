export const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || 'https://portal.touristvisaexperts.com').replace(/\/$/, '')
const API = import.meta.env.VITE_API_URL || '/api'

/**
 * Login and sign-up live on the client portal (portal.touristvisaexperts.com/login).
 * A client who is already signed in here (shared session cookie) is handed straight
 * into their portal with a one-time token instead of seeing the login form again.
 */
export async function goToPortal({ replace = false } = {}) {
  let url = `${PORTAL_URL}/login`
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2500)
    const r = await fetch(`${API}/auth/session-token`, { credentials: 'include', signal: ctrl.signal })
    clearTimeout(timer)
    const d = r.ok ? await r.json() : null
    if (d?.success && d?.token && d?.role === 'client') url = `${PORTAL_URL}/auth?token=${encodeURIComponent(d.token)}`
  } catch { /* not signed in, slow or offline → the portal's login page */ }
  if (replace) window.location.replace(url)
  else window.location.assign(url)
}

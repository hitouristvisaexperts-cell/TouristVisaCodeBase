export const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || '').replace(/\/$/, '')
const API = import.meta.env.VITE_API_URL || '/api'

/**
 * Direct navigation to client portal or login.
 * In the unified application, this always navigates to internal routes
 * on the exact same origin/port.
 */
export async function goToPortal({ replace = false } = {}) {
  // Check local session first
  try {
    const token = localStorage.getItem('fv_token')
    const userStr = localStorage.getItem('fv_user')
    if (token && userStr) {
      const user = JSON.parse(userStr)
      let dest = '/client/status'
      if (user?.role === 'admin') dest = '/admin/dashboard'
      else if (user?.role === 'manager') dest = '/manager/dashboard'
      else if (user?.role === 'team') dest = '/team/clients'
      if (replace) window.location.replace(dest)
      else window.location.assign(dest)
      return
    }
  } catch {
    // continue to fallback check
  }

  // Always use relative routes on the same origin/port
  let url = '/login'
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 2000)
    const r = await fetch(`${API}/auth/session-token`, { credentials: 'include', signal: ctrl.signal })
    clearTimeout(timer)
    const d = r.ok ? await r.json() : null
    if (d?.success && d?.token && d?.role === 'client') {
      url = `/auth?token=${encodeURIComponent(d.token)}`
    }
  } catch { /* offline or no session */ }

  if (replace) window.location.replace(url)
  else window.location.assign(url)
}

import { useEffect, useState } from 'react'

const API = import.meta.env.VITE_API_URL || '/api'

export type ClientSessionUser = { id: string; name: string; email: string; phone?: string; role: string }

// The marketing site and portal live on different subdomains, so the
// portal's localStorage token is invisible here. The backend also mirrors
// the login token into an httpOnly cookie scoped to the parent domain
// (.touristvisaexperts.com in production), so a credentialed request to
// /auth/me lets this site see the same session the portal already has.
export function useClientSession() {
  const [user, setUser] = useState<ClientSessionUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const check = () => {
      fetch(`${API}/auth/me`, { credentials: 'include' })
        .then(r => (r.ok ? r.json() : null))
        .then(data => {
          if (cancelled) return
          const role = data?.user?.role
          setUser(role === 'client' ? data.user : null)
        })
        .catch(() => { if (!cancelled) setUser(null) })
        .finally(() => { if (!cancelled) setLoading(false) })
    }

    check()

    // The session can change in another tab or on the portal subdomain
    // (e.g. the user signs out there and comes back here via back/forward
    // cache, which restores this page without re-mounting). Re-check
    // whenever the page is shown or the tab regains visibility so the
    // header never keeps showing a stale login state.
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) check() }
    const onVisibility = () => { if (document.visibilityState === 'visible') check() }
    window.addEventListener('pageshow', onPageShow)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.removeEventListener('pageshow', onPageShow)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return { user, loading }
}

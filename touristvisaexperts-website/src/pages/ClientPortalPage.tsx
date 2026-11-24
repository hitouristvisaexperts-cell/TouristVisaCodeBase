import { useEffect } from 'react'
import Navbar from '../components/Navbar'
import { PORTAL_URL, goToPortal } from '../lib/portal'

// Login and sign-up now live on the portal itself — old /client-portal links just pass through.
export default function ClientPortalPage() {
  useEffect(() => { goToPortal({ replace: true }) }, [])

  return (
    <>
      <Navbar />
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange-500 border-t-transparent" />
        <p className="text-sm font-semibold text-slate-600">Taking you to the client portal…</p>
        <a href={`${PORTAL_URL}/login`} className="text-sm font-bold text-orange-600 hover:underline">
          Not moving? Continue to Login / Sign Up →
        </a>
      </div>
    </>
  )
}

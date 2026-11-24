import { Outlet, useLocation, useNavigate } from 'react-router'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import { ClientCaseProvider, useClientCase } from '../../context/ClientCaseContext'
import Sidebar from './Sidebar'
import { getStatus } from '../../api/client'

const PAGE_MAP = {
  '/admin/dashboard':      { title: 'Dashboard',       sub: 'Overview of all visa applications' },
  '/admin/clients':        { title: 'Clients',          sub: 'Manage all client accounts' },
  '/admin/team':           { title: 'Team Members',     sub: 'Manage your consultant team' },
  '/admin/faqs':           { title: 'FAQs',             sub: 'Manage frequently asked questions' },
  '/admin/audit-logs':     { title: 'Audit Logs',       sub: 'System activity and event history' },
  '/admin/escalations':    { title: 'Needs Attention',  sub: 'Cases flagged for manager review' },
  '/admin/settings':       { title: 'Settings',         sub: 'System configuration' },
  '/admin/enquiries':      { title: 'Enquiries',        sub: 'Paid consultations and contact messages' },
  '/admin/pricing':        { title: 'Pricing & Offers', sub: 'Prices, cashback and coupons' },
  '/admin/testimonials':   { title: 'Testimonials',     sub: 'Client reviews shown on the website' },
  '/admin/notifications':  { title: 'Notifications',    sub: 'Your admin notifications' },
  '/team/clients':         { title: 'My Clients',       sub: 'Clients assigned to you' },
  '/team/notifications':   { title: 'Notifications',    sub: 'Your team notifications' },
  '/client/status':        { title: 'My Application',  sub: 'Track your visa application progress' },
  '/client/documents':     { title: 'Documents',        sub: 'Upload and manage your documents' },
  '/client/meetings':      { title: 'Meetings',         sub: 'Your scheduled consultation calls' },
  '/client/notifications': { title: 'Notifications',   sub: 'Updates on your application' },
  '/client/faqs':          { title: 'FAQs',             sub: 'Frequently asked questions' },
  '/client/support':       { title: 'Support',          sub: 'Contact our team for help' },
}

const ROLE_ACCENT = {
  admin: '#3b82f6',
  team: '#10b981',
  client: '#8b5cf6',
}

const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://portal.touristvisaexperts.com'
const MARKETING_URL = import.meta.env.VITE_MARKETING_URL || 'https://touristvisaexperts.com'

function UpgradeScreen() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:400, padding:'40px 24px', textAlign:'center' }}>
      <div style={{ width:72, height:72, borderRadius:20, marginBottom:24, background:'linear-gradient(135deg,#fff7ed,#fed7aa)', border:'1.5px solid rgba(249,115,22,0.3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32 }}>🔒</div>
      <h2 style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.03em', margin:'0 0 10px' }}>Full Access Required</h2>
      <p style={{ fontSize:14, color:'#64748b', lineHeight:1.7, maxWidth:420, margin:'0 0 28px' }}>
        Your account is registered, but you need to complete the purchase to access your visa dashboard and all features.
      </p>
      <a href={MARKETING_URL} style={{ display:'inline-flex', alignItems:'center', gap:8, background:'linear-gradient(135deg,#F97316,#f85c00)', color:'#fff', textDecoration:'none', fontWeight:700, fontSize:15, padding:'14px 28px', borderRadius:14, boxShadow:'0 4px 16px rgba(249,115,22,0.4)' }}>
        Complete Purchase →
      </a>
      <p style={{ fontSize:12, color:'#94a3b8', marginTop:16 }}>
        Already paid? Contact us at support and we'll activate your account.
      </p>
    </div>
  )
}

/* ── Toast notification popup ── */
function NotifToast({ notif, onDone, isClient }) {
  useEffect(() => {
    if (!notif) return
    const t = setTimeout(onDone, 4500)
    return () => clearTimeout(t)
  }, [notif])

  if (!notif) return null
  return (
    <div style={{
      position: 'fixed', bottom: isClient ? 84 : 24, right: 24, zIndex: 9998,
      background: '#0f172a', color: '#fff', borderRadius: 14,
      padding: '14px 18px', maxWidth: 340,
      boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
      animation: 'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both',
    }}>
      <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
        🔔
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{notif.title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.4 }}>{notif.message}</div>
      </div>
      <button onClick={onDone} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1, flexShrink: 0, padding: 0 }}>×</button>
    </div>
  )
}

/* ── Floating WhatsApp Consultant Support Button for Clients ── */
function WhatsAppFloatButton({ user }) {
  const [hovered, setHovered] = useState(false)
  if (user?.role !== 'client') return null

  const phone = import.meta.env.VITE_WHATSAPP_NUMBER || '919876543210'
  const text = encodeURIComponent(
    `Hi Tourist Visa Experts, my name is ${user?.name || 'Applicant'} (${user?.email || ''}). I am logged into my client portal and have a query regarding my visa application.`
  )
  const waUrl = `https://wa.me/${phone}?text=${text}`

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9990,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: '#25D366',
        color: '#fff',
        padding: '12px 18px',
        borderRadius: 99,
        textDecoration: 'none',
        boxShadow: hovered ? '0 8px 26px rgba(37, 211, 102, 0.45)' : '0 4px 16px rgba(37, 211, 102, 0.35)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        fontWeight: 700,
        fontSize: 13.5,
        cursor: 'pointer',
      }}
      title="Chat with your Visa Consultant on WhatsApp"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
      </svg>
      <span>Chat with Consultant</span>
    </a>
  )
}

/* ── Notification Bell ── */
function NotificationBell({ accent }) {
  const { unreadCount, clearUnread } = useSocket()
  const navigate = useNavigate()
  const { user } = useAuth()

  const handleClick = () => {
    clearUnread()
    if (user?.role === 'admin') navigate('/admin/notifications')
    else if (user?.role === 'team') navigate('/team/notifications')
    else navigate('/client/notifications')
  }

  return (
    <button
      onClick={handleClick}
      title="Notifications"
      style={{
        position: 'relative', width: 36, height: 36, borderRadius: 10,
        background: unreadCount > 0 ? `${accent}14` : '#f8fafc',
        border: `1px solid ${unreadCount > 0 ? accent + '30' : '#e2e8f0'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={unreadCount > 0 ? accent : '#64748b'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
      {unreadCount > 0 && (
        <span style={{
          position: 'absolute', top: -4, right: -4,
          minWidth: 18, height: 18, borderRadius: 99,
          background: '#ef4444', color: '#fff',
          fontSize: 10, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 4px', border: '2px solid #fff',
          lineHeight: 1,
        }}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  )
}

export default function AppLayout() {
  const { user } = useAuth()
  if (user?.role === 'client') {
    return (
      <ClientCaseProvider>
        <AppLayoutInner />
      </ClientCaseProvider>
    )
  }
  return <AppLayoutInner />
}

/* Case switcher — only rendered (and only matters) once a client has 2+ visa cases */
function CaseSwitcher({ accent }) {
  const clientCase = useClientCase()
  if (!clientCase || clientCase.cases.length < 2) return null
  const { cases, activeCaseId, setActiveCaseId } = clientCase

  return (
    <select
      value={activeCaseId || ''}
      onChange={(e) => setActiveCaseId(e.target.value)}
      style={{
        fontSize: 12.5, fontWeight: 600, color: '#334155',
        background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8,
        padding: '6px 10px', cursor: 'pointer', flexShrink: 0, maxWidth: 180,
      }}
      title="Switch visa case"
    >
      {cases.map((c) => (
        <option key={c._id} value={c._id}>
          {c.destinationCountry || c.visaType || 'Visa Case'}
        </option>
      ))}
    </select>
  )
}

function AppLayoutInner() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { latestNotif } = useSocket()
  const clientCase = useClientCase()
  const accent = ROLE_ACCENT[user?.role] || '#3b82f6'
  const [isPurchased, setIsPurchased] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!userMenuOpen) return
    const onClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [userMenuOpen])

  useEffect(() => {
    if (latestNotif) setToast(latestNotif)
  }, [latestNotif])

  // First-time login must set a real password before reaching any portal page —
  // route there instead of stacking a modal on top of whatever page they landed on.
  useEffect(() => {
    if (user?.isFirstLogin && pathname !== '/change-password') {
      navigate('/change-password', { replace: true })
    }
  }, [user?.isFirstLogin, pathname, navigate])

  useEffect(() => {
    if (user?.role !== 'client') return
    if (clientCase?.loading) return
    getStatus(clientCase?.activeCaseId)
      .then(r => setIsPurchased(r.data.data.isPurchased ?? false))
      .catch(() => setIsPurchased(true))
  }, [user?.role, clientCase?.activeCaseId, clientCase?.loading])

  // Close sidebar on route change (mobile)
  useEffect(() => { setSidebarOpen(false) }, [pathname])

  // Every portal page opens at the top (the content area keeps its own scroll position otherwise)
  const mainRef = useRef(null)
  useLayoutEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  // Tables: tag them for the responsive CSS (scroll on tablets, labelled cards on phones)
  // and copy each column heading onto its cells as data-label.
  useEffect(() => {
    const label = () => document.querySelectorAll('main table').forEach(t => {
      t.classList.add('r-table')
      const heads = [...t.querySelectorAll('thead th')].map(th => th.textContent.trim())
      t.querySelectorAll('tbody tr').forEach(tr => [...tr.children].forEach((td, i) => {
        const h = td.colSpan > 1 ? '' : (heads[i] || '')
        if (td.getAttribute('data-label') !== h) td.setAttribute('data-label', h)
      }))
    })
    label()
    const mo = new MutationObserver(label)
    mo.observe(document.body, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [])

  const OPEN_ROUTES = ['/client/faqs', '/client/support']
  const isOpenRoute = OPEN_ROUTES.some(p => pathname.startsWith(p))
  const showUpgrade = user?.role === 'client' && isPurchased === false && !isOpenRoute

  const pageInfo = Object.entries(PAGE_MAP).reduce((best, [path, info]) => {
    if (pathname.startsWith(path) && path.length > (best?.len || 0)) return { ...info, len: path.length }
    return best
  }, null)

  const isDetailPage = pathname.match(/\/clients\/[a-f0-9]{24}/i)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <NotifToast notif={toast} onDone={() => setToast(null)} isClient={user?.role === 'client'} />

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 40,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── Top header bar ── */}
        <header style={{
          height: 60,
          background: '#fff',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex', alignItems: 'center',
          padding: '0 16px 0 16px',
          flexShrink: 0,
          position: 'sticky', top: 0, zIndex: 30,
          boxShadow: '0 1px 0 0 #f1f5f9',
          gap: 12,
        }}>
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="mobile-menu-btn"
            style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#f8fafc', border: '1px solid #e2e8f0',
              display: 'none', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0, color: '#64748b',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          {/* Page title */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {pageInfo && !isDetailPage ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pageInfo.title}
                </div>
                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 1, display: 'none' }} className="header-sub">
                  {pageInfo.sub}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', letterSpacing: '-0.01em' }}>
                Tourist Visa Experts Portal
              </div>
            )}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {user?.role === 'client' && <CaseSwitcher accent={accent} />}
            <NotificationBell accent={accent} />

            {/* Role badge — hidden on very small screens */}
            <div className="role-badge" style={{
              padding: '3px 10px', borderRadius: 99,
              background: `${accent}14`, border: `1px solid ${accent}30`,
              fontSize: 11, fontWeight: 600, color: accent,
              letterSpacing: '0.04em', textTransform: 'uppercase',
            }}>
              {user?.role}
            </div>

            {/* User chip — click to open Website / Sign out */}
            <div ref={userMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: userMenuOpen ? '#f1f5f9' : '#f8fafc', border: '1px solid #e2e8f0',
                  borderRadius: 99, padding: '4px 10px 4px 4px',
                  cursor: 'pointer', fontFamily: 'var(--font-sans)',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <span className="user-name" style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  {user?.name?.split(' ')[0]}
                </span>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" style={{ transition: 'transform 0.15s', transform: userMenuOpen ? 'rotate(180deg)' : 'none' }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {userMenuOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 220, background: '#fff', borderRadius: 14,
                  border: '1px solid #e2e8f0', boxShadow: '0 12px 32px rgba(15,23,42,0.14)',
                  overflow: 'hidden', zIndex: 60,
                }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.email}
                    </div>
                  </div>
                  <a
                    href={MARKETING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setUserMenuOpen(false)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 14px', fontSize: 13.5, fontWeight: 500,
                      color: '#334155', textDecoration: 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Visit Website
                  </a>
                  <button
                    onClick={() => { setUserMenuOpen(false); logout() }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                      padding: '10px 14px', fontSize: 13.5, fontWeight: 500,
                      color: '#ef4444', background: 'transparent', border: 'none',
                      borderTop: '1px solid #f1f5f9', cursor: 'pointer',
                      fontFamily: 'var(--font-sans)', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main ref={mainRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 20px 40px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }} className="animate-fade-up">
            {showUpgrade ? <UpgradeScreen /> : <Outlet />}
          </div>
        </main>
      </div>

      {/* Floating WhatsApp Consultant Support for Clients */}
      <WhatsAppFloatButton user={user} />

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
          .role-badge { display: none !important; }
          .user-name { display: none; }
          .header-sub { display: none !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
        }
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}

import { NavLink, Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'

const ROLE_CONFIG = {
  admin: {
    accent: '#3b82f6',
    accentDim: 'rgba(59,130,246,0.15)',
    bg: 'linear-gradient(175deg, #0e1a35 0%, #080f20 60%, #060c1a 100%)',
    glowColor: 'rgba(59,130,246,0.12)',
    label: 'Admin Portal',
    navItems: [
      { to: '/admin/dashboard',  label: 'Dashboard',    icon: 'dashboard'  },
      { to: '/admin/clients',    label: 'Clients',      icon: 'clients'    },
      { to: '/admin/refunds',    label: 'Refunds',      icon: 'refund'     },
      { to: '/admin/team',       label: 'Team',         icon: 'team'       },
      { to: '/admin/faqs',       label: 'FAQs',         icon: 'faq'        },
      { to: '/admin/audit-logs', label: 'Audit Logs',   icon: 'logs'       },
      { to: '/admin/enquiries',      label: 'Enquiries',      icon: 'support'    },
      { to: '/admin/flight-orders',  label: 'Flight Orders',  icon: 'plane'      },
      { to: '/admin/articles',       label: 'Articles',       icon: 'article'    },
      { to: '/admin/testimonials',   label: 'Testimonials',   icon: 'quote'      },
      { to: '/admin/pricing',        label: 'Pricing',           icon: 'pricing'    },
      { to: '/admin/escalations',   label: 'Needs Attention',   icon: 'escalation' },
      { to: '/admin/notifications', label: 'Notifications',  icon: 'bell'       },
      { to: '/admin/settings',      label: 'Settings',       icon: 'settings'   },
    ],
  },
  manager: {
    accent: '#f59e0b',
    accentDim: 'rgba(245,158,11,0.15)',
    bg: 'linear-gradient(175deg, #1c1500 0%, #0f0b00 60%, #0a0700 100%)',
    glowColor: 'rgba(245,158,11,0.12)',
    label: 'Manager Portal',
    navItems: [
      { to: '/manager/dashboard',    label: 'Dashboard',       icon: 'dashboard'  },
      { to: '/manager/clients',      label: 'All Clients',     icon: 'clients'    },
      { to: '/manager/team',         label: 'Team',            icon: 'team'       },
      { to: '/manager/escalations',  label: 'Needs Attention', icon: 'escalation' },
      { to: '/manager/notifications',label: 'Notifications',   icon: 'bell'       },
    ],
  },
  team: {
    accent: '#10b981',
    accentDim: 'rgba(16,185,129,0.15)',
    bg: 'linear-gradient(175deg, #071f16 0%, #040f0b 60%, #030a07 100%)',
    glowColor: 'rgba(16,185,129,0.12)',
    label: 'Team Portal',
    navItems: [
      { to: '/team/clients',        label: 'My Clients',    icon: 'briefcase' },
      { to: '/team/notifications',  label: 'Notifications', icon: 'bell'      },
    ],
  },
  client: {
    accent: '#8b5cf6',
    accentDim: 'rgba(139,92,246,0.15)',
    bg: 'linear-gradient(175deg, #120b28 0%, #0a0618 60%, #070412 100%)',
    glowColor: 'rgba(139,92,246,0.12)',
    label: 'Client Portal',
    navItems: [
      { to: '/client/status',        label: 'My Application',  icon: 'status'    },
      { to: '/client/documents',     label: 'Documents',       icon: 'docs'      },
      { to: '/client/meetings',      label: 'Meetings',        icon: 'calendar'  },
      { to: '/client/notifications', label: 'Notifications',   icon: 'bell'      },
      { to: '/client/faqs',          label: 'FAQs',            icon: 'faq'       },
      { to: '/client/support',       label: 'Support',         icon: 'support'   },
      { to: '/change-password',      label: 'Change Password', icon: 'lock'      },
    ],
  },
}

function NavIcon({ type, size = 17 }) {
  const s = { width: size, height: size, flexShrink: 0 }
  const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

  const paths = {
    dashboard: <svg style={s} viewBox="0 0 24 24" {...base}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
    clients:   <svg style={s} viewBox="0 0 24 24" {...base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    refund:    <svg style={s} viewBox="0 0 24 24" {...base}><path d="M3 10h10a5 5 0 0 1 5 5v2"/><polyline points="7 6 3 10 7 14"/><path d="M13 18l-3 3-3-3"/></svg>,
    team:      <svg style={s} viewBox="0 0 24 24" {...base}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>,
    faq:       <svg style={s} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/></svg>,
    logs:      <svg style={s} viewBox="0 0 24 24" {...base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    briefcase: <svg style={s} viewBox="0 0 24 24" {...base}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="12" strokeWidth="2.5"/><path d="M2 12h20"/></svg>,
    status:    <svg style={s} viewBox="0 0 24 24" {...base}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    docs:      <svg style={s} viewBox="0 0 24 24" {...base}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    calendar:  <svg style={s} viewBox="0 0 24 24" {...base}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    bell:      <svg style={s} viewBox="0 0 24 24" {...base}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    support:   <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    lock:      <svg style={s} viewBox="0 0 24 24" {...base}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    logout:    <svg style={s} viewBox="0 0 24 24" {...base}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    plane:     <svg style={s} viewBox="0 0 24 24" {...base}><path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>,
    escalation:<svg style={s} viewBox="0 0 24 24" {...base}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.5"/></svg>,
    article:   <svg style={s} viewBox="0 0 24 24" {...base}><path d="M4 4h16v16H4z" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg>,
    quote:     <svg style={s} viewBox="0 0 24 24" {...base}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2H4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 0-1 1.03V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.76-2-2-2h-4c-1.25 0-2 .75-2 1.97V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>,
    pricing:   <svg style={s} viewBox="0 0 24 24" {...base}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    settings:  <svg style={s} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    close:     <svg style={s} viewBox="0 0 24 24" {...base}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    website:   <svg style={s} viewBox="0 0 24 24" {...base}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  }
  return paths[type] || null
}

function Avatar({ name, accent, size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${accent}cc, ${accent}55)`,
      border: `1.5px solid ${accent}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, color: '#fff', flexShrink: 0,
      fontFamily: 'var(--font-sans)', letterSpacing: '-0.01em',
    }}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth()
  const role = user?.role || 'client'
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.client
  const { accent, accentDim, bg, glowColor, label, navItems } = config

  return (
    <>
      <aside style={{
        width: 248,
        minHeight: '100vh',
        background: bg,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        // Mobile: fixed overlay, slides in/out
        zIndex: 50,
      }}
        className={`sidebar-panel${open ? ' sidebar-open' : ''}`}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 200,
          background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        {/* ── Logo / Brand — full-width band so the light logo reads as part of
             the header, not a card floating on the dark panel ── */}
        <div style={{
          background: '#fff',
          padding: '18px 20px 14px',
          position: 'relative',
          borderBottom: `2px solid ${accent}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt="Tourist Visa Experts" style={{ height: 26, objectFit: 'contain', flex: 1 }} />
            {/* Close button (mobile only) */}
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'rgba(15,23,42,0.06)', border: 'none',
                display: 'none', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#64748b',
                flexShrink: 0,
              }}
            >
              <NavIcon type="close" size={14} />
            </button>
          </div>
          <div style={{ color: accent, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 8 }}>
            {label}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

        {/* ── Navigation ── */}
        <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', padding: '8px 10px 4px' }}>
            Navigation
          </div>

          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 10, textDecoration: 'none',
                fontSize: 13.5, fontWeight: isActive ? 600 : 500,
                color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
                background: isActive ? accentDim : 'transparent',
                position: 'relative', transition: 'all 0.15s ease',
                letterSpacing: '-0.01em',
              })}
              onMouseEnter={e => {
                if (!e.currentTarget.dataset.active) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={e => {
                if (!e.currentTarget.dataset.active) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.45)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div style={{
                      position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                      width: 3, height: 18, borderRadius: '0 3px 3px 0',
                      background: accent, boxShadow: `0 0 8px ${accent}`,
                    }} />
                  )}
                  <span style={{ color: isActive ? accent : 'inherit', transition: 'color 0.15s' }}>
                    <NavIcon type={item.icon} />
                  </span>
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}

          <Link
            to="/"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 10, textDecoration: 'none',
              fontSize: 13.5, fontWeight: 500,
              color: 'rgba(255,255,255,0.45)',
              transition: 'all 0.15s ease', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' }}
          >
            <NavIcon type="website" />
            <span>Visit Website</span>
          </Link>

          <button
            onClick={logout}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 10, border: 'none',
              fontSize: 13.5, fontWeight: 500, textAlign: 'left',
              color: 'rgba(255,255,255,0.45)', background: 'transparent',
              cursor: 'pointer', transition: 'all 0.15s ease',
              letterSpacing: '-0.01em', fontFamily: 'var(--font-sans)', width: '100%',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.08)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; e.currentTarget.style.background = 'transparent' }}
          >
            <NavIcon type="logout" />
            <span>Sign out</span>
          </button>
        </nav>

        {/* ── User identity ── */}
        <div style={{ margin: '0 10px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', padding: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name={user?.name} accent={accent} />
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 13, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name}
              </div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <style>{`
        /* Desktop: normal sidebar */
        @media (min-width: 769px) {
          .sidebar-panel {
            position: relative !important;
            transform: none !important;
          }
          .sidebar-close-btn { display: none !important; }
        }

        /* Mobile: sidebar is a fixed left-drawer */
        @media (max-width: 768px) {
          .sidebar-panel {
            position: fixed !important;
            top: 0; left: 0; bottom: 0;
            transform: translateX(-100%);
            transition: transform 0.26s cubic-bezier(0.4,0,0.2,1);
            min-height: 100dvh;
          }
          .sidebar-panel.sidebar-open {
            transform: translateX(0);
          }
          .sidebar-close-btn { display: flex !important; }
        }
      `}</style>
    </>
  )
}

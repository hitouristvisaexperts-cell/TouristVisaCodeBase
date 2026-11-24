import { useEffect, useState } from 'react'
import styles from './Navbar.module.css'
import { useNavigation } from '../context/NavigationContext'
import { useClientSession } from '../hooks/useClientSession'
import SearchDialog from './SearchDialog'

/* ── Plane icon inline ───────────────────────────────────────────── */
function PlaneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
    </svg>
  )
}

const NAV_LINKS = [
  { label: 'Home',       target: 'home',      hasDropdown: false },
  { label: 'About Us',   target: 'about-us',  hasDropdown: false },
  { label: 'Services',   target: 'services',  hasDropdown: true  },
  { label: 'Resources',  target: 'resources', hasDropdown: true  },
  { label: 'Contact Us', target: 'contact',   hasDropdown: false },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  // Ctrl+K / Cmd+K (or "/" when not typing in a field) opens site search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName))
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  const { navigateTo, openFlightReservation, openClientPortal, openRejectedVisa } = useNavigation()
  const { user } = useClientSession()
  // Signed-in clients see their first name; everyone else goes to the portal's login / sign-up page
  const accountLabel = user ? user.name.split(' ')[0] : 'Login / Sign Up'

  const handleNav = (target: string) => {
    navigateTo(target)
    setMenuOpen(false)
  }

  return (
    <nav className={styles.navbar}>
      <div className={styles.inner}>
        {/* Logo */}
        <button
          onClick={() => handleNav('home')}
          className={styles.logoLink}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          aria-label="Go to homepage"
        >
          <img src="/logo.png" alt="Tourist Visa Experts" className={styles.logoImg} />
        </button>

        {/* Desktop Nav */}
        <ul className={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <li key={link.label} className={styles.navItem}>
              <button
                onClick={() => handleNav(link.target)}
                className={styles.navLink}
                style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
              >
                {link.label}
                {link.hasDropdown && (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>

        {/* Right Actions */}
        <div className={styles.actions}>
          {/* Rejected Visa CTA */}
          <button
            onClick={() => openRejectedVisa()}
            className={styles.rejectedBtn}
            aria-label="Visa Rejected?"
          >
            Visa Rejected?
          </button>
          {/* Flight Ticket CTA — highlighted */}
          <button
            onClick={openFlightReservation}
            className={styles.flightBtn}
            aria-label="Book Flight Ticket"
          >
            <PlaneIcon />
            Flight Ticket
            <span className={styles.flightBadge}>₹999</span>
          </button>
          <button className={styles.searchBtn} aria-label="Search the site" title="Search (Ctrl+K)" onClick={() => setSearchOpen(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
          <button className={styles.accountBtn} onClick={() => { openClientPortal(); setMenuOpen(false) }} aria-label={accountLabel} title={accountLabel}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className={styles.accountLabel}>{accountLabel}</span>
          </button>
        </div>

        {/* Hamburger */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
          <span className={styles.bar} />
          <span className={styles.bar} />
          <span className={styles.bar} />
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <button
            onClick={() => { setMenuOpen(false); setSearchOpen(true) }}
            className="mb-2 flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-[15px] text-slate-500"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.4">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            Search countries, services…
          </button>
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => handleNav(link.target)}
              className={styles.mobileLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit', textAlign: 'left', width: '100%' }}
            >
              {link.label}
            </button>
          ))}
          {/* Mobile Rejected Visa CTA */}
          <button
            onClick={() => { openRejectedVisa(); setMenuOpen(false) }}
            className={styles.rejectedBtnMobile}
          >
            Visa Rejected? We Fix It
          </button>
          {/* Mobile Flight CTA */}
          <button
            onClick={() => { openFlightReservation(); setMenuOpen(false) }}
            className={styles.flightBtnMobile}
          >
            <PlaneIcon />
            Book Flight Ticket — ₹999
          </button>
          <button className={styles.accountBtnMobile} onClick={() => { openClientPortal(); setMenuOpen(false) }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            {accountLabel}
          </button>
        </div>
      )}
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </nav>
  )
}

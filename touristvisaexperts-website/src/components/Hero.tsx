import { useState, useEffect, useRef } from 'react'
import styles from './Hero.module.css'

const COUNTRIES = [
  { label: 'India',  flag: '🇮🇳', code: 'in' },
  { label: 'UK',     flag: '🇬🇧', code: 'gb' },
  { label: 'USA',    flag: '🇺🇸', code: 'us' },
  { label: 'Europe', flag: '🇪🇺', code: 'eu' },
  { label: 'Other',  flag: '🌍',  code: 'xx' },
]

export const DESTINATIONS = [
  // Main destinations
  { label: 'Schengen',    flag: '🇪🇺', code: 'eu' },
  { label: 'USA',         flag: '🇺🇸', code: 'us' },
  { label: 'UK',          flag: '🇬🇧', code: 'gb' },
  { label: 'Canada',      flag: '🇨🇦', code: 'ca' },
  { label: 'Australia',   flag: '🇦🇺', code: 'au' },
  { label: 'New Zealand', flag: '🇳🇿', code: 'nz' },
  { label: 'Turkey',      flag: '🇹🇷', code: 'tr' },
  { label: 'Singapore',   flag: '🇸🇬', code: 'sg' },
  // Schengen countries
  { label: 'Austria',        flag: '🇦🇹', code: 'at' },
  { label: 'Belgium',        flag: '🇧🇪', code: 'be' },
  { label: 'Bulgaria',       flag: '🇧🇬', code: 'bg' },
  { label: 'Croatia',        flag: '🇭🇷', code: 'hr' },
  { label: 'Czech Republic', flag: '🇨🇿', code: 'cz' },
  { label: 'Denmark',        flag: '🇩🇰', code: 'dk' },
  { label: 'Estonia',        flag: '🇪🇪', code: 'ee' },
  { label: 'Finland',        flag: '🇫🇮', code: 'fi' },
  { label: 'France',         flag: '🇫🇷', code: 'fr' },
  { label: 'Germany',        flag: '🇩🇪', code: 'de' },
  { label: 'Greece',         flag: '🇬🇷', code: 'gr' },
  { label: 'Hungary',        flag: '🇭🇺', code: 'hu' },
  { label: 'Iceland',        flag: '🇮🇸', code: 'is' },
  { label: 'Italy',          flag: '🇮🇹', code: 'it' },
  { label: 'Latvia',         flag: '🇱🇻', code: 'lv' },
  { label: 'Liechtenstein',  flag: '🇱🇮', code: 'li' },
  { label: 'Lithuania',      flag: '🇱🇹', code: 'lt' },
  { label: 'Luxembourg',     flag: '🇱🇺', code: 'lu' },
  { label: 'Malta',          flag: '🇲🇹', code: 'mt' },
  { label: 'Netherlands',    flag: '🇳🇱', code: 'nl' },
  { label: 'Norway',         flag: '🇳🇴', code: 'no' },
  { label: 'Poland',         flag: '🇵🇱', code: 'pl' },
  { label: 'Portugal',       flag: '🇵🇹', code: 'pt' },
  { label: 'Romania',        flag: '🇷🇴', code: 'ro' },
  { label: 'Slovakia',       flag: '🇸🇰', code: 'sk' },
  { label: 'Slovenia',       flag: '🇸🇮', code: 'si' },
  { label: 'Spain',          flag: '🇪🇸', code: 'es' },
  { label: 'Sweden',         flag: '🇸🇪', code: 'se' },
  { label: 'Switzerland',    flag: '🇨🇭', code: 'ch' },
]

const POPULAR_FROM = ['India', 'UK', 'USA', 'Europe']
const POPULAR_TO   = ['Schengen', 'USA', 'UK', 'Canada', 'Australia', 'New Zealand', 'Turkey']

type Option = { label: string; flag: string; code: string }

const flagSrc = (code: string) => `https://flagcdn.com/w40/${code}.png`

const OTHER_OPTION: Option = { label: 'Other', flag: '🌍', code: 'xx' }

function renderItem(
  o: Option,
  value: Option | null,
  onChange: (o: Option) => void,
  setOpen: (v: boolean) => void,
  styles: Record<string, string>,
  flagSrc: (code: string) => string,
) {
  const isOther = o.code === 'xx'
  return (
    <li
      key={o.label}
      role="option"
      aria-selected={value?.label === o.label}
      className={`${styles.ddItem} ${value?.label === o.label ? styles.ddItemActive : ''}`}
      onClick={() => { onChange(o); setOpen(false) }}
    >
      {isOther
        ? <span style={{ fontSize: 18, lineHeight: 1, width: 22, display: 'inline-block', textAlign: 'center' }}>🌍</span>
        : <img
            src={flagSrc(o.code)}
            width="22" height="16"
            alt={o.label}
            className={styles.flagImg}
            onError={(e) => { (e.target as HTMLImageElement).replaceWith(document.createTextNode(o.flag)) }}
          />
      }
      <span className={styles.ddItemLabel}>{o.label}</span>
      {value?.label === o.label && (
        <svg className={styles.ddCheck} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      )}
    </li>
  )
}

function CountrySelect({
  options, value, onChange, placeholder, subtitle, icon, triggerLabel, popular = [], alignRight = false, showOtherOnSearch = false,
}: {
  options: Option[]
  value: Option | null
  onChange: (o: Option) => void
  placeholder: string
  subtitle: string
  icon: React.ReactNode
  triggerLabel: string
  popular?: string[]
  alignRight?: boolean
  showOtherOnSearch?: boolean
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const ref      = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const mainOptions = options.filter(o => o.label !== 'Other')
  const filtered    = query
    ? mainOptions.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : mainOptions
  // When searching and no main match — show Other as a result
  const showOther   = showOtherOnSearch && query.length > 0 && filtered.length === 0
  const popularOpts = filtered.filter(o => popular.includes(o.label))
  const otherOpts   = filtered.filter(o => !popular.includes(o.label))

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50)
    else setQuery('')
  }, [open])

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} className={styles.ddWrap}>
      <div className={styles.ddLabelPill}>{triggerLabel}</div>

      <button
        type="button"
        className={`${styles.ddTrigger} ${open ? styles.ddTriggerOpen : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <div className={styles.ddIconBox}>{icon}</div>
        <div className={styles.ddTriggerContent}>
          <div className={styles.ddTriggerTitle}>
            {value ? (
              <span className={styles.ddSelectedRow}>
                <img
                  src={flagSrc(value.code)}
                  width="22" height="16"
                  alt=""
                  aria-hidden="true"
                  className={styles.flagImg}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {value.label}
              </span>
            ) : placeholder}
          </div>
          <div className={styles.ddTriggerSub}>{value ? '' : subtitle}</div>
        </div>
        <svg
          className={`${styles.ddChevron} ${open ? styles.ddChevronUp : ''}`}
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5"
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className={`${styles.ddPanel} ${alignRight ? styles.ddPanelRight : ''}`} role="listbox">
          <div className={styles.ddSearch}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref={inputRef}
              className={styles.ddInput}
              placeholder="Search country..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button className={styles.ddClear} onClick={() => setQuery('')}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          <ul className={styles.ddList}>
            {/* No results + not showing Other fallback */}
            {filtered.length === 0 && !showOther && (
              <li className={styles.ddEmpty}>No results found</li>
            )}

            {/* No-query: show all options in order */}
            {!query && (
              <>
                {popularOpts.map(o => renderItem(o, value, onChange, setOpen, styles, flagSrc))}
                {otherOpts.length > 0 && popularOpts.length > 0 && <li className={styles.ddDivider} />}
                {otherOpts.map(o => renderItem(o, value, onChange, setOpen, styles, flagSrc))}
                {/* Always show Other at bottom when not searching */}
                {showOtherOnSearch && (
                  <>
                    <li className={styles.ddDivider} />
                    {renderItem(OTHER_OPTION, value, onChange, setOpen, styles, flagSrc)}
                  </>
                )}
              </>
            )}

            {/* Search: show filtered matches or Other fallback */}
            {query && !showOther && filtered.map(o => renderItem(o, value, onChange, setOpen, styles, flagSrc))}
            {showOther && renderItem(OTHER_OPTION, value, onChange, setOpen, styles, flagSrc)}
          </ul>
        </div>
      )}
    </div>
  )
}

type HeroProps = {
  onCheck?: (from: Option | null, to: Option | null) => void
}

export default function Hero({ onCheck }: HeroProps) {
  const [from, setFrom] = useState<Option | null>(null)
  const [to, setTo]     = useState<Option | null>(null)
  const [error, setError] = useState('')

  // Swap exchanges the two selections exactly (like a flight search). If that leaves a
  // destination we don't offer (e.g. "India"), Check Requirements explains instead of failing silently.
  const handleSwap = () => {
    setFrom(to)
    setTo(from)
    setError('')
  }

  const handleCheck = () => {
    if (!from) { setError('Please choose the country you are applying from.'); return }
    if (!to) { setError('Please choose your destination.'); return }
    if (!DESTINATIONS.some(d => d.label === to.label)) {
      setError(`We don't offer visas for ${to.label}. Please choose a destination from the list.`)
      return
    }
    setError('')
    onCheck?.(from, to)
  }

  return (
    <section className={styles.hero}>

      <div className={styles.bgPanel} aria-hidden="true">
        <img
          src="/hero-image.webp"
          srcSet="/hero-image-800.webp 800w, /hero-image.webp 1535w"
          sizes="(max-width: 768px) 100vw, 65vw"
          width={1535}
          height={1024}
          fetchPriority="high"
          alt="Tourist visa destination landscape"
          className={styles.bgImg}
        />
      </div>

      <div className={styles.wrapper}>
        <div className={styles.topRow}>
          <div className={styles.content}>

            <div className={styles.badge}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="#F97316">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              #1 Visa Assistance Company
            </div>

            <h1 className={styles.heading}>
              Making Your Travel
              <span className={styles.script} style={{ display: 'block' }}>Dreams Come True</span>
            </h1>

            <p className={styles.desc}>
              Expert visa assistance with meticulous document preparation and
              end-to-end guidance.
            </p>

            <div className={styles.formCard}>
              <div className={styles.formRow}>

                <CountrySelect
                  options={COUNTRIES}
                  value={from}
                  onChange={(o) => { setFrom(o); setError('') }}
                  placeholder="Select Country"
                  subtitle="Choose your current location"
                  triggerLabel="I'm Applying From"
                  popular={POPULAR_FROM}
                  showOtherOnSearch={true}
                  icon={
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
                    </svg>
                  }
                />

                <button type="button" className={styles.swapBtn} onClick={handleSwap} title="Swap" aria-label="Swap applying-from and destination">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M4 7h14m0 0l-4-4m4 4l-4 4"/><path d="M20 17H6m0 0l4-4m-4 4l4 4"/>
                  </svg>
                </button>

                <CountrySelect
                  options={DESTINATIONS}
                  value={to}
                  onChange={(o) => { setTo(o); setError('') }}
                  placeholder="Select Destination"
                  subtitle="Where are you traveling to?"
                  triggerLabel="I'm Going To"
                  popular={POPULAR_TO}
                  alignRight={true}
                  icon={
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  }
                />

              </div>

              {error && (
                <p role="alert" style={{ margin: '10px 0 0', color: '#dc2626', fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{error}</p>
              )}
              <button className={styles.checkBtn} onClick={handleCheck}>
                <span>Check Requirements</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

              <div className={styles.checkBtnSub}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                Takes less than 30 seconds
              </div>

              <div className={styles.trustRow}>
                <div className={styles.trustItem}>
                  <div className={styles.trustIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2.2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                      <polyline points="9 12 11 14 15 10"/>
                    </svg>
                  </div>
                  <div>
                    <div className={styles.trustTitle}>100% Secure &amp; Confidential</div>
                    <div className={styles.trustSub}>Your information is safe with us.</div>
                  </div>
                </div>
                <div className={styles.trustDivider} />
                <div className={styles.trustItem}>
                  <div className={styles.avatarGroup}>
                    <img src="https://i.pravatar.cc/32?img=1" className={styles.avatar} alt="Traveler avatar" />
                    <img src="https://i.pravatar.cc/32?img=2" className={styles.avatar} alt="Traveler avatar" />
                    <img src="https://i.pravatar.cc/32?img=3" className={styles.avatar} alt="Traveler avatar" />
                    <img src="https://i.pravatar.cc/32?img=4" className={styles.avatar} alt="Traveler avatar" />
                  </div>
                  <div>
                    <div className={styles.trustTitle}>Trusted by 2,500+ Travelers</div>
                    <div className={styles.trustSub}>Join thousands of happy travelers.</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}

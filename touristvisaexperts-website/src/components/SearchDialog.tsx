import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'
import {
  Search, X, ArrowRight, Plane, FileCheck2, Headphones, ShieldAlert, ShieldCheck,
  FileText, Info, UserCircle2, HelpCircle, Scale, CornerDownLeft,
} from 'lucide-react'
import { useNavigation } from '../context/NavigationContext'
import { DESTINATIONS } from './Hero'
import { faqs } from './site/FAQ'

type Result = {
  id: string
  group: 'Destinations' | 'Services' | 'Pages' | 'FAQs'
  title: string
  subtitle?: string
  keywords?: string
  flagCode?: string
  Icon?: React.ElementType
  run: () => void
}

// Shown in the home-page cards but not in the hero country picker
const EXTRA_DESTINATIONS = [
  { label: 'UAE', flag: '🇦🇪', code: 'ae' },
  { label: 'Singapore', flag: '🇸🇬', code: 'sg' },
  { label: 'Japan', flag: '🇯🇵', code: 'jp' },
]
const POPULAR = ['USA', 'UK', 'Schengen', 'Canada', 'Australia', 'UAE']

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[^\w\s]/g, '').trim()

export default function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate()
  const nav = useNavigation()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const all = useMemo<Result[]>(() => {
    const go = (fn: () => void) => () => { onClose(); fn() }
    const dests = [
      ...DESTINATIONS.map(d => ({ label: d.label, flag: d.flag, code: d.code })),
      ...EXTRA_DESTINATIONS,
    ].map<Result>(d => ({
      id: `dest-${d.label}`,
      group: 'Destinations',
      title: `${d.label} Visa`,
      subtitle: 'Tourist visa · requirements, documents & price',
      keywords: `${d.label} tourist visa ${d.label === 'Schengen' ? 'europe eu' : ''} ${d.label === 'UAE' ? 'dubai emirates' : ''} ${d.label === 'USA' ? 'america united states us b1 b2' : ''} ${d.label === 'UK' ? 'united kingdom britain england london' : ''}`,
      flagCode: d.code,
      run: go(() => nav.openVisaDetails(d.label, d.flag)),
    }))
    const services: Result[] = [
      { id: 's-visa', group: 'Services', title: 'Visa Assistance', subtitle: 'A dedicated expert handles your application', keywords: 'apply help tourist package', Icon: FileCheck2, run: go(nav.openVisaAssistance) },
      { id: 's-flight', group: 'Services', title: 'Flight Reservation — ₹999', subtitle: 'Embassy-ready dummy flight ticket', keywords: 'dummy ticket booking itinerary air', Icon: Plane, run: go(nav.openFlightReservation) },
      { id: 's-consult', group: 'Services', title: 'Book a Consultation', subtitle: '1-on-1 session with a visa expert', keywords: 'talk expert call meeting advice contact', Icon: Headphones, run: go(nav.openConsultation) },
      { id: 's-rejected', group: 'Services', title: 'Visa Rejected? We Fix It', subtitle: 'Re-application with a specialist', keywords: 'refused refusal denied reapply specialist', Icon: ShieldAlert, run: go(nav.openRejectedVisa) },
      { id: 's-guarantee', group: 'Services', title: '100% Refund Guarantee', subtitle: 'How the refund guarantee works', keywords: 'money back refund guarantee', Icon: ShieldCheck, run: go(() => navigate('/refund-guarantee')) },
      { id: 's-docs', group: 'Services', title: 'Document Checklist', subtitle: 'What documents you need', keywords: 'documents checklist papers bank statement passport', Icon: FileText, run: go(() => navigate('/documents')) },
    ]
    const pages: Result[] = [
      { id: 'p-about', group: 'Pages', title: 'About Us', keywords: 'company who we are story', Icon: Info, run: go(() => nav.navigateTo('about-us')) },
      { id: 'p-account', group: 'Pages', title: 'Login / Sign Up', subtitle: 'Client portal — track your application', keywords: 'login sign in sign up register account portal status track dashboard', Icon: UserCircle2, run: go(nav.openClientPortal) },
      { id: 'p-contact', group: 'Pages', title: 'Contact Us', subtitle: 'Phone, email, WhatsApp & address', keywords: 'phone email whatsapp address reach', Icon: Headphones, run: go(() => nav.navigateTo('contact')) },
      { id: 'p-terms', group: 'Pages', title: 'Terms & Conditions', keywords: 'terms service legal', Icon: Scale, run: go(() => navigate('/terms')) },
      { id: 'p-refund', group: 'Pages', title: 'Refund & Cancellation Policy', keywords: 'refund cancel cancellation policy', Icon: Scale, run: go(() => navigate('/refund-policy')) },
      { id: 'p-privacy', group: 'Pages', title: 'Privacy Policy', keywords: 'privacy data personal', Icon: Scale, run: go(() => navigate('/privacy')) },
      { id: 'p-disclaimer', group: 'Pages', title: 'Disclaimer', keywords: 'disclaimer legal', Icon: Scale, run: go(() => navigate('/disclaimer')) },
    ]
    const faqItems: Result[] = faqs.map((f, i) => ({
      id: `faq-${i}`, group: 'FAQs', title: f.q, subtitle: f.a, Icon: HelpCircle,
      run: go(() => nav.navigateTo('faq')),
    }))
    return [...dests, ...services, ...pages, ...faqItems]
  }, [nav, navigate, onClose])

  const results = useMemo(() => {
    const q = norm(query)
    if (!q) {
      // Nothing typed yet: popular destinations + main services
      return [
        ...POPULAR.map(p => all.find(r => r.id === `dest-${p}`)!).filter(Boolean),
        ...all.filter(r => r.group === 'Services'),
      ]
    }
    const words = q.split(/\s+/)
    return all
      .map(r => {
        const title = norm(r.title)
        const hay = `${title} ${norm(r.keywords || '')} ${norm(r.subtitle || '')}`
        // Each typed word must match the start of a word ("ger" finds Germany, not "stronger")
        if (!words.every(w => ` ${hay}`.includes(` ${w}`))) return null
        // Rank: title starts with query > title contains query > keyword/subtitle match
        const score = title.startsWith(q) ? 0 : title.includes(q) ? 1 : words.every(w => title.includes(w)) ? 2 : 3
        return { r, score }
      })
      .filter((x): x is { r: Result; score: number } => x !== null)
      .sort((a, b) => a.score - b.score)
      .map(x => x.r)
      .slice(0, 30)
  }, [query, all])

  // Lock page scroll while open; clear the query after closing so the next open starts fresh.
  // (Focus comes from autoFocus on the input, so keys typed right after Ctrl+K are never lost.)
  useEffect(() => {
    if (!open) { setQuery(''); setActive(0); return }
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [open])

  useEffect(() => { setActive(0) }, [query])

  // Keep the highlighted row visible while using arrow keys
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [active])

  if (!open) return null

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { e.preventDefault(); onClose() }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); results[active]?.run() }
  }

  let lastGroup = ''

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-[#0A1628]/60 backdrop-blur-sm px-3 pt-[8vh] sm:pt-[12vh]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Search the site"
    >
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl" onKeyDown={onKeyDown}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-4">
          <Search className="h-5 w-5 shrink-0 text-orange-500" />
          <input
            ref={inputRef}
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search a country, service or question…"
            className="h-14 flex-1 min-w-0 bg-transparent text-slate-900 placeholder:text-slate-400 outline-none"
            style={{ fontSize: 16 }}
            aria-label="Search"
            aria-controls="site-search-results"
            aria-activedescendant={results[active] ? `sr-${results[active].id}` : undefined}
          />
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Close search">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div ref={listRef} id="site-search-results" role="listbox" className="max-h-[60vh] overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="font-semibold text-slate-700">No results for “{query}”</p>
              <p className="mt-1 text-sm text-slate-500">Try a country name like “Canada”, or ask our experts directly.</p>
              <button
                type="button"
                onClick={() => { onClose(); nav.openConsultation() }}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                Talk to an expert <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : results.map((r, i) => {
            const header = !query.trim() && i === 0 ? 'Popular destinations'
              : !query.trim() && r.group !== lastGroup && r.group === 'Services' ? 'Services'
              : query.trim() && r.group !== lastGroup ? r.group : null
            lastGroup = r.group
            const Icon = r.Icon
            return (
              <div key={r.id}>
                {header && <p className="px-4 pb-1 pt-3 text-[11px] font-bold uppercase tracking-wider text-slate-500">{header}</p>}
                <button
                  type="button"
                  id={`sr-${r.id}`}
                  data-idx={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseMove={() => setActive(i)}
                  onClick={r.run}
                  className={`mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${i === active ? 'bg-orange-50' : ''}`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                    {r.flagCode
                      ? <img src={`https://flagcdn.com/w40/${r.flagCode}.png`} alt="" width={26} height={18} className="rounded-sm object-cover" loading="lazy" />
                      : Icon && <Icon className="h-4 w-4 text-orange-500" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">{r.title}</span>
                    {r.subtitle && <span className="block truncate text-xs text-slate-500">{r.subtitle}</span>}
                  </span>
                  {i === active && <CornerDownLeft className="hidden h-4 w-4 shrink-0 text-orange-500 sm:block" />}
                </button>
              </div>
            )
          })}
        </div>

        <div className="hidden items-center gap-4 border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-500 sm:flex">
          <span><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">↑</kbd> <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">↓</kbd> to move</span>
          <span><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">Enter</kbd> to open</span>
          <span><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">Esc</kbd> to close</span>
          <span className="ml-auto"><kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">Ctrl</kbd> + <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans">K</kbd> anywhere</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

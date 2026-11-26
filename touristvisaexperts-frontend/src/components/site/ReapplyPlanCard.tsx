import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Check, ChevronDown, Info, Minus, Plus, ShieldCheck, Sparkles, Users, Wallet, X } from 'lucide-react'
import { useNavigation } from '../../context/NavigationContext'
import { REAPPLICATION_COUNTRIES, formatInr, reapplyPlanPriceInr, type ReapplyPlan } from '../../lib/pricing'

/* Shared by the Visa Rejected page (Specialist plan, can switch to Guarantee),
   the Refund Guarantee page (Guarantee plan) and their mobile bottom sheets. */

const FLAG_CODE: Record<string, string> = {
  Schengen: 'eu', UK: 'gb', USA: 'us', Canada: 'ca', Australia: 'au', 'New Zealand': 'nz',
  Austria: 'at', Belgium: 'be', Bulgaria: 'bg', Croatia: 'hr', Czechia: 'cz', Denmark: 'dk', Estonia: 'ee', Finland: 'fi',
  France: 'fr', Germany: 'de', Greece: 'gr', Hungary: 'hu', Iceland: 'is', Italy: 'it', Latvia: 'lv', Liechtenstein: 'li',
  Lithuania: 'lt', Luxembourg: 'lu', Malta: 'mt', Netherlands: 'nl', Norway: 'no', Poland: 'pl', Portugal: 'pt',
  Romania: 'ro', Slovakia: 'sk', Slovenia: 'si', Spain: 'es', Sweden: 'se', Switzerland: 'ch',
}
export const flagUrl = (c: string) => `https://flagcdn.com/w40/${FLAG_CODE[c] || 'un'}.png`
// No generic "Schengen" entry — the client picks the Schengen country that refused the visa
const MAIN_COUNTRIES = ['UK', 'USA', 'Canada', 'Australia', 'New Zealand']
const FROM_OPTIONS = [
  { label: 'India', code: 'in' }, { label: 'United Kingdom', code: 'gb' }, { label: 'United States', code: 'us' },
  { label: 'UAE', code: 'ae' }, { label: 'Other', code: 'un' },
]

const PLAN = {
  specialist: {
    title: 'Specialist Re-application', sub: 'Expert support for your next application', label: 'Specialist package',
    Icon: Sparkles, header: 'from-orange-500 to-orange-600', accent: 'text-orange-500', btn: 'bg-orange-500 hover:bg-orange-600 shadow-[0_8px_22px_rgba(249,115,22,0.35)]',
    included: ['Rejection letter analysis', 'Full document review', 'Tailored cover letter', 'Senior specialist review', 'Reapplication support'],
  },
  guarantee: {
    title: 'Guarantee Re-application', sub: 'Expert support with service-fee protection', label: 'Guarantee package',
    Icon: ShieldCheck, header: 'from-green-600 to-green-700', accent: 'text-green-700', btn: 'bg-green-700 hover:bg-green-800 shadow-[0_8px_22px_rgba(21,128,61,0.3)]',
    included: ['Everything in Specialist plan', 'Priority senior specialist', 'Unlimited document revisions', '24/7 expert support', '100% service-fee refund on eligible refusals'],
  },
} as const

export function useRejectedCashback() {
  const [cb, setCb] = useState({ enabled: true, amount: 5000 })
  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || '/api'
    fetch(`${API}/settings/cashback`).then(r => r.json()).then(d => {
      if (d?.success) setCb({ enabled: d.data?.enabled !== false, amount: Number(d.data?.rejectedPerPerson ?? 5000) })
    }).catch(() => {})
  }, [])
  return cb
}

type Props = {
  plan?: ReapplyPlan                        // default: Specialist (Visa Rejected page)
  onPlanChange?: (p: ReapplyPlan) => void   // Specialist card offers "View Guarantee Plan"
  initialCountry?: string
  initialTravellers?: number
  onClose?: () => void                      // shown in mobile bottom sheets
  className?: string
}

export function ReapplyPlanCard({ plan = 'specialist', onPlanChange, initialCountry = '', initialTravellers = 1, onClose, className = '' }: Props) {
  const { openCheckout } = useNavigation()
  const cfg = PLAN[plan]
  const cashback = useRejectedCashback()
  const [from, setFrom] = useState('India')
  const [country, setCountry] = useState(initialCountry === 'Schengen' ? '' : initialCountry)
  const [travellers, setTravellers] = useState(initialTravellers)
  const [open, setOpen] = useState(false)
  const [fromOpen, setFromOpen] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const fromRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const price = reapplyPlanPriceInr(plan)
  const cbAmount = cashback.enabled ? cashback.amount : 0
  const others = REAPPLICATION_COUNTRIES.filter(c => c !== 'Schengen' && !MAIN_COUNTRIES.includes(c)).sort()
  const fromFlag = FROM_OPTIONS.find(o => o.label === from)?.code || 'un'

  const proceed = () => {
    if (!country) { setError('Please choose the country that refused your visa.'); return }
    openCheckout(country, from, travellers, plan === 'guarantee' ? 'guarantee' : 'standard')
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-20px_rgba(10,31,68,0.35)] ${className}`}>
      {/* Header */}
      <div className={`flex items-center gap-3 bg-gradient-to-r px-4 py-3.5 ${cfg.header}`}>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15"><cfg.Icon className="h-5 w-5 text-white" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-black leading-tight text-white">{cfg.title}</p>
          <p className="text-[12px] text-white/85">{cfg.sub}</p>
        </div>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/50 text-white hover:bg-white/15"><X className="h-4 w-4" /></button>
        )}
      </div>

      <div className="px-4 pb-4 pt-3">
        {/* Applying from */}
        <div ref={fromRef} className="relative">
          <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Applying from</label>
          <button type="button" onClick={() => setFromOpen(o => !o)}
            className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left">
            <img src={`https://flagcdn.com/w40/${fromFlag}.png`} alt="" width={20} height={14} className="h-[14px] w-5 rounded-sm object-cover" />
            <span className="flex-1 text-[14px] font-bold text-slate-800">{from}</span>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>
          {fromOpen && (
            <div className="absolute inset-x-0 top-full z-40 mt-1 rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
              {FROM_OPTIONS.map(o => (
                <button key={o.label} type="button" onClick={() => { setFrom(o.label); setFromOpen(false) }}
                  className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-slate-50 ${from === o.label ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                  <img src={`https://flagcdn.com/w40/${o.code}.png`} alt="" width={20} height={14} className="h-[14px] w-5 rounded-sm object-cover" />{o.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Rejected visa country */}
        <div ref={ref} className="relative mt-2.5">
          <label className="mb-1 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Rejected visa country</label>
          <button type="button" onClick={() => setOpen(o => !o)} aria-haspopup="listbox" aria-expanded={open}
            className={`flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition ${
              open ? 'border-orange-500 ring-2 ring-orange-100' : error ? 'border-red-400 bg-red-50' : plan === 'specialist' && !country ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50'}`}>
            {country
              ? <><img src={flagUrl(country)} alt="" width={20} height={14} className="h-[14px] w-5 rounded-sm object-cover" /><span className="flex-1 text-[14px] font-bold text-slate-800">{country}</span></>
              : <span className="flex-1 text-[14px] text-slate-400">Select country</span>}
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div role="listbox" className="absolute inset-x-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-xl">
              {[...MAIN_COUNTRIES, '—', ...others].map(c => c === '—'
                ? <p key="sep" className="px-3 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Schengen countries</p>
                : (
                  <button key={c} type="button" role="option" aria-selected={country === c}
                    onClick={() => { setCountry(c); setOpen(false); setError('') }}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm hover:bg-orange-50 ${country === c ? 'bg-orange-50 font-bold text-orange-700' : 'text-slate-700'}`}>
                    <img src={flagUrl(c)} alt="" width={20} height={14} loading="lazy" className="h-[14px] w-5 rounded-sm object-cover" />{c}
                    {country === c && <Check className="ml-auto h-4 w-4 text-orange-500" />}
                  </button>
                ))}
            </div>
          )}
          {error && <p role="alert" className="mt-1 text-[12px] font-semibold text-red-600">{error}</p>}
        </div>

        {/* Travellers */}
        <div className="mt-2.5 flex items-center justify-between border-y border-slate-100 py-2">
          <span className="flex items-center gap-2 text-[14px] font-bold text-slate-800"><Users className="h-4 w-4 text-slate-500" /> Travellers</span>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Fewer travellers" onClick={() => setTravellers(t => Math.max(1, t - 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-orange-400 hover:text-orange-500"><Minus className="h-3.5 w-3.5" /></button>
            <span className="w-4 text-center text-[15px] font-black text-slate-900">{travellers}</span>
            <button type="button" aria-label="More travellers" onClick={() => setTravellers(t => Math.min(20, t + 1))}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 text-slate-500 hover:border-orange-400 hover:text-orange-500"><Plus className="h-3.5 w-3.5" /></button>
          </div>
        </div>

        {/* Price */}
        <p className={`mt-2.5 text-[10px] font-black uppercase tracking-[0.14em] ${cfg.accent}`}>{cfg.label}</p>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[30px] font-black leading-none text-slate-900">{formatInr(price)}</p>
            <p className="mt-0.5 text-[12px] text-slate-500">Upfront · Per person{travellers > 1 ? ` · ${formatInr(price * travellers)} for ${travellers}` : ''}</p>
          </div>
          {cbAmount > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-[12px] font-bold text-green-800">
              <Wallet className="h-4 w-4 text-green-600" /> Get {formatInr(cbAmount)} cashback
            </span>
          )}
        </div>
        {cbAmount > 0 && (
          <>
            <p className="mt-2 rounded-md bg-green-50 px-2.5 py-1.5 text-[13px] font-bold text-green-900">Effective cost after cashback: {formatInr(Math.max(0, price - cbAmount))}</p>
            <p className="mt-1 text-[11px] text-slate-500">Cashback after visa approval and submission of a video testimonial.</p>
          </>
        )}

        {/* Included */}
        <p className="mt-2.5 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">Included free</p>
        <ul className="mt-1 space-y-1">
          {cfg.included.map(item => (
            <li key={item} className="flex items-center gap-2 text-[13px] text-slate-700"><Check className="h-3.5 w-3.5 shrink-0 text-green-600" strokeWidth={3} />{item}</li>
          ))}
        </ul>
        <p className="mt-2.5 flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11.5px] text-slate-500">
          <Info className="h-3.5 w-3.5 shrink-0" /> Embassy, appointment fees and applicable taxes are extra.
        </p>

        <button type="button" onClick={proceed}
          className={`mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[14px] font-black text-white transition hover:-translate-y-0.5 ${cfg.btn}`}>
          Proceed to Payment <ArrowRight className="h-4 w-4" />
        </button>

        {/* Footer box */}
        {plan === 'specialist' ? (
          onPlanChange && (
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-green-700" />
                <div>
                  <p className="text-[13.5px] font-black text-green-900">Want added refund protection?</p>
                  <p className="text-[12px] text-green-900/80">Guarantee Plan · {formatInr(reapplyPlanPriceInr('guarantee'))} per person</p>
                  <p className="text-[12px] text-green-900/70">100% service-fee refund on eligible refusals.</p>
                </div>
              </div>
              <button type="button" onClick={() => onPlanChange('guarantee')}
                className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-green-700 py-2.5 text-[13px] font-black text-white hover:bg-green-800">
                View Guarantee Plan <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-1.5 text-center text-[10.5px] text-slate-500">Terms and exclusions apply. Visa decisions rest with the embassy.</p>
            </div>
          )
        ) : (
          <>
            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-green-700" />
                <div>
                  <p className="text-[13.5px] font-black text-green-900">Your service fee is protected</p>
                  <p className="text-[12px] leading-snug text-green-900/80">100% service-fee refund if your re-application is refused for reasons covered by the plan.</p>
                  <p className="mt-0.5 text-[11px] text-slate-500">Refund within 7 working days. Terms and exclusions apply.</p>
                </div>
              </div>
            </div>
            {onPlanChange && (
              <button type="button" onClick={() => onPlanChange('specialist')} className="mt-2 w-full text-center text-[12px] font-bold text-orange-600 hover:underline">
                ← Back to Specialist plan ({formatInr(reapplyPlanPriceInr('specialist'))})
              </button>
            )}
            <p className="mt-2 text-center text-[11px] text-slate-500">Visa decisions remain with the embassy.</p>
            {cbAmount > 0 && (
              <p className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-[11.5px] leading-snug text-green-900">
                <Wallet className="h-5 w-5 shrink-0 text-green-700" />
                {formatInr(cbAmount)} cashback after visa approval, when you submit a video testimonial.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

/* Mobile bottom sheet that holds a plan card ("Start Application" on phones). */
export function PlanSheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#0A1628]/55 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-3xl sm:rounded-3xl">
        <div className="mx-auto mb-1.5 h-1.5 w-12 rounded-full bg-white/70 sm:hidden" />
        {children}
      </div>
    </div>
  )
}

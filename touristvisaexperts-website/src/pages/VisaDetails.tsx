import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useInView } from 'motion/react'
import { Highlighter } from '@/components/ui/highlighter'
import { DocumentCarousel } from '../components/site/DocumentCarousel'
import Navbar from '../components/Navbar'
import { VdPassportReviews } from '../components/site/VdPassportReviews'
import { visaPriceInr, formatInr, gstBreakdown, isReapplicationCountry } from '../lib/pricing'
import { JourneyPopup } from '../components/site/JourneyPopup'
import { Footer } from '../components/site/Footer'
import { useNavigation } from '../context/NavigationContext'
import { ScrollReveal } from '../components/magicui/scroll-reveal'
import SplitText from '../components/magicui/split-text'
import MagicBento from '../components/MagicBento'
import {
  Globe, Clock, Calendar, Shield, Star,
  ChevronDown, Plus, Minus, BadgeCheck,
  Users, Info, FileText,
  Gift,
  Camera, Mail, MapPin, Building2, CreditCard,
  Briefcase, GraduationCap, BookOpen, Heart, Inbox, FileCheck,
  Plane,
} from 'lucide-react'

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */

const VISA_INFO: Record<string, {
  processing: string; validity: string; type: string; entries: string; maxStay: string
}> = {
  USA:           { processing: '3–5 Days',   validity: '10 Years',  type: 'B1/B2 Tourist Visa',       entries: 'Multiple', maxStay: '180 Days' },
  UK:            { processing: '15–20 Days', validity: '10 Years',  type: 'Standard Visitor Visa',     entries: 'Multiple', maxStay: '6 Months' },
  Canada:        { processing: '20–30 Days', validity: '10 Years',  type: 'Temporary Resident Visa',   entries: 'Multiple', maxStay: '6 Months' },
  Australia:     { processing: '15–30 Days', validity: '12 Months', type: 'Tourist Visa (600)',         entries: 'Multiple', maxStay: '3 Months' },
  Schengen:      { processing: '15 Days',    validity: '5 Years',   type: 'Schengen Tourist Visa',     entries: 'Multiple', maxStay: 'As Applied' },
  UAE:           { processing: '3–5 Days',   validity: '30 Days',   type: 'Tourist Visa',              entries: 'Single',   maxStay: '30 Days'  },
  Singapore:     { processing: '3–5 Days',   validity: '2 Years',   type: 'Tourist Visa',              entries: 'Single',   maxStay: '30 Days'  },
  Japan:         { processing: '5–7 Days',   validity: '10 Years',  type: 'Tourist Visa',              entries: 'Multiple', maxStay: '15 Days'  },
  'New Zealand': { processing: '20–30 Days', validity: '5 Years',   type: 'Visitor Visa',              entries: 'Multiple', maxStay: '3 Months' },
  Germany:       { processing: '15 Days',    validity: '5 Years',   type: 'Schengen Visa (Type C)',    entries: 'Multiple', maxStay: '90 Days'  },
  France:        { processing: '15 Days',    validity: '5 Years',   type: 'Schengen Visa (Type C)',    entries: 'Multiple', maxStay: '90 Days'  },
  Italy:         { processing: '15 Days',    validity: '5 Years',   type: 'Schengen Visa (Type C)',    entries: 'Multiple', maxStay: '90 Days'  },
  Spain:         { processing: '15 Days',    validity: '5 Years',   type: 'Schengen Visa (Type C)',    entries: 'Multiple', maxStay: '90 Days'  },
  Netherlands:   { processing: '15 Days',    validity: '5 Years',   type: 'Schengen Visa (Type C)',    entries: 'Multiple', maxStay: '90 Days'  },
  Turkey:        { processing: '1–3 Days',   validity: '180 Days',  type: 'e-Visa',                    entries: 'Multiple', maxStay: '30 Days'  },
}


const flagSrc = (code: string) => `https://flagcdn.com/w40/${code}.png`


const DOCUMENTS = [
  { icon: FileText,      name: 'Application Form',              color: '#2563EB', bg: '#EFF6FF', optional: false },
  { icon: BookOpen,      name: 'Valid Passport (6+ months)',    color: '#2563EB', bg: '#EFF6FF', optional: false },
  { icon: Camera,        name: 'Passport-size Photos',          color: '#8B5CF6', bg: '#F5F3FF', optional: false },
  { icon: Mail,          name: 'Cover Letter',                  color: '#F97316', bg: '#FFF7ED', optional: false },
  { icon: MapPin,        name: 'Travel Itinerary',              color: '#F97316', bg: '#FFF7ED', optional: false },
  { icon: Building2,     name: 'Accommodation Proof',           color: '#0EA5E9', bg: '#F0F9FF', optional: false },
  { icon: Shield,        name: 'Travel Insurance',              color: '#22C55E', bg: '#F0FDF4', optional: false },
  { icon: CreditCard,    name: 'Bank Statements (3 months)',    color: '#22C55E', bg: '#F0FDF4', optional: false },
  { icon: Briefcase,     name: 'Employment / Business Proof',   color: '#8B5CF6', bg: '#F5F3FF', optional: false },
  { icon: GraduationCap, name: 'Academic / Enrollment Letter',  color: '#F97316', bg: '#FFF7ED', optional: true  },
  { icon: Users,         name: 'Civil Status Documents',        color: '#EC4899', bg: '#FDF2F8', optional: true  },
  { icon: FileCheck,     name: 'Birth Certificate',             color: '#EC4899', bg: '#FDF2F8', optional: true  },
  { icon: Heart,         name: 'Parental Consent (for minors)', color: '#EC4899', bg: '#FDF2F8', optional: true  },
  { icon: Inbox,         name: 'Sponsorship Letter',            color: '#0EA5E9', bg: '#F0F9FF', optional: true  },
  { icon: FileText,      name: 'NOC from Employer',             color: '#0EA5E9', bg: '#F0F9FF', optional: true  },
  { icon: BookOpen,      name: 'Proof of Legal Residence',      color: '#8B5CF6', bg: '#F5F3FF', optional: true  },
  { icon: Shield,        name: 'Residence Permit / Visa',       color: '#8B5CF6', bg: '#F5F3FF', optional: true  },
]

// Documents NOT needed for some destinations (client list, Oct 2026)
const DOC_EXCLUDE: Record<string, string[]> = {
  UK:            ['Passport-size Photos', 'Travel Insurance'],
  USA:           ['Accommodation Proof', 'Passport-size Photos', 'Travel Insurance'],
  'New Zealand': ['Accommodation Proof', 'Travel Insurance'],
  Australia:     ['Travel Insurance', 'Valid Passport (6+ months)', 'Passport-size Photos', 'Accommodation Proof'],
}
const docsFor = (country: string) => DOCUMENTS.filter(d => !(DOC_EXCLUDE[country] || []).includes(d.name))
// Same exclusions in the document slideshow, which uses shorter labels
const CAROUSEL_LABEL: Record<string, string> = {
  'Passport-size Photos': 'Passport-size Photos', 'Travel Insurance': 'Travel Insurance',
  'Accommodation Proof': 'Accommodation Proof', 'Valid Passport (6+ months)': 'Valid Passport',
}
const carouselExcludeFor = (country: string) => (DOC_EXCLUDE[country] || []).map(n => CAROUSEL_LABEL[n]).filter(Boolean)




/* ─────────────────────────────────────────────────────────
   BOOKING FORM (right sticky column)
───────────────────────────────────────────────────────── */
const FLAG_CODES: Record<string, string> = {
  India: 'in', USA: 'us', UK: 'gb', Canada: 'ca', Australia: 'au',
  UAE: 'ae', Germany: 'de', France: 'fr', Singapore: 'sg', Japan: 'jp',
  Italy: 'it', Spain: 'es', Netherlands: 'nl', 'New Zealand': 'nz', Schengen: 'eu',
}

/* ── Pricing: always in INR (GST inclusive), depends only on the destination ── */
function getPrice(to: string) {
  return { basePrice: visaPriceInr(to), formatted: formatInr }
}

const FROM_OPTIONS = [
  { label: 'India',  flag: '🇮🇳', code: 'in' },
  { label: 'UK',     flag: '🇬🇧', code: 'gb' },
  { label: 'USA',    flag: '🇺🇸', code: 'us' },
  { label: 'Europe', flag: '🇪🇺', code: 'eu' },
  { label: 'Other',  flag: '🌍',  code: 'xx' },
]

const FlagByCode = ({ code, w = 26 }: { code: string; w?: number }) => (
  <img
    src={flagSrc(code)}
    alt=""
    width={w}
    height={Math.round(w * 0.667)}
    className="rounded-sm object-cover flex-shrink-0"
    style={{ width: w, height: Math.round(w * 0.667) }}
    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
  />
)

interface FormProps {
  to: string
  toFlag: string
  initFrom: string
  initFromFlag: string
}

function BookingForm({ to, toFlag: _toFlag, initFrom, initFromFlag }: FormProps) {
  const { openCheckout, openRejectedVisa } = useNavigation()
  const [selFrom, setSelFrom]           = useState(initFrom)
  const [_selFromFlag, setSelFromFlag]  = useState(initFromFlag)
  const [travellers, setTravellers]     = useState(1)
  const [fromOpen, setFromOpen]         = useState(false)

  const fromRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) setFromOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  // "Get Your Visa Or Full Refund" asks first-time vs rejected in a popup (client request, Oct 2026).
  // Re-application is only offered for the countries the client listed.
  const reapplyOk = isReapplicationCountry(to)
  const [journey, setJourney] = useState(false)

  const pricing      = getPrice(to)
  const unitPrice    = pricing.basePrice
  const serviceTotal = unitPrice * travellers

  const handleContinue = () => setJourney(true)
  const goFirstTime = () => { setJourney(false); openCheckout(to, selFrom, travellers, null, false) }
  const goRejected = () => { setJourney(false); openRejectedVisa(reapplyOk ? { country: to, travellers } : { travellers }) }

  return (
    <div className="rounded-2xl overflow-clip border border-slate-900/50 bg-white"
      style={{ boxShadow: '0 4px 6px -1px rgba(15,23,42,0.07), 0 10px 32px rgba(15,23,42,0.10), 0 2px 4px rgba(15,23,42,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}>
      <JourneyPopup open={journey} onClose={() => setJourney(false)} onFirstTime={goFirstTime} onRejected={goRejected} />

      {/* ── Orange banner ── */}
      <div className="px-4 py-3.5 flex items-center gap-3" style={{ background: 'linear-gradient(135deg,#F97316 0%,#EA6D0D 100%)' }}>
        <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0 border border-white/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-white font-black text-[14px] leading-tight">
            100% Assisted Process
          </p>
          <p className="text-white/80 text-[11.5px] font-medium mt-0.5">
            Aimed at <span className="text-white font-bold">getting you approved.</span>
          </p>
        </div>
      </div>

      {/* ── Route row ── */}
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div ref={fromRef} className="relative flex-1 min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Applying From</p>
            <button
              onClick={() => setFromOpen(!fromOpen)}
              className={`w-full flex items-center justify-between gap-2 border-b-2 pb-1 text-sm font-semibold transition-all focus:outline-none bg-transparent ${
                fromOpen ? 'border-orange-500 text-slate-900' : 'border-slate-200 text-slate-700 hover:border-slate-400'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <div className="w-6 h-4 rounded overflow-hidden flex-shrink-0 shadow-sm">
                  <img src={flagSrc(FLAG_CODES[selFrom] ?? 'in')} alt={selFrom} className="w-full h-full object-cover" />
                </div>
                <span className="truncate">{selFrom}</span>
              </span>
              <ChevronDown className={`h-3 w-3 text-slate-400 flex-shrink-0 transition-transform duration-200 ${fromOpen ? 'rotate-180' : ''}`} />
            </button>
            {fromOpen && (
              <div className="absolute left-0 top-full mt-2 z-50 rounded-xl shadow-xl border border-slate-100 py-1.5 max-h-52 overflow-y-auto w-full min-w-[200px] bg-white">
                {FROM_OPTIONS.map(o => (
                  <button key={o.label} onClick={() => { setSelFrom(o.label); setSelFromFlag(o.flag); setFromOpen(false) }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-3 ${
                      selFrom === o.label ? 'bg-orange-50 text-orange-600 font-bold' : 'text-slate-600 hover:bg-slate-50'
                    }`}>
                    <FlagByCode code={o.code} w={20} />
                    {o.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-shrink-0 mt-3">
            <Plane className="h-3.5 w-3.5 text-orange-400" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">Travelling To</p>
            <div className="flex items-center gap-2 border-b-2 border-slate-200 pb-1">
              <div className="w-6 h-4 rounded overflow-hidden flex-shrink-0 shadow-sm">
                <img src={flagSrc(FLAG_CODES[to] ?? 'un')} alt={to} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-semibold text-slate-700 truncate">{to}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Travellers ── */}
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-800">No of Travellers</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setTravellers(t => Math.max(1, t - 1))}
            className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-orange-400 hover:text-orange-500 transition-colors">
            <Minus className="h-3 w-3" />
          </button>
          <span className="text-sm font-black text-slate-900 w-4 text-center">{travellers}</span>
          <button onClick={() => setTravellers(t => Math.min(20, t + 1))}
            className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-orange-400 hover:text-orange-500 transition-colors">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
      {travellers >= 3 && (
        <div className="px-4 py-1.5 bg-amber-50 border-b border-amber-100 flex items-center gap-2">
          <Gift className="h-3 w-3 text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-700 font-semibold">
            {travellers >= 5 ? 'WhatsApp us for a group deal!' : travellers === 4 ? '₹400 cashback on 4 travellers!' : '₹200 cashback on 3 travellers!'}
          </p>
        </div>
      )}

      {/* ── Free services ── */}
      <div className="px-4 pt-2.5 pb-1 flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[8.5px] font-black uppercase tracking-[0.18em] text-slate-400">Included Free</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      {(['Expert Consultation', 'Document Review & Filling', 'Application Submission', 'Tracking & Follow-up'] as const).map(label => (
        <div key={label} className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
          <span className="text-[14px] font-semibold text-slate-800">{label}</span>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Free</span>
        </div>
      ))}

      {/* ── Embassy / Govt Charges ── */}
      <div className="px-4 pt-2.5 pb-1 flex items-center gap-2">
        <div className="h-px flex-1 bg-slate-100" />
        <span className="text-[8.5px] font-black uppercase tracking-[0.18em] text-slate-400">Embassy / Govt Charges</span>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-slate-800">Embassy Fees{travellers > 1 ? ` × ${travellers}` : ''}</span>
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Actuals</span>
      </div>
      <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
        <span className="text-[14px] font-semibold text-slate-800">Appointment Booking</span>
        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">Actuals</span>
      </div>

      {/* ── CTA — pinned to the bottom of the scrolling sticky card so pay + price stay visible ── */}
      <div className="sticky bottom-0 z-10 px-4 pt-3 pb-4 border-t border-slate-100 mt-1 bg-white rounded-b-2xl shadow-[0_-8px_16px_-12px_rgba(15,23,42,0.25)]">
        <button
          onClick={handleContinue}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-black text-sm rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
        >
          Expert Support, Start to Finish
          <Plane className="h-4 w-4" />
        </button>

        {/* ── Complete Package Price ── */}
        <div className="rounded-xl px-3 py-2.5 flex items-center justify-between mt-2.5" style={{ background: 'linear-gradient(135deg,#FFF7ED 0%,#FFFBEB 100%)', border: '1.5px solid #FED7AA' }}>
          <div>
            <p className="text-[9.5px] font-black uppercase tracking-[0.2em] text-orange-500">Complete Package</p>
            <p className="text-[11px] text-slate-500 font-medium">One-time fee · Incl. 18% GST</p>
          </div>
          <div className="text-right">
            <p className="text-[22px] font-black text-slate-900 leading-none">{pricing.formatted(serviceTotal)}</p>
            {travellers > 1 && (
              <p className="text-[10px] text-slate-400 mt-0.5">{pricing.formatted(unitPrice)} × {travellers}</p>
            )}
          </div>
        </div>
        {(() => {
          const { base, gst } = gstBreakdown(serviceTotal)
          return (
            <div className="mt-1.5 px-3 flex justify-between text-[10.5px] text-slate-500">
              <span>Base amount {formatInr(base)}</span>
              <span>GST (18%) {formatInr(gst)}</span>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────────────────── */
type Props = { from: string; fromFlag: string; to: string; toFlag: string }

const SECTION_TABS = [
  { id: 'vd-visa-info',  label: 'Visa Info' },
  { id: 'vd-process',    label: 'The Process' },
  { id: 'vd-documents',  label: 'Documents' },
  { id: 'vd-why-us',     label: 'Why Us' },
  { id: 'vd-reviews',    label: 'Reviews' },
  { id: 'vd-faq',        label: 'FAQs' },
]

/* ─── Sliding-cursor section tab nav ──────────────────────── */
function SectionTabNav({
  tabs,
  activeSection,
  onTabClick,
}: {
  tabs: { id: string; label: string }[]
  activeSection: string
  onTabClick: (id: string) => void
}) {
  const [cursor, setCursor] = useState({ left: 0, width: 0, opacity: 0 })
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const idx = tabs.findIndex(t => t.id === activeSection)
    const el = tabRefs.current[idx]
    if (el) setCursor({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
  }, [activeSection, tabs])

  return (
    <div
      className="relative flex gap-0 overflow-x-auto no-scrollbar"
      onMouseLeave={() => {
        const idx = tabs.findIndex(t => t.id === activeSection)
        const el = tabRefs.current[idx]
        if (el) setCursor({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
      }}
    >
      {/* sliding orange underline */}
      <motion.span
        animate={cursor}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="absolute bottom-0 h-[4px] bg-orange-500 rounded-full"
        style={{ opacity: cursor.opacity }}
      />

      {tabs.map(({ id, label }, i) => (
        <button
          key={id}
          ref={el => { tabRefs.current[i] = el }}
          onClick={() => onTabClick(id)}
          onMouseEnter={() => {
            const el = tabRefs.current[i]
            if (el) setCursor({ left: el.offsetLeft, width: el.offsetWidth, opacity: 1 })
          }}
          className={`relative flex-shrink-0 px-5 py-4 text-sm font-semibold transition-colors whitespace-nowrap ${
            activeSection === id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

const DEST_OPTIONS = [
  { name: 'Japan',       flag: '🇯🇵', code: 'jp', img: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&q=80&fit=crop',  desc: 'Cherry blossoms & culture' },
  { name: 'France',      flag: '🇫🇷', code: 'fr', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&q=80&fit=crop',  desc: 'Art, cuisine & the Eiffel' },
  { name: 'UAE',         flag: '🇦🇪', code: 'ae', img: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&q=80&fit=crop',  desc: 'Luxury & desert adventures' },
  { name: 'Australia',   flag: '🇦🇺', code: 'au', img: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&q=80&fit=crop',  desc: 'Outback & ocean wonders' },
  { name: 'Canada',      flag: '🇨🇦', code: 'ca', img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&h=600&q=80&fit=crop',  desc: 'Rockies & northern lights' },
]

function DestinationSelector() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [visible, setVisible] = useState<number[]>([])
  const { openVisaDetails } = useNavigation()

  useEffect(() => {
    const timers = DEST_OPTIONS.map((_, i) =>
      setTimeout(() => setVisible(prev => [...prev, i]), 150 * i)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <section className="py-16 bg-white border-t border-slate-100">
      <div className="max-w-7xl mx-auto px-4 text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-orange-50 text-orange-500 text-xs font-bold px-4 py-2 rounded-full border border-orange-100 mb-4">
          <Globe className="h-3.5 w-3.5" /> Trusted Across Major Destinations
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900">Explore More Destinations</h2>
        <p className="text-slate-400 text-sm mt-2">Expert visa assistance for travelers around the world</p>
      </div>

      {/* Mobile: swipeable row of full cards (the expanding accordion below needs desktop width) */}
      <div
        className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory px-4 pb-2 [&::-webkit-scrollbar]:hidden"
        style={{ scrollbarWidth: 'none' }}
      >
        {DEST_OPTIONS.map(dest => (
          <button
            key={dest.name}
            type="button"
            onClick={() => openVisaDetails(dest.name, dest.flag)}
            className="relative shrink-0 w-[72%] h-[260px] snap-start overflow-hidden rounded-2xl border border-slate-200 text-left shadow-md"
            style={{ backgroundImage: `url('${dest.img}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <span className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow">
              Apply Now
            </span>
            <div className="absolute bottom-0 left-0 right-0 flex items-end gap-3 p-4">
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-black/50 border border-white/30">
                <img src={`https://flagcdn.com/w80/${dest.code}.png`} alt={`${dest.name} flag`} width={40} height={40} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-black text-base leading-tight">{dest.name}</p>
                <p className="text-white/75 text-xs mt-0.5 truncate">{dest.desc}</p>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="hidden md:flex w-full max-w-5xl mx-auto h-[420px] px-4 gap-0 overflow-hidden">
        {DEST_OPTIONS.map((dest, i) => {
          const isActive = activeIndex === i
          return (
            <div
              key={dest.name}
              onClick={() => activeIndex === i ? openVisaDetails(dest.name, dest.flag) : setActiveIndex(i)}
              className="relative flex flex-col justify-end overflow-hidden cursor-pointer"
              style={{
                flex: isActive ? '7 1 0%' : '1 1 0%',
                transition: 'flex 0.7s cubic-bezier(0.4,0,0.2,1), box-shadow 0.4s',
                borderRadius: 20,
                border: `2px solid ${isActive ? '#f97316' : '#e2e8f0'}`,
                margin: '0 4px',
                boxShadow: isActive ? '0 20px 60px rgba(0,0,0,0.22)' : '0 4px 16px rgba(0,0,0,0.08)',
                opacity: visible.includes(i) ? 1 : 0,
                transform: visible.includes(i) ? 'translateX(0)' : 'translateX(-40px)',
                backgroundImage: `url('${dest.img}')`,
                backgroundSize: isActive ? 'cover' : 'auto 130%',
                backgroundPosition: 'center',
                willChange: 'flex-grow',
                minWidth: 56,
              }}
            >
              {/* gradient overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: isActive
                    ? 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 60%, transparent 100%)'
                    : 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 80%)',
                  transition: 'background 0.6s',
                }}
              />

              {/* label */}
              <div className="relative z-10 flex items-end gap-3 px-4 pb-5">
                {/* flag pill */}
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden"
                  style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: '1.5px solid rgba(255,255,255,0.35)' }}>
                  {/* Image, not emoji: Windows can't draw flag emoji */}
                  <img src={`https://flagcdn.com/w80/${dest.code}.png`} alt={`${dest.name} flag`} width={40} height={40} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'translateX(0)' : 'translateX(20px)',
                    transition: 'opacity 0.5s 0.2s, transform 0.5s 0.2s',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <p className="text-white font-black text-base leading-tight">{dest.name}</p>
                  <p className="text-white/70 text-xs mt-0.5">{dest.desc}</p>
                </div>
              </div>

              {/* active badge */}
              {isActive && (
                <button
                  onClick={e => { e.stopPropagation(); openVisaDetails(dest.name, dest.flag) }}
                  className="absolute top-4 right-4 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow transition-colors"
                >
                  Apply Now
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── Why Us — horizontal 3-column with animated connecting line ────── */
const WHY_ITEMS = [
  {
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
    Icon: Users,
    title: 'Your Dedicated Visa Specialist',
    desc: "You're not just another client — you get a dedicated expert working specifically on your case from start to approval.",
  },
  {
    color: '#22C55E',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    Icon: BadgeCheck,
    title: 'Every Document Checked',
    desc: 'Every form, photo, and supporting document is thoroughly reviewed before submission to prevent common embassy refusal triggers.',
  },
  {
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    Icon: Globe,
    title: 'Real Travelers, Real Solutions',
    desc: "We've explored destinations across the globe and understand the complexities Indians face. Our expertise comes from experience, not just textbooks.",
  },
]

function VdWhyUs() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-5%' })

  // Sequential timing: step1 → line1 → step2 → line2 → step3
  // Each step takes ~0.55s, line takes ~0.5s
  const T = {
    step1:  0.1,   // col 1 appears
    line1:  0.75,  // line 1→2 draws
    step2:  1.35,  // col 2 appears
    line2:  2.0,   // line 2→3 draws
    step3:  2.6,   // col 3 appears
  }
  const stepDelay = [T.step1, T.step2, T.step3]

  return (
    <div
      ref={ref}
      className="relative overflow-hidden rounded-3xl border border-slate-900/50 bg-white shadow-sm px-6 pt-8 pb-10"
    >
      {/* Dot grid bg */}
      <div className="absolute inset-0 opacity-[0.35]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
      <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 blur-[80px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-500/5 blur-[70px] pointer-events-none rounded-full" />

      <div className="relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
            <BadgeCheck className="w-3 h-3" /> Why Us
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight">
            Benefits of Tourist Visa Experts
          </h2>
          <p className="text-2xl font-black text-orange-500 leading-tight mt-0.5">Over Other Services</p>
        </motion.div>

        {/* 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 relative">

          {/* Grey track line */}
          <div className="hidden sm:block absolute top-[22px] left-[16.5%] right-[16.5%] h-[2px] bg-slate-200 rounded-full z-0" />

          {/* Line segment 1: col1 → col2 */}
          <motion.div
            className="hidden sm:block absolute top-[22px] z-[1] h-[2px] rounded-full origin-left"
            style={{ left: '16.5%', width: '33.3%', background: `linear-gradient(90deg, ${WHY_ITEMS[0].color}, ${WHY_ITEMS[1].color})` }}
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, delay: T.line1, ease: [0.22, 1, 0.36, 1] }}
          />

          {/* Line segment 2: col2 → col3 */}
          <motion.div
            className="hidden sm:block absolute top-[22px] z-[1] h-[2px] rounded-full origin-left"
            style={{ left: '49.8%', width: '33.3%', background: `linear-gradient(90deg, ${WHY_ITEMS[1].color}, ${WHY_ITEMS[2].color})` }}
            initial={{ scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.5, delay: T.line2, ease: [0.22, 1, 0.36, 1] }}
          />

          {WHY_ITEMS.map(({ color, bg, border, Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 32 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: stepDelay[i], ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col items-center text-center relative z-[2]"
            >
              {/* Numbered circle — top connector node */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={inView ? { scale: 1, opacity: 1 } : {}}
                transition={{ type: 'spring', stiffness: 320, damping: 18, delay: stepDelay[i] + 0.05 }}
                className="w-11 h-11 rounded-full flex items-center justify-center mb-5 shadow-lg text-white font-black text-sm"
                style={{ background: color, boxShadow: `0 6px 20px ${color}55` }}
              >
                {String(i + 1).padStart(2, '0')}
              </motion.div>

              {/* Soft square icon badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.4, delay: stepDelay[i] + 0.15 }}
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 border-2"
                style={{ background: bg, borderColor: border }}
              >
                <Icon size={28} style={{ color }} />
              </motion.div>

              {/* Title */}
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: stepDelay[i] + 0.25 }}
                className="text-[15px] font-black text-slate-900 leading-snug mb-3 px-2"
              >{title}</motion.h3>

              {/* Desc */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: stepDelay[i] + 0.35 }}
                className="text-[13px] text-slate-500 leading-relaxed px-1"
              >{desc}</motion.p>

              {/* Bottom accent line */}
              <motion.div
                className="mt-5 h-[3px] w-10 rounded-full"
                style={{ background: color }}
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.4, delay: stepDelay[i] + 0.45 }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function VisaDetails({ from, fromFlag, to, toFlag }: Props) {
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [mobileSheet, setMobileSheet] = useState(false)
  const [activeSection, setActiveSection] = useState('vd-visa-info')
  const [openStatTip, setOpenStatTip] = useState<string | null>(null)
  const [statTipRect, setStatTipRect] = useState<{ left: number; top: number; width: number } | null>(null)

  useEffect(() => {
    if (!openStatTip) return
    const closeTip = () => { setOpenStatTip(null); setStatTipRect(null) }
    const id = setTimeout(() => document.addEventListener('click', closeTip), 0)
    window.addEventListener('scroll', closeTip, true)
    window.addEventListener('resize', closeTip)
    return () => {
      clearTimeout(id)
      document.removeEventListener('click', closeTip)
      window.removeEventListener('scroll', closeTip, true)
      window.removeEventListener('resize', closeTip)
    }
  }, [openStatTip])

  useEffect(() => {
    // Detection uses 40% of viewport height so the active section
    // matches what the user is actually reading — not a fixed pixel offset
    const getThreshold = () => window.innerHeight * 0.4

    // Recalculate absolute positions (called after layout settles + on resize)
    let positions: { id: string; top: number }[] = []

    const calcPositions = () => {
      positions = SECTION_TABS.map(({ id }) => {
        const el = document.getElementById(id)
        const top = el ? el.getBoundingClientRect().top + window.scrollY : 0
        return { id, top }
      })
    }

    const onScroll = () => {
      const scrollY = window.scrollY + getThreshold()
      let current = SECTION_TABS[0].id
      for (const { id, top } of positions) {
        if (top <= scrollY) current = id
      }
      setActiveSection(current)
    }

    const init = setTimeout(() => {
      calcPositions()
      onScroll()
    }, 200)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', calcPositions)

    return () => {
      clearTimeout(init)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', calcPositions)
    }
  }, [])

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    // offset: main navbar (65px) + section tab bar (~53px) + small gap
    const offset = 65 + 53 + 12
    const top = el.getBoundingClientRect().top + window.scrollY - offset
    window.scrollTo({ top, behavior: 'smooth' })
  }

  const visaInfo = VISA_INFO[to] ?? { processing: '15–20 Days', validity: '6 Months', type: 'Tourist Visa', entries: 'Single', maxStay: '30 Days' }

  const visaBentoCards = [
    {
      color: '#F8FAFC',
      customContent: (
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full self-start">
            Why Choose Us
          </div>
          <h3 className="text-slate-900 font-black text-xl leading-snug">
            Your Visa, Handled<br />
            <span className="shimmer-text">End to End.</span>
          </h3>
          <div className="space-y-3">
            {([
              { Icon: Users,      label: '1 on 1 Dedicated Visa Expert',  color: '#3B82F6' },
              { Icon: FileText,   label: 'End-to-End Document Support',    color: '#22C55E' },
              { Icon: BadgeCheck, label: 'Embassy Application Handling',   color: '#8B5CF6' },
            ] as const).map(({ Icon, label, color }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl p-3 border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1.5px solid ${color}45` }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-slate-700 text-sm font-bold leading-snug">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      color: '#F8FAFC',
      customContent: (
        <div className="flex flex-col gap-4">
          <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full self-start">
            What We Handle
          </div>
          <h3 className="text-[#0A1628] font-black text-2xl leading-tight">
            We Don't Just Submit.<br />
            <span className="shimmer-text">We Protect.</span>
          </h3>
          <div className="space-y-4">
            {([
              { Icon: Shield,     color: '#8B5CF6', title: 'We catch red flags first', desc: 'Risks are identified and fixed before they reach the embassy.' },
              { Icon: FileCheck,  color: '#F97316', title: 'We verify, not just forward', desc: 'Every document is checked. One weak file can undo everything.' },
              { Icon: BadgeCheck, color: '#22C55E', title: 'End-to-end accountability', desc: 'One dedicated expert, accountable from start to finish.' },
            ]).map(({ Icon, color, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}22`, border: `1.5px solid ${color}55` }}>
                  <Icon className="w-4.5 h-4.5" style={{ color }} />
                </div>
                <div>
                  <p className="text-slate-900 text-sm font-extrabold leading-tight">{title}</p>
                  <p className="text-slate-600 text-xs leading-relaxed mt-1">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ]

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [])
  useEffect(() => {
    if (mobileSheet) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileSheet])

  const FAQS = [
    {
      q: `How long does the ${to} visa take to process?`,
      a: `Processing typically takes ${visaInfo.processing} from the time all documents are correctly submitted. We recommend applying at least 4–6 weeks before your travel date to be safe.`,
    },
    {
      q: `What documents do I need for a ${to} visa?`,
      a: `The core documents are: ${docsFor(to).filter(d => !d.optional).map(d => d.name.toLowerCase()).join(', ')}. Our specialist will confirm the exact list for your profile.`,
    },
    {
      q: 'Can I track my application status?',
      a: "Yes! Once submitted, you'll receive real-time email updates at every stage — from document review to embassy submission and the final decision.",
    },
    {
      q: 'What happens if my visa is rejected?',
      a: 'We provide a free re-application consultation to identify the issue and guide you through a stronger second application. No additional service fee is charged for re-applications resulting from our error.',
    },
    {
      q: 'Are my documents safe with you?',
      a: 'Absolutely. All uploaded documents are encrypted using bank-grade SSL and are only accessible to your assigned visa specialist. We never share data with third parties.',
    },
    {
      q: 'Can I change my travel date after applying?',
      a: `Yes — you can update your travel date to any future date within the ${visaInfo.validity} visa validity period at no additional charge.`,
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{`
        @keyframes marqueeScroll { from { transform: translateX(0) } to { transform: translateX(-50%) } }
        .vd-marquee { animation: marqueeScroll 45s linear infinite; }
        .vd-marquee:hover { animation-play-state: paused; }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(100%) } to { transform: translateY(0) } }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        .shimmer-text {
          background: linear-gradient(90deg,#f97316,#fb923c,#fdba74,#fb923c,#f97316);
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmer 3s linear infinite;
        }
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes lineGrow { from { transform: scaleY(0); transform-origin: top; } to { transform: scaleY(1); transform-origin: top; } }
        @keyframes linePulse { 0%,100%{opacity:.5} 50%{opacity:1} }
        .vd-step-line { animation: lineGrow 1.2s cubic-bezier(0.4,0,0.2,1) forwards, linePulse 2.5s ease-in-out 1.2s infinite; }
        .vd-dark-scroll::-webkit-scrollbar { width: 5px; }
        .vd-dark-scroll::-webkit-scrollbar-track { background: transparent; }
        .vd-dark-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 99px; }
        .vd-dark-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.22); }
        .vd-dark-scroll { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.12) transparent; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <Navbar />

      {/* ── Section Tab Navbar ─────────────────────────────────── */}
      <div className="sticky top-[65px] z-40 bg-white border-b border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-w-max sm:min-w-0">
          <SectionTabNav
            tabs={SECTION_TABS}
            activeSection={activeSection}
            onTabClick={scrollToSection}
          />
        </div>
      </div>

      {/* ── Main two-column grid ──────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 pb-28 lg:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-8">

          {/* ════════════════════════════════════════
              LEFT COLUMN — Content
          ════════════════════════════════════════ */}
          <div className="space-y-10 self-start">

            {/* ══════════════════════════════════════
                SECTION 1 — VISA INFO
            ══════════════════════════════════════ */}
            <section id="vd-visa-info" className="space-y-5">

              {/* Hero */}
              <ScrollReveal direction="up">
                <div className="pb-2">
                  <h1 className="text-4xl md:text-5xl font-black text-[#0A1628] leading-tight mb-2">
                    <SplitText text={`${to} Visa`} tag="span" className="block" splitType="chars"
                      delay={25} duration={0.8} ease="power4.out"
                      from={{ opacity: 0, y: 55, rotateX: -25 }} to={{ opacity: 1, y: 0, rotateX: 0 }}
                      threshold={0.05} rootMargin="0px" textAlign="left" />
                    <span className="shimmer-text block">Expert-Assisted.</span>
                  </h1>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 max-w-lg">
                    A dedicated specialist guides you from document review to embassy submission — stress-free, fully digital, built on trust and proven performance.
                  </p>
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(s => <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
                      <span className="text-slate-500 text-xs ml-1.5">Rated by our customers</span>
                    </div>
                    <span className="flex items-center gap-1.5 text-sm text-slate-700"><BadgeCheck className="h-4 w-4 text-green-500" /><span className="font-semibold">Every Document Checked</span></span>
                  </div>
                </div>
              </ScrollReveal>

              {/* Compact visa stats row — click a card to reveal what it means */}
              <ScrollReveal direction="up" delay={30}>
                {/* 4-across only where the column is wide enough (tablet with no side card, or wide desktop) */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-2 2xl:grid-cols-4 gap-2">
                  {[
                    { Icon: Clock,    label: 'Processing',  value: `Embassy Set (~${visaInfo.processing})`, color: '#F97316', tip: 'Processing times are set by the embassy and vary. We keep your file moving and update you at every step.' },
                    { Icon: Calendar, label: 'Validity',    value: `Up to ${visaInfo.validity}`, color: '#3B82F6', tip: 'The embassy decides the final visa validity for each application.' },
                    { Icon: Globe,    label: 'Entry Type',  value: visaInfo.entries,  color: '#22C55E', tip: 'The final entry type is decided solely by the embassy.' },
                    { Icon: Users,    label: 'Expert Guidance', value: 'Every Step',  color: '#8B5CF6', tip: 'Our experts guide you through every step of your visa application.' },
                  ].map(({ Icon, label, value, color, tip }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={e => {
                        const r = e.currentTarget.getBoundingClientRect()
                        setStatTipRect({ left: r.left, top: r.bottom, width: r.width })
                        setOpenStatTip(t => t === label ? null : label)
                      }}
                      className="relative flex items-center gap-2.5 rounded-2xl border border-slate-900/50 bg-white px-3 py-3 text-left w-full hover:border-slate-300 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18`, border: `1.5px solid ${color}35` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide leading-tight mb-0.5">{label}</p>
                        <p className="text-sm font-black text-slate-900 leading-tight whitespace-nowrap">{value}</p>
                      </div>
                      {openStatTip === label && statTipRect && createPortal(
                        <div
                          className="fixed z-[9999] w-64 rounded-xl bg-slate-900 text-white text-xs leading-relaxed px-3.5 py-3 shadow-2xl"
                          style={{
                            top: statTipRect.top + 8,
                            left: Math.max(8, Math.min(statTipRect.left, window.innerWidth - 256 - 8)),
                          }}
                          onClick={ev => ev.stopPropagation()}
                        >
                          {tip}
                        </div>,
                        document.body
                      )}
                    </button>
                  ))}
                </div>
              </ScrollReveal>

              {/* Magic Bento */}
              <ScrollReveal direction="up" delay={60}>
                {/* bento-auto: cards take their content's height (fixed 4:3 cards clipped the text on phones) */}
                <div className="bento-auto">
                  <MagicBento textAutoHide={false} enableStars={true} enableSpotlight={true}
                    enableBorderGlow={true} enableTilt={false} enableMagnetism={true}
                    clickEffect={true} spotlightRadius={300} particleCount={12}
                    glowColor="132, 0, 255" cards={visaBentoCards} />
                </div>
              </ScrollReveal>

            </section>

            {/* ══════════════════════════════════════
                SECTION 2 — THE PROCESS
            ══════════════════════════════════════ */}
            <section id="vd-process" className="space-y-5">

              <ScrollReveal direction="up" delay={120}>
                <div className="relative overflow-hidden rounded-3xl border border-slate-900/50 bg-white shadow-sm">
                  <div className="absolute inset-0 opacity-[0.4]" style={{ backgroundImage: 'radial-gradient(rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                  <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500/5 blur-[80px] pointer-events-none rounded-full" />
                  <div className="absolute bottom-0 left-0 w-56 h-56 bg-orange-500/5 blur-[70px] pointer-events-none rounded-full" />
                  <div className="relative px-6 pt-8 pb-6">
                    <div className="mb-8">
                      <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-3">
                        <Plane className="w-3 h-3" /> The Process
                      </div>
                      <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                        How It Works
                      </h2>
                      <p className="text-slate-400 text-base mt-2">Four simple steps from payment to embassy-ready — we handle everything in between.</p>
                    </div>
                    <div className="space-y-0">
                      {([
                        { num: '01', title: 'Make Payment',     desc: 'Choose your package and complete the payment securely online in under 2 minutes.',    color: '#F97316', next: '#3B82F6', Icon: Globe      },
                        { num: '02', title: 'Expert Assigned',  desc: 'A dedicated visa expert will be assigned to your case after payment confirmation.',   color: '#3B82F6', next: '#8B5CF6', Icon: Users      },
                        { num: '03', title: 'Document Review',  desc: 'We review all your documents and provide a precise checklist — nothing gets missed.',   color: '#8B5CF6', next: '#22C55E', Icon: FileText   },
                        { num: '04', title: 'Submission Ready', desc: 'Your complete application is prepared and embassy-ready for submission.',               color: '#22C55E', next: null,      Icon: BadgeCheck },
                      ] as const).map(({ num, title, desc, color, next, Icon }, i) => (
                        <ScrollReveal key={num} direction="left" delay={i * 120} duration={600}>
                          <div className="flex gap-5">
                            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 52 }}>
                              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg flex-shrink-0"
                                style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 6px 24px ${color}50` }}>{num}</div>
                              {next && <div className="w-[2px] flex-1 min-h-[20px] rounded-full mt-1" style={{ background: `linear-gradient(180deg, ${color}90, ${next}70)` }} />}
                            </div>
                            <div className={`flex-1 min-w-0 ${next ? 'pb-3' : ''}`}>
                              <div className="relative rounded-2xl p-5 border border-slate-900/50 bg-slate-50 hover:bg-white transition-all duration-300 overflow-hidden"
                                style={{ '--glow-x': '50%', '--glow-y': '50%', '--glow-intensity': '0', '--glow-radius': '200px' } as React.CSSProperties}
                                onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--glow-x', `${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--glow-y', `${((e.clientY-r.top)/r.height)*100}%`); e.currentTarget.style.setProperty('--glow-intensity','1') }}
                                onMouseLeave={e => e.currentTarget.style.setProperty('--glow-intensity','0')}>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 font-black select-none pointer-events-none" style={{ color: 'rgba(0,0,0,0.04)', fontSize: '6rem', lineHeight: 1 }}>{num}</div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20`, border: `1px solid ${color}40` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-widest" style={{ color }}>Step {num}</span>
                                </div>
                                <p className="text-slate-900 font-black text-base leading-snug mb-2">{title}</p>
                                <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                              </div>
                            </div>
                          </div>
                        </ScrollReveal>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollReveal>

            </section>

            {/* ══════════════════════════════════════
                SECTION 3 — DOCUMENTS
            ══════════════════════════════════════ */}
            <section id="vd-documents" className="space-y-5">

              {/* Documents Required */}
              <ScrollReveal direction="up" delay={140}>
                <div className="relative overflow-hidden rounded-3xl bg-white" style={{ border: '2px solid #CBD5E1', boxShadow: '0 2px 16px rgba(15,23,42,0.07)' }}>
                  <div className="relative px-6 py-7">
                    <div className="flex items-end justify-between mb-6">
                      <div>
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-2">Documents</div>
                        <h2 className="font-black text-slate-900 text-2xl">What You'll Need</h2>
                        <p className="text-slate-500 text-sm mt-1">
                          Just gather these documents —{' '}
                          <Highlighter action="underline" color="#F97316" strokeWidth={2} animationDuration={800} isView={true}>
                            our visa expert handles the rest.
                          </Highlighter>
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-400 tabular-nums">{docsFor(to).length} items</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Mandatory</p>
                    <div className="mb-5">
                      <DocumentCarousel exclude={carouselExcludeFor(to)} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Situational / Optional</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {docsFor(to).filter(d => d.optional).map((doc, i) => {
                        const Icon = doc.icon
                        return (
                          <div key={i} className="magic-bento-card--border-glow group flex items-center gap-3 rounded-2xl p-4 border border-dashed border-slate-900/50 hover:border-solid bg-slate-50/50 hover:bg-slate-50 transition-all duration-200 cursor-default relative overflow-hidden"
                            style={{ '--glow-x': '50%', '--glow-y': '50%', '--glow-intensity': '0', '--glow-radius': '150px' } as React.CSSProperties}
                            onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); e.currentTarget.style.setProperty('--glow-x', `${((e.clientX-r.left)/r.width)*100}%`); e.currentTarget.style.setProperty('--glow-y', `${((e.clientY-r.top)/r.height)*100}%`); e.currentTarget.style.setProperty('--glow-intensity','1') }}
                            onMouseLeave={e => e.currentTarget.style.setProperty('--glow-intensity','0')}>
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 opacity-70" style={{ background: `${doc.color}12`, border: `1.5px solid ${doc.color}25` }}>
                              <Icon className="h-5 w-5" style={{ color: doc.color }} />
                            </div>
                            <span className="text-sm font-semibold text-slate-500 flex-1 leading-tight">{doc.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full flex-shrink-0">If applicable</span>
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-slate-400 mt-5 flex items-start gap-1.5 pt-4 border-t border-slate-100">
                      <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-orange-400" />
                      Requirements vary by applicant profile. Your specialist will confirm exactly what applies to you.
                    </p>
                  </div>
                </div>
              </ScrollReveal>


            </section>

            {/* ══════════════════════════════════════
                SECTION 3 — WHY US
            ══════════════════════════════════════ */}
            <section id="vd-why-us">
              <VdWhyUs />
            </section>

            {/* ══════════════════════════════════════
                SECTION 4 — REVIEWS
            ══════════════════════════════════════ */}
            <section id="vd-reviews">
              <VdPassportReviews />
            </section>

            {/* ══════════════════════════════════════
                SECTION 5 — FAQs
            ══════════════════════════════════════ */}
            <section id="vd-faq">
              <ScrollReveal direction="up" delay={185}>
                <div className="bg-white rounded-3xl border border-slate-900/50 shadow-sm p-6">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">FAQ</div>
                    <h2 className="font-black text-[#0A1628] text-2xl">Frequently Asked Questions</h2>
                    <p className="text-sm text-gray-400 mt-1">Common questions about the {to} visa</p>
                  </div>
                  <div className="space-y-3">
                    {FAQS.map((faq, i) => (
                      <div key={i} className={`rounded-2xl border transition-all duration-300 overflow-hidden ${faqOpen === i ? 'border-orange-400 bg-orange-50/40' : 'border-slate-900/50 bg-white'}`}>
                        <button className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                          onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                          <span className="text-base font-semibold text-[#0A1628] leading-snug">{faq.q}</span>
                          <span className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${faqOpen === i ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${faqOpen === i ? 'rotate-180' : ''}`} />
                          </span>
                        </button>
                        <div className={`transition-all duration-300 ${faqOpen === i ? 'max-h-52 pb-6' : 'max-h-0'} overflow-hidden`}>
                          <p className="px-6 text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </section>

          </div>

          {/* ════════════════════════════════════════
              RIGHT COLUMN — Sticky booking form
          ════════════════════════════════════════ */}
          <div className="hidden lg:block">
            <div className="sticky overflow-y-auto no-scrollbar" style={{ top: '126px', maxHeight: 'calc(100vh - 130px)', paddingBottom: '16px' }}>
              <div className="rounded-3xl bg-slate-100 p-3">
                <BookingForm to={to} toFlag={toFlag} initFrom={from} initFromFlag={fromFlag} />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-3 pb-4 safe-area-pb">
          <div className="flex items-center gap-3">
            {/* Destination flag + label */}
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 shadow-sm flex-shrink-0">
                <img
                  src={`https://flagcdn.com/w40/${FLAG_CODES[to] ?? 'un'}.png`}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] text-slate-400 font-medium leading-none mb-0.5">Apply for</div>
                <div className="text-sm font-black text-slate-900 leading-tight truncate">{to} Visa</div>
              </div>
            </div>
            {/* CTA button */}
            <button
              onClick={() => setMobileSheet(true)}
              className="flex-shrink-0 flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-orange-500 to-amber-400 text-white font-black text-sm rounded-xl shadow-lg active:scale-95 transition-transform duration-150"
            >
              <Plane className="h-4 w-4" />
              Apply Now
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom sheet ───────────────────────────────── */}
      {mobileSheet && (
        <div className="lg:hidden fixed inset-0 z-[60] flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileSheet(false)}
            style={{ animation: 'fadeIn 0.2s ease' }}
          />
          {/* Sheet */}
          <div
            className="relative bg-[#F8FAFC] rounded-t-3xl shadow-2xl flex flex-col"
            style={{
              maxHeight: '92dvh',
              animation: 'slideUp 0.32s cubic-bezier(0.32,0.72,0,1)',
            }}
          >
            {/* Drag indicator + close */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 pt-4 pb-3">
              <div className="flex-1" />
              <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto" />
              <div className="flex-1 flex justify-end">
                <button
                  onClick={() => setMobileSheet(false)}
                  className="w-7 h-7 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors active:scale-90"
                  aria-label="Close"
                >
                  <svg className="h-3.5 w-3.5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            {/* Scrollable form content */}
            <div className="overflow-y-auto overscroll-contain flex-1 px-4 pb-6">
              <BookingForm to={to} toFlag={toFlag} initFrom={from} initFromFlag={fromFlag} />
            </div>
          </div>
        </div>
      )}

      {/* ── Explore More Destinations ─────────────────────────── */}
      <DestinationSelector />

      <Footer />
    </div>
  )
}

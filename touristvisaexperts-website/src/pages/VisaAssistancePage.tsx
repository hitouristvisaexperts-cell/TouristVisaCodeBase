import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { useNavigation } from '../context/NavigationContext'
import { CountryCodeSelect, DEFAULT_DIAL_CODE, withDialCode } from '../components/site/CountryCodeSelect'
import { nameError, isValidEmail, phoneError, cleanPhone, phoneMaxDigits } from '../lib/validate'
import { ScrollReveal } from '../components/magicui/scroll-reveal'
import SplitText from '../components/magicui/split-text'
import { AnimatedList } from '../components/magicui/animated-list'
import { GlobeBars } from '../components/ui/cobe-globe-bars'
import {
  CheckCircle2, Shield, FileText, Plane, Hotel,
  Calendar, Star, MessageCircle, ChevronDown, ChevronUp,
  Users, Zap, ArrowRight, Globe, BadgeCheck, Search,
} from 'lucide-react'
import { PORTAL_URL } from '../lib/portal'

/* ─── Destination search data ──────────────────────── */
const SEARCH_DESTINATIONS = [
  { name: 'USA',         flag: '🇺🇸', code: 'us' },
  { name: 'UK',          flag: '🇬🇧', code: 'gb' },
  { name: 'Canada',      flag: '🇨🇦', code: 'ca' },
  { name: 'Australia',   flag: '🇦🇺', code: 'au' },
  { name: 'Schengen',    flag: '🇪🇺', code: 'eu' },
  { name: 'UAE',         flag: '🇦🇪', code: 'ae' },
  { name: 'Singapore',   flag: '🇸🇬', code: 'sg' },
  { name: 'Japan',       flag: '🇯🇵', code: 'jp' },
  { name: 'Germany',     flag: '🇩🇪', code: 'de' },
  { name: 'France',      flag: '🇫🇷', code: 'fr' },
  { name: 'Italy',       flag: '🇮🇹', code: 'it' },
  { name: 'Spain',       flag: '🇪🇸', code: 'es' },
  { name: 'Netherlands', flag: '🇳🇱', code: 'nl' },
  { name: 'New Zealand', flag: '🇳🇿', code: 'nz' },
  { name: 'Turkey',      flag: '🇹🇷', code: 'tr' },
]
const flagSrc = (code: string) => `https://flagcdn.com/w40/${code}.png`

function DestinationSearchBar() {
  const { openVisaDetails, openAllDestinations } = useNavigation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [rect, setRect] = useState<{ left: number; top: number; width: number } | null>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const fieldRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const filtered = query.length > 0
    ? SEARCH_DESTINATIONS.filter(d => d.name.toLowerCase().includes(query.toLowerCase()))
    : SEARCH_DESTINATIONS

  useEffect(() => {
    const h = (e: MouseEvent) => {
      const target = e.target as Node
      if (boxRef.current?.contains(target)) return
      if (dropdownRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  useEffect(() => {
    if (!open) return
    const update = () => {
      if (!fieldRef.current) return
      const r = fieldRef.current.getBoundingClientRect()
      setRect({ left: r.left, top: r.bottom + 8, width: r.width })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [open])

  const pick = (name: string, flag: string) => {
    setOpen(false)
    setQuery('')
    openVisaDetails(name, flag)
  }

  const explore = () => {
    const exact = SEARCH_DESTINATIONS.find(d => d.name.toLowerCase() === query.trim().toLowerCase())
    if (exact) { pick(exact.name, exact.flag); return }
    if (filtered.length === 1) { pick(filtered[0].name, filtered[0].flag); return }
    openAllDestinations()
  }

  return (
    <div className="w-full max-w-xl">
      <div className="inline-flex rounded-t-2xl bg-white/95 pt-1.5 px-1.5 relative z-10">
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-t-xl bg-white text-slate-900 font-bold text-sm">
          <Globe className="w-4 h-4 text-orange-500" /> Visa
        </div>
      </div>
      <div ref={boxRef} className="relative flex items-center gap-2 bg-white rounded-2xl rounded-tl-none p-2 shadow-2xl ring-1 ring-black/5">
        <div ref={fieldRef} className="relative flex-1">
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => { if (e.key === 'Enter') explore() }}
            placeholder="Where is your next travel to…"
            className="w-full bg-transparent text-slate-800 placeholder:text-slate-400 text-sm font-medium px-4 py-3 focus:outline-none"
          />
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          aria-label="Search"
          className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white flex items-center justify-center hover:scale-105 transition-transform shadow-[0_4px_14px_rgba(249,115,22,0.4)]"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={explore}
          className="shrink-0 hidden sm:inline-flex items-center gap-1.5 px-6 py-3 rounded-xl border-2 border-orange-500 text-orange-600 font-bold text-sm hover:bg-orange-500 hover:text-white transition-colors"
        >
          Explore
        </button>
      </div>

      {open && filtered.length > 0 && rect && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-slate-100 py-2 max-h-64 overflow-y-auto z-[9999]"
          style={{ left: rect.left, top: rect.top, width: rect.width }}
        >
          {filtered.map(d => (
            <button
              key={d.name}
              onClick={() => pick(d.name, d.flag)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm font-semibold text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
            >
              <img src={flagSrc(d.code)} width={22} height={16} alt="" className="rounded-sm shadow-sm object-cover" />
              {d.name}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  )
}

/* ─── What's included ──────────────────────────────── */
const INCLUDES = [
  {
    icon: FileText,
    title: 'Application Form Filling',
    desc: 'Our experts fill every field accurately — no mistakes, no rejections due to form errors.',
    color: '#3B82F6',
    bg: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
  },
  {
    icon: FileText,
    title: 'Cover Letter Preparation',
    desc: 'A professionally drafted cover letter tailored to your itinerary and embassy requirements.',
    color: '#8B5CF6',
    bg: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
  },
  {
    icon: Plane,
    title: 'Flight Ticket Reservations',
    desc: 'Dummy flight tickets for visa purposes — 100% verifiable by embassies. Paid tickets arranged on request.',
    color: '#F97316',
    bg: 'linear-gradient(135deg,#FFF7ED,#FED7AA)',
    note: '* Dummy tickets are not paid tickets. Some embassies require confirmed tickets.',
  },
  {
    icon: Calendar,
    title: 'Appointment Booking',
    desc: 'We book embassy appointments based on availability and guide you through the process.',
    color: '#22C55E',
    bg: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
    highlight: true,
  },
  {
    icon: Hotel,
    title: 'Hotel Booking Suggestions',
    desc: 'Curated hotel recommendations that meet embassy requirements — fully refundable & cost-effective.',
    color: '#EC4899',
    bg: 'linear-gradient(135deg,#FDF2F8,#FCE7F3)',
  },
  {
    icon: CheckCircle2,
    title: 'Other Mandatory Bookings',
    desc: 'Travel insurance, itinerary planning, and all other mandatory bookings — 100% refundable options recommended.',
    color: '#14B8A6',
    bg: 'linear-gradient(135deg,#F0FDFA,#CCFBF1)',
  },
]

/* ─── Process steps ────────────────────────────────── */
const STEPS = [
  {
    n: '01',
    icon: Shield,
    title: 'Make Payment',
    desc: 'Choose your package and complete the payment securely online in under 2 minutes.',
    accent: '#F97316',
    glow: 'rgba(249,115,22,0.3)',
  },
  {
    n: '02',
    icon: Users,
    title: 'Expert Assigned',
    desc: 'A dedicated visa expert is assigned to your case within 2 hours of payment.',
    accent: '#3B82F6',
    glow: 'rgba(59,130,246,0.3)',
  },
  {
    n: '03',
    icon: FileText,
    title: 'Document Review',
    desc: 'We review all your documents and provide a precise checklist — nothing gets missed.',
    accent: '#8B5CF6',
    glow: 'rgba(139,92,246,0.3)',
  },
  {
    n: '04',
    icon: BadgeCheck,
    title: 'Submission Ready',
    desc: 'Your complete application is prepared and embassy-ready for submission.',
    accent: '#22C55E',
    glow: 'rgba(34,197,94,0.3)',
  },
]

/* ─── Important notes data ─────────────────────────── */
const NOTES = [
  {
    icon: Calendar,
    color: '#F97316',
    bg: '#FFF7ED',
    border: '#FED7AA',
    title: 'Appointment Slots Are Limited',
    text: 'Embassy slots fill up quickly. If you want a specific country or date, it may not be possible. Apply early to lock your preferred slot.',
  },
  {
    icon: Plane,
    color: '#3B82F6',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    title: 'Book Early — Flights Get Expensive',
    text: 'Delaying your appointment booking makes flight prices more expensive. Act early to save money and secure better timings.',
  },
  {
    icon: FileText,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    title: 'Dummy vs Paid Flight Tickets',
    text: 'Dummy tickets are verifiable reservations — not paid bookings. Most embassies accept them, but some (e.g. USA) may require confirmed paid tickets.',
  },
  {
    icon: MessageCircle,
    color: '#22C55E',
    bg: '#F0FDF4',
    border: '#BBF7D0',
    title: 'Customer Care Available',
    text: 'Reach our Customer Care on Instagram for any questions before or after payment. Your dedicated expert is also reachable via WhatsApp.',
  },
]

/* ─── FAQ ──────────────────────────────────────────── */
const FAQS = [
  {
    q: 'What is the difference between dummy and paid flight tickets?',
    a: 'Dummy tickets are verifiable flight reservations (not paid bookings) used for visa applications. Most embassies accept them. However, some embassies like the US may require fully paid/confirmed tickets — we will advise you based on your destination.',
  },
  {
    q: 'Can I choose a specific embassy appointment date?',
    a: 'Appointment slots are booked based on availability at the embassy. We cannot guarantee specific dates as slots are limited and fill up quickly. Delaying your application also increases flight costs.',
  },
  {
    q: 'How long does the visa assistance process take?',
    a: 'Once payment is done, your expert is assigned within 2 hours. Document review and form filling typically takes 1–2 business days. Total processing depends on embassy timelines.',
  },
  {
    q: 'How do I contact my assigned visa expert?',
    a: 'After payment, your dedicated expert will reach out directly via WhatsApp/phone. You can also reach our customer care on Instagram for any queries.',
  },
  {
    q: 'Are the hotel and travel bookings refundable?',
    a: 'Yes — we only recommend 100% refundable and cost-effective options for hotel and other mandatory bookings so you are not at financial risk.',
  },
]

/* ─── Case Milestone Showcase ─────────────────────────── */
const APPROVALS = [
  { flag: '🇫🇷', country: 'France (Schengen)', type: 'Visa Approved',         time: 'Step 4/4', color: '#22C55E' },
  { flag: '🇬🇧', country: 'UK Tourist Visa',   type: 'Documents Verified',    time: 'Step 2/4', color: '#3B82F6' },
  { flag: '🇯🇵', country: 'Japan Visa',         type: 'Application Submitted', time: 'Step 3/4', color: '#F97316' },
  { flag: '🇦🇪', country: 'Dubai Visit Visa',   type: 'Visa Approved',         time: 'Step 4/4', color: '#22C55E' },
  { flag: '🇨🇦', country: 'Canada Visa',        type: 'Expert Assigned',       time: 'Step 1/4', color: '#8B5CF6' },
  { flag: '🇸🇬', country: 'Singapore Visa',     type: 'Visa Approved',         time: 'Step 4/4', color: '#22C55E' },
  { flag: '🇩🇪', country: 'Germany (Schengen)', type: 'Checklist Sent',        time: 'Step 1/4', color: '#14B8A6' },
  { flag: '🇺🇸', country: 'USA B1/B2 Visa',     type: 'Documents Verified',    time: 'Step 2/4', color: '#3B82F6' },
]

/* ─── Animated step connector ───────────────────────── */
function AnimatedStepLine() {
  const lineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = lineRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.width = '100%'
          obs.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // line threads through center of the w-11 h-11 (44px) badge circles → top = 22px
  return (
    <div className="hidden md:block absolute top-[22px] left-[12.5%] right-[12.5%] h-px bg-white/[0.08]">
      <div
        ref={lineRef}
        className="h-full bg-gradient-to-r from-orange-500 via-blue-500 via-purple-500 to-green-500"
        style={{ width: '0%', transition: 'width 2s cubic-bezier(0.22,1,0.36,1) 0.4s' }}
      />
    </div>
  )
}

/* ─── FAQ Item ──────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${open ? 'border-orange-300 bg-orange-50/50' : 'border-gray-200 bg-white'}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
      >
        <span className="font-semibold text-[#0A1628] text-sm md:text-base leading-snug">{q}</span>
        <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${open ? 'bg-orange-500 text-white rotate-0' : 'bg-gray-100 text-gray-500'}`}>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>
      <div className={`transition-all duration-400 ${open ? 'max-h-48 pb-5' : 'max-h-0'} overflow-hidden`}>
        <p className="px-6 text-sm text-gray-600 leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

/* ─── Razorpay type declaration ─────────────────────── */
declare global {
  interface Window { Razorpay: any }
}

/* ─── Checkout Modal ─────────────────────────────────── */
const VISA_TYPES = [
  'Schengen Tourist Visa','UK Visit Visa','USA Tourist Visa (B2)',
  'Canada Tourist Visa','Australia Tourist Visa','UAE Visit Visa',
  'Dubai Tourist Visa','New Zealand Visa','Japan Tourist Visa','Other',
]

function CheckoutModal({ pkg, onClose }: { pkg: 'essential'|'complete'; onClose: () => void }) {
  const [form, setForm] = useState({ name:'', email:'', phone:'', visaType:'', destinationCountry:'' })
  const [phoneCode, setPhoneCode] = useState(DEFAULT_DIAL_CODE)
  const fullPhone = withDialCode(phoneCode, form.phone)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    const problem = nameError(form.name) || (isValidEmail(form.email) ? '' : 'Please enter a valid email address.') || phoneError(phoneCode, form.phone)
    if (problem) return setError(problem)
    setError('')
    setLoading(true)
    try {
      // 1. Create Razorpay order
      const API = import.meta.env.VITE_API_URL || '/api'
      const orderRes = await fetch(`${API}/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkg }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.message)

      // 2. Load Razorpay script if needed
      if (!window.Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => res()
          s.onerror = () => rej(new Error('Failed to load Razorpay'))
          document.head.appendChild(s)
        })
      }

      // 3. Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: orderData.data.keyId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        order_id: orderData.data.orderId,
        name: 'Travel Tourist Visa Expert',
        description: `${pkg === 'complete' ? 'Complete' : 'Essential'} Visa Package`,
        image: '/logo.png',
        prefill: { name: form.name, email: form.email, contact: fullPhone },
        theme: { color: '#F97316' },
        handler: async (response: any) => {
          try {
            // 4. Verify payment & provision account
            const verifyRes = await fetch(`${API}/payment/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                name: form.name,
                email: form.email,
                phone: fullPhone,
                visaType: form.visaType,
                destinationCountry: form.destinationCountry,
                package: pkg,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyData.success) throw new Error(verifyData.message)
            setSuccess(true)
          } catch (err: any) {
            setError(err.message || 'Payment verification failed. Please contact support.')
            setLoading(false)
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none transition-all focus:border-orange-400 focus:ring-2 focus:ring-orange-100 font-medium placeholder:text-gray-400'

  if (success) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl p-10 max-w-md w-full text-center shadow-2xl">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 border border-green-200 flex items-center justify-center mx-auto mb-6 text-4xl">🎉</div>
        <h2 className="text-2xl font-extrabold text-[#0A1628] mb-3">Payment Successful!</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Your account has been created. Check your email <strong className="text-gray-800">{form.email}</strong> for your login credentials.
        </p>
        <a
          href={`${PORTAL_URL}/login`}
          target="_blank"
          rel="noreferrer"
          className="block w-full py-4 rounded-xl font-bold text-white text-base"
          style={{ background: 'linear-gradient(135deg,#F97316,#f85c00)', boxShadow: '0 4px 16px rgba(249,115,22,0.4)' }}
        >
          Login to Your Portal →
        </a>
        <button onClick={onClose} className="mt-3 text-sm text-gray-400 hover:text-gray-600">Close</button>
      </div>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#0A1628] to-[#0d1e3a] px-7 py-5 flex items-center justify-between">
          <div>
            <div className="text-white font-bold text-lg">Visa Assistance Package</div>
            <div className="text-orange-400 font-extrabold text-2xl mt-0.5">₹10,000</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handlePay} className="px-7 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm font-medium">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
              <input className={inputCls} placeholder="John Doe" value={form.name} required onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email Address *</label>
              <input type="email" className={inputCls} placeholder="you@example.com" value={form.email} required onChange={e => set('email', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
              <div className="flex items-center border border-gray-200 rounded-xl transition-all focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                <CountryCodeSelect value={phoneCode} onChange={setPhoneCode} className="pl-4 pr-2.5 py-3 text-sm text-gray-700 border-r border-gray-200" />
                <input type="tel" inputMode="numeric" maxLength={phoneMaxDigits(phoneCode)} className="flex-1 min-w-0 bg-transparent px-3 py-3 text-sm text-gray-900 outline-none font-medium placeholder:text-gray-400" placeholder="98765 43210" value={form.phone} onChange={e => set('phone', cleanPhone(phoneCode, e.target.value))} />
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Visa Type</label>
              <select className={inputCls} value={form.visaType} onChange={e => set('visaType', e.target.value)}>
                <option value="">Select visa type...</option>
                {VISA_TYPES.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Destination Country</label>
              <input className={inputCls} placeholder="e.g. Germany, UK, UAE..." value={form.destinationCountry} onChange={e => set('destinationCountry', e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 rounded-xl text-white font-bold text-base transition-all"
            style={{ background: loading ? '#fdba74' : 'linear-gradient(135deg,#F97316,#f85c00)', boxShadow: '0 4px 16px rgba(249,115,22,0.4)', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Processing...' : 'Pay ₹10,000 Securely →'}
          </button>

          <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            256-bit SSL · Powered by Razorpay
          </p>
        </form>
      </div>
    </div>
  )
}

/* ─── Page ──────────────────────────────────────────── */
export default function VisaAssistancePage() {
  const { openAllDestinations } = useNavigation()
  const [checkoutPkg, setCheckoutPkg] = useState<'essential'|'complete'|null>(null)
  const handleApply = (_pkg: 'essential'|'complete' = 'complete') => openAllDestinations()

  useEffect(() => {}, [])

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      {checkoutPkg && <CheckoutModal pkg={checkoutPkg} onClose={() => setCheckoutPkg(null)} />}
      <style>{`
        @keyframes float-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-14px)} }
        @keyframes pulse-ring { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(1.6);opacity:0} }
        @keyframes shimmer { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes draw-line { from{stroke-dashoffset:400} to{stroke-dashoffset:0} }
        .shimmer-text {
          background: linear-gradient(90deg,#f97316,#fb923c,#fdba74,#fb923c,#f97316);
          background-size:200% auto;
          -webkit-background-clip:text;
          -webkit-text-fill-color:transparent;
          animation:shimmer 3s linear infinite;
        }
        .step-card:hover .step-icon-wrap { transform:scale(1.12) rotate(-4deg); }
        .step-number-bg { font-size:7rem; font-weight:900; line-height:1; opacity:.06; position:absolute; top:-1rem; right:-1rem; pointer-events:none; user-select:none; }
      `}</style>

      <Navbar />

      {/* ══ HERO ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#060d1f] via-[#0A1628] to-[#0f2040] pt-20 pb-16 px-4">
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)', backgroundSize: '32px 32px' }}
          aria-hidden
        />
        {/* Glow blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange-500/[0.08] blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-blue-600/[0.08] blur-[60px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text */}
            <div>
              <h1 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-[1.08] mb-6">
                <SplitText
                  text="Visa Assistance"
                  tag="span"
                  className="block"
                  splitType="chars"
                  delay={25}
                  duration={0.8}
                  ease="power4.out"
                  from={{ opacity: 0, y: 55, rotateX: -25 }}
                  to={{ opacity: 1, y: 0, rotateX: 0 }}
                  threshold={0.05}
                  rootMargin="0px"
                  textAlign="left"
                />
                <span className="shimmer-text">Done Right.</span>
              </h1>

              <ScrollReveal duration={700} delay={280}>
                <p className="text-white/60 text-base md:text-lg max-w-lg leading-relaxed mb-8">
                  A dedicated expert guides you start to finish — document review to embassy-ready application. Simple, stress-free, built on trust and proven performance.
                </p>
              </ScrollReveal>

              <ScrollReveal duration={700} delay={360}>
                <div className="flex flex-wrap gap-3 mb-10">
                  <button
                    onClick={() => handleApply('complete')}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm px-8 py-4 rounded-full shadow-[0_8px_28px_rgba(249,115,22,0.45)] hover:shadow-[0_12px_36px_rgba(249,115,22,0.58)] hover:-translate-y-1 transition-all duration-200"
                  >
                    Apply Now <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </ScrollReveal>

              {/* Destination search */}
              <ScrollReveal duration={700} delay={450}>
                <DestinationSearchBar />
              </ScrollReveal>
            </div>

            {/* Right: Globe + Live Approvals */}
            <div className="flex flex-col gap-6 items-center self-start lg:self-center">
              <ScrollReveal duration={900} delay={200} direction="fade">
                <div className="relative">
                  {/* Globe glow ring */}
                  <div className="absolute inset-0 rounded-full bg-orange-500/10 blur-2xl scale-110 pointer-events-none" />
                  <GlobeBars className="w-[280px] md:w-[340px]" speed={0.004} />
                  {/* Globe label */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white/70 text-[11px] font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm whitespace-nowrap">
                    <Globe className="w-3 h-3 text-orange-400" />
                    Trusted Across Major Destinations
                  </div>
                </div>
              </ScrollReveal>

              {/* Live Approvals */}
              <ScrollReveal duration={700} delay={500} direction="up">
                <div className="w-full max-w-[340px]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                    </span>
                    <span className="text-white/70 text-xs font-semibold uppercase tracking-wider">Milestone Tracking</span>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-sm h-[216px] overflow-hidden relative">
                    {/* fade-out at bottom so items disappear cleanly */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0A1628]/80 to-transparent z-10 rounded-b-2xl" />
                    <AnimatedList delay={1600} className="flex-col-reverse">
                      {APPROVALS.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 bg-white/5 border border-white/[0.07] rounded-xl px-3 py-2.5"
                        >
                          <span className="text-xl leading-none shrink-0">{item.flag}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-white text-xs font-semibold truncate">{item.country}</div>
                            <div className="text-[11px] font-semibold" style={{ color: item.color }}>{item.type}</div>
                          </div>
                          <span className="text-white/25 text-[10px] shrink-0 tabular-nums">{item.time}</span>
                        </div>
                      ))}
                    </AnimatedList>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* ══ WHAT'S INCLUDED ══════════════════════════════════ */}
      <section className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 bg-orange-500 text-white text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5 shadow-[0_4px_14px_rgba(249,115,22,0.3)]">
                Our Fee Includes
              </div>
              <h2 className="text-3xl md:text-4xl xl:text-5xl font-black text-[#0A1628] leading-tight mb-4">
                <span className="block">Everything You Need,</span>
                <span className="block text-orange-500">Nothing You Don't</span>
              </h2>
              <p className="text-gray-600 text-base max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
                From application forms to embassy appointments — we handle it all so you don't have to.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {INCLUDES.map((item, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 90} duration={650}>
                <div
                  className={`group relative rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl h-full ${item.highlight ? 'border-orange-300 shadow-[0_4px_24px_rgba(249,115,22,0.15)]' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  style={item.highlight ? { background: 'linear-gradient(135deg,#fff7ed,#fff)' } : {}}
                >
                  {item.highlight && (
                    <span className="absolute -top-3 left-5 inline-flex items-center gap-1 bg-orange-500 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
                      <Star className="w-2.5 h-2.5 fill-current" /> Most Requested
                    </span>
                  )}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]"
                    style={{ background: item.bg }}
                  >
                    <item.icon className="w-6 h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-bold text-[#0A1628] text-base mb-2">{item.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  {item.note && (
                    <p className="mt-3 text-xs text-orange-500 font-medium bg-orange-50 rounded-lg px-3 py-2">{item.note}</p>
                  )}
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══ HOW IT WORKS ═══════════════════════════════════════ */}
      <section className="py-28 px-4 bg-[#060d1f] relative overflow-hidden">
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
          aria-hidden
        />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-orange-500/5 blur-[100px] pointer-events-none rounded-full" />

        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-20">
              <div className="inline-flex items-center gap-2 bg-blue-500/15 border border-blue-400/25 text-blue-300 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-5">
                The Process
              </div>
              <h2 className="text-4xl md:text-5xl xl:text-6xl font-black text-white leading-tight mb-4">
                <SplitText
                  text="How It Works"
                  tag="span"
                  className="block"
                  splitType="words"
                  delay={100}
                  duration={0.75}
                  ease="power3.out"
                  from={{ opacity: 0, y: 40, scale: 0.9 }}
                  to={{ opacity: 1, y: 0, scale: 1 }}
                  threshold={0.15}
                  rootMargin="-60px"
                  textAlign="center"
                />
                <span className="sr-only">How It Works</span>
              </h2>
              <p className="text-white/40 text-base max-w-md mx-auto">
                Four simple steps from payment to embassy-ready — we handle everything in between.
              </p>
            </div>
          </ScrollReveal>

          {/* Steps */}
          <div className="relative">
            {/* Animated connector line */}
            <AnimatedStepLine />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
              {STEPS.map((step, i) => (
                <ScrollReveal key={i} direction="up" delay={i * 160} duration={700}>
                  <div className="step-card group flex flex-col items-center text-center px-2">

                    {/* ── Badge node ─ line runs through these ── */}
                    {/* w-11 h-11 = 44px, center = 22px, matches top-[22px] on the line */}
                    <div
                      className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center text-sm font-black text-white shadow-lg mb-5 shrink-0 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: step.accent, boxShadow: `0 4px 16px ${step.glow}` }}
                    >
                      {step.n}
                    </div>

                    {/* ── Icon box — sits below the line, never touched by it ── */}
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shrink-0 transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${step.accent}18, ${step.accent}32)`,
                        border: `1.5px solid ${step.accent}45`,
                      }}
                    >
                      <step.icon className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" style={{ color: step.accent }} />
                    </div>

                    <h3 className="font-black text-white text-base mb-2 leading-snug">{step.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>

                    <div
                      className="mt-4 h-px w-6 rounded-full group-hover:w-14 transition-all duration-300 opacity-30 group-hover:opacity-70"
                      style={{ background: step.accent }}
                    />
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>

          {/* CTA strip inside How It Works */}
          <ScrollReveal direction="up" delay={200} duration={700}>
            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => handleApply('complete')}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-8 py-4 rounded-full shadow-[0_8px_28px_rgba(249,115,22,0.4)] hover:shadow-[0_12px_36px_rgba(249,115,22,0.55)] hover:-translate-y-1 transition-all duration-200 text-sm"
              >
                Start Your Application <ArrowRight className="w-4 h-4" />
              </button>
              <p className="text-white/30 text-xs">No commitment. Cancel anytime before submission.</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ══ IMPORTANT NOTES ════════════════════════════════════ */}
      <section className="py-20 px-4 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal direction="up" duration={600}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                <Zap className="w-3 h-3" /> Before You Apply
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#0A1628]">
                Things to Keep <span className="text-amber-500">in Mind</span>
              </h2>
              <p className="text-gray-500 text-sm mt-3 max-w-md mx-auto">
                Read these before you apply — they'll save you time, money, and surprises.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {NOTES.map((note, i) => (
              <ScrollReveal
                key={i}
                direction={i % 2 === 0 ? 'left' : 'right'}
                delay={i * 80}
                duration={650}
              >
                <div
                  className="flex items-start gap-4 p-5 rounded-2xl border group hover:-translate-y-1 transition-all duration-300 hover:shadow-md"
                  style={{ background: note.bg, borderColor: note.border }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${note.color}18` }}
                  >
                    <note.icon className="w-5 h-5" style={{ color: note.color }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-[#0A1628] text-sm mb-1">{note.title}</h4>
                    <p className="text-gray-600 text-sm leading-relaxed">{note.text}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ════════════════════════════════════════════════ */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <ScrollReveal direction="up" duration={700}>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-4">
                Questions
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-[#0A1628]">
                Frequently Asked{' '}
                <span className="text-orange-500">Questions</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <ScrollReveal key={i} direction="up" delay={i * 70} duration={600}>
                <FAQItem q={faq.q} a={faq.a} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

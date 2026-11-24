import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { useNavigation } from '../context/NavigationContext'
import { useClientSession } from '../hooks/useClientSession'
import { CountryCodeSelect, withDialCode } from '../components/site/CountryCodeSelect'
import { nameError, isValidEmail, phoneError, dialCodeFor, cleanPhone, phoneMaxDigits } from '../lib/validate'
import { visaPriceInr, gstBreakdown, formatInr, PRICES, isReapplicationCountry } from '../lib/pricing'
import checkoutBg from '../assets/checkout-bg.jpg'
import {
  ArrowLeft, CheckCircle2, Info, Shield, Plane,
  Globe, ChevronDown, ChevronUp, AlertCircle, ArrowRight,
  FileText, Mail, Building2, Hotel, Umbrella, FolderOpen,
  Wallet, Search, Target, Users, Gift, X,
} from 'lucide-react'

/* ─── Data ─────────────────────────────────────────── */
const INCLUDES = [
  { label: 'Visa Application Form Filling',         Icon: FileText,   color: '#2563EB', bg: '#EFF6FF' },
  { label: 'Professional Cover Letter Preparation', Icon: Mail,       color: '#8B5CF6', bg: '#F5F3FF' },
  { label: 'Embassy Appointment Assistance',        Icon: Building2,  color: '#10B981', bg: '#F0FDF4' },
  { label: 'Flight Itinerary Reservation',          Icon: Plane,      color: '#F97316', bg: '#FFF7ED' },
  { label: 'Hotel Booking Recommendations',         Icon: Hotel,      color: '#EC4899', bg: '#FDF2F8' },
  { label: 'Travel Insurance Assistance',           Icon: Umbrella,   color: '#14B8A6', bg: '#F0FDFA' },
  { label: 'Document Preparation Guidance',         Icon: FolderOpen, color: '#F59E0B', bg: '#FFFBEB' },
  { label: '100% Refundable Booking Options',       Icon: Wallet,     color: '#10B981', bg: '#F0FDF4' },
  { label: 'Expert Document Review',                Icon: Search,     color: '#2563EB', bg: '#EFF6FF' },
  { label: 'End-to-End Visa Process Guidance',      Icon: Target,     color: '#F97316', bg: '#FFF7ED' },
]

const IMPORTANT = [
  'No Refunds: All payments are strictly non-refundable once made (except the 100% Refund Guarantee plan if your visa is rejected).',
  'Appointments: Once booked, embassy appointments cannot be rescheduled. Any change is treated as a new requirement and requires a new booking and full payment.',
  'Embassy appointment fees are paid directly by the applicant.',
  'Appointment availability depends on embassy slot release. Appointment booking is subject to availability and cannot be guaranteed.',
  'Some embassies may require applicants to book appointments directly.',
  'Flight itineraries are temporary reservations for visa purposes only — not fully paid tickets.',
  'Certain embassies may require confirmed or fully paid flight tickets.',
  'Travel insurance charges are paid separately by the applicant.',
  'Refundable bookings are subject to supplier policies at the time of booking.',
  'Final visa approval is solely at the discretion of the respective embassy/consulate.',
  'Processing time: Minimum 15–20 days, subject to embassy/consulate appointment availability.',
]

/* Two separately-recorded consents, matching what's sent to the backend consent log. */
const DATA_PROTECTION_TEXT = 'I agree to the Privacy Policy and consent to Tourist Visa Experts processing my personal data (including passport and travel documents) for visa assistance purposes, including where applicable by staff in the UK and India under equivalent data-protection safeguards, and retained as described in the Data Retention Policy.'
const TERMS_REFUND_TEXT = 'I agree to the Terms & Conditions and Refund & Cancellation Policy. I understand that payments are non-refundable except under the 100% Refund Guarantee plan, that embassy appointments cannot be rescheduled once booked, and I confirm I am 18 years of age or older and that all information I have provided is accurate.'

declare global { interface Window { Razorpay: any } }


interface Props { visaCountry: string; fromCountry: string; initialTravellers?: number; initialRejectedTier?: 'standard' | 'guarantee' | null; initialPreviouslyRejected?: boolean | null }

export default function CheckoutPage({ visaCountry, fromCountry, initialTravellers = 1, initialRejectedTier = null, initialPreviouslyRejected = null }: Props) {
  const { navigateTo } = useNavigation()
  const { user: sessionUser } = useClientSession()

  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  // Preselect the dial code of the country the client is applying from (they can still change it)
  const [phoneCode, setPhoneCode] = useState(() => dialCodeFor(fromCountry))
  const fullPhone = withDialCode(phoneCode, form.phone)

  // If the visitor is already logged in (shared session with the portal),
  // pre-fill their details instead of asking them to retype what we already
  // know — only into fields they haven't already typed something into.
  useEffect(() => {
    if (!sessionUser) return
    setForm(prev => ({
      name: prev.name || sessionUser.name || '',
      email: prev.email || sessionUser.email || '',
      phone: prev.phone || sessionUser.phone || '',
    }))
  }, [sessionUser])
  const emptyMember = () => ({ name: '', relation: 'Spouse', dateOfBirth: '', passportNumber: '' })
  const [familyMembers, setFamilyMembers] = useState<Array<{ name: string; relation: string; dateOfBirth: string; passportNumber: string }>>(
    initialTravellers > 1 ? Array.from({ length: initialTravellers - 1 }, emptyMember) : []
  )

  // Schengen country preference (up to 3)
  const SCHENGEN_COUNTRIES: { name: string; code: string }[] = [
    { name: 'Austria',        code: 'at' }, { name: 'Belgium',        code: 'be' },
    { name: 'Bulgaria',       code: 'bg' }, { name: 'Croatia',        code: 'hr' },
    { name: 'Czech Republic', code: 'cz' }, { name: 'Denmark',        code: 'dk' },
    { name: 'Estonia',        code: 'ee' }, { name: 'Finland',        code: 'fi' },
    { name: 'France',         code: 'fr' }, { name: 'Germany',        code: 'de' },
    { name: 'Greece',         code: 'gr' }, { name: 'Hungary',        code: 'hu' },
    { name: 'Iceland',        code: 'is' }, { name: 'Italy',          code: 'it' },
    { name: 'Latvia',         code: 'lv' }, { name: 'Liechtenstein',  code: 'li' },
    { name: 'Lithuania',      code: 'lt' }, { name: 'Luxembourg',     code: 'lu' },
    { name: 'Malta',          code: 'mt' }, { name: 'Netherlands',    code: 'nl' },
    { name: 'Norway',         code: 'no' }, { name: 'Poland',         code: 'pl' },
    { name: 'Portugal',       code: 'pt' }, { name: 'Romania',        code: 'ro' },
    { name: 'Slovakia',       code: 'sk' }, { name: 'Slovenia',       code: 'si' },
    { name: 'Spain',          code: 'es' }, { name: 'Sweden',         code: 'se' },
    { name: 'Switzerland',    code: 'ch' },
  ]
  const isSchengen = visaCountry === 'Schengen'
  const [schengenPref, setSchengenPref] = useState<[string,string,string]>(['','',''])
  const [schengenSearch, setSchengenSearch] = useState<[string,string,string]>(['','',''])
  const [schengenOpen, setSchengenOpen] = useState<[boolean,boolean,boolean]>([false,false,false])
  const setSchengenSlot = (idx: number, val: string) => {
    setSchengenPref(p => { const n: [string,string,string] = [...p] as [string,string,string]; n[idx] = val; return n })
    setSchengenOpen(p => { const n: [boolean,boolean,boolean] = [...p] as [boolean,boolean,boolean]; n[idx] = false; return n })
    setSchengenSearch(p => { const n: [string,string,string] = [...p] as [string,string,string]; n[idx] = ''; return n })
  }
  const clearSchengenSlot = (idx: number) => {
    setSchengenPref(p => { const n: [string,string,string] = [...p] as [string,string,string]; n[idx] = ''; return n })
  }
  const toggleSchengenOpen = (idx: number) =>
    setSchengenOpen(p => { const n: [boolean,boolean,boolean] = [...p] as [boolean,boolean,boolean]; n[idx] = !n[idx]; return n })

  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponAmount, setCouponAmount] = useState<number | null>(null)
  const [couponChecking, setCouponChecking] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [paidEmail, setPaidEmail] = useState('')
  const [showImportant, setShowImportant] = useState(false)
  const [dataProtectionAgreed, setDataProtectionAgreed] = useState(false)
  const [termsRefundAgreed, setTermsRefundAgreed] = useState(false)
  // null = not answered, false = first-time, true = rejected before.
  // The re-application package is offered only for the countries the client listed (Schengen, UK, USA, Canada, Australia, NZ).
  const specialistAvailable = isReapplicationCountry(visaCountry)
  const rejectedTierIn: 'standard' | 'guarantee' | null = specialistAvailable && initialRejectedTier ? initialRejectedTier : null
  // First-time unless the visitor came from the Visa Rejected page (that choice is made in the visa-page popup)
  const [previouslyRejected] = useState<boolean | null>(rejectedTierIn ? true : false)
  void initialPreviouslyRejected
  const [rejectionTier] = useState<'standard' | 'guarantee' | null>(rejectedTierIn)

  /* ── Pricing: every customer pays in INR (Razorpay); prices come from the admin portal ── */
  const FIRST_TIME_PRICE = visaPriceInr(visaCountry) // GST inclusive
  // GST inclusive, per person — Specialist, or Guarantee when coming from the Refund Guarantee page
  const REAPPLICATION_PRICE = rejectionTier === 'guarantee' ? PRICES.reapplicationGuarantee : PRICES.reapplication
  const isIndia = true as boolean // always the Razorpay (INR) path; Stripe path kept but unused

  const [finalAmount, setFinalAmount] = useState(() =>
    (rejectedTierIn ? REAPPLICATION_PRICE : FIRST_TIME_PRICE) * (initialTravellers || 1))

  const localPrice = formatInr
  void 0

  // ── Auto-Capture Abandoned Checkout Lead in Background ──
  useEffect(() => {
    if (!form.name.trim() || !isValidEmail(form.email) || form.phone.trim().length < 6) return
    const timer = setTimeout(() => {
      const API = import.meta.env.VITE_API_URL || '/api'
      fetch(`${API}/checkout/lead-capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: fullPhone,
          destinationCountry: visaCountry,
          package: rejectionTier ? (rejectionTier === 'guarantee' ? 'Guarantee Re-application' : 'Specialist Re-application') : 'Complete Package',
          numberOfApplicants: familyMembers.length + 1,
          amount: finalAmount,
        }),
      }).catch(() => {})
    }, 1500)
    return () => clearTimeout(timer)
  }, [form.name, form.email, form.phone, fullPhone, visaCountry, rejectionTier, familyMembers.length, finalAmount])

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('stripe_session')
    if (!sessionId) return
    setLoading(true)
    const API = import.meta.env.VITE_API_URL || '/api'
    fetch(`${API}/payment/stripe-visa-verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async r => {
        const text = await r.text()
        let data: any
        try { data = JSON.parse(text) } catch { throw new Error('Server error verifying payment. Please contact support with your payment confirmation.') }
        return data
      })
      .then(async data => {
        if (!data.success) throw new Error(data.message)
        await handleVerifySuccess(data, API)
      })
      .catch(err => { setError(err.message || 'Payment verification failed.'); setLoading(false) })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const basePrice = previouslyRejected ? REAPPLICATION_PRICE : FIRST_TIME_PRICE
  const isReapplication = previouslyRejected === true

  const totalApplicants = 1 + familyMembers.length

  // Backend returns the discounted amount in the same currency/unit this
  // checkout is about to actually charge, so it's safe to convert to a
  // display amount using only that response — never a value computed in a
  // different currency (e.g. INR/paise reused for a GBP checkout).
  const fetchCouponAmount = async (code: string) => {
    const API = import.meta.env.VITE_API_URL || '/api'
    const res = await fetch(`${API}/payment/validate-coupon`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coupon: code, isIndia, fromCountry, destinationCountry: visaCountry,
        previouslyRejected, rejectionTier, numberOfApplicants: totalApplicants,
      }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.message || 'Invalid coupon code.')
    return data.zeroDecimal ? data.finalAmount : Math.round(data.finalAmount / 100)
  }

  // Re-calculate total whenever family members/tier change. With a coupon
  // applied, only the first applicant is discounted — every traveller after
  // that is billed at the normal rate, so the total must be re-derived
  // rather than left frozen at whatever it was when the coupon was applied.
  useEffect(() => {
    if (!couponApplied) {
      setFinalAmount(basePrice * totalApplicants)
      return
    }
    const code = coupon.trim()
    if (!code) return
    fetchCouponAmount(code)
      .then(displayAmount => { setCouponAmount(displayAmount); setFinalAmount(displayAmount) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalApplicants, basePrice, couponApplied])

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const [showCashbackModal, setShowCashbackModal] = useState(false)
  const [cashbackConfig, setCashbackConfig] = useState<{ enabled: boolean; [key: string]: any } | null>(null)

  useEffect(() => {
    const API = import.meta.env.VITE_API_URL || '/api'
    fetch(`${API}/settings/cashback`)
      .then(r => r.json())
      .then(d => { if (d.success) setCashbackConfig(d.data) })
      .catch(() => {})
  }, [])

  const applyCoupon = async () => {
    const code = coupon.trim()
    if (!code) return
    setCouponChecking(true); setCouponError('')
    try {
      const displayAmount = await fetchCouponAmount(code)
      setCouponApplied(true)
      setCouponAmount(displayAmount)
      setFinalAmount(displayAmount)
    } catch (err: any) {
      setCouponApplied(false)
      setCouponAmount(null)
      setCouponError(err.message || 'Invalid coupon code.')
      setFinalAmount(basePrice * totalApplicants)
    } finally {
      setCouponChecking(false)
    }
  }

  const removeCoupon = () => {
    setCoupon(''); setCouponApplied(false); setCouponAmount(null); setCouponError('')
    setFinalAmount(basePrice * totalApplicants)
  }


  const handleVerifySuccess = async (verifyData: any, API: string) => {
    if (verifyData.exchangeCode) {
      const PORTAL = import.meta.env.VITE_PORTAL_URL || 'https://portal.touristvisaexperts.com'
      const exchRes = await fetch(`${API}/payment/exchange-token`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyData.exchangeCode }),
      })
      const exchData = await exchRes.json()
      window.location.href = exchData.success
        ? `${PORTAL}/auth?token=${encodeURIComponent(exchData.token)}`
        : `${PORTAL}/login`
      return
    }
    setPaidEmail(form.email); setSuccess(true)
  }

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim())
      return setError('Please fill in your name, email and phone number.')
    const contactProblem = nameError(form.name, 'full name')
      || (isValidEmail(form.email) ? '' : 'Please enter a valid email address.')
      || phoneError(phoneCode, form.phone, 'phone number')
    if (contactProblem) return setError(contactProblem)
    if (isSchengen && !schengenPref[0]) return setError('Please select at least one Schengen country preference.')
    if (previouslyRejected === null) return setError('Please tell us if your visa was rejected before.')
    if (previouslyRejected === true && rejectionTier === null) return setError('Please choose a plan.')
    if (!dataProtectionAgreed) return setError('Please accept the data-protection terms to continue.')
    if (!termsRefundAgreed) return setError('Please accept the Terms & Refund Policy to continue.')
    setError(''); setLoading(true)

    const API = import.meta.env.VITE_API_URL || '/api'
    const consentTimestamp = new Date().toISOString()

    // Fire-and-forget: record consent intent immediately, even if payment is later abandoned.
    fetch(`${API}/consent/log`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name, email: form.email, phone: fullPhone,
        source: 'checkout',
        dataProtection: dataProtectionAgreed, termsRefund: termsRefundAgreed,
        consentTextSnapshot: { dataProtection: DATA_PROTECTION_TEXT, termsRefund: TERMS_REFUND_TEXT },
        documentVersions: { privacyPolicy: 'v1', terms: 'v1', refundPolicy: 'v1' },
      }),
    }).catch(() => {})

    const commonFields = {
      name: form.name, email: form.email, phone: fullPhone,
      visaType: `${visaCountry} Visa`, destinationCountry: visaCountry,
      previouslyRejected, rejectionTier, numberOfApplicants: totalApplicants,
      familyMembers: familyMembers.filter(m => m.name.trim()),
      ...(isSchengen && { schengenPreferences: schengenPref.filter(v => v) }),
      dataProtectionConsent: dataProtectionAgreed,
      termsRefundConsent: termsRefundAgreed,
      consentTimestamp,
    }

    // ── Stripe Checkout path (international users) ──
    if (!isIndia) {
      try {
        const orderRes = await fetch(`${API}/payment/stripe-visa-order`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fromCountry, coupon: couponApplied ? coupon.trim() : '', ...commonFields }),
        })
        const orderData = await orderRes.json()
        if (!orderData.success) throw new Error(orderData.message)
        if (!orderData.data?.sessionUrl) throw new Error('Payment session could not be created. Please try again.')
        window.location.href = orderData.data.sessionUrl
      } catch (err: any) {
        setError(err.message || 'Payment failed. Please try again or contact support.')
        setLoading(false)
      }
      return
    }

    // ── Razorpay path (India) ──
    try {
      const orderRes = await fetch(`${API}/payment/create-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: 'complete', coupon: couponApplied ? coupon.trim() : '', previouslyRejected, rejectionTier, numberOfApplicants: totalApplicants, destinationCountry: visaCountry }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.message)

      if (!window.Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load Razorpay'))
          document.head.appendChild(s)
        })
      }

      const rzp = new window.Razorpay({
        key: orderData.data.keyId, amount: orderData.data.amount,
        currency: orderData.data.currency, order_id: orderData.data.orderId,
        name: 'Travel Tourist Visa Expert', description: `${visaCountry} Visa Assistance`,
        image: '/logo.png',
        prefill: { name: form.name, email: form.email, contact: fullPhone },
        theme: { color: '#F97316' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API}/payment/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                package: 'complete', ...commonFields,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyData.success) throw new Error(verifyData.message)
            await handleVerifySuccess(verifyData, API)
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

  /* ── Success screen ── */
  if (success) {
    return (
      <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #0A1628 0%, #0e1d35 100%)' }}>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-10 text-center"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-9 h-9 text-green-500" strokeWidth={2} />
            </div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-bold px-4 py-1.5 rounded-full border border-green-200 mb-4">
              Payment Confirmed
            </div>
            <h1 className="text-2xl font-black text-[#0A1628] mb-3">
              You're all set, {form.name.split(' ')[0]}!
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed mb-8">
              Your <span className="font-bold text-orange-500">{visaCountry} Visa Assistance</span> package is now active.
              Check <span className="font-semibold text-slate-700">{paidEmail}</span> for your portal login credentials.
            </p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { icon: '📋', label: 'Expert assigned', sub: 'Within 2 hours' },
                { icon: '📧', label: 'Credentials sent', sub: 'Check your inbox' },
                { icon: '📅', label: 'Welcome call', sub: 'Book via Calendly' },
                { icon: '🔐', label: 'Secure portal', sub: 'Your dashboard awaits' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-2xl p-4 text-left border border-slate-100">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <div className="text-xs font-bold text-slate-800">{item.label}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigateTo('client-portal')}
              className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
              style={{ boxShadow: '0 8px 24px rgba(249,115,22,0.35)' }}
            >
              Access Your Portal →
            </button>
          </div>
        </div>
      </div>
    )
  }

  const canPay = form.name.trim() && form.email.trim() && form.phone.trim()
    && dataProtectionAgreed && termsRefundAgreed
    && previouslyRejected !== null
    && (previouslyRejected === false || rejectionTier !== null)
    && (!isSchengen || schengenPref[0])

  /* ── Plan, cashback and the single agreement shown in the payment card ── */
  const cbPer = !cashbackConfig?.enabled ? 0 : isReapplication
    ? Number(cashbackConfig.rejectedPerPerson ?? 5000)
    : Number((cashbackConfig.India || cashbackConfig.Other || { amount: 0 }).amount || 0)
  const cbTotal = isReapplication ? cbPer * totalApplicants : cbPer
  const isGuarantee = isReapplication && rejectionTier === 'guarantee'
  const cardTitle = isGuarantee ? 'Guarantee Re-application' : isReapplication ? 'Specialist Re-application' : 'Complete Package'
  const cardSub = isGuarantee ? 'Expert support with service-fee protection' : isReapplication ? 'Expert support for your next application' : 'Expert support for your visa application.'
  const cardHeader = isGuarantee ? 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)' : 'linear-gradient(135deg, #F97316 0%, #EA6D0D 100%)'
  const { base: payBase, gst: payGst } = gstBreakdown(finalAmount)

  /* ── Main checkout ── */
  return (
    <div className="min-h-screen bg-[#FBF7F1]">
      <style>{`
        /* Kill the browser autofill grey/yellow box — keep our white field + dark text */
        .co-input:-webkit-autofill,
        .co-input:-webkit-autofill:hover,
        .co-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #1e293b;
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset;
          box-shadow: 0 0 0 1000px #ffffff inset;
          caret-color: #1e293b;
          transition: background-color 9999s ease-in-out 0s;
        }
        /* Ensure selects always show white background */
        select option { background: #ffffff; color: #1e293b; }
      `}</style>
      <Navbar />

      <form onSubmit={handlePay} className="mx-auto max-w-[1320px] px-4 sm:px-6 pt-5 pb-10">
        <button type="button" onClick={() => window.history.back()}
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition-colors hover:text-orange-600">
          <ArrowLeft className="h-4 w-4" /> Back to visa details
        </button>

        {/* ── Top: big picture with the "Complete Your Payment" panel on its right side (Canva design), form on the right ── */}
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="order-2 lg:order-1">
            <div className="relative xl:min-h-[600px]">
              {/* picture at a fixed size, anchored left, so the man and both cashback cards are always fully visible;
                  the panel sits in the cream space to his right (wide screens only) */}
              <img src={checkoutBg} alt="Happy client holding a visa-approved checklist and a ₹5,000 cashback card"
                width={1899} height={1071}
                className="pointer-events-none absolute left-0 top-1/2 hidden h-[600px] w-auto max-w-none -translate-y-1/2 rounded-[28px] [mask-image:linear-gradient(to_right,black_70%,transparent)] xl:block" />
              <div className="relative flex flex-col gap-3 xl:ml-auto xl:w-[calc(100%-385px)] xl:max-w-[480px] xl:py-4">
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0A1628] to-[#13284d] p-1.5 shadow-[0_24px_60px_-20px_rgba(10,22,40,0.6)]">
                <div className="px-5 pb-3.5 pt-4">
                  <h1 className="text-[26px] font-black leading-tight text-white sm:text-[28px]">Complete <span className="text-orange-400">Your Payment</span></h1>
                  <p className="mt-0.5 text-[13.5px] text-white/70">Secure your visa application with expert support.</p>
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/85">
                    <Plane className="h-3.5 w-3.5 text-orange-400" /> {visaCountry} Visa Assistance · Applying from {fromCountry}
                  </p>
                </div>
                <div className="rounded-[20px] bg-white p-4">
                  <div className="mb-2 flex items-center gap-3 border-b border-slate-100 px-1 pb-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100"><CheckCircle2 className="h-5 w-5 text-green-600" /></span>
                    <div>
                      <p className="text-[15px] font-black text-[#0A1628]">What's Included</p>
                      <p className="text-[12px] text-slate-400">Everything in your {cardTitle}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-x-3 sm:grid-cols-2 sm:divide-x sm:divide-slate-100">
                    {[INCLUDES.slice(0, 5), INCLUDES.slice(5)].map((col, ci) => (
                      <div key={ci} className={ci ? 'sm:pl-3' : ''}>
                        {col.map((item, i) => (
                          <div key={i} className="flex items-center gap-2.5 py-2">
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border" style={{ background: item.bg, borderColor: `${item.color}33` }}>
                              <item.Icon className="h-4 w-4" style={{ color: item.color }} strokeWidth={2} />
                            </div>
                            <span className="flex-1 text-[12.5px] font-semibold leading-snug text-slate-700">{item.label}</span>
                            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-green-500" />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Important — collapsible, at the bottom of the panel */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                  style={{ boxShadow: '0 8px 24px -12px rgba(10,22,40,0.35)' }}>
                  <button
                    onClick={() => setShowImportant(v => !v)}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center flex-shrink-0">
                      <Info className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-[#0A1628] text-sm">Important Information</p>
                      <p className="text-xs text-slate-400 mt-0.5">Visa decisions rest with the embassy. Embassy fees, insurance, flights and hotels are not included.</p>
                    </div>
                    {showImportant
                      ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                  </button>
                  {showImportant && (
                    <div className="px-5 pb-3 pt-1 border-t border-slate-100">
                      {IMPORTANT.map((item, i) => (
                        <div key={i} className="flex gap-3 items-start py-2.5 border-b border-slate-50 last:border-b-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                          <p className="text-sm text-slate-500 leading-relaxed">{item}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Before you pay — the two policies you agree to below (fills the space under the picture) */}
            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_12px_40px_-18px_rgba(10,22,40,0.25)]">
              <p className="mb-4 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Before you pay</p>
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-100"><Shield className="h-3.5 w-3.5 text-blue-600" /></div>
                      <p className="text-[13px] font-black text-[#0A1628]">Data Protection &amp; Processing</p>
                    </div>
                    <p className="text-[12px] leading-relaxed text-slate-500">{DATA_PROTECTION_TEXT}</p>
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg border border-purple-200 bg-purple-100"><FileText className="h-3.5 w-3.5 text-purple-600" /></div>
                      <p className="text-[13px] font-black text-[#0A1628]">Terms &amp; Refund Policy</p>
                    </div>
                    <p className="text-[12px] leading-relaxed text-slate-500">{TERMS_REFUND_TEXT}</p>
                  </div>
                </div>
            </div>
          </div>

          {/* ── RIGHT — payment card ── */}
          <div className="order-1 lg:order-2 lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_-18px_rgba(10,22,40,0.35)]">
              <div className="flex items-center gap-3 px-5 py-4" style={{ background: cardHeader }}>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/15">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-[16px] font-black leading-tight text-white">{cardTitle}</p>
                  <p className="mt-0.5 text-[12px] text-white/85">{cardSub}</p>
                </div>
              </div>

            <div className="px-5 py-4 flex flex-col gap-2.5">

              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              )}

              {/* Fields */}
              {[
                { label: 'Full Name', key: 'name', type: 'text', ph: 'Your full legal name', ac: 'name' },
                { label: 'Email Address', key: 'email', type: 'email', ph: 'you@example.com', ac: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    {f.label} <span className="text-orange-500">*</span>
                  </label>
                  <input
                    type={f.type}
                    placeholder={f.ph}
                    autoComplete={f.ac}
                    value={(form as any)[f.key]}
                    required
                    onChange={e => set(f.key, e.target.value)}
                    className="co-input w-full bg-white border-[1.5px] border-slate-300 rounded-lg px-3.5 py-2.5 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all"
                    style={{ fontSize: 16 }}
                  />
                </div>
              ))}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Phone Number <span className="text-orange-500">*</span>
                </label>
                <div className="flex items-center bg-white border-[1.5px] border-slate-300 rounded-lg focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-100 transition-all">
                  <CountryCodeSelect value={phoneCode} onChange={c => { setPhoneCode(c); set('phone', cleanPhone(c, form.phone)) }} className="pl-3.5 pr-2.5 py-2.5 text-slate-700 border-r border-slate-200" />
                  <input
                    type="tel"
                    placeholder="98765 43210"
                    autoComplete="tel-national"
                    inputMode="numeric"
                    maxLength={phoneMaxDigits(phoneCode)}
                    value={form.phone}
                    required
                    onChange={e => set('phone', cleanPhone(phoneCode, e.target.value))}
                    className="co-input flex-1 min-w-0 bg-transparent px-3 py-2.5 text-slate-800 font-semibold placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
                    style={{ fontSize: 16 }}
                  />
                </div>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Destination <span className="text-orange-500">*</span></label>
                <div className="flex items-center gap-2 rounded-lg border-[1.5px] border-slate-200 bg-slate-50 px-3.5 py-2.5">
                  <Globe className="h-4 w-4 text-orange-500" />
                  <span className="text-[14px] font-bold text-slate-800">
                    {isSchengen && schengenPref.some(Boolean) ? `Schengen (${schengenPref.filter(v => v).join(', ')})` : visaCountry}
                  </span>
                </div>
              </div>

              {/* ── Schengen Country Preference ── */}
              {isSchengen && (
                <div className="rounded-2xl overflow-hidden border border-blue-100"
                  style={{ background: 'linear-gradient(135deg,#EFF6FF 0%,#F0F9FF 100%)' }}>
                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                      <Globe className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-blue-900 leading-snug">Select Your Schengen Country Preference</p>
                      <p className="text-[11px] text-blue-600 mt-0.5 leading-relaxed">
                        Choose your top 3 preferred countries. We'll prioritise your selections, while also considering other Schengen countries to help secure the earliest available appointment.
                      </p>
                    </div>
                  </div>

                  {/* 3 country slots */}
                  <div className="px-4 pb-4 flex flex-col gap-2.5">
                    {([0,1,2] as const).map(idx => {
                      const selectedNames = schengenPref.filter((v,i) => v && i !== idx)
                      const available = SCHENGEN_COUNTRIES.filter(c => !selectedNames.includes(c.name))
                      const selCountry = SCHENGEN_COUNTRIES.find(c => c.name === schengenPref[idx])
                      const filtered = schengenSearch[idx]
                        ? available.filter(c => c.name.toLowerCase().includes(schengenSearch[idx].toLowerCase()))
                        : available

                      return (
                        <div key={idx}>
                          <label className="flex items-center gap-1.5 text-[10px] font-black text-blue-700 uppercase tracking-wider mb-1.5">
                            Country {idx + 1}
                            {idx === 0
                              ? <span className="text-orange-500 font-black">*</span>
                              : <span className="text-blue-400 normal-case font-semibold tracking-normal">(optional)</span>}
                          </label>

                          {/* Trigger button */}
                          <button
                            type="button"
                            onClick={() => toggleSchengenOpen(idx)}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border-[1.5px] transition-all text-left"
                            style={{
                              borderColor: schengenOpen[idx] ? '#3B82F6' : selCountry ? '#93C5FD' : '#BFDBFE',
                              boxShadow: schengenOpen[idx] ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none',
                            }}
                          >
                            {selCountry ? (
                              <>
                                <img
                                  src={`https://flagcdn.com/24x18/${selCountry.code}.png`}
                                  width={24} height={18}
                                  alt={selCountry.name}
                                  className="rounded-sm flex-shrink-0"
                                  style={{ objectFit: 'cover' }}
                                />
                                <span className="flex-1 text-[13.5px] font-bold text-slate-800">{selCountry.name}</span>
                                <span
                                  onClick={e => { e.stopPropagation(); clearSchengenSlot(idx) }}
                                  className="w-5 h-5 rounded-full bg-slate-200 hover:bg-red-100 flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors text-slate-500 hover:text-red-500 text-xs font-black"
                                >✕</span>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-[18px] rounded-sm bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <Globe className="w-3 h-3 text-blue-400" />
                                </div>
                                <span className="flex-1 text-[13px] text-slate-400 font-medium">
                                  {idx === 0 ? 'Select a country' : 'No preference'}
                                </span>
                                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${schengenOpen[idx] ? 'rotate-180' : ''}`} />
                              </>
                            )}
                          </button>

                          {/* Inline expanding panel — NOT absolute, so overflow:hidden on parent won't clip it */}
                          {schengenOpen[idx] && (
                            <div
                              className="mt-1.5 rounded-xl bg-white border border-blue-200"
                              style={{ boxShadow: '0 8px 24px rgba(59,130,246,0.14)' }}
                            >
                              {/* Search */}
                              <div className="p-2 border-b border-slate-100">
                                <div className="relative">
                                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    autoFocus
                                    value={schengenSearch[idx]}
                                    onChange={e => setSchengenSearch(p => { const n: [string,string,string] = [...p] as [string,string,string]; n[idx] = e.target.value; return n })}
                                    placeholder="Search country…"
                                    className="w-full pl-7 pr-3 py-1.5 text-[13px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 transition-all"
                                  />
                                </div>
                              </div>
                              {/* Country list */}
                              <div className="overflow-y-auto" style={{ maxHeight: 220 }}>
                                {idx > 0 && !schengenSearch[idx] && (
                                  <button
                                    type="button"
                                    onClick={() => setSchengenSlot(idx, '')}
                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-slate-50 text-left border-b border-slate-100"
                                  >
                                    <div className="w-6 h-[18px] rounded-sm bg-slate-100 flex items-center justify-center">
                                      <Globe className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <span className="text-[13px] text-slate-400 font-medium italic">No preference</span>
                                  </button>
                                )}
                                {filtered.map(c => (
                                  <button
                                    key={c.name}
                                    type="button"
                                    onClick={() => setSchengenSlot(idx, c.name)}
                                    className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-blue-50 text-left transition-colors"
                                    style={{ background: schengenPref[idx] === c.name ? '#EFF6FF' : undefined }}
                                  >
                                    <img
                                      src={`https://flagcdn.com/24x18/${c.code}.png`}
                                      width={24} height={18} alt={c.name}
                                      className="rounded-sm flex-shrink-0"
                                      style={{ objectFit: 'cover' }}
                                    />
                                    <span className="text-[13px] font-semibold text-slate-700">{c.name}</span>
                                    {schengenPref[idx] === c.name && (
                                      <CheckCircle2 className="w-4 h-4 text-blue-500 ml-auto flex-shrink-0" />
                                    )}
                                  </button>
                                ))}
                                {filtered.length === 0 && (
                                  <div className="py-6 text-center text-[12px] text-slate-400">No countries found</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Selected summary pills */}
                  {schengenPref.some(Boolean) && (
                    <div className="px-4 pb-4 flex flex-wrap gap-2">
                      {schengenPref.map((name, i) => {
                        if (!name) return null
                        const c = SCHENGEN_COUNTRIES.find(x => x.name === name)
                        return (
                          <div key={i} className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full bg-blue-500 text-white text-[11.5px] font-bold">
                            {c && <img src={`https://flagcdn.com/16x12/${c.code}.png`} width={16} height={12} alt={name} className="rounded-sm" />}
                            {name}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Number of Travellers ── */}
              <div className="rounded-xl border-[1.5px] border-slate-200 overflow-hidden">
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center flex-shrink-0">
                      <Users className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black text-slate-800">No. of Travellers</p>
                        {cashbackConfig?.enabled && (
                          <button
                            type="button"
                            onClick={() => setShowCashbackModal(true)}
                            className="w-5 h-5 rounded-full bg-green-100 border border-green-300 flex items-center justify-center hover:bg-green-200 transition-colors flex-shrink-0"
                            title="View cashback offer"
                          >
                            <Gift className="w-3 h-3 text-green-600" />
                          </button>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">Including all accompanying travellers</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="button" onClick={() => setFamilyMembers(p => p.length > 0 ? p.slice(0, -1) : p)}
                      className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                      <span className="text-sm font-black">−</span>
                    </button>
                    <span className="text-sm font-black text-slate-900 w-4 text-center">{totalApplicants}</span>
                    <button type="button" onClick={() => setFamilyMembers(p => [...p, emptyMember()])}
                      className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center text-slate-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
                      <span className="text-sm font-black">+</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Previous-rejection question (sets price tier) ── */}
              {!specialistAvailable ? null : rejectedTierIn ? (
                <div className="rounded-xl border-[1.5px] border-orange-400 bg-orange-50 p-3.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-black text-slate-800">{cardTitle}</span>
                    <span className="ml-auto text-sm font-black text-orange-500">{localPrice(REAPPLICATION_PRICE)}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    {isGuarantee ? 'Includes a 100% service-fee refund if the re-application is refused for a covered reason' : 'Refusal letter review, profile assessment and a stronger re-application'}
                    {totalApplicants > 1 && ` × ${totalApplicants} applicants`}
                  </p>
                </div>
              ) : null}

              {/* Price breakdown */}
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[12.5px] text-slate-600">
                <div className="flex justify-between"><span>Base amount</span><span className="font-semibold">{formatInr(payBase)}</span></div>
                <div className="flex justify-between"><span>GST (18%)</span><span className="font-semibold">{formatInr(payGst)}</span></div>
                {couponApplied && <div className="flex justify-between text-emerald-700"><span>Coupon "{coupon.trim()}"</span><span className="font-semibold line-through text-slate-400">{formatInr(basePrice * totalApplicants)}</span></div>}
                <div className="mt-1.5 flex items-baseline justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-[15px] font-black text-slate-900">Pay today</span>
                  <span className="text-[20px] font-black text-slate-900">{localPrice(finalAmount)}</span>
                </div>
                {totalApplicants > 1 && !couponApplied && <p className="text-right text-[11px] text-slate-400">{localPrice(basePrice)} × {totalApplicants}</p>}
              </div>
              {/* ── Coupon ── */}
              <div>
                {!couponApplied ? (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Gift className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={coupon}
                          onChange={e => { setCoupon(e.target.value); setCouponError('') }}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                          placeholder="Have a coupon code?"
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyCoupon}
                        disabled={!coupon.trim() || couponChecking}
                        className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg hover:bg-orange-50 hover:text-orange-600 border border-slate-200 hover:border-orange-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {couponChecking ? 'Checking…' : 'Apply'}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-600 font-semibold flex items-center gap-1.5 mt-1.5">
                        <AlertCircle className="h-3.5 w-3.5" /> {couponError}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3.5 py-2.5">
                    <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Coupon "{coupon.trim()}" applied
                      {couponAmount != null && ` — now ${localPrice(couponAmount)}`}
                    </p>
                    <button type="button" onClick={removeCoupon} className="text-slate-400 hover:text-slate-600">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {cbTotal > 0 && (
                <>
                  <button type="button" onClick={() => setShowCashbackModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-left text-[12.5px] font-bold text-green-900 hover:bg-green-100">
                    <Gift className="h-4 w-4 flex-shrink-0 text-green-600" />
                    {localPrice(cbTotal)} cashback after approval + video testimonial
                    <span className="ml-auto text-[11px] font-semibold text-green-700">Details</span>
                  </button>
                  <div className="flex items-center justify-between rounded-lg border border-green-100 px-3 py-2 text-[13px]">
                    <span className="font-semibold text-slate-600">Effective cost after cashback</span>
                    <span className="font-black text-green-700">{localPrice(Math.max(0, finalAmount - cbTotal))}</span>
                  </div>
                </>
              )}

            </div>
            </div>
          </div>
        </div>

        {/* ── Confirm & pay — both tick-boxes beside the Pay button ── */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_12px_40px_-18px_rgba(10,22,40,0.35)]">
          <div className="flex flex-col gap-4 px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="lg:max-w-[60%]">
              {/* Two separately-recorded consents, together right beside Pay */}
              <div className="mt-1 flex flex-col gap-2.5">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${dataProtectionAgreed ? 'border-orange-500 bg-orange-500' : 'border-slate-300 bg-white'}`}>
                    {dataProtectionAgreed && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={dataProtectionAgreed} onChange={() => setDataProtectionAgreed(v => !v)} />
                  <span className="text-[12.5px] leading-snug text-slate-600">I have read and understood the <strong className="text-[#0A1628]">Data Protection &amp; Processing</strong> information (<a href="/privacy" target="_blank" rel="noreferrer" className="text-blue-700 underline">Privacy Policy</a>).</span>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <div className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${termsRefundAgreed ? 'border-orange-500 bg-orange-500' : 'border-slate-300 bg-white'}`}>
                    {termsRefundAgreed && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                    )}
                  </div>
                  <input type="checkbox" className="sr-only" checked={termsRefundAgreed} onChange={() => setTermsRefundAgreed(v => !v)} />
                  <span className="text-[12.5px] leading-snug text-slate-600">I have read and agree to the <a href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">Terms &amp; Conditions</a> and <a href="/refund-policy" target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">Refund Policy</a>.</span>
                </label>
              </div>
          </div>
          <div className="flex w-full flex-col items-center gap-2 lg:w-[420px] lg:flex-shrink-0">
              <button
                type="submit"
                disabled={loading || !canPay}
                className={`w-full py-3.5 font-black text-[15px] rounded-xl transition-all flex items-center justify-center gap-2 ${
                  canPay && !loading
                    ? 'bg-green-700 hover:bg-green-800 text-white hover:-translate-y-0.5 active:translate-y-0'
                    : 'bg-slate-200 text-slate-500 cursor-not-allowed border-[1.5px] border-slate-300'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2.5">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing payment…
                  </span>
                ) : previouslyRejected === null ? (
                  'Proceed to Payment'
                ) : !dataProtectionAgreed ? (
                  'Accept data-protection terms to pay'
                ) : !termsRefundAgreed ? (
                  'Accept Terms & Refund Policy to pay'
                ) : (
                  <>Proceed to Payment · {localPrice(finalAmount)} <ArrowRight className="h-4 w-4" /></>
                )}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-slate-400">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Secure checkout via {isIndia ? 'Razorpay' : 'Stripe'}. Your information is safe with us.
              </p>
          </div>
          </div>
        </div>
      </form>

      <Footer />

      {/* ── Cashback Modal ── */}
      {showCashbackModal && cashbackConfig && (() => {
        const cbEntry = isReapplication
          ? { amount: Number(cashbackConfig.rejectedPerPerson ?? 5000), symbol: '₹' }
          : (cashbackConfig.India || cashbackConfig.Other || { amount: 0, symbol: '₹' })
        const cbDisplay = `₹${Number(cbEntry.amount).toLocaleString('en-IN')}${isReapplication ? ' per person' : ''}`
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
            <div className="bg-white rounded-2xl max-w-md w-full" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.3)' }}>
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Get {cbDisplay} Cashback!</h2>
                    <p className="text-xs text-green-600 font-semibold mt-0.5">After your visa decision</p>
                  </div>
                </div>
                <button type="button" onClick={() => setShowCashbackModal(false)} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps */}
              <div className="px-6 py-5 flex flex-col gap-3">
                <p className="text-[13px] text-slate-600 leading-relaxed mb-1">
                  To receive your <span className="font-black text-green-600">{cbDisplay} cashback</span>, simply complete the following after your visa decision:
                </p>
                {(cashbackConfig.steps || [
                  'Share a Video Testimonial – Tell us about your experience!',
                  "Send a Photo with Your Visa Copy – Email us, and we'll feature it on our website & social media.",
                  'Post on your Social Media & WhatsApp Status – Spread the word about your journey!',
                  'Leave a Review – Share your feedback on our website & social media.',
                ]).map((text: string, i: number) => (
                  <div key={i} className="flex items-start gap-3 bg-green-50 rounded-xl px-4 py-3 border border-green-100">
                    <span className="text-lg flex-shrink-0">{['🎥','📸','📢','⭐'][i] || '✅'}</span>
                    <p className="text-[12.5px] text-slate-700 font-medium leading-relaxed">{text}</p>
                  </div>
                ))}
                {isReapplication && (
                  <p className="text-[11.5px] leading-relaxed text-slate-500">
                    <b className="text-slate-700">Terms &amp; conditions:</b> paid only if your new visa is approved. No cashback applies if the visa is not approved.
                    Paid per person on the application, once all the steps above are completed.
                  </p>
                )}
                <div className="mt-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 px-4 py-3 text-center">
                  <p className="text-white font-black text-sm">
                    💰 {cashbackConfig.footerText || "Once you complete these steps, we'll credit your reward!"} {cbDisplay} 🚀✨
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6">
                <button type="button" onClick={() => setShowCashbackModal(false)}
                  className="w-full py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-black text-sm transition-all"
                  style={{ boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                  Got it! 🎉
                </button>
              </div>
            </div>
          </div>
        )
      })()}

    </div>
  )
}

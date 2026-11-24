import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'motion/react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { toast } from 'sonner'
import { PRICES, formatInr } from '../lib/pricing'
import { PromoCodeBox } from '../components/site/PromoCodeBox'
import { CountryCodeSelect, DEFAULT_DIAL_CODE, withDialCode } from '../components/site/CountryCodeSelect'
import { nameError, isValidEmail, phoneError, cleanPhone } from '../lib/validate'
import {
  User, Mail, Phone, MessageSquare, Globe, Send,
  Shield, Clock, ChevronDown,
  Headphones, Zap, Award, ArrowRight, Check, Sparkles,
} from 'lucide-react'

declare global { interface Window { Razorpay: any } }

const COUNTRIES = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'Schengen (Europe)',
  'UAE / Dubai', 'Singapore', 'Japan', 'New Zealand', 'Thailand',
  'Malaysia', 'Indonesia (Bali)', 'France', 'Germany', 'Italy',
  'Spain', 'Portugal', 'Netherlands', 'Switzerland', 'Turkey',
  'South Africa', 'Egypt', 'Kenya', 'Brazil', 'Mexico',
]

const NATIONALITIES = [
  'Indian', 'Pakistani', 'Bangladeshi', 'Sri Lankan', 'Nepali',
  'Afghan', 'Other',
]

const HIGHLIGHTS = [
  { icon: Headphones, label: '1-on-1 Sessions',   color: '#22C55E' },
  { icon: Clock,      label: '30-Min Sessions',   color: '#3B82F6' },
  { icon: Award,      label: 'Fee Credited Back', color: '#8B5CF6' },
]

const TRUST = [
  { icon: Shield,     label: 'Data Privacy',      sub: 'Never shared with 3rd parties' },
  { icon: Zap,        label: 'Quick Response',    sub: 'We reply promptly' },
  { icon: Headphones, label: 'Expert Assigned',   sub: 'Dedicated visa specialist' },
  { icon: Award,      label: 'Experienced Team',  sub: 'Dedicated visa specialists' },
]

type Field = {
  firstName: string; lastName: string; email: string
  mobile: string; whatsapp: string; nationality: string
  country: string; message: string; promoCode: string
}

const EMPTY: Field = {
  firstName: '', lastName: '', email: '', mobile: '', whatsapp: '',
  nationality: '', country: '', message: '', promoCode: '',
}

/* ── Custom Select ─────────────────────────────────────────────────── */
function Select({
  id, label, icon: Icon, value, onChange, options, placeholder,
}: {
  id: string; label: string; icon: React.ElementType; value: string
  onChange: (v: string) => void; options: string[]; placeholder: string
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
      <button
        type="button"
        id={id}
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-sm transition-all duration-200 bg-white text-left
          ${value ? 'text-slate-800 border-orange-300 ring-1 ring-orange-200' : 'text-slate-400 border-slate-200'}
          hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400`}
      >
        <Icon size={16} className={value ? 'text-orange-500' : 'text-slate-400'} />
        <span className="flex-1 truncate">{value || placeholder}</span>
        <ChevronDown size={15} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute z-50 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-auto max-h-52 text-sm"
          >
            {options.map(opt => (
              <li key={opt}>
                <button
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false) }}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-2 hover:bg-orange-50 transition-colors
                    ${value === opt ? 'text-orange-600 font-semibold bg-orange-50/60' : 'text-slate-700'}`}
                >
                  {value === opt && <Check size={13} className="text-orange-500 shrink-0" />}
                  <span className={value === opt ? 'ml-0' : 'ml-5'}>{opt}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Input ──────────────────────────────────────────────────────────── */
function Input({
  id, label, icon: Icon, type = 'text', value, onChange,
  placeholder, prefix, required,
}: {
  id: string; label: string; icon: React.ElementType; type?: string
  value: string; onChange: (v: string) => void; placeholder: string
  prefix?: React.ReactNode; required?: boolean
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">
        {label}{required && <span className="text-orange-500 ml-1">*</span>}
      </label>
      <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border bg-white transition-all duration-200
        ${focused || value ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200'}
        hover:border-orange-300`}>
        <Icon size={16} className={focused || value ? 'text-orange-500' : 'text-slate-400'} />
        {prefix && (
          <span className="text-slate-500 text-sm font-semibold shrink-0 border-r border-slate-200 pr-3">{prefix}</span>
        )}
        <input
          id={id}
          type={type}
          inputMode={type === 'tel' ? 'numeric' : undefined}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none min-w-0"
        />
      </div>
    </div>
  )
}

/* ── Textarea ───────────────────────────────────────────────────────── */
function Textarea({
  id, label, icon: Icon, value, onChange, placeholder,
}: {
  id: string; label: string; icon: React.ElementType
  value: string; onChange: (v: string) => void; placeholder: string
}) {
  const [focused, setFocused] = useState(false)
  return (
    <div>
      <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">{label}</label>
      <div className={`flex gap-3 px-4 py-3.5 rounded-2xl border bg-white transition-all duration-200
        ${focused || value ? 'border-orange-300 ring-1 ring-orange-200' : 'border-slate-200'}
        hover:border-orange-300`}>
        <Icon size={16} className={`mt-0.5 shrink-0 ${focused || value ? 'text-orange-500' : 'text-slate-400'}`} />
        <textarea
          id={id}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          rows={4}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none"
        />
      </div>
    </div>
  )
}

/* ── Main Page ──────────────────────────────────────────────────────── */
export default function ConsultationPage() {
  const [form, setForm] = useState<Field>(EMPTY)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [waSameAsMobile, setWaSameAsMobile] = useState(false)
  const [mobileCode, setMobileCode] = useState(DEFAULT_DIAL_CODE)
  const [waCode, setWaCode] = useState(DEFAULT_DIAL_CODE)

  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }) }, [])
  const formRef = useRef<HTMLDivElement>(null)
  const heroInView = useInView(heroRef, { once: true })
  const formInView = useInView(formRef, { once: true, margin: '-5%' })

  const set = (key: keyof Field) => (raw: string) => {
    // Phone fields keep digits only and stop at the right length for the chosen country code
    const val = key === 'mobile' ? cleanPhone(mobileCode, raw) : key === 'whatsapp' ? cleanPhone(waCode, raw) : raw
    setForm(f => {
      const updated = { ...f, [key]: val }
      if (key === 'mobile' && waSameAsMobile) updated.whatsapp = val
      return updated
    })
  }

  const toggleWaSame = () => {
    setWaSameAsMobile(v => {
      if (!v) setForm(f => ({ ...f, whatsapp: f.mobile }))
      return !v
    })
  }

  const [payError, setPayError] = useState('')
  const [promo, setPromo] = useState<{ code: string; amountPaise: number } | null>(null)
  const price = PRICES.consultation
  const payPrice = promo ? promo.amountPaise / 100 : price

  // Pay the consultation fee (incl. GST) with Razorpay; the booking is then saved and our team alerted
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.email || !form.mobile || !form.country) {
      toast.error('Please fill in all required fields.')
      return
    }
    const problem = nameError(form.firstName, 'first name') || nameError(form.lastName, 'last name', false)
      || (isValidEmail(form.email) ? '' : 'Please enter a valid email address.')
      || phoneError(mobileCode, form.mobile)
      || (!waSameAsMobile && form.whatsapp.trim() ? phoneError(waCode, form.whatsapp, 'WhatsApp number') : '')
    if (problem) { toast.error(problem); return }
    setPayError(''); setLoading(true)
    const API = import.meta.env.VITE_API_URL || '/api'
    try {
      const orderRes = await fetch(`${API}/consultation/create-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promoCode: promo?.code || '' }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.message || 'Could not start the payment.')

      if (!window.Razorpay) {
        await new Promise<void>((res, rej) => {
          const sc = document.createElement('script')
          sc.src = 'https://checkout.razorpay.com/v1/checkout.js'
          sc.onload = () => res(); sc.onerror = () => rej(new Error('Could not load the payment window. Please check your connection.'))
          document.head.appendChild(sc)
        })
      }
      const mobile = withDialCode(mobileCode, form.mobile)
      const whatsapp = withDialCode(waSameAsMobile ? mobileCode : waCode, waSameAsMobile ? form.mobile : form.whatsapp)
      const rzp = new window.Razorpay({
        key: orderData.data.keyId, amount: orderData.data.amount, currency: orderData.data.currency, order_id: orderData.data.orderId,
        name: 'Tourist Visa Experts', description: '1-on-1 Visa Consultation', image: '/logo.png',
        prefill: { name: `${form.firstName} ${form.lastName}`.trim(), email: form.email, contact: mobile },
        theme: { color: '#F97316' },
        handler: async (response: any) => {
          try {
            const vRes = await fetch(`${API}/consultation/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...response, ...form, mobile, whatsapp }),
            })
            const vData = await vRes.json()
            if (!vData.success) throw new Error(vData.message)
            setSubmitted(true)
            toast.success('Consultation booked! Check your email for the next steps.')
          } catch (err: any) {
            setPayError(err.message || 'Payment received but we could not save your booking. Please contact us with your payment ID.')
          } finally { setLoading(false) }
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    } catch (err: any) {
      setPayError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />

      {/* ── Hero Banner ─────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0f2040] to-[#1a3560] pt-28 pb-20 px-4"
      >
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>

        <div className="relative z-10 container mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-orange-500/15 border border-orange-500/30 text-orange-400 text-[11px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
          >
            <Sparkles size={12} />
            1-on-1 Consultation — {formatInr(price)}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="text-4xl sm:text-5xl font-black text-white leading-tight tracking-tight"
          >
            <span className="block">Get Your Visa Done</span>
            {/* padding gives the gradient room for the "g"/"y" descenders and letter edges; negative margins keep the layout */}
            <span className="mx-auto -mb-3 block w-fit bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text px-3 pb-3 leading-[1.15] text-transparent [-webkit-box-decoration-break:clone]">
              The Right Way
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 text-base text-white/60 max-w-xl mx-auto leading-relaxed"
          >
            Tell us your travel plans and a dedicated visa expert will reach out
            with a personalised plan — no generic advice.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={heroInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-10 grid grid-cols-3 gap-3 max-w-xl mx-auto"
          >
            {HIGHLIGHTS.map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={heroInView ? { opacity: 1, scale: 1 } : {}}
                transition={{ duration: 0.45, delay: 0.4 + i * 0.08, type: 'spring', stiffness: 260, damping: 20 }}
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-3 py-4"
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22` }}>
                  <Icon size={17} style={{ color }} />
                </div>
                <p className="text-sm font-bold text-white leading-tight text-center">{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-8 items-start">

          {/* ── Form Card ─────────────────────────────────────────── */}
          <motion.div
            ref={formRef}
            initial={{ opacity: 0, y: 32 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 overflow-hidden"
          >
            {/* Card header */}
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-7 py-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-100">Consultation Service</p>
              <h2 className="text-xl font-black text-white mt-0.5">Book Your Consultation</h2>
              <p className="text-sm text-orange-100/80 mt-1"><span className="font-black text-white">{formatInr(price)}</span> · incl. 18% GST</p>
            </div>

            {/* Form or success */}
            <div className="px-7 py-8">
              <AnimatePresence mode="wait">
                {submitted ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center py-12 text-center"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-5">
                      <Check size={36} className="text-green-500" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">Consultation Booked!</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-sm">
                      Payment received. A visa expert will contact you to confirm a time for your session.
                      Check your email for the confirmation.
                    </p>
                    <button
                      onClick={() => { setForm(EMPTY); setSubmitted(false) }}
                      className="mt-7 px-6 py-2.5 rounded-full bg-orange-500 text-white text-sm font-bold hover:bg-orange-600 transition-colors"
                    >
                      Book Another
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-5"
                  >
                    {/* Name row */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Input id="firstName" label="First Name" icon={User} value={form.firstName} onChange={set('firstName')} placeholder="Rahul" required />
                      <Input id="lastName"  label="Last Name"  icon={User} value={form.lastName}  onChange={set('lastName')}  placeholder="Sharma" />
                    </div>

                    {/* Email */}
                    <Input id="email" label="Email ID" icon={Mail} type="email" value={form.email} onChange={set('email')} placeholder="rahul@email.com" required />

                    {/* Phone row */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Input id="mobile" type="tel"   label="Mobile Number"   icon={Phone} value={form.mobile}   onChange={set('mobile')}   placeholder="98765 43210" prefix={<CountryCodeSelect value={mobileCode} onChange={setMobileCode} />} required />
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="whatsapp" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">WhatsApp Number</label>
                          <label className="flex items-center gap-1.5 cursor-pointer select-none">
                            <div
                              onClick={toggleWaSame}
                              className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${waSameAsMobile ? 'bg-orange-500 border-orange-500' : 'border-slate-300 bg-white'}`}
                            >
                              {waSameAsMobile && (
                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-500">Same as mobile</span>
                          </label>
                        </div>
                        <Input id="whatsapp" type="tel" label="" icon={Phone} value={waSameAsMobile ? form.mobile : form.whatsapp} onChange={waSameAsMobile ? () => {} : set('whatsapp')} placeholder="98765 43210" prefix={<CountryCodeSelect value={waSameAsMobile ? mobileCode : waCode} onChange={setWaCode} />} />
                      </div>
                    </div>

                    {/* Dropdowns */}
                    <div className="grid sm:grid-cols-2 gap-5">
                      <Select id="nationality" label="Nationality"          icon={Globe} value={form.nationality} onChange={set('nationality')} options={NATIONALITIES} placeholder="Select Nationality" />
                      <Select id="country"     label="Country You Apply For" icon={Globe} value={form.country}     onChange={set('country')}     options={COUNTRIES}     placeholder="Select Country" />
                    </div>

                    {/* Message */}
                    <Textarea id="message" label="How can we help you?" icon={MessageSquare} value={form.message} onChange={set('message')} placeholder="Tell us about your travel plans, destination, travel dates, or any specific concerns…" />

                    {/* Promo */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-1.5">Promotion Code (Optional)</label>
                      <PromoCodeBox endpoint={`${import.meta.env.VITE_API_URL || '/api'}/consultation/validate-coupon`} body={{}} codeField="promoCode"
                        applied={promo} onChange={setPromo} label="Enter promo code" />
                    </div>

                    {/* Privacy note */}
                    <p className="text-[11px] text-slate-400 leading-relaxed border-t border-slate-100 pt-4">
                      <Shield size={11} className="inline mr-1 text-slate-400" />
                      Tourist Visa Experts does not share your data with any third parties. We will only contact you about your consultation.
                    </p>

                    {payError && <p role="alert" className="text-sm font-semibold text-red-600">{payError}</p>}

                    {/* Submit */}
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="flex items-center gap-2.5 px-7 py-3 rounded-xl text-white font-bold text-[14px] transition-all duration-200
                        bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600
                        shadow-md shadow-orange-500/30 hover:shadow-orange-500/45 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <motion.span
                            className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                          />
                          Opening payment…
                        </span>
                      ) : (
                        <>
                          <Send size={14} />
                          PAY {formatInr(payPrice)}/-
                          <ArrowRight size={14} />
                        </>
                      )}
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* ── Right Panel ─────────────────────────────────────────── */}
          <div className="space-y-5 lg:sticky lg:top-24">
            {/* Trust badges */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={formInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.2 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-4">Why Trust Us</p>
              <div className="space-y-3">
                {TRUST.map(({ icon: Icon, label, sub }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, x: 16 }}
                    animate={formInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-orange-500" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-slate-800 leading-tight">{label}</p>
                      <p className="text-[11px] text-slate-500">{sub}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Services included */}
            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={formInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.55, delay: 0.35 }}
              className="bg-gradient-to-br from-[#0A1628] to-[#1a3560] rounded-3xl p-6 text-white"
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-orange-400 mb-1">What's Included</p>
              <h3 className="text-lg font-black leading-tight mb-4">Your {formatInr(price)} Consultation Covers</h3>
              <ul className="space-y-2.5">
                {[
                  'Visa eligibility check',
                  'Document checklist',
                  'Step-by-step guidance',
                  'Timeline & processing info',
                  'Embassy requirement update',
                  'Dedicated expert assigned',
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    initial={{ opacity: 0, x: 12 }}
                    animate={formInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.35, delay: 0.45 + i * 0.06 }}
                    className="flex items-center gap-2.5 text-[13px] text-white/80"
                  >
                    <span className="w-5 h-5 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center shrink-0">
                      <Check size={11} className="text-green-400" />
                    </span>
                    {item}
                  </motion.li>
                ))}
              </ul>

            </motion.div>

          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

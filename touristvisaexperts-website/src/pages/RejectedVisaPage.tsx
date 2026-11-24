import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ShieldCheck, ArrowRight, Wallet, Plane, FileText, Info, FileSearch, UserRound, Compass,
  Plus, MessagesSquare, AlertTriangle,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { isReapplicationCountry } from '../lib/pricing'
import { ReapplyPlanCard, PlanSheet } from '../components/site/ReapplyPlanCard'
import { ReapplyProcessCard } from '../components/site/ReapplyProcessCard'
import heroBg from '../assets/rejected-hero-bg.jpg'

/* ─── Content (client WEB CHANGES doc + Canva design, Oct 2026) ──────────── */
const REFUSAL_REASONS = [
  { Icon: Wallet, color: '#F97316', title: 'Financial Concerns', desc: 'Your financial documents may not have clearly demonstrated that you could support the proposed trip.' },
  { Icon: Plane, color: '#3B82F6', title: 'Travel Purpose', desc: 'The purpose, itinerary or intended activities may not have been sufficiently clear or convincing.' },
  { Icon: FileText, color: '#8B5CF6', title: 'Supporting Documents', desc: 'Missing, inconsistent or unclear documents can weaken an application.' },
  { Icon: Info, color: '#16A34A', title: 'Information Gaps', desc: 'Differences between your application, documents and previous travel history can raise questions.' },
]
const HOW_WE_HELP = [
  { Icon: FileSearch, color: '#2563EB', title: 'Refusal Letter Review', desc: 'We analyse your refusal letter and identify the key reasons for your rejection.' },
  { Icon: UserRound, color: '#F97316', title: 'Profile Assessment', desc: 'We review your documents, finances, travel history and supporting evidence to find possible gaps.' },
  { Icon: Compass, color: '#16A34A', title: 'Reapplication Guidance', desc: 'We suggest the right next steps and help you prepare a stronger application.' },
]
const FAQS = [
  { q: 'Can I apply again after a refusal?', a: 'Yes. A refusal does not ban you from applying again. What matters is fixing the reasons behind it with a clearer, better-documented application.' },
  { q: 'How soon can I re-apply?', a: 'Most embassies let you apply again straight away. We usually recommend taking 2–4 weeks to prepare a noticeably stronger file.' },
  { q: 'Will you guarantee visa approval?', a: 'No one can guarantee a visa — the decision always rests with the embassy. We give you the best possible chance by addressing every concern from your refusal.' },
  { q: 'What documents should I share?', a: 'Your refusal letter, the documents from your previous application, current bank statements, proof of employment or business, and anything else your specialist asks for.' },
  { q: "What if I don't have the refusal letter?", a: 'We can still help. We review your original application details and rebuild the file based on the most likely reasons for refusal for your destination.' },
  { q: 'How does the cashback work?', a: 'If your new visa is approved and you submit a video testimonial, we pay the cashback per person on the application. No cashback applies if the visa is not approved. Terms & conditions apply.' },
]
const TABS = [
  { id: 'rv-process', label: 'Our Process' },
  { id: 'rv-why', label: 'Why Rejected' },
  { id: 'rv-faq', label: 'FAQs' },
]

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function RejectedVisaPage() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams()
  const qCountry = params.get('country') || ''
  const initialCountry = isReapplicationCountry(qCountry) ? (qCountry === 'Czech Republic' ? 'Czechia' : qCountry) : ''
  const initialTravellers = Math.max(1, Math.min(20, parseInt(params.get('travellers') || '1', 10) || 1))

  // Phones: the plan card lives in a bottom sheet — open straight away when a visa page sent the country along
  const [sheet, setSheet] = useState(() => !!initialCountry && typeof window !== 'undefined' && window.innerWidth < 1024)
  const [faqOpen, setFaqOpen] = useState<number | null>(0)
  const [active, setActive] = useState(TABS[0].id)

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + window.innerHeight * 0.35
      let cur = TABS[0].id
      for (const t of TABS) { const el = document.getElementById(t.id); if (el && el.getBoundingClientRect().top + window.scrollY <= y) cur = t.id }
      setActive(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />

      {/* ── Sub-navigation ───────────────────────────────── */}
      <div className="sticky top-[65px] z-30 border-b border-slate-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(t => (
            <button key={t.id} type="button" onClick={() => scrollTo(t.id)}
              className={`relative whitespace-nowrap px-4 py-3 text-sm font-semibold transition-colors ${active === t.id ? 'text-orange-600' : 'text-slate-500 hover:text-slate-800'}`}>
              {t.label}
              {active === t.id && <motion.span layoutId="rv-tab" className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-orange-500" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Hero: desk photo background, headline left, plan card right ── */}
      <section className="relative overflow-hidden">
        <img src={heroBg} alt="" aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[70%_center] lg:object-right" />
        {/* keeps the headline readable over the photo */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FFF9F1] via-[#FFF9F1]/85 to-[#FFF9F1]/10 lg:via-[#FFF9F1]/60 lg:to-transparent" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:py-12">
          <div className="lg:pt-10">
            <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest text-blue-700">
              <ShieldCheck className="h-3.5 w-3.5" /> Visa Rejection Support
            </span>
            <h1 className="mt-5 text-[40px] font-black leading-[1.05] tracking-tight text-[#0A1F44] sm:text-6xl">
              Visa Rejected?
              <span className="mt-1 block text-orange-500">Let's Rebuild It Right.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[16px] leading-relaxed text-[#0A1F44]/80 sm:text-[17px]">
              A specialist-led visa reapplication service designed to understand your refusal, identify the gaps,
              rebuild your application and prepare you for a stronger submission.
            </p>
            {/* Phones: the card opens in a sheet */}
            <div className="mt-7 lg:hidden">
              <button type="button" onClick={() => setSheet(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-[15px] font-black text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)] sm:w-auto">
                Start Application <ArrowRight className="h-4 w-4" />
              </button>
              <p className="mt-2 text-center text-[12.5px] text-slate-600 sm:text-left">Continue to the payment page</p>
            </div>
            <ReapplyProcessCard id="rv-process" className="mt-8 max-w-[600px] lg:mt-9" />
          </div>
          <div className="hidden lg:block">
            <ReapplyPlanCard initialCountry={initialCountry} initialTravellers={initialTravellers} />
          </div>
        </div>
      </section>

      {/* ── Why refused + How we help ────────────────────── */}
      <section id="rv-why" className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-0">
          <div className="lg:border-r lg:border-slate-200 lg:pr-10">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><AlertTriangle className="h-5 w-5" /></span>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-[#0A1F44]">Why Was Your Visa Refused?</h2>
                <p className="mt-1.5 text-[15px] text-slate-500">Visa refusals can happen for different reasons, including:</p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {REFUSAL_REASONS.map(({ Icon, color, title, desc }, i) => (
                <motion.div key={title} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}14`, color }}><Icon className="h-5 w-5" /></span>
                  <div>
                    <h3 className="font-black text-[#0A1F44]">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="lg:pl-10">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MessagesSquare className="h-5 w-5" /></span>
              <div>
                <h2 className="text-3xl font-black tracking-tight text-[#0A1F44]">How We Can Help</h2>
                <p className="mt-1.5 text-[15px] text-slate-500">We review your case in detail and provide practical guidance based on your individual situation.</p>
              </div>
            </div>
            <div className="mt-8 flex flex-col gap-4">
              {HOW_WE_HELP.map(({ Icon, color, title, desc }, i) => (
                <motion.div key={title} initial={{ opacity: 0, x: 18 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: `${color}14`, color }}><Icon className="h-5 w-5" /></span>
                  <div>
                    <h3 className="text-lg font-black text-[#0A1F44]">{title}</h3>
                    <p className="mt-1 text-[15px] leading-relaxed text-slate-500">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQs ─────────────────────────────────────────── */}
      <section id="rv-faq" className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><MessagesSquare className="h-5 w-5" /></span>
          <div>
            <h2 className="text-3xl font-black tracking-tight text-[#0A1F44]">Frequently Asked Questions</h2>
            <p className="mt-1.5 text-[15px] text-slate-500">Find quick answers to common questions about visa refusals and our reapplication support.</p>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3">
          {FAQS.map((f, i) => (
            <div key={f.q} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button type="button" onClick={() => setFaqOpen(faqOpen === i ? null : i)} aria-expanded={faqOpen === i}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="font-bold text-[#0A1F44]">{f.q}</span>
                <Plus className={`h-4 w-4 shrink-0 text-blue-600 transition-transform ${faqOpen === i ? 'rotate-45' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {faqOpen === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}>
                    <p className="px-5 pb-4 text-[15px] leading-relaxed text-slate-600">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </section>

      <Footer />

      <PlanSheet open={sheet} onClose={() => setSheet(false)}>
        <ReapplyPlanCard initialCountry={initialCountry} initialTravellers={initialTravellers} onClose={() => setSheet(false)} />
      </PlanSheet>
    </div>
  )
}

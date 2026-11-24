import { useState } from 'react'
import { useNavigate } from 'react-router'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { ReapplyPlanCard, PlanSheet } from '../components/site/ReapplyPlanCard'
import { ReapplyProcessCard } from '../components/site/ReapplyProcessCard'
import MagicBento from '../components/MagicBento'
import guaranteeMan from '../assets/guarantee-man.jpg'
import {
  ShieldCheck, ArrowRight, BadgeIndianRupee, Clock, UserCheck, Landmark, Plane, AlertTriangle, CalendarX,
} from 'lucide-react'

const COVERED = [
  { Icon: BadgeIndianRupee, color: '#16A34A', title: '100% service-fee refund', desc: 'Full refund of the Tourist Visa Experts service fee.' },
  { Icon: ShieldCheck, color: '#3B82F6', title: 'Covered refusals', desc: 'Applies when the re-application is refused for a reason covered by the plan.' },
  { Icon: Clock, color: '#F97316', title: 'Paid within 7 working days', desc: 'Refunded to your original payment method.' },
  { Icon: UserCheck, color: '#8B5CF6', title: 'Priority senior specialist', desc: 'Plus unlimited document revisions until your file is ready.' },
] as const
const NOT_COVERED = [
  { Icon: Landmark, title: 'Government & appointment fees', desc: 'Embassy, visa-centre and appointment fees are paid directly by you.' },
  { Icon: Plane, title: 'Travel bookings', desc: 'Travel insurance, flight or hotel booking charges.' },
  { Icon: AlertTriangle, title: 'Incorrect information', desc: 'Cases where false or incomplete information was provided.' },
  { Icon: CalendarX, title: 'Missed steps', desc: 'Refusals caused by a missed appointment or late documents.' },
] as const

// Same glowing card pattern as "Why Choose Us / What We Handle" on the visa pages
const POLICY_CARDS = [
  {
    color: '#FFFFFF',
    customContent: (
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-green-700">
          What's Covered
        </div>
        <h3 className="text-2xl font-black leading-tight text-[#0A1628]">
          Your Service Fee,<br />
          <span className="bento-shimmer-green">Fully Protected.</span>
        </h3>
        <ul className="space-y-3">
          {COVERED.map(({ Icon, color, title, desc }) => (
            <li key={title} className="flex items-center gap-3 rounded-xl border p-3" style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18`, border: `1.5px solid ${color}45` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-extrabold leading-tight text-slate-800">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    color: '#FFFFFF',
    customContent: (
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-600">
          What's Not Covered
        </div>
        <h3 className="text-2xl font-black leading-tight text-[#0A1628]">
          Good to Know<br />
          <span className="bento-shimmer">Before You Apply.</span>
        </h3>
        <ul className="space-y-4">
          {NOT_COVERED.map(({ Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: '#F43F5E14', border: '1.5px solid #F43F5E40' }}>
                <Icon className="h-[18px] w-[18px] text-rose-500" />
              </div>
              <div>
                <p className="text-sm font-extrabold leading-tight text-slate-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{desc}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
]

export default function RefundGuaranteePage() {
  const navigate = useNavigate()
  const [sheet, setSheet] = useState(false)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#FFF8EE] via-[#FDFBF6] to-[#EEF8F1]">
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-start gap-6 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)_400px] lg:pt-10">
          {/* Copy */}
          <div className="relative z-10 lg:pt-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-green-800">
              <ShieldCheck className="h-4 w-4 text-green-700" /> 100% Service-Fee Refund Protection
            </span>
            <h1 className="mt-5 text-[42px] font-black leading-[0.98] tracking-tight sm:text-6xl">
              <span className="block text-[#0A1F44]">Your next application.</span>
              <span className="block text-green-800">Our refund promise.</span>
            </h1>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#1D3FBF]/80">
              Reapply with senior specialist support. If your visa is refused again for a covered reason,
              we refund 100% of our service fee within 7 working days.
            </p>
            {/* Phones: the plan card opens in a sheet */}
            <button type="button" onClick={() => setSheet(true)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-800 py-3.5 text-[16px] font-black text-white shadow-[0_10px_24px_rgba(21,128,61,0.3)] transition hover:bg-green-900 sm:w-auto sm:px-8 lg:hidden">
              Start Application <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Photo */}
          <div className="relative mx-auto w-full max-w-[420px] lg:mt-6">
            <img src={guaranteeMan} alt="Smiling client holding a visa-approved checklist and a ₹25,000 service-fee refund card"
              width={694} height={910} className="h-auto w-full rounded-[28px] [mask-image:linear-gradient(to_bottom,black_90%,transparent)]" />
          </div>

          {/* Plan card — runs down beside the steps card */}
          <div id="rg-card" className="hidden lg:row-span-2 lg:block">
            <ReapplyPlanCard plan="guarantee" />
          </div>

          {/* 3 steps — fills the space under the copy + photo, next to the plan card */}
          <div className="relative z-10 lg:col-span-2 lg:-mt-2">
            <ReapplyProcessCard layout="row" />
          </div>
        </div>
      </section>

      {/* ── Covered vs not covered ───────────────────────── */}
      <section className="bg-[#F8F9FB] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-green-50 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-green-800">
              <ShieldCheck className="h-4 w-4 text-green-700" /> The Refund Promise
            </span>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#0A1F44] sm:text-4xl">Exactly What's Protected</h2>
            <p className="mt-2 text-[15px] text-slate-500">Clear terms, no surprises: what the Guarantee Plan refunds, and what it doesn't.</p>
          </div>
          <div className="bento-auto bento-auto--pair">
            <MagicBento textAutoHide={false} enableStars enableSpotlight enableBorderGlow enableTilt={false} enableMagnetism
              clickEffect spotlightRadius={300} particleCount={12} glowColor="132, 0, 255" cards={POLICY_CARDS} />
          </div>
          <p className="mt-6 text-center text-[13px] text-slate-500">
            Full terms in our{' '}
            <button type="button" onClick={() => navigate('/refund-policy')} className="font-bold text-[#1D3FBF] underline-offset-2 hover:underline">Refund Policy</button>.
          </p>
        </div>
      </section>

      <Footer />

      <PlanSheet open={sheet} onClose={() => setSheet(false)}>
        <ReapplyPlanCard plan="guarantee" onClose={() => setSheet(false)} />
      </PlanSheet>
    </div>
  )
}

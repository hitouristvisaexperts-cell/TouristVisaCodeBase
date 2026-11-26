import { useState, useRef } from 'react'
import { motion, useMotionValue, useTransform } from 'motion/react'
import { toast } from 'sonner'

import { useNavigation } from '../../context/NavigationContext'
import {
  Shield, Plane, Headphones, CheckCircle2, ArrowRight,
  Clock, BadgeCheck, Star, FileText, Zap, Users,
  CalendarCheck, MessageSquare, Award,
} from 'lucide-react'

import destUSA   from '../../assets/dest-usa.jpg'
import destUK    from '../../assets/dest-uk.jpg'
import destUAE   from '../../assets/dest-uae.jpg'

/* ── Service data ─────────────────────────────────────────────────── */
const SERVICES = [
  {
    id: 'visa',
    n: '01',
    title: 'Visa Assistance',
    tagline: 'One expert, your case, start to finish.',
    desc: 'A dedicated visa specialist handles everything for you. No agency middlemen, no guesswork — just an expert who owns your case start to finish.',
    color: '#3B82F6',
    colorDark: '#1D4ED8',
    bgFrom: '#0c1a35',
    bgTo: '#0a1628',
    image: destUSA,
    badge: 'Expert Assistance',
    badgeIcon: BadgeCheck,
    features: [
      { icon: FileText,     text: 'Document Review & Checklist' },
      { icon: Shield,       text: 'Embassy Application Handling' },
      { icon: Clock,        text: 'Real-Time Application Tracking' },
      { icon: BadgeCheck,   text: 'Thorough Document Check' },
    ],
    stats: [{ val: '100%', label: 'Document Check' }, { val: '1-on-1', label: 'Support' }, { val: 'Experts', label: 'Assigned' }],
    cta: 'Get Visa Help',
  },
  {
    id: 'flight',
    n: '02',
    title: 'Flight Reservation',
    tagline: 'Verifiable flight reservations for visa applications.',
    desc: 'Get a verified flight reservation for your visa application — tailored for embassy submission without purchasing expensive upfront tickets.',
    color: '#F97316',
    colorDark: '#c2410c',
    bgFrom: '#1f0e00',
    bgTo: '#160900',
    image: destUAE,
    badge: 'Fast Delivery',
    badgeIcon: Zap,
    features: [
      { icon: Plane,        text: 'Embassy-Ready Booking' },
      { icon: Clock,        text: 'Quick Turnaround' },
      { icon: CalendarCheck,text: 'All Major Airlines' },
      { icon: CheckCircle2, text: 'No Payment Upfront' },
    ],
    stats: [{ val: 'Fast', label: 'Delivery' }, { val: '100%', label: 'Verifiable' }, { val: '500+', label: 'Airlines' }],
    cta: 'Book Ticket Now',
  },
  {
    id: 'consult',
    n: '03',
    title: 'Consultation',
    tagline: 'One-on-one expert session tailored to your trip.',
    desc: 'Get a dedicated 30-minute session with a certified visa expert. Your ₹999 fee is fully credited back when you book a full service.',
    color: '#8B5CF6',
    colorDark: '#6D28D9',
    bgFrom: '#0d0a1f',
    bgTo: '#080612',
    image: destUK,
    badge: 'Fee Credited Back',
    badgeIcon: Award,
    features: [
      { icon: Users,        text: '1-on-1 Dedicated Session' },
      { icon: MessageSquare,text: 'Personalised Advice' },
      { icon: Star,         text: '30-Minute Deep Dive' },
      { icon: CheckCircle2, text: '₹999 — Fee Credited Back' },
    ],
    stats: [{ val: '30m', label: 'Session' }, { val: '₹999', label: 'Starting' }, { val: '100%', label: 'Credited' }],
    cta: 'Book a Session',
  },
]

/* ── Tilt card ──────────────────────────────────────────────────────── */
function ServiceCard({ s, index }: { s: typeof SERVICES[0]; index: number }) {
  const { openVisaAssistance, openConsultation, openFlightReservation } = useNavigation()
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [6, -6])
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-6, 6])
  const glowX   = useTransform(mouseX, [-0.5, 0.5], ['20%', '80%'])
  const glowY   = useTransform(mouseY, [-0.5, 0.5], ['20%', '80%'])

  const isTouchDevice = typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice) return
    const r = cardRef.current!.getBoundingClientRect()
    mouseX.set((e.clientX - r.left) / r.width - 0.5)
    mouseY.set((e.clientY - r.top) / r.height - 0.5)
  }
  const handleMouseLeave = () => {
    mouseX.set(0); mouseY.set(0); setHovered(false)
  }

  const handleCta = () => {
    if (s.id === 'visa')    return openVisaAssistance()
    if (s.id === 'flight')  return openFlightReservation()
    if (s.id === 'consult') return openConsultation()
    toast.success(`${s.title} — let's get started!`)
  }

  const BadgeIconComp = s.badgeIcon

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.65, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="relative rounded-3xl overflow-hidden cursor-default group"
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
    >
      {/* MOST POPULAR — full-width top strip above card content */}
      {s.id === 'flight' && (
        <div
          className="absolute top-0 left-0 right-0 z-[10] flex items-center justify-center gap-1.5 py-2 text-[10.5px] font-black uppercase tracking-widest text-white"
          style={{ background: 'linear-gradient(90deg,#EA580C,#F97316,#EA580C)' }}
        >
          <Zap size={9} className="fill-white" />
          Most Popular
          <Zap size={9} className="fill-white" />
        </div>
      )}

      {/* Card dark bg */}
      <div
        className="absolute inset-0 z-0"
        style={{ background: `linear-gradient(160deg, ${s.bgFrom} 0%, ${s.bgTo} 100%)` }}
      />

      {/* Destination image — subtle blurred overlay */}
      <div className="absolute inset-0 z-[1]">
        <img src={s.image} alt={`${s.title} background`} className="w-full h-full object-cover opacity-[0.12] scale-110" />
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 0%, ${s.bgTo}ee 65%)` }} />
      </div>

      {/* Mouse-tracked glow */}
      <motion.div
        className="absolute inset-0 z-[2] pointer-events-none rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background: `radial-gradient(280px circle at ${glowX} ${glowY}, ${s.color}22, transparent 70%)`,
        }}
      />

      {/* Animated border glow on hover */}
      <motion.div
        className="absolute inset-0 z-[2] rounded-3xl pointer-events-none"
        style={{
          boxShadow: hovered ? `inset 0 0 0 1.5px ${s.color}55, 0 24px 60px ${s.color}30` : `inset 0 0 0 1px rgba(255,255,255,0.06)`,
          transition: 'box-shadow 0.3s ease',
        }}
      />

      {/* Content */}
      <div className={`relative z-[3] p-5 sm:p-7 flex flex-col h-full min-h-[420px] sm:min-h-[480px] ${s.id === 'flight' ? 'pt-12 sm:pt-14' : ''}`}>

        {/* Top row */}
        <div className="flex items-center justify-between mb-6">
          <span
            className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border"
            style={{ color: s.color, borderColor: `${s.color}40`, background: `${s.color}12` }}
          >
            {s.n} / 03
          </span>
          <div
            className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border"
            style={{ color: s.color, borderColor: `${s.color}35`, background: `${s.color}10` }}
          >
            <BadgeIconComp size={12} />
            {s.badge}
          </div>
        </div>

        {/* Visual icon area */}
        <motion.div
          animate={hovered ? { scale: 1.05, y: -4 } : { scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-20 h-20 rounded-2xl mb-6 flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${s.color}30, ${s.color}15)`, border: `1.5px solid ${s.color}45` }}
        >
          {/* Glow ring */}
          <motion.div
            className="absolute inset-[-8px] rounded-[20px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle, ${s.color}20, transparent 70%)` }}
          />
          {s.id === 'visa'   && <Shield   size={36} style={{ color: s.color }} />}
          {s.id === 'flight' && <Plane    size={36} style={{ color: s.color }} />}
          {s.id === 'consult'&& <Headphones size={36} style={{ color: s.color }} />}

          {/* Floating stat bubble */}
          <motion.div
            initial={{ opacity: 0, scale: 0, x: 8, y: -8 }}
            animate={hovered ? { opacity: 1, scale: 1, x: 0, y: 0 } : { opacity: 0, scale: 0, x: 8, y: -8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className="absolute -top-3 -right-3 rounded-full px-2 py-1 text-[10px] font-black text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${s.color}, ${s.colorDark})` }}
          >
            {s.stats[0].val}
          </motion.div>
        </motion.div>

        {/* Title & desc */}
        <h3 className="text-2xl font-black text-white leading-tight mb-1">{s.title}</h3>
        <p className="text-[13px] font-semibold mb-3" style={{ color: `${s.color}cc` }}>{s.tagline}</p>
        <p className="text-[13px] text-white/80 leading-relaxed mb-6 flex-1">{s.desc}</p>

        {/* Feature list — always visible, animate on hover */}
        <div className="space-y-2.5 mb-7">
          {s.features.map(({ icon: Icon, text }, fi) => (
            <motion.div
              key={text}
              initial={{ opacity: isTouchDevice ? 1 : 0.4, x: isTouchDevice ? 0 : -6 }}
              animate={hovered || isTouchDevice ? { opacity: 1, x: 0 } : { opacity: 0.4, x: -6 }}
              transition={{ duration: 0.3, delay: fi * 0.06 }}
              className="flex items-center gap-2.5"
            >
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${s.color}20`, border: `1px solid ${s.color}35` }}
              >
                <Icon size={12} style={{ color: s.color }} />
              </div>
              <span className="text-[12.5px] text-white font-medium">{text}</span>
            </motion.div>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-6">
          {s.stats.map(({ val, label }) => (
            <div
              key={label}
              className="flex-1 rounded-xl p-2.5 text-center border"
              style={{ background: `${s.color}0e`, borderColor: `${s.color}25` }}
            >
              <p className="text-base font-black text-white leading-none">{val}</p>
              <p className="text-[10px] text-white/40 font-semibold mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <motion.button
          onClick={handleCta}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl text-white font-black text-sm transition-all duration-200 group/btn"
          style={{
            background: `linear-gradient(135deg, ${s.color}, ${s.colorDark})`,
            boxShadow: hovered ? `0 12px 32px ${s.color}50` : `0 6px 20px ${s.color}35`,
          }}
        >
          {s.cta}
          <ArrowRight size={15} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ── Section ─────────────────────────────────────────────────────────── */
export const Services = () => (
  <section className="relative bg-white py-8 pb-24 overflow-hidden">
    {/* Subtle bg glows */}
    <div className="pointer-events-none absolute top-[-200px] left-[-200px] w-[600px] h-[600px] rounded-full bg-blue-500/[0.04] blur-[140px]" />
    <div className="pointer-events-none absolute bottom-[-120px] right-[-150px] w-[500px] h-[500px] rounded-full bg-orange-500/[0.04] blur-[120px]" />

    <div className="relative container mx-auto max-w-6xl px-4 sm:px-6">

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {SERVICES.map((s, i) => <ServiceCard key={s.id} s={s} index={i} />)}
      </div>

      {/* Trust strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.55, delay: 0.3 }}
        className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
      >
        {[
          { icon: Shield,     color: '#22C55E', label: '100% Secure',        sub: 'Bank-grade data protection' },
          { icon: BadgeCheck, color: '#3B82F6', label: 'Expert Guidance',    sub: 'Certified visa specialists' },
          { icon: Zap,        color: '#F97316', label: 'Fast & Reliable',    sub: 'Your success is our commitment' },
          { icon: Users,      color: '#8B5CF6', label: 'Trusted Worldwide',  sub: 'Happy travelers everywhere' },
        ].map(({ icon: Icon, color, label, sub }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 hover:bg-white hover:shadow-sm transition-all duration-200"
          >
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-[13px] font-black text-slate-800 leading-tight">{label}</p>
              <p className="text-[11px] text-slate-500">{sub}</p>
            </div>
          </div>
        ))}
      </motion.div>
    </div>
  </section>
)

import { useRef } from 'react'
import { motion, useInView } from 'motion/react'

/* ─── Step data ─────────────────────────────────────────── */
const steps = [
  {
    num: '01',
    eyebrow: 'Free Assessment',
    title: 'Profile Screening',
    desc: '1-on-1 guidance with our Visa experts. We review your profile to craft the best approach for your application.',
    badge: '100% Secure',
    badgeColor: '#16A34A',
    badgeBg: '#F0FDF4',
    accentColor: '#3B82F6',
    glowColor: 'rgba(59,130,246,0.35)',
    Icon: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="38" height="38">
        <rect x="10" y="10" width="34" height="44" rx="5" fill="#1E3A5F" stroke="rgba(255,255,255,0.15)" strokeWidth="1"/>
        <rect x="20" y="6" width="14" height="10" rx="3" fill="#CBD5E1"/>
        <rect x="24" y="4" width="6" height="8" rx="2" fill="#1E3A5F"/>
        <rect x="15" y="22" width="20" height="2.5" rx="1.25" fill="rgba(255,255,255,0.35)"/>
        <rect x="15" y="28" width="14" height="2.5" rx="1.25" fill="rgba(255,255,255,0.2)"/>
        <circle cx="46" cy="46" r="13" fill="#F97316"/>
        <circle cx="43" cy="43" r="8" fill="none" stroke="white" strokeWidth="2"/>
        <line x1="49" y1="49" x2="56" y2="56" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    num: '02',
    eyebrow: 'Expert Review',
    title: 'Document Validation',
    desc: 'Our experts meticulously validate every document for accuracy and compliance, reverting changes if needed.',
    badge: 'Expert Guided',
    badgeColor: '#2563EB',
    badgeBg: '#EFF6FF',
    accentColor: '#22C55E',
    glowColor: 'rgba(34,197,94,0.35)',
    Icon: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="38" height="38">
        <rect x="8" y="14" width="48" height="38" rx="6" fill="#1D4ED8" opacity="0.8"/>
        <rect x="14" y="8" width="36" height="44" rx="5" fill="white" stroke="rgba(59,130,246,0.3)" strokeWidth="1"/>
        <rect x="20" y="18" width="24" height="2.5" rx="1.25" fill="#DBEAFE"/>
        <rect x="20" y="24" width="18" height="2.5" rx="1.25" fill="#DBEAFE"/>
        <rect x="20" y="30" width="21" height="2.5" rx="1.25" fill="#DBEAFE"/>
        <circle cx="46" cy="44" r="13" fill="#22C55E"/>
        <path d="M40 44 L44 48 L53 38" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    num: '03',
    eyebrow: 'High Success Rate',
    title: 'Get Your Visa',
    desc: 'We submit, track, and follow up your application until your visa lands in your hands. Sit back & relax.',
    badge: 'Fast & Reliable',
    badgeColor: '#F97316',
    badgeBg: '#FFF7ED',
    accentColor: '#F97316',
    glowColor: 'rgba(249,115,22,0.35)',
    Icon: () => (
      <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="38" height="38">
        <rect x="12" y="6" width="34" height="48" rx="5" fill="#1E3A5F" stroke="rgba(255,255,255,0.12)" strokeWidth="1"/>
        <rect x="12" y="6" width="6" height="48" rx="3" fill="#152D4E"/>
        <circle cx="31" cy="26" r="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
        <ellipse cx="31" cy="26" rx="5" ry="11" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
        <line x1="20" y1="26" x2="42" y2="26" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2"/>
        <rect x="44" y="34" width="14" height="22" rx="3" fill="#F97316" transform="rotate(-12 51 45)"/>
        <text x="51" y="43" textAnchor="middle" fill="white" fontSize="3.5" fontWeight="800" letterSpacing="0.5" transform="rotate(-12 51 45)">VISA</text>
        <text x="51" y="49" textAnchor="middle" fill="white" fontSize="4.5" fontWeight="900" letterSpacing="0.3" transform="rotate(-12 51 45)">OK</text>
      </svg>
    ),
  },
]

/* ─── Connector line between cards ─────────────────────── */
const Connector = ({ inView, delay }: { inView: boolean; delay: number }) => (
  <div className="hidden lg:flex items-center justify-center w-16 xl:w-20 flex-shrink-0" style={{ marginTop: '-24px' }}>
    <div className="relative w-full h-[2px]" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <motion.div
        className="absolute inset-y-0 left-0 h-full"
        style={{ background: 'linear-gradient(90deg,#F97316,#fb923c)', borderRadius: 2, originX: 0 }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: inView ? 1 : 0 }}
        transition={{ duration: 0.55, delay: delay, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
        style={{ background: '#F97316', boxShadow: '0 0 8px 2px rgba(249,115,22,0.7)' }}
        initial={{ left: '0%', opacity: 0 }}
        animate={{ left: inView ? '100%' : '0%', opacity: inView ? [0, 1, 1, 0] : 0 }}
        transition={{ duration: 0.55, delay: delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
    <svg className="absolute" width="8" height="14" viewBox="0 0 8 14" style={{ right: 0, marginRight: -4 }}>
      <motion.polygon
        points="0,0 8,7 0,14"
        fill="#F97316"
        initial={{ opacity: 0 }}
        animate={{ opacity: inView ? 1 : 0 }}
        transition={{ duration: 0.2, delay: delay + 0.5 }}
      />
    </svg>
  </div>
)

const MobileConnector = ({ inView, delay }: { inView: boolean; delay: number }) => (
  <div className="flex lg:hidden justify-center" style={{ height: 48, position: 'relative' }}>
    <div className="relative w-[2px] h-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <motion.div
        className="absolute inset-x-0 top-0 w-full"
        style={{ background: 'linear-gradient(180deg,#F97316,#fb923c)', borderRadius: 2, originY: 0 }}
        initial={{ scaleY: 0 }}
        animate={{ scaleY: inView ? 1 : 0 }}
        transition={{ duration: 0.4, delay: delay, ease: [0.4, 0, 0.2, 1] }}
      />
    </div>
    <motion.div
      className="absolute bottom-0 left-1/2 -translate-x-1/2"
      style={{ width: 8, height: 8, borderRadius: '50%', background: '#F97316', boxShadow: '0 0 8px 2px rgba(249,115,22,0.7)' }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: inView ? 1 : 0, scale: inView ? 1 : 0 }}
      transition={{ duration: 0.25, delay: delay + 0.35 }}
    />
  </div>
)

/* ─── Step Card ─────────────────────────────────────────── */
const StepCard = ({
  step,
  index,
  inView,
}: {
  step: (typeof steps)[0]
  index: number
  inView: boolean
}) => {
  const delay = index * 0.22

  return (
    <motion.div
      className="flex-1 min-w-0"
      style={{ pointerEvents: inView ? 'auto' : 'none' }}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 40 }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      <div
        className="relative rounded-2xl p-6 h-full flex flex-col"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(12px)',
          boxShadow: `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`,
          transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
        }}
        onMouseEnter={e => {
          if (!inView) return
          const el = e.currentTarget
          el.style.borderColor = `rgba(249,115,22,0.35)`
          el.style.boxShadow = `0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(249,115,22,0.2), inset 0 1px 0 rgba(255,255,255,0.1)`
        }}
        onMouseLeave={e => {
          if (!inView) return
          const el = e.currentTarget
          el.style.borderColor = 'rgba(255,255,255,0.10)'
          el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)`
        }}
      >
        {/* Glow corner accent */}
        <div
          className="absolute top-0 right-0 w-24 h-24 rounded-2xl pointer-events-none"
          style={{
            background: `radial-gradient(circle at top right, ${step.glowColor} 0%, transparent 70%)`,
            opacity: 0.6,
          }}
        />

        {/* Step number bubble */}
        <div className="flex items-start justify-between mb-5">
          <div className="relative">
            {/* Pulse ring */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ border: `1.5px solid ${step.accentColor}`, opacity: 0.4 }}
              animate={inView ? { scale: [1, 1.55, 1], opacity: [0.4, 0, 0.4] } : {}}
              transition={{ duration: 2.4, delay: delay + 0.6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div
              className="relative w-11 h-11 rounded-full flex items-center justify-center font-black text-sm"
              style={{
                background: `linear-gradient(135deg, ${step.accentColor} 0%, ${step.accentColor}cc 100%)`,
                color: '#fff',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                boxShadow: `0 4px 16px ${step.glowColor}`,
                letterSpacing: '0.5px',
              }}
            >
              {step.num}
            </div>
          </div>

          {/* Eyebrow chip */}
          <motion.div
            className="px-3 py-1 rounded-full text-[11px] font-bold"
            style={{
              background: 'rgba(249,115,22,0.12)',
              color: '#FB923C',
              border: '1px solid rgba(249,115,22,0.25)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.5px',
            }}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 10 }}
            transition={{ duration: 0.4, delay: delay + 0.3 }}
          >
            {step.eyebrow}
          </motion.div>
        </div>

        {/* Icon area */}
        <motion.div
          className="mb-5 flex items-center justify-center w-16 h-16 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
          animate={inView ? { y: [0, -5, 0] } : {}}
          transition={{ duration: 3.5, delay: delay + 0.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <step.Icon />
        </motion.div>

        {/* Text */}
        <h3
          className="text-white font-bold text-[17px] mb-2"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.3 }}
        >
          {step.title}
        </h3>
        <p
          className="text-sm flex-1 mb-5"
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            lineHeight: 1.7,
          }}
        >
          {step.desc}
        </p>

        {/* Bottom divider + badge */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
          <span
            className="inline-flex items-center gap-1.5 text-[12px] font-bold px-3 py-1.5 rounded-full"
            style={{
              background: step.badgeBg,
              color: step.badgeColor,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={step.badgeColor} strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {step.badge}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Main Component ─────────────────────────────────────── */
export const HowItWorks = () => {
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-8%' })

  return (
    <section
      ref={sectionRef}
      style={{
        background: 'linear-gradient(180deg,#0A1628 0%,#0d1e3a 55%,#0A1628 100%)',
        padding: '72px 0 80px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '-80px', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: '-60px', left: '10%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          top: '30%', right: '5%',
          width: 250, height: 250, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 24 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <div style={{ width: 36, height: 1.5, background: '#F97316', borderRadius: 2 }} />
            <span
              className="text-[12px] font-black uppercase tracking-[3px]"
              style={{ color: '#F97316', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              How It Works
            </span>
            <div style={{ width: 36, height: 1.5, background: '#F97316', borderRadius: 2 }} />
          </div>

          <h2
            className="text-white font-bold mb-1"
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(22px, 3vw, 34px)',
              lineHeight: 1.2,
            }}
          >
            Your Journey,
          </h2>
          <h2
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 'clamp(24px, 3.5vw, 42px)',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: 12,
              background: 'linear-gradient(90deg,#F97316 0%,#FB923C 50%,#FBBF24 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Our Priority.
          </h2>
          <p
            className="text-sm sm:text-base"
            style={{
              color: 'rgba(255,255,255,0.45)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              maxWidth: 440,
              margin: '0 auto',
              lineHeight: 1.7,
            }}
          >
            We simplify the visa process in just 3 simple steps.
          </p>
        </motion.div>

        {/* Steps row (desktop) + stacked (mobile) */}
        <div className="flex flex-col lg:flex-row items-stretch gap-0 lg:gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex flex-col lg:flex-row items-stretch flex-1 min-w-0">
              <StepCard step={step} index={i} inView={inView} />
              {i < steps.length - 1 && (
                <>
                  {/* Desktop connector */}
                  <Connector inView={inView} delay={i * 0.22 + 0.5} />
                  {/* Mobile connector */}
                  <MobileConnector inView={inView} delay={i * 0.22 + 0.4} />
                </>
              )}
            </div>
          ))}
        </div>

        {/* Bottom tagline */}
        <motion.div
          className="text-center mt-12"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 16 }}
          transition={{ duration: 0.55, delay: 0.85 }}
        >
          <p
            className="text-sm"
            style={{
              color: 'rgba(255,255,255,0.38)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              letterSpacing: '0.2px',
            }}
          >
            We submit, track, and follow up your application until your visa lands in your hands.
          </p>
        </motion.div>

      </div>
    </section>
  )
}

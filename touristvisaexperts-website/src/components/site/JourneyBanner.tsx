import { useRef, useState } from "react";
import { Plane, ShieldCheck, Check } from "lucide-react";
import { DiaTextReveal } from "@/components/magicui/dia-text-reveal";
import { motion, useInView, AnimatePresence } from "motion/react";
import { Highlighter } from "@/components/ui/highlighter";
import { ScrollReveal } from "@/components/magicui/scroll-reveal";
import plane from "@/assets/journey-plane.png";

const STEPS = [
  {
    num: '01',
    badge: 'Free Assessment',
    title: 'Profile Screening',
    color: '#F97316',
    colorLight: 'rgba(249,115,22,0.12)',
    colorBorder: 'rgba(249,115,22,0.28)',
    gradFrom: '#F97316',
    gradTo: '#FB923C',
    desc: 'We evaluate your travel history, financials & eligibility to craft the best visa strategy — 100% free.',
    points: ['Travel history check', 'Financial background review', 'Visa eligibility report'],
  },
  {
    num: '02',
    badge: 'Expert Review',
    title: 'Document Validation',
    color: '#3B82F6',
    colorLight: 'rgba(59,130,246,0.12)',
    colorBorder: 'rgba(59,130,246,0.28)',
    gradFrom: '#3B82F6',
    gradTo: '#60A5FA',
    desc: 'Our specialists meticulously verify every document to ensure full embassy compliance before submission.',
    points: ['Passport & ID verification', 'Bank statement review', 'Supporting docs checklist'],
  },
  {
    num: '03',
    badge: 'Highly Rated',
    title: 'Get Your Visa',
    color: '#22C55E',
    colorLight: 'rgba(34,197,94,0.12)',
    colorBorder: 'rgba(34,197,94,0.28)',
    gradFrom: '#22C55E',
    gradTo: '#4ADE80',
    desc: 'Your visa arrives on time — delivered straight to your inbox or doorstep. We prioritize results while keeping you informed throughout.',
    points: ['Embassy submission handled', 'Real-time status updates', 'Visa delivered to you'],
  },
]

const T = { s1: 0.15, l1: 0.72, s2: 1.22, l2: 1.88, s3: 2.38 }
const sd = [T.s1, T.s2, T.s3]
const ld = [T.l1, T.l2]

/* ── Animated connector between two cards ── */
const Connector = ({ delay, fromColor, toColor, inView }: {
  delay: number; fromColor: string; toColor: string; inView: boolean
}) => (
  <div className="hidden sm:flex items-center justify-center flex-shrink-0 w-10 relative">
    {/* Track */}
    <div className="w-full h-[2.5px] rounded-full" style={{ background: 'rgba(15,23,42,0.18)' }} />
    {/* Fill */}
    <motion.div
      className="absolute left-0 h-[2.5px] rounded-full origin-left"
      style={{ top: '50%', transform: 'translateY(-50%)', width: '100%', background: `linear-gradient(90deg,${fromColor},${toColor})` }}
      initial={{ scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : {}}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
    />
    {/* Traveling dot */}
    <motion.div
      className="absolute w-3 h-3 rounded-full"
      style={{ top: '50%', transform: 'translateY(-50%)', background: toColor, boxShadow: `0 0 8px 3px ${toColor}90`, left: 0 }}
      initial={{ left: '0%', opacity: 0 }}
      animate={inView ? { left: '88%', opacity: [0, 1, 1, 0] } : {}}
      transition={{ duration: 0.42, delay, ease: [0.22, 1, 0.36, 1] }}
    />
    {/* Arrow */}
    <motion.svg
      className="absolute -right-[5px]"
      width="8" height="13" viewBox="0 0 8 13"
      initial={{ opacity: 0, scale: 0.4 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.22, delay: delay + 0.38 }}
    >
      <polygon points="0,0 8,6.5 0,13" fill={toColor} />
    </motion.svg>
  </div>
)

/* ── Hover Step Card ── */
function HoverStepCard({
  step, inView, delay,
}: {
  step: typeof STEPS[0]; inView: boolean; delay: number
}) {
  const [hovered, setHovered] = useState(false)
  const [ready, setReady] = useState(false)
  const { num, badge, title, color, colorLight, colorBorder, gradFrom, gradTo, desc, points } = step

  return (
    <div
      className="flex-1 relative"
      style={{ pointerEvents: ready ? 'auto' : 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* ── Floating tooltip popup — appears ABOVE the card ── */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            key="tooltip"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.95 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="absolute bottom-[calc(100%+10px)] left-0 right-0 z-50 rounded-2xl p-4"
            style={{
              background: 'rgba(255,255,255,0.98)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: `1.5px solid ${colorBorder}`,
              boxShadow: `0 12px 36px ${color}25, 0 4px 12px rgba(0,0,0,0.10)`,
              pointerEvents: 'none',
            }}
          >
            {/* Tip arrow */}
            <div
              className="absolute -bottom-[7px] left-6 w-3 h-3 rotate-45"
              style={{
                background: 'rgba(255,255,255,0.98)',
                border: `1.5px solid ${colorBorder}`,
                borderTop: 'none',
                borderLeft: 'none',
              }}
            />

            {/* Accent top bar */}
            <div
              className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
              style={{ background: `linear-gradient(90deg,${gradFrom},${gradTo})` }}
            />

            <p
              className="text-[11.5px] leading-relaxed mb-3 mt-1"
              style={{ color: 'rgba(51,65,85,0.9)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
            >
              {desc}
            </p>

            <div className="space-y-2">
              {points.map((pt, pi) => (
                <motion.div
                  key={pt}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: pi * 0.05, duration: 0.18 }}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-[18px] h-[18px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: colorLight, border: `1px solid ${colorBorder}` }}
                  >
                    <Check size={9} style={{ color }} strokeWidth={3} />
                  </div>
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: 'rgba(15,23,42,0.8)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
                  >
                    {pt}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── The card itself — unchanged size ── */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.94 }}
        animate={inView ? { opacity: 1, y: hovered ? -4 : 0, scale: 1 } : {}}
        transition={{ duration: 0.55, delay, type: 'spring', stiffness: 240, damping: 22 }}
        onAnimationComplete={() => { if (inView) setReady(true) }}
        className="relative cursor-default"
        style={{
          background: hovered ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderRadius: 16,
          border: `1.5px solid ${hovered ? color : colorBorder}`,
          boxShadow: hovered
            ? `0 16px 32px ${color}28, 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`
            : `0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)`,
          overflow: 'hidden',
          transition: 'box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease',
          padding: '16px 18px 14px',
        }}
      >
        {/* Top row: number + badge */}
        <div className="flex items-center justify-between mb-3">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={inView ? { scale: 1, opacity: 1 } : {}}
            transition={{ type: 'spring', stiffness: 380, damping: 18, delay: delay + 0.08 }}
            className="flex items-center justify-center w-9 h-9 rounded-xl text-white font-black text-[13px] flex-shrink-0"
            style={{
              background: `linear-gradient(135deg,${gradFrom},${gradTo})`,
              boxShadow: `0 4px 14px ${color}50`,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
              letterSpacing: '0.5px',
            }}
          >
            {num}
          </motion.div>

          <motion.span
            initial={{ opacity: 0, x: 8 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.32, delay: delay + 0.18 }}
            className="text-[9.5px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              color,
              background: colorLight,
              border: `1px solid ${colorBorder}`,
              fontFamily: "'Plus Jakarta Sans',sans-serif",
            }}
          >
            {badge}
          </motion.span>
        </div>

        {/* Step label */}
        <p
          className="text-[9px] font-bold uppercase tracking-[0.15em] mb-1"
          style={{ color: 'rgba(100,116,139,0.7)', fontFamily: "'Plus Jakarta Sans',sans-serif" }}
        >
          Step {num}
        </p>

        {/* Title */}
        <p
          className="text-[13.5px] font-black text-slate-800 leading-snug"
          style={{ fontFamily: "'Plus Jakarta Sans',sans-serif" }}
        >
          {title}
        </p>

        {/* Bottom gradient accent bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[3px] rounded-b-2xl origin-left"
          style={{ background: `linear-gradient(90deg,${gradFrom},${gradTo})` }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 0.45, delay: delay + 0.38, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
    </div>
  )
}

export const JourneyBanner = () => {
  const bannerRef = useRef<HTMLDivElement>(null)
  const inView = useInView(bannerRef, { once: true, margin: '-8%' })

  return (
    <>
      <section className="container mx-auto px-4 pb-20 pt-16">
        <ScrollReveal direction="up" delay={0} duration={800}>
          {/* overflow-visible so hover tooltips on step cards can escape upward */}
          <div ref={bannerRef} className="relative rounded-3xl bg-gradient-journey p-7 md:p-10" style={{ overflow: 'visible' }}>

            {/* Clipped background layer — world map + plane stay inside banner bounds */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none z-0">
              <div className="absolute inset-0 world-map-bg opacity-50" aria-hidden />
              <img
                src={plane} alt="Airplane in flight"
                width={1280} height={640} loading="lazy"
                className="absolute -right-28 -top-4 z-[1] hidden w-[60%] max-w-[700px] opacity-90 md:block"
              />
            </div>

            {/* ── Header ── */}
            <div className="relative z-[2] flex items-start gap-5 mb-8">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-blue to-accent-purple shadow-elevated">
                <ShieldCheck className="h-8 w-8 text-white" />
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent-green text-white ring-4 ring-card">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <Plane className="absolute -top-2 -right-2 h-5 w-5 -rotate-45 text-white" />
              </span>
              <div className="max-w-md">
                <h3 className="text-3xl font-bold text-navy md:text-4xl">
                  <DiaTextReveal text="Your Journey," colors={['#0A1628','#1e3a5f','#0A1628']} />{' '}
                  <DiaTextReveal text="Our Priority" colors={['#3B82F6','#6366F1','#8B5CF6']} />
                </h3>
                <p className="mt-3 text-sm font-bold text-slate-700 md:text-base">
                  <Highlighter action="highlight" color="#FDE047" strokeWidth={1} animationDuration={900} isView={true}>
                    We simplify the visa process in just 3 simple steps.
                  </Highlighter>
                </p>
              </div>
            </div>

            {/* ── Step Cards Row ── */}
            <div className="relative z-[2] lg:max-w-[64%]">
              <div className="flex flex-col sm:flex-row items-stretch gap-2 sm:gap-0">
                {STEPS.map((step, i) => (
                  <div key={step.num} className="flex flex-col sm:flex-row items-stretch flex-1 min-w-0">

                    {/* Card */}
                    <HoverStepCard
                      step={step}
                      inView={inView}
                      delay={sd[i]}
                    />

                    {/* Connector */}
                    {i < STEPS.length - 1 && (
                      <>
                        <Connector
                          inView={inView}
                          delay={ld[i]}
                          fromColor={STEPS[i].color}
                          toColor={STEPS[i + 1].color}
                        />
                        {/* Mobile vertical connector */}
                        <div className="flex sm:hidden justify-center h-6 relative my-0.5">
                          <div className="relative w-[1.5px] h-full" style={{ background: 'rgba(0,0,0,0.1)' }}>
                            <motion.div
                              className="absolute inset-x-0 top-0 rounded-full origin-top"
                              style={{ background: `linear-gradient(180deg,${STEPS[i].color},${STEPS[i+1].color})` }}
                              initial={{ scaleY: 0 }}
                              animate={inView ? { scaleY: 1 } : {}}
                              transition={{ duration: 0.35, delay: ld[i] }}
                            />
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

          </div>
        </ScrollReveal>
      </section>
    </>
  )
}

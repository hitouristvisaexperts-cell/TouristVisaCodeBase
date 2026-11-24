import { motion } from 'motion/react'
import {
  Globe, Footprints, FileCheck2, BellRing, Luggage,
  HelpCircle, FileWarning, Clock, AlertTriangle,
  Plane, UserCircle2, ShieldCheck,
} from 'lucide-react'
import { useNavigation } from '../../context/NavigationContext'
import withExpertsImg from '../../assets/dest-usa-couple.jpg'
import onYourOwnImg from '../../assets/why-on-your-own.jpg'

// Wording set by the client (Oct 2026)
const WITH_US = [
  { icon: Globe,      label: 'Requirements',        status: 'Always Up to Date' },
  { icon: Footprints, label: 'Guidance',            status: 'From Start to Submission' },
  { icon: FileCheck2, label: 'Application Review',  status: 'Checked Before You Apply' },
  { icon: BellRing,   label: 'Application Progress', status: 'We Keep You Updated' },
  { icon: Luggage,    label: 'Travel Plans',        status: 'You Focus, We Handle' },
]

const ON_YOUR_OWN = [
  { icon: HelpCircle,    label: 'Requirements',         status: 'Easy to Miss' },
  { icon: FileWarning,   label: 'Guidance',             status: 'Research & Confusion' },
  { icon: Clock,         label: 'Application Review',   status: 'Mistakes Can Go Unnoticed' },
  { icon: AlertTriangle, label: 'Application Progress', status: 'Easy to Lose Track' },
  { icon: Plane,         label: 'Travel Plans',         status: 'Delays Can Happen' },
]

/* Circular framed photo with a rotating dashed ring, pulsing glow, and a subtle float. */
function FramedPhoto({ src, alt, glow, badge, badgeColor }: { src: string; alt: string; glow: string; badge: string; badgeColor: string }) {
  return (
    <div className="relative group shrink-0 mx-auto">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-[-14%] rounded-full border border-dashed border-white/10"
      />
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 rounded-full blur-2xl opacity-40"
        style={{ background: glow }}
      />

      <div className="relative h-44 w-44 md:h-52 md:w-52 rounded-full border border-white/5 shadow-2xl flex items-center justify-center overflow-hidden bg-black/20 backdrop-blur-sm">
        <motion.div
          animate={{ y: [-6, 6, -6] }}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
          className="relative z-10 w-full h-full flex items-center justify-center"
        >
          <img src={src} alt={alt} className="w-full h-full object-cover" draggable={false} />
        </motion.div>
      </div>

      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-zinc-300 bg-zinc-950/90 px-3.5 py-1.5 rounded-full border border-white/10 backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: badgeColor }} />
          {badge}
        </div>
      </div>
    </div>
  )
}

export default function DestinationShowcase() {
  const { openVisaAssistance, openRejectedVisa } = useNavigation()

  return (
    <section className="relative w-full bg-zinc-950 text-zinc-100 overflow-hidden py-16">
      {/* Ambient glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-0 w-[28rem] h-[28rem] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle,#10B981,transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] rounded-full opacity-20 blur-[100px]" style={{ background: 'radial-gradient(circle,#EF4444,transparent 70%)' }} />
      </div>

      {/* Section header */}
      <div className="relative z-10 text-center mb-10 px-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-zinc-500 mb-3">
          Why Choose Us
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white">
          Expert Guidance at{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Every Step
          </span>
        </h2>
        <p className="mt-3 text-zinc-400 text-sm max-w-2xl mx-auto leading-relaxed">
          Our experts stay up to date with the latest embassy requirements and guide you step by step,
          review your documents, follow up when needed, and keep your application moving — so you can
          focus on your travel plans.
        </p>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-8 md:gap-6">
          {/* ── With Tourist Visa Experts ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.04] p-6 md:p-7 pt-10"
          >
            <FramedPhoto
              src={withExpertsImg}
              alt="Travellers with Tourist Visa Experts"
              glow="radial-gradient(circle,#10B981,transparent 70%)"
              badge="You Focus on Your Journey"
              badgeColor="#10B981"
            />

            <div className="mt-8 text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400 mb-2">
                With Tourist Visa Experts
              </p>
              <h3 className="text-2xl font-black text-white mb-1.5">We Guide. You Travel.</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                From preparation to submission, our experts are with you at every step.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              {WITH_US.map(({ icon: Icon, label, status }) => (
                <div key={label} className="flex items-center gap-3.5 py-2.5 border-b border-white/5 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-200 flex-1">{label}</span>
                  <span className="text-xs font-medium text-emerald-400/90 text-right">{status}</span>
                </div>
              ))}
            </div>

            <button
              onClick={openVisaAssistance}
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#10B981 0%,#3B82F6 100%)' }}
            >
              <Plane className="w-4 h-4" /> Start My Visa Application
            </button>
          </motion.div>

          {/* ── Applying On Your Own ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6 md:p-7 pt-10"
          >
            <FramedPhoto
              src={onYourOwnImg}
              alt="Applicant struggling to manage visa paperwork alone"
              glow="radial-gradient(circle,#EF4444,transparent 70%)"
              badge="Time-Consuming & Stressful"
              badgeColor="#EF4444"
            />

            <div className="mt-8 text-center md:text-left">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-red-400 mb-2">
                Applying On Your Own
              </p>
              <h3 className="text-2xl font-black text-white mb-1.5">Managing Everything Yourself.</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                Doing it on your own can be confusing, time-consuming, and may lead to avoidable mistakes.
              </p>
            </div>

            <div className="flex flex-col gap-1">
              {ON_YOUR_OWN.map(({ icon: Icon, label, status }) => (
                <div key={label} className="flex items-center gap-3.5 py-2.5 border-b border-white/5 last:border-0">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-red-400" />
                  </div>
                  <span className="text-sm font-semibold text-zinc-200 flex-1">{label}</span>
                  <span className="text-xs font-medium text-red-400/80 text-right">{status}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => openRejectedVisa()}
              className="mt-6 w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 bg-zinc-800 border border-white/10 hover:bg-zinc-700 transition-colors"
            >
              <UserCircle2 className="w-4 h-4" /> See What You Need to Know
            </button>
          </motion.div>
        </div>

        {/* Bottom banner */}
        <div className="mt-6 flex items-center justify-center gap-2.5 text-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <p className="text-xs md:text-sm text-zinc-300 font-medium">
            One well-prepared application is always better than correcting a refused one later.
          </p>
        </div>
      </div>
    </section>
  )
}

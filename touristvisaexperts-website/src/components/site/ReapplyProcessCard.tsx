import { FileSearch, ClipboardList, Plane } from 'lucide-react'
import MagicBento from '../MagicBento'

/* "Our Process" — the 3 re-application steps, in the same glowing card style as the
   "Why Choose Us / What We Handle" cards on the visa pages. Used in the hero of the
   Visa Rejected and Refund Guarantee pages. */
const STEPS = [
  { Icon: FileSearch, color: '#F97316', title: 'Review your refusal', desc: 'We analyse the reasons and assess your options.' },
  { Icon: ClipboardList, color: '#3B82F6', title: 'Strengthen your file', desc: 'We help you fix the issues and prepare a stronger application.' },
  { Icon: Plane, color: '#22C55E', title: 'Reapply with support', desc: 'Reapply with senior specialist guidance throughout.' },
] as const

// layout 'stack': steps one under another (hero column) · 'row': full-width card, steps side by side
export function ReapplyProcessCard({ id, className = '', layout = 'stack' }: { id?: string; className?: string; layout?: 'stack' | 'row' }) {
  const row = layout === 'row'
  const card = {
    color: 'rgba(248,250,252,0.94)',
    customContent: (
      <div className="flex flex-col gap-4">
        <div className="inline-flex items-center gap-1.5 self-start rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-orange-600">
          Our Process
        </div>
        <h2 className={`font-black leading-snug text-slate-900 ${row ? 'text-xl sm:text-2xl' : 'text-xl'}`}>
          Three Steps to a{row ? ' ' : <br />}
          <span className="bento-shimmer">Stronger Application.</span>
        </h2>
        <ol className={row ? 'grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4' : 'space-y-3'}>
          {STEPS.map(({ Icon, color, title, desc }, i) => (
            <li key={title} className={`flex gap-3 rounded-xl border p-3 ${row ? 'items-center md:flex-col md:items-start md:p-4' : 'items-center'}`} style={{ background: `${color}08`, borderColor: `${color}25` }}>
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl" style={{ background: `${color}18`, border: `1.5px solid ${color}45` }}>
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color }}>Step 0{i + 1}</p>
                <p className="text-sm font-extrabold leading-tight text-slate-800">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    ),
  }
  return (
    <div id={id} className={`bento-auto ${className}`}>
      <MagicBento textAutoHide={false} enableStars enableSpotlight enableBorderGlow enableTilt={false} enableMagnetism
        clickEffect spotlightRadius={300} particleCount={12} glowColor="132, 0, 255" cards={[card]} />
    </div>
  )
}

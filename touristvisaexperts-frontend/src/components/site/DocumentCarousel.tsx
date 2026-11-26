import { useState, useEffect, useCallback } from "react"
import passportSample from "@/assets/passport-sample.jpg"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

const DOC_ITEMS = [
  {
    id: "hotel",
    label: "Accommodation Proof",
    color: "#22C55E",
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop",
    description: "Hotel bookings or host invitation letters confirming your stay throughout the trip.",
  },
  {
    id: "form",
    label: "Application Form",
    color: "#3B82F6",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=1200&auto=format&fit=crop",
    description: "Accurately filled visa application forms — no errors, no rejections due to clerical mistakes.",
  },
  {
    id: "bank",
    label: "Bank Statements",
    color: "#3B82F6",
    image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&auto=format&fit=crop",
    description: "Last 3 months of bank statements showing sufficient funds to support your travel.",
  },
  {
    id: "cover",
    label: "Cover Letter",
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1200&auto=format&fit=crop",
    description: "A professionally drafted cover letter tailored to your itinerary and embassy requirements.",
  },
  {
    id: "employment",
    label: "Employment Proof",
    color: "#8B5CF6",
    image: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1200&auto=format&fit=crop",
    description: "Employment letter, leave approval, or business registration documents as applicable.",
  },
  {
    id: "photos",
    label: "Passport-size Photos",
    color: "#EC4899",
    image: passportSample,
    description: "Recent passport-size photographs meeting exact embassy specifications for your destination.",
  },
  {
    id: "insurance",
    label: "Travel Insurance",
    color: "#F97316",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1200&auto=format&fit=crop",
    description: "Comprehensive travel insurance covering medical emergencies for the full duration of stay.",
  },
  {
    id: "itinerary",
    label: "Travel Itinerary",
    color: "#14B8A6",
    image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1200&auto=format&fit=crop",
    description: "Day-by-day travel plan with flight reservations and entry/exit dates clearly outlined.",
  },
  {
    id: "passport",
    label: "Valid Passport",
    color: "#F97316",
    image: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop",
    description: "Passport with at least 6 months validity beyond your travel dates and 2 blank visa pages.",
  },
]

const AUTO_PLAY_INTERVAL = 3200
const ITEM_HEIGHT = 64

const wrap = (min: number, max: number, v: number) => {
  const s = max - min
  return ((((v - min) % s) + s) % s) + min
}

export function DocumentCarousel({ exclude = [] }: { exclude?: string[] } = {}) {
  // Some destinations don't need every standard document (e.g. no travel insurance for the UK)
  const ITEMS = DOC_ITEMS.filter(d => !exclude.includes(d.label))
  const [step, setStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const total = ITEMS.length
  const currentIndex = ((step % total) + total) % total

  const nextStep = useCallback(() => setStep(p => p + 1), [])

  const handleChipClick = (index: number) => {
    const diff = (index - currentIndex + total) % total
    if (diff > 0) setStep(s => s + diff)
  }

  useEffect(() => {
    if (isPaused) return
    const id = setInterval(nextStep, AUTO_PLAY_INTERVAL)
    return () => clearInterval(id)
  }, [nextStep, isPaused])

  const getCardStatus = (index: number) => {
    const diff = index - currentIndex
    const len = total
    let d = diff
    if (diff > len / 2) d -= len
    if (diff < -len / 2) d += len
    if (d === 0) return "active"
    if (d === -1) return "prev"
    if (d === 1) return "next"
    return "hidden"
  }

  return (
    <div className="relative overflow-hidden rounded-2xl flex flex-col lg:flex-row"
      style={{ background: '#fff', border: '2px solid #CBD5E1', boxShadow: '0 4px 24px 0 rgba(15,23,42,0.10)' }}>

      {/* ── Left: scrolling label list ── */}
      <div className="w-full lg:w-[44%] relative flex flex-col items-start justify-center overflow-hidden px-4 lg:px-7 py-12 lg:py-14"
        style={{ minHeight: 360, background: 'linear-gradient(160deg,#F0F4FF 0%,#EBF0FA 100%)', borderRight: '2px solid #CBD5E1' }}>

        {/* top/bottom fade */}
        <div className="absolute inset-x-0 top-0 h-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom,#F0F4FF,transparent)' }} />
        <div className="absolute inset-x-0 bottom-0 h-20 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to top,#EBF0FA,transparent)' }} />

        {/* header */}
        <div className="absolute top-0 inset-x-0 z-20 px-5 lg:px-7 py-4"
          style={{ borderBottom: '1.5px solid #1E293B', background: 'linear-gradient(135deg,#0F172A 0%,#1E293B 100%)' }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-white text-[10.5px] font-black uppercase tracking-[0.18em]">Documents Required</span>
            <span className="ml-auto bg-white/10 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums border border-white/20">
              {total} docs
            </span>
          </div>
        </div>

        {/* scrolling items */}
        <div className="relative w-full h-full flex items-center justify-start z-0">
          {ITEMS.map((doc, index) => {
            const dist = index - currentIndex
            const wrapped = wrap(-(total / 2), total / 2, dist)
            const isActive = index === currentIndex
            return (
              <motion.div
                key={doc.id}
                style={{ height: ITEM_HEIGHT, width: "100%" }}
                animate={{
                  y: wrapped * ITEM_HEIGHT,
                  opacity: 1 - Math.abs(wrapped) * 0.2,
                  scale: isActive ? 1 : 0.97,
                }}
                transition={{ type: "spring", stiffness: 90, damping: 22, mass: 1 }}
                className="absolute flex items-center"
              >
                <button
                  onClick={() => handleChipClick(index)}
                  onMouseEnter={() => setIsPaused(true)}
                  onMouseLeave={() => setIsPaused(false)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all duration-300 text-left overflow-hidden relative",
                    isActive
                      ? "text-white shadow-[0_6px_24px_rgba(249,115,22,0.40)]"
                      : "bg-white text-slate-700 hover:shadow-md"
                  )}
                  style={isActive
                    ? { background: 'linear-gradient(135deg,#F97316,#FB923C)', border: '2px solid #F97316' }
                    : { border: '1.5px solid #94A3B8' }
                  }
                >
                  {/* color accent bar on inactive */}
                  {!isActive && (
                    <span className="absolute left-0 inset-y-0 w-[3px] rounded-l-xl"
                      style={{ background: doc.color }} />
                  )}
                  {/* Number badge */}
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-[13px] tabular-nums transition-all duration-300",
                    isActive ? "bg-white/25 text-white" : ""
                  )}
                    style={!isActive ? { background: `${doc.color}18`, border: `1.5px solid ${doc.color}55`, color: doc.color } : {}}>
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <span className={cn(
                    "font-semibold tracking-tight truncate flex-1",
                    isActive ? "text-[14.5px] text-white" : "text-[13px] text-slate-800"
                  )}>{doc.label}</span>
                  {isActive && (
                    <motion.div layoutId="doc-active-dot"
                      className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                  )}
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* ── Right: image card carousel ── */}
      <div className="flex-1 relative flex items-center justify-center py-8 lg:py-10 px-4 overflow-hidden"
        style={{ minHeight: 340, background: '#F8FAFC' }}>
        {/* subtle grid pattern */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ backgroundImage: 'radial-gradient(#CBD5E1 1px,transparent 1px)', backgroundSize: '22px 22px', opacity: 0.35 }} />

        {/* card stack */}
        <div className="relative" style={{ width: 280, height: 380 }}>
          {ITEMS.map((doc, index) => {
            const status = getCardStatus(index)
            const isActive = status === "active"
            const isPrev  = status === "prev"
            const isNext  = status === "next"

            return (
              <motion.div
                key={doc.id}
                initial={false}
                animate={{
                  x:       isActive ? 0 : isPrev ? -72 : isNext ? 72 : 0,
                  scale:   isActive ? 1 : isPrev || isNext ? 0.87 : 0.72,
                  opacity: isActive ? 1 : isPrev || isNext ? 0.42 : 0,
                  rotate:  isPrev ? -5 : isNext ? 5 : 0,
                  zIndex:  isActive ? 20 : isPrev || isNext ? 10 : 0,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 26, mass: 0.8 }}
                className="absolute inset-0 rounded-[1.5rem] overflow-hidden bg-white origin-center"
                style={{
                  pointerEvents: isActive ? "auto" : "none",
                  border: isActive ? `4px solid ${doc.color}` : '4px solid #e2e8f0',
                  boxShadow: isActive ? `0 16px 48px rgba(0,0,0,0.22), 0 0 0 1px ${doc.color}33` : '0 8px 24px rgba(0,0,0,0.10)',
                }}
              >
                <img
                  src={doc.image}
                  alt={doc.label}
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-all duration-700",
                    isActive ? "grayscale-0" : "grayscale blur-[2px] brightness-70"
                  )}
                />

                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-x-0 bottom-0 px-4 pb-5 pt-16 pointer-events-none"
                      style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.92) 0%,rgba(0,0,0,0.55) 60%,transparent 100%)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 font-black text-[12px] tabular-nums"
                          style={{ background: `${doc.color}35`, border: `1.5px solid ${doc.color}`, color: doc.color }}>
                          {String(currentIndex + 1).padStart(2, '0')}
                        </div>
                        <span className="text-white text-[11px] font-black uppercase tracking-[0.14em]">{doc.label}</span>
                      </div>
                      <p className="text-white/85 font-medium text-[12.5px] leading-snug">{doc.description}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {isActive && (
                  <div className="absolute top-3 right-3 text-white text-[11px] font-bold px-2.5 py-1 rounded-full tabular-nums backdrop-blur-sm"
                    style={{ background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    {currentIndex + 1} / {total}
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>

        {/* dot pagination */}
        <div className="absolute bottom-5 left-0 right-0 flex items-center justify-center gap-2">
          {ITEMS.map((_, i) => (
            <button
              key={i}
              onClick={() => handleChipClick(i)}
              className="rounded-full transition-all duration-300"
              style={i === currentIndex
                ? { width: 20, height: 6, background: '#F97316' }
                : { width: 6, height: 6, background: '#94A3B8' }
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}

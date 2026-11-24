import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import { ArrowRight, FileSearch, X } from 'lucide-react'

/* Passport with a globe — the "First Time Visa" icon from the Canva design */
function PassportIcon() {
  return (
    <svg viewBox="0 0 40 48" className="h-9 w-8 sm:h-11 sm:w-9" aria-hidden="true">
      <rect x="2" y="2" width="34" height="44" rx="4" fill="#F97316" />
      <rect x="6" y="2" width="30" height="44" rx="4" fill="#FB923C" opacity=".35" />
      <circle cx="20" cy="21" r="8.5" fill="none" stroke="#fff" strokeWidth="2" />
      <ellipse cx="20" cy="21" rx="3.6" ry="8.5" fill="none" stroke="#fff" strokeWidth="1.6" />
      <path d="M11.5 21h17M12.6 16.5h14.8M12.6 25.5h14.8" stroke="#fff" strokeWidth="1.4" />
      <rect x="12" y="36" width="16" height="2.4" rx="1.2" fill="#fff" />
    </svg>
  )
}

type Props = {
  open: boolean
  onClose: () => void
  onFirstTime: () => void   // "Start My Application"
  onRejected: () => void    // "Review My Rejection"
}

/* "Where are you in your visa journey?" — asked when the visitor clicks
   "Get Your Visa Or Full Refund" on a visa page (Canva design, Oct 2026). */
export function JourneyPopup({ open, onClose, onFirstTime, onRejected }: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey) }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[#0A1628]/45 p-4 backdrop-blur-[3px]"
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }} role="dialog" aria-modal="true" aria-labelledby="journey-title">
      <motion.div initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.25 }}
        className="relative max-h-[92vh] w-full max-w-[600px] overflow-y-auto rounded-3xl bg-white px-5 pb-6 pt-5 shadow-[0_30px_80px_-20px_rgba(10,22,40,0.5)] sm:px-8">
        <div className="flex items-start justify-between">
          <img src="/logo.png" alt="Tourist Visa Experts" className="h-9 w-auto" />
          <button type="button" onClick={onClose} aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-3 text-center">
          <span className="inline-block rounded-full bg-orange-50 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-orange-600">Let's get you started</span>
          <h2 id="journey-title" className="mt-3 text-[24px] font-black leading-tight tracking-tight text-[#0A1628] sm:text-[30px]">Where are you in your visa journey?</h2>
          <p className="mt-1.5 text-[14.5px] text-slate-500">Choose an option so we can guide you to the right support.</p>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:mt-6 sm:grid-cols-2 sm:gap-4">
          {/* First time */}
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 rounded-2xl border border-orange-200 bg-white p-4 text-left shadow-[0_10px_28px_-16px_rgba(249,115,22,0.45)] sm:flex sm:flex-col sm:items-center sm:p-5 sm:text-center">
            <span className="row-span-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 sm:h-16 sm:w-16"><PassportIcon /></span>
            <h3 className="text-[17px] font-black text-[#0A1628] sm:mt-3 sm:text-[18px]">First Time Visa</h3>
            <p className="mt-0.5 flex-1 text-[13px] leading-relaxed text-slate-500 sm:mt-1 sm:text-[13.5px]">Applying for the first time? Get help with requirements, documents and your application.</p>
            <button type="button" onClick={onFirstTime}
              className="col-span-2 mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 py-3 text-[14px] font-black text-white shadow-[0_8px_20px_rgba(249,115,22,0.35)] hover:bg-orange-600">
              Start My Application <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {/* Rejected */}
          <div className="grid grid-cols-[auto_1fr] items-start gap-x-3 rounded-2xl border border-slate-200 bg-white p-4 text-left sm:flex sm:flex-col sm:items-center sm:p-5 sm:text-center">
            <span className="row-span-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 sm:h-16 sm:w-16"><FileSearch className="h-7 w-7 sm:h-8 sm:w-8" /></span>
            <h3 className="text-[17px] font-black text-[#0A1628] sm:mt-3 sm:text-[18px]">Visa Rejected</h3>
            <p className="mt-0.5 flex-1 text-[13px] leading-relaxed text-slate-500 sm:mt-1 sm:text-[13.5px]">Had a visa refused? Get your refusal reasons reviewed and guidance on your next steps.</p>
            <button type="button" onClick={onRejected}
              className="col-span-2 mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0A1F44] py-3 text-[14px] font-black text-white hover:bg-[#13295a]">
              Review My Rejection <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

      </motion.div>
    </div>,
    document.body,
  )
}

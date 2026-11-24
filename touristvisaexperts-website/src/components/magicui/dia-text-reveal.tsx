import { useEffect, useRef, useState } from 'react'

interface DiaTextRevealProps {
  text: string
  colors?: string[]
  className?: string
}

/**
 * Magic UI – DiaTextReveal
 * Characters animate in diagonally with staggered delay,
 * each tinted across the provided color stops.
 */
export function DiaTextReveal({
  text,
  colors = ['#A97CF8', '#F38CB8', '#FDCC92'],
  className = '',
}: DiaTextRevealProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const chars = text.split('')
  const total = chars.length

  /* Build a per-character colour by interpolating across the stops */
  const getColor = (i: number): string => {
    if (colors.length === 1) return colors[0]
    const t = i / Math.max(total - 1, 1)           // 0 → 1
    const scaled = t * (colors.length - 1)
    const lo = Math.floor(scaled)
    const hi = Math.min(lo + 1, colors.length - 1)
    const frac = scaled - lo
    return lerpHex(colors[lo], colors[hi], frac)
  }

  return (
    <span ref={ref} className={`inline-block ${className}`} aria-label={text}>
      {chars.map((ch, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            display: 'inline-block',
            color: getColor(i),
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) rotate(0deg)' : 'translateY(0.4em) rotate(-4deg)',
            transition: `opacity 0.5s ease ${i * 38}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${i * 38}ms`,
            whiteSpace: ch === ' ' ? 'pre' : 'normal',
          }}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </span>
  )
}

/* ── helpers ── */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = hexToRgb(a)
  const [br, bg, bb] = hexToRgb(b)
  const r = Math.round(ar + (br - ar) * t)
  const g = Math.round(ag + (bg - ag) * t)
  const bl = Math.round(ab + (bb - ab) * t)
  return `rgb(${r},${g},${bl})`
}

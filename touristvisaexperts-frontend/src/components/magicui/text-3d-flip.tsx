import { useEffect, useRef, useState } from 'react'

interface Text3DFlipProps {
  children: string
  className?: string
  rotateDirection?: 'top' | 'bottom'
  staggerDuration?: number
  staggerFrom?: 'first' | 'last' | 'center'
  /** unused — kept for API compatibility with Magic UI demo */
  textClassName?: string
  flipTextClassName?: string
  transition?: object
}

/**
 * Text3DFlip — each character flips in on a 3-D X-axis rotation
 * when the element enters the viewport.
 * No external dependencies — uses IntersectionObserver + CSS transitions.
 */
export default function Text3DFlip({
  children,
  className = '',
  rotateDirection = 'top',
  staggerDuration = 0.04,
  staggerFrom = 'first',
}: Text3DFlipProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.25 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const chars = Array.from(children)
  const len = chars.length

  const getDelay = (i: number): number => {
    if (staggerFrom === 'last')   return (len - 1 - i) * staggerDuration
    if (staggerFrom === 'center') return Math.abs(i - Math.floor(len / 2)) * staggerDuration
    return i * staggerDuration // 'first' (default)
  }

  const rotateFrom = rotateDirection === 'top' ? 'rotateX(-80deg)' : 'rotateX(80deg)'

  return (
    <span ref={ref} className={`inline-flex flex-wrap ${className}`} aria-label={children}>
      {chars.map((char, i) => (
        <span
          key={i}
          aria-hidden
          style={{ display: 'inline-block', perspective: '800px' }}
        >
          <span
            style={{
              display: 'inline-block',
              transform: visible ? 'rotateX(0deg)' : rotateFrom,
              opacity: visible ? 1 : 0,
              transition: [
                `transform 0.65s cubic-bezier(0.22,1,0.36,1) ${getDelay(i).toFixed(3)}s`,
                `opacity   0.45s ease                         ${getDelay(i).toFixed(3)}s`,
              ].join(', '),
              whiteSpace: char === ' ' ? 'pre' : 'normal',
              transformOrigin: rotateDirection === 'top' ? 'bottom center' : 'top center',
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        </span>
      ))}
    </span>
  )
}

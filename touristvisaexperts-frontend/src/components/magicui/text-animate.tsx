import { useEffect, useRef, useState } from 'react'

type Animation = 'blurInUp' | 'fadeIn' | 'slideUp'
type By = 'character' | 'word'

interface TextAnimateProps {
  children: string
  animation?: Animation
  by?: By
  once?: boolean
  className?: string
  delay?: number        // base delay in ms
  stagger?: number      // ms between each token
}

const ANIMATIONS: Record<Animation, { hidden: React.CSSProperties; visible: React.CSSProperties }> = {
  blurInUp: {
    hidden:  { opacity: 0, filter: 'blur(10px)', transform: 'translateY(18px)' },
    visible: { opacity: 1, filter: 'blur(0px)',  transform: 'translateY(0px)' },
  },
  fadeIn: {
    hidden:  { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden:  { opacity: 0, transform: 'translateY(24px)' },
    visible: { opacity: 1, transform: 'translateY(0px)' },
  },
}

export function TextAnimate({
  children,
  animation = 'blurInUp',
  by = 'character',
  once = true,
  className = '',
  delay = 0,
  stagger = 35,
}: TextAnimateProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          if (once) obs.disconnect()
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold: 0.2 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [once])

  const anim = ANIMATIONS[animation]
  const tokens: string[] = by === 'character' ? children.split('') : children.split(' ')

  return (
    <span ref={ref} className={`inline-block ${className}`} aria-label={children}>
      {tokens.map((token, i) => {
        const isSpace = token === ' '
        return (
          <span
            key={i}
            aria-hidden
            style={{
              display: 'inline-block',
              whiteSpace: isSpace ? 'pre' : undefined,
              ...(visible ? anim.visible : anim.hidden),
              transition: `opacity 0.5s ease ${delay + i * stagger}ms, filter 0.5s ease ${delay + i * stagger}ms, transform 0.55s cubic-bezier(0.22,1,0.36,1) ${delay + i * stagger}ms`,
            }}
          >
            {isSpace ? '\u00A0' : token}
            {by === 'word' && i < tokens.length - 1 ? '\u00A0' : ''}
          </span>
        )
      })}
    </span>
  )
}

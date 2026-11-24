import { useEffect, useRef, ReactNode } from 'react'

interface ScrollRevealProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  duration?: number
  threshold?: number
  once?: boolean
}

/**
 * ScrollReveal – wraps children and animates them into view on scroll.
 * Uses IntersectionObserver + CSS transitions (no GSAP dep needed here).
 */
export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  direction = 'up',
  duration = 700,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  const initial: Record<string, string> = {
    up:    'translateY(48px)',
    down:  'translateY(-48px)',
    left:  'translateX(-48px)',
    right: 'translateX(48px)',
    fade:  'translateY(0px)',
  }

  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.style.opacity = '0'
    el.style.transform = initial[direction]
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms, transform ${duration}ms cubic-bezier(0.22,1,0.36,1) ${delay}ms`

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translate(0,0)'
          if (once) obs.disconnect()
        } else if (!once) {
          el.style.opacity = '0'
          el.style.transform = initial[direction]
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [delay, direction, duration, once, threshold])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/** Stagger children sequentially */
export function StaggerReveal({
  children,
  className = '',
  baseDelay = 0,
  stagger = 120,
  direction = 'up',
  duration = 650,
}: {
  children: ReactNode[]
  className?: string
  baseDelay?: number
  stagger?: number
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade'
  duration?: number
}) {
  return (
    <div className={className}>
      {(children as ReactNode[]).map((child, i) => (
        <ScrollReveal key={i} delay={baseDelay + i * stagger} direction={direction} duration={duration}>
          {child}
        </ScrollReveal>
      ))}
    </div>
  )
}

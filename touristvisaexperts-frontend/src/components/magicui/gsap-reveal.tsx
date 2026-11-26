import { useEffect, useRef, ReactNode } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

interface GSAPRevealProps {
  children: ReactNode
  className?: string
  from?: gsap.TweenVars
  delay?: number
  duration?: number
  scrub?: boolean
  markers?: boolean
}

/**
 * GSAPReveal – uses GSAP ScrollTrigger to animate children on scroll.
 */
export function GSAPReveal({
  children,
  className = '',
  from = { opacity: 0, y: 50 },
  delay = 0,
  duration = 0.9,
}: GSAPRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from(el, {
        ...from,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none none',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [delay, duration])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/**
 * GSAPStagger – animates a list of children with staggered entrance.
 */
export function GSAPStagger({
  children,
  className = '',
  itemSelector = '[data-gsap-item]',
  from = { opacity: 0, y: 40 },
  stagger = 0.12,
  duration = 0.8,
}: {
  children: ReactNode
  className?: string
  itemSelector?: string
  from?: gsap.TweenVars
  stagger?: number
  duration?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const ctx = gsap.context(() => {
      gsap.from(itemSelector, {
        ...from,
        duration,
        stagger,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      })
    }, el)

    return () => ctx.revert()
  }, [stagger, duration, itemSelector])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}

/**
 * Initializes GSAP smooth scroll behavior using native CSS scroll-behavior
 * and GSAP's built-in momentum via ScrollTrigger.
 */
export function initGSAPSmoothScroll() {
  // GSAP handles scroll natively, just ensure ScrollTrigger is refreshed on resize
  ScrollTrigger.addEventListener('refreshInit', () => ScrollTrigger.refresh())
}

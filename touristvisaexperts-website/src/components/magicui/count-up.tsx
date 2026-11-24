import { useEffect, useRef, useState } from 'react'

interface CountUpProps {
  end: number | string
  duration?: number
  suffix?: string
  prefix?: string
  className?: string
  /** If provided, animation only starts when this is true (parent controls trigger) */
  start?: boolean
}

export function CountUp({
  end,
  duration = 1800,
  suffix = '',
  prefix = '',
  className = '',
  start: externalStart,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [display, setDisplay] = useState('0')
  const [started, setStarted] = useState(false)

  const numericStr = String(end).replace(/[^0-9.]/g, '')
  const target = parseFloat(numericStr) || 0
  const isFloat = numericStr.includes('.')
  const decimals = isFloat ? (numericStr.split('.')[1]?.length ?? 0) : 0

  // If externalStart is provided, use it; otherwise use IntersectionObserver
  useEffect(() => {
    if (externalStart !== undefined) {
      if (externalStart && !started) setStarted(true)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          obs.disconnect()
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -30px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [started, externalStart])

  useEffect(() => {
    if (!started) return
    let startTime: number | null = null
    const step = (ts: number) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 4)
      const current = eased * target
      setDisplay(
        isFloat
          ? current.toFixed(decimals)
          : Math.floor(current).toLocaleString()
      )
      if (progress < 1) requestAnimationFrame(step)
      else setDisplay(isFloat ? target.toFixed(decimals) : target.toLocaleString())
    }
    requestAnimationFrame(step)
  }, [started, target, duration, isFloat, decimals])

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  )
}

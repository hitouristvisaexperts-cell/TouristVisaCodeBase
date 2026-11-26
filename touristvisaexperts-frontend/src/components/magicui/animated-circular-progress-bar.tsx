import { useEffect, useRef, useState } from 'react'

interface AnimatedCircularProgressBarProps {
  /** Target value (0–max) */
  value: number
  max?: number
  min?: number
  gaugePrimaryColor?: string
  gaugeSecondaryColor?: string
  className?: string
  /** Label shown inside. Defaults to `${value}%` */
  label?: string
  size?: number
  strokeWidth?: number
}

/**
 * AnimatedCircularProgressBar — SVG gauge that animates from 0 → value
 * when it enters the viewport. No external dependencies.
 */
export function AnimatedCircularProgressBar({
  value,
  max = 100,
  min = 0,
  gaugePrimaryColor = '#F97316',
  gaugeSecondaryColor = 'rgba(255,255,255,0.12)',
  className = '',
  label,
  size = 110,
  strokeWidth = 9,
}: AnimatedCircularProgressBarProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(0)

  // Animate to value once in viewport
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        obs.disconnect()
        const start = performance.now()
        const duration = 1600
        const from = 0
        const to = Math.max(min, Math.min(max, value))
        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1)
          const eased = 1 - Math.pow(1 - t, 4) // ease-out-quart
          setDisplay(Math.round(from + (to - from) * eased))
          if (t < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [value, min, max])

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (display - min) / (max - min)
  const dashoffset = circumference * (1 - progress)

  return (
    <div
      ref={wrapRef}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugeSecondaryColor}
          strokeWidth={strokeWidth}
        />
        {/* progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={gaugePrimaryColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 0.05s linear' }}
        />
      </svg>

      {/* center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span
          className="font-black tabular-nums"
          style={{ fontSize: size * 0.22, color: gaugePrimaryColor }}
        >
          {label ?? `${display}%`}
        </span>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState, Children, ReactNode } from 'react'

interface AnimatedListProps {
  children: ReactNode
  className?: string
  delay?: number
}

/**
 * AnimatedList – streams items in one at a time (newest on top),
 * then resets and loops. Pure React + CSS, no external deps.
 */
export function AnimatedList({ children, className = '', delay = 1400 }: AnimatedListProps) {
  const items = Children.toArray(children)
  const [count, setCount] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      setCount(c => (c >= items.length ? 1 : c + 1))
    }, delay)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [count, items.length, delay])

  const visible = items.slice(0, count).reverse()

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <style>{`
        @keyframes al-slide-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
      {visible.map((item, i) => (
        <div
          // Key by the item's own position so existing rows stay mounted; only the new row animates
          key={count - 1 - i}
          style={{
            animation: i === 0 ? 'al-slide-in 0.45s cubic-bezier(0.22,1,0.36,1) both' : undefined,
          }}
        >
          {item}
        </div>
      ))}
    </div>
  )
}

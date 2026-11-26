import { useRef, useEffect, useState, useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { SplitText as GSAPSplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, GSAPSplitText, useGSAP)

interface SplitTextProps {
  text: string
  className?: string
  delay?: number
  duration?: number
  ease?: string
  splitType?: string
  from?: Record<string, unknown>
  to?: Record<string, unknown>
  threshold?: number
  rootMargin?: string
  textAlign?: string
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
  onLetterAnimationComplete?: () => void
}

const SplitText = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}: SplitTextProps) => {
  const ref = useRef<HTMLElement>(null)
  const animationCompletedRef = useRef(false)
  const onCompleteRef = useRef(onLetterAnimationComplete)
  const [fontsLoaded, setFontsLoaded] = useState(false)

  useEffect(() => {
    onCompleteRef.current = onLetterAnimationComplete
  }, [onLetterAnimationComplete])

  useEffect(() => {
    if (document.fonts.status === 'loaded') {
      setFontsLoaded(true)
    } else {
      document.fonts.ready.then(() => setFontsLoaded(true))
    }
  }, [])

  // Guaranteed synchronous cleanup on unmount — prevents React's removeChild
  // crash when GSAP SplitText has replaced the text node with span wrappers
  // and React's fiber still references the original text node.
  useLayoutEffect(() => {
    return () => {
      const el = ref.current as (HTMLElement & { _rbsplitInstance?: any }) | null
      if (!el) return
      ScrollTrigger.getAll().forEach(st => { if (st.trigger === el) st.kill() })
      try { el._rbsplitInstance?.revert() } catch (_) { /* noop */ }
    }
  }, [])

  useGSAP(
    () => {
      if (!ref.current || !text || !fontsLoaded) return
      if (animationCompletedRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = ref.current as HTMLElement & { _rbsplitInstance?: any }

      if (el._rbsplitInstance) {
        try { el._rbsplitInstance.revert() } catch (_) { /* noop */ }
        el._rbsplitInstance = undefined
      }

      const startPct = (1 - threshold) * 100
      const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin)
      const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0
      const marginUnit = marginMatch ? (marginMatch[2] ?? 'px') : 'px'
      const sign =
        marginValue === 0 ? '' :
        marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` :
        `+=${marginValue}${marginUnit}`
      const start = `top ${startPct}%${sign}`

      let targets: gsap.DOMTarget

      const splitInstance = new GSAPSplitText(el, {
        type: splitType,
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSplit: (self: any) => {
          if (splitType.includes('chars') && self.chars.length)       targets = self.chars
          if (!targets && splitType.includes('words') && self.words.length) targets = self.words
          if (!targets && splitType.includes('lines') && self.lines.length) targets = self.lines
          if (!targets) targets = self.chars || self.words || self.lines

          return gsap.fromTo(targets, { ...from }, {
            ...to,
            duration,
            ease,
            stagger: delay / 1000,
            scrollTrigger: {
              trigger: el,
              start,
              once: true,
              fastScrollEnd: true,
              anticipatePin: 0.4,
            },
            onComplete: () => {
              animationCompletedRef.current = true
              onCompleteRef.current?.()
            },
            willChange: 'transform, opacity',
            force3D: true,
          })
        },
      })

      el._rbsplitInstance = splitInstance

      return () => {
        ScrollTrigger.getAll().forEach(st => { if (st.trigger === el) st.kill() })
        try { splitInstance.revert() } catch (_) { /* noop */ }
        el._rbsplitInstance = undefined
      }
    },
    {
      dependencies: [text, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin, fontsLoaded],
      scope: ref,
    }
  )

  const Tag = (tag ?? 'p') as React.ElementType

  return (
    <Tag
      ref={ref}
      // overflow is hidden for the reveal animation — the padding/negative margin give descenders (g, y, p) room so they aren't clipped
      style={{ textAlign: textAlign as React.CSSProperties['textAlign'], overflow: 'hidden', display: 'inline-block', whiteSpace: 'normal', wordWrap: 'break-word', willChange: 'transform, opacity', paddingBottom: '0.18em', marginBottom: '-0.18em' }}
      className={`split-parent ${className}`}
    >
      {text}
    </Tag>
  )
}

export default SplitText

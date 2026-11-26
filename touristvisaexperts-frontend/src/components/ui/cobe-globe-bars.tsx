import { useEffect, useRef, useCallback } from 'react'
import createGlobe from 'cobe'

interface BarMarker {
  id: string
  location: [number, number]
  value: number
  label: string
}

interface GlobeBarsProps {
  markers?: BarMarker[]
  className?: string
  speed?: number
}

const defaultMarkers: BarMarker[] = [
  { id: 'bar-1', location: [48.86, 2.35],   value: 88, label: 'France'    },
  { id: 'bar-2', location: [51.51, -0.13],  value: 74, label: 'UK'        },
  { id: 'bar-3', location: [35.68, 139.65], value: 91, label: 'Japan'     },
  { id: 'bar-4', location: [1.35,  103.82], value: 82, label: 'Singapore' },
  { id: 'bar-5', location: [25.20, 55.27],  value: 95, label: 'Dubai'     },
  { id: 'bar-6', location: [43.65, -79.38], value: 69, label: 'Canada'    },
]

export function GlobeBars({
  markers = defaultMarkers,
  className = '',
  speed = 0.004,
}: GlobeBarsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null)
  const dragOffset = useRef({ phi: 0, theta: 0 })
  const phiOffsetRef = useRef(0)
  const thetaOffsetRef = useRef(0)
  const isPausedRef = useRef(false)

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY }
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing'
    isPausedRef.current = true
  }, [])

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi
      thetaOffsetRef.current += dragOffset.current.theta
      dragOffset.current = { phi: 0, theta: 0 }
    }
    pointerInteracting.current = null
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab'
    isPausedRef.current = false
  }, [])

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (pointerInteracting.current !== null) {
        dragOffset.current = {
          phi:   (e.clientX - pointerInteracting.current.x) / 280,
          theta: (e.clientY - pointerInteracting.current.y) / 900,
        }
      }
    }
    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    window.addEventListener('pointerup', handlePointerUp, { passive: true })
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [handlePointerUp])

  useEffect(() => {
    if (!canvasRef.current) return
    const canvas = canvasRef.current
    let globe: ReturnType<typeof createGlobe> | null = null
    let animId: number
    let phi = 0
    let lastFrame = 0
    let onScreen = true
    let ro: ResizeObserver | null = null

    // Only render while the globe is visible and the tab is active — cobe re-renders the
    // WebGL scene and rewrites a document-wide <style> on every update, which is costly.
    const io = new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting })
    io.observe(canvas)

    function init() {
      const width = canvas.offsetWidth
      if (width === 0 || globe) return

      globe = createGlobe(canvas, {
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        width,
        height: width,
        phi: 0,
        theta: 0.25,
        dark: 1,
        diffuse: 1.2,
        mapSamples: 12000,
        mapBrightness: 5,
        baseColor: [0.06, 0.09, 0.16],
        markerColor: [1, 0.45, 0.1],
        glowColor: [0.15, 0.22, 0.4],
        markerElevation: 0,
        markers: markers.map(m => ({ location: m.location, size: 0.04 })),
        arcs: [],
        arcColor: [1, 0.5, 0.1],
        arcWidth: 0.5,
        arcHeight: 0.25,
        opacity: 0.9,
      })

      // Capped at ~30 fps; rotation speed is time-based so it looks the same at any frame rate
      function animate(now: number) {
        animId = requestAnimationFrame(animate)
        if (!onScreen || document.hidden || now - lastFrame < 33) return
        const elapsed = lastFrame ? Math.min(now - lastFrame, 100) : 16
        lastFrame = now
        if (!isPausedRef.current) phi = (phi + speed * (elapsed / 16.7)) % (Math.PI * 2)
        globe!.update({
          phi:   phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: 0.25 + thetaOffsetRef.current + dragOffset.current.theta,
        })
      }
      animId = requestAnimationFrame(animate)
      setTimeout(() => { if (canvas) canvas.style.opacity = '1' })
    }

    if (canvas.offsetWidth > 0) {
      init()
    } else {
      ro = new ResizeObserver(entries => {
        if (entries[0]?.contentRect.width > 0) { ro?.disconnect(); init() }
      })
      ro.observe(canvas)
    }

    return () => {
      io.disconnect()
      ro?.disconnect()
      if (animId) cancelAnimationFrame(animId)
      if (globe) globe.destroy()
    }
  }, [markers, speed])

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        style={{
          width: '100%',
          height: '100%',
          cursor: 'grab',
          opacity: 0,
          transition: 'opacity 1.4s ease',
          borderRadius: '50%',
          touchAction: 'none',
        }}
      />
    </div>
  )
}

import * as React from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface FlightStatusCardProps {
  airlineName: string
  airlineLogo: React.ReactNode
  planeImageSrc: string
  flightNumber: string
  gate: string
  origin: { city: string; code: string }
  destination: { city: string; code: string }
  status: { text: string; color: 'green' | 'orange' | 'red' }
  boardingStatusText: string
  boardingTimeLeft?: string
  gateCloseTime: string
  boardingStartTime: string
  boardingEndTime: string
  progressPercent: number
  className?: string
}

const statusColorMap = {
  green:  'bg-green-500',
  orange: 'bg-orange-500',
  red:    'bg-red-500',
}

export const FlightStatusCard = React.forwardRef<HTMLDivElement, FlightStatusCardProps>(
  ({
    airlineName, airlineLogo, planeImageSrc, flightNumber, gate,
    origin, destination, status, boardingStatusText, boardingTimeLeft,
    gateCloseTime, boardingStartTime, boardingEndTime, progressPercent, className,
  }, ref) => {
    const clamped = Math.min(100, Math.max(0, progressPercent))

    return (
      <div
        ref={ref}
        className={cn(
          'w-full rounded-2xl bg-white text-slate-900 shadow-xl overflow-hidden font-sans border border-slate-200',
          className
        )}
      >
        {/* Top — plane image + flight details */}
        <div className="px-5 pt-5 pb-4 bg-white">
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: 'easeOut' }}
            className="flex items-center justify-center relative h-44 mb-3"
          >
            <img
              src={planeImageSrc}
              alt="Airplane"
              className="absolute h-full w-auto object-contain drop-shadow-xl"
            />
          </motion.div>

          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {airlineLogo}
              <span className="font-bold text-xs text-slate-500 uppercase tracking-wide">{airlineName}</span>
            </div>
            <div className="text-right">
              <p className="font-black text-sm text-slate-900">
                {flightNumber} · Gate {gate}
              </p>
              <div className="flex items-center justify-end gap-1.5 text-slate-500 text-xs mt-0.5">
                <span className="font-bold">{origin.code}</span>
                <ArrowRight className="h-3 w-3" />
                <span className="font-bold">{destination.code}</span>
              </div>
              <div className="flex items-center justify-end gap-1.5 mt-1">
                <span className={cn('h-2 w-2 rounded-full', statusColorMap[status.color])} />
                <span className="text-[11px] font-bold text-slate-600">{status.text}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom — boarding progress */}
        <div className="bg-[#0A1628] text-white px-5 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center text-xs mb-1">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bold text-sm">{boardingStatusText}</span>
              {boardingTimeLeft && (
                <span className="text-orange-400 font-bold text-[11px] animate-pulse">
                  · {boardingTimeLeft}
                </span>
              )}
            </div>
            <span className="text-white/50 text-[11px]">Gate closes {gateCloseTime}</span>
          </div>

          {/* Progress bar */}
          <div className="relative w-full my-3">
            <div className="h-1.5 w-full bg-white/10 rounded-full" />
            <motion.div
              className="absolute top-0 h-1.5 bg-orange-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${clamped}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute -top-[5px] h-4 w-4 bg-orange-500 rounded-full border-2 border-[#0A1628] shadow-lg shadow-orange-500/40"
              initial={{ left: '0%' }}
              animate={{ left: `${clamped}%` }}
              transition={{ duration: 1, ease: 'easeInOut' }}
              style={{ transform: 'translateX(-50%)' }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-white/40">
            <span>{boardingStartTime}</span>
            <span>{boardingEndTime}</span>
          </div>
        </div>
      </div>
    )
  }
)

FlightStatusCard.displayName = 'FlightStatusCard'

import { useState, useRef, useEffect, useCallback } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import type { Stripe, StripeCardElement } from '@stripe/stripe-js'
import {
  motion, AnimatePresence, useInView, useScroll,
  useTransform, useMotionValue, useSpring,
} from 'motion/react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { Calendar as CalendarUI } from '../components/ui/calendar'
import {
  Plane, MapPin, CalendarDays, User, Mail, ChevronDown,
  Plus, Check, ArrowRight, Shield, BadgeCheck,
  Users, PlaneTakeoff, PlaneLanding,
  ChevronRight, Star, FileCheck,
  CheckCircle2, ChevronUp, Ticket,
} from 'lucide-react'

import destUAE from '../assets/dest-uae.jpg'
import destSingapore from '../assets/dest-singapore.jpg'
import destSchengen from '../assets/dest-schengen.jpg'
import destUK from '../assets/dest-uk.jpg'
import { detectCountryCode } from '../lib/geo'
import { formatInr, gstBreakdown, PRICES } from '../lib/pricing'
import { PromoCodeBox } from '../components/site/PromoCodeBox'
import { nameError, isValidEmail } from '../lib/validate'

/* ─── Types ──────────────────────────────────────────────────────── */
type TripType = 'one-way' | 'round-trip'
type Step = 1 | 2 | 3

interface Passenger { title: string; firstName: string; lastName: string; email: string }
interface RouteData { from: string; to: string; departure: string; returnDate: string; tripType: TripType; applyingFrom: string }

const TITLES = ['Mr.', 'Mrs.', 'Ms.', 'Dr.']
interface Airport { city: string; code: string; country: string }
const AIRPORTS: Airport[] = [
  // India
  { city: 'Mumbai', code: 'BOM', country: 'India' },
  { city: 'Delhi', code: 'DEL', country: 'India' },
  { city: 'Bangalore', code: 'BLR', country: 'India' },
  { city: 'Chennai', code: 'MAA', country: 'India' },
  { city: 'Hyderabad', code: 'HYD', country: 'India' },
  { city: 'Kolkata', code: 'CCU', country: 'India' },
  { city: 'Pune', code: 'PNQ', country: 'India' },
  { city: 'Ahmedabad', code: 'AMD', country: 'India' },
  { city: 'Goa', code: 'GOI', country: 'India' },
  { city: 'Kochi', code: 'COK', country: 'India' },
  { city: 'Jaipur', code: 'JAI', country: 'India' },
  { city: 'Lucknow', code: 'LKO', country: 'India' },
  { city: 'Nagpur', code: 'NAG', country: 'India' },
  { city: 'Patna', code: 'PAT', country: 'India' },
  { city: 'Thiruvananthapuram', code: 'TRV', country: 'India' },
  { city: 'Coimbatore', code: 'CJB', country: 'India' },
  { city: 'Bhubaneswar', code: 'BBI', country: 'India' },
  { city: 'Guwahati', code: 'GAU', country: 'India' },
  { city: 'Amritsar', code: 'ATQ', country: 'India' },
  { city: 'Indore', code: 'IDR', country: 'India' },
  // Middle East
  { city: 'Dubai', code: 'DXB', country: 'UAE' },
  { city: 'Abu Dhabi', code: 'AUH', country: 'UAE' },
  { city: 'Sharjah', code: 'SHJ', country: 'UAE' },
  { city: 'Doha', code: 'DOH', country: 'Qatar' },
  { city: 'Riyadh', code: 'RUH', country: 'Saudi Arabia' },
  { city: 'Jeddah', code: 'JED', country: 'Saudi Arabia' },
  { city: 'Dammam', code: 'DMM', country: 'Saudi Arabia' },
  { city: 'Kuwait City', code: 'KWI', country: 'Kuwait' },
  { city: 'Muscat', code: 'MCT', country: 'Oman' },
  { city: 'Bahrain', code: 'BAH', country: 'Bahrain' },
  { city: 'Amman', code: 'AMM', country: 'Jordan' },
  { city: 'Beirut', code: 'BEY', country: 'Lebanon' },
  { city: 'Tel Aviv', code: 'TLV', country: 'Israel' },
  // Southeast Asia
  { city: 'Singapore', code: 'SIN', country: 'Singapore' },
  { city: 'Bangkok Suvarnabhumi', code: 'BKK', country: 'Thailand' },
  { city: 'Bangkok Don Mueang', code: 'DMK', country: 'Thailand' },
  { city: 'Phuket', code: 'HKT', country: 'Thailand' },
  { city: 'Kuala Lumpur', code: 'KUL', country: 'Malaysia' },
  { city: 'Jakarta', code: 'CGK', country: 'Indonesia' },
  { city: 'Bali Denpasar', code: 'DPS', country: 'Indonesia' },
  { city: 'Manila', code: 'MNL', country: 'Philippines' },
  { city: 'Ho Chi Minh City', code: 'SGN', country: 'Vietnam' },
  { city: 'Hanoi', code: 'HAN', country: 'Vietnam' },
  { city: 'Colombo', code: 'CMB', country: 'Sri Lanka' },
  { city: 'Dhaka', code: 'DAC', country: 'Bangladesh' },
  { city: 'Kathmandu', code: 'KTM', country: 'Nepal' },
  { city: 'Paro', code: 'PBH', country: 'Bhutan' },
  { city: 'Yangon', code: 'RGN', country: 'Myanmar' },
  { city: 'Phnom Penh', code: 'PNH', country: 'Cambodia' },
  // East Asia
  { city: 'Tokyo Narita', code: 'NRT', country: 'Japan' },
  { city: 'Tokyo Haneda', code: 'HND', country: 'Japan' },
  { city: 'Osaka', code: 'KIX', country: 'Japan' },
  { city: 'Seoul Incheon', code: 'ICN', country: 'South Korea' },
  { city: 'Beijing', code: 'PEK', country: 'China' },
  { city: 'Shanghai Pudong', code: 'PVG', country: 'China' },
  { city: 'Guangzhou', code: 'CAN', country: 'China' },
  { city: 'Shenzhen', code: 'SZX', country: 'China' },
  { city: 'Hong Kong', code: 'HKG', country: 'Hong Kong' },
  { city: 'Taipei', code: 'TPE', country: 'Taiwan' },
  // Europe
  { city: 'London Heathrow', code: 'LHR', country: 'United Kingdom' },
  { city: 'London Gatwick', code: 'LGW', country: 'United Kingdom' },
  { city: 'Manchester', code: 'MAN', country: 'United Kingdom' },
  { city: 'Birmingham', code: 'BHX', country: 'United Kingdom' },
  { city: 'Paris Charles de Gaulle', code: 'CDG', country: 'France' },
  { city: 'Paris Orly', code: 'ORY', country: 'France' },
  { city: 'Frankfurt', code: 'FRA', country: 'Germany' },
  { city: 'Munich', code: 'MUC', country: 'Germany' },
  { city: 'Berlin', code: 'BER', country: 'Germany' },
  { city: 'Amsterdam', code: 'AMS', country: 'Netherlands' },
  { city: 'Madrid', code: 'MAD', country: 'Spain' },
  { city: 'Barcelona', code: 'BCN', country: 'Spain' },
  { city: 'Rome Fiumicino', code: 'FCO', country: 'Italy' },
  { city: 'Milan Malpensa', code: 'MXP', country: 'Italy' },
  { city: 'Zurich', code: 'ZRH', country: 'Switzerland' },
  { city: 'Geneva', code: 'GVA', country: 'Switzerland' },
  { city: 'Vienna', code: 'VIE', country: 'Austria' },
  { city: 'Brussels', code: 'BRU', country: 'Belgium' },
  { city: 'Copenhagen', code: 'CPH', country: 'Denmark' },
  { city: 'Stockholm', code: 'ARN', country: 'Sweden' },
  { city: 'Oslo', code: 'OSL', country: 'Norway' },
  { city: 'Helsinki', code: 'HEL', country: 'Finland' },
  { city: 'Lisbon', code: 'LIS', country: 'Portugal' },
  { city: 'Prague', code: 'PRG', country: 'Czech Republic' },
  { city: 'Warsaw', code: 'WAW', country: 'Poland' },
  { city: 'Budapest', code: 'BUD', country: 'Hungary' },
  { city: 'Athens', code: 'ATH', country: 'Greece' },
  { city: 'Istanbul', code: 'IST', country: 'Turkey' },
  { city: 'Dublin', code: 'DUB', country: 'Ireland' },
  { city: 'Reykjavik', code: 'KEF', country: 'Iceland' },
  // North America
  { city: 'New York JFK', code: 'JFK', country: 'USA' },
  { city: 'New York Newark', code: 'EWR', country: 'USA' },
  { city: 'Los Angeles', code: 'LAX', country: 'USA' },
  { city: 'Chicago O\'Hare', code: 'ORD', country: 'USA' },
  { city: 'San Francisco', code: 'SFO', country: 'USA' },
  { city: 'Miami', code: 'MIA', country: 'USA' },
  { city: 'Dallas Fort Worth', code: 'DFW', country: 'USA' },
  { city: 'Seattle', code: 'SEA', country: 'USA' },
  { city: 'Boston', code: 'BOS', country: 'USA' },
  { city: 'Houston', code: 'IAH', country: 'USA' },
  { city: 'Atlanta', code: 'ATL', country: 'USA' },
  { city: 'Washington DC', code: 'IAD', country: 'USA' },
  { city: 'Las Vegas', code: 'LAS', country: 'USA' },
  { city: 'Denver', code: 'DEN', country: 'USA' },
  { city: 'Toronto', code: 'YYZ', country: 'Canada' },
  { city: 'Vancouver', code: 'YVR', country: 'Canada' },
  { city: 'Montreal', code: 'YUL', country: 'Canada' },
  { city: 'Calgary', code: 'YYC', country: 'Canada' },
  { city: 'Mexico City', code: 'MEX', country: 'Mexico' },
  { city: 'Cancún', code: 'CUN', country: 'Mexico' },
  // Australia / Pacific
  { city: 'Sydney', code: 'SYD', country: 'Australia' },
  { city: 'Melbourne', code: 'MEL', country: 'Australia' },
  { city: 'Brisbane', code: 'BNE', country: 'Australia' },
  { city: 'Perth', code: 'PER', country: 'Australia' },
  { city: 'Auckland', code: 'AKL', country: 'New Zealand' },
  // Africa
  { city: 'Johannesburg', code: 'JNB', country: 'South Africa' },
  { city: 'Cape Town', code: 'CPT', country: 'South Africa' },
  { city: 'Nairobi', code: 'NBO', country: 'Kenya' },
  { city: 'Cairo', code: 'CAI', country: 'Egypt' },
  { city: 'Lagos', code: 'LOS', country: 'Nigeria' },
  { city: 'Addis Ababa', code: 'ADD', country: 'Ethiopia' },
  { city: 'Casablanca', code: 'CMN', country: 'Morocco' },
  // South America
  { city: 'São Paulo', code: 'GRU', country: 'Brazil' },
  { city: 'Buenos Aires', code: 'EZE', country: 'Argentina' },
  { city: 'Bogotá', code: 'BOG', country: 'Colombia' },
  { city: 'Lima', code: 'LIM', country: 'Peru' },
  { city: 'Santiago', code: 'SCL', country: 'Chile' },
]
const airportToString = (a: Airport) => `${a.city} (${a.code})`
const DEST_CARDS = [
  { src: destSingapore, city: 'Singapore', code: 'SIN', color: '#0EA5E9' },
  { src: destUAE,       city: 'Dubai',     code: 'DXB', color: '#F97316' },
  { src: destSchengen,  city: 'Europe',    code: 'EUR', color: '#8B5CF6' },
  { src: destUK,        city: 'London',    code: 'LHR', color: '#10B981' },
]
const getCode    = (city: string) => city.match(/\(([A-Z]{3})\)/)?.[1] ?? city.slice(0, 3).toUpperCase()
const getCity    = (city: string) => city.split(' (')[0] ?? city
const getCountry = (city: string) => AIRPORTS.find(a => airportToString(a) === city)?.country ?? ''
const fmtDate  = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'

/* ─── Pricing — every customer pays in INR via Razorpay, whatever country they apply from ─── */
interface CurrencyInfo { code: string; symbol: string; price: number }
// Per passenger, incl. 18% GST — the live value comes from the admin portal (Pricing & Offers)
const INR_CURRENCY: CurrencyInfo = { code: 'INR', symbol: '₹', get price() { return PRICES.flightPerPassenger } }

// ISO 2-letter country code → country name
const COUNTRY_CODE_MAP: Record<string, string> = {
  IN: 'India', AE: 'UAE', QA: 'Qatar', SA: 'Saudi Arabia', KW: 'Kuwait',
  OM: 'Oman', BH: 'Bahrain', JO: 'Jordan', LB: 'Lebanon', IL: 'Israel',
  SG: 'Singapore', TH: 'Thailand', MY: 'Malaysia', ID: 'Indonesia',
  PH: 'Philippines', VN: 'Vietnam', LK: 'Sri Lanka', NP: 'Nepal',
  BD: 'Bangladesh', MM: 'Myanmar', KH: 'Cambodia', MV: 'Maldives', PK: 'Pakistan',
  JP: 'Japan', KR: 'South Korea', CN: 'China', HK: 'Hong Kong', TW: 'Taiwan',
  GB: 'UK', DE: 'Germany', FR: 'France', NL: 'Netherlands', IT: 'Italy',
  ES: 'Spain', CH: 'Switzerland', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  AT: 'Austria', BE: 'Belgium', PL: 'Poland', PT: 'Portugal', GR: 'Greece',
  CZ: 'Czech Republic', RO: 'Romania', HU: 'Hungary', FI: 'Finland',
  IE: 'Ireland', TR: 'Turkey', RU: 'Russia', US: 'USA', CA: 'Canada',
  MX: 'Mexico', AU: 'Australia', NZ: 'New Zealand', ZA: 'South Africa',
  KE: 'Kenya', EG: 'Egypt', NG: 'Nigeria', ET: 'Ethiopia', MA: 'Morocco',
  BR: 'Brazil', AR: 'Argentina', CO: 'Colombia', PE: 'Peru', CL: 'Chile',
}

/* ─── Shared field wrapper styles ───────────────────────────────── */
const fieldBase = (active: boolean) =>
  `w-full flex flex-col rounded-xl bg-white transition-all duration-200 ${
    active
      ? 'border-[1.5px] border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]'
      : 'border border-gray-200 shadow-sm hover:border-orange-300'
  }`

/* ─── Date Picker Field (calendar popup) ────────────────────────── */
function DatePickerField({ label, value, onChange, optional, minDate }: {
  label: string; value: string; onChange: (v: string) => void; optional?: boolean; minDate?: string
}) {
  const [open, setOpen] = useState(false)
  const [openUp, setOpenUp] = useState(false)
  const [alignRight, setAlignRight] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // value is YYYY-MM-DD
  const selected = value ? new Date(value + 'T12:00:00') : undefined
  const display  = selected ? format(selected, 'd MMM yyyy') : null

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    onChange(format(date, 'yyyy-MM-dd'))
    setOpen(false)
  }

  const toggleOpen = () => {
    setOpen(o => {
      const next = !o
      if (next && ref.current) {
        // Decide direction + scroll into view so the user never has to scroll
        const rect = ref.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        setOpenUp(spaceBelow < 380) // calendar ~360px tall
        // ~250px wide: if it would run off the right edge (phones, Return Date), anchor it to the field's right side
        setAlignRight(rect.left + 260 > window.innerWidth - 8)
        setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
      }
      return next
    })
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggleOpen}
        className={fieldBase(open)}
        style={{ padding: '8px 14px 10px', textAlign: 'left' }}
      >
        {/* Label row */}
        <div className="flex items-center gap-1.5 mb-1">
          <CalendarDays size={11} className={open ? 'text-orange-500' : 'text-gray-400'} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: open ? '#F97316' : '#9CA3AF' }}>
            {label}{optional && <span className="normal-case font-medium text-gray-300 ml-1">(optional)</span>}
          </span>
        </div>
        {/* Value row */}
        <div className="flex items-center justify-between pl-4">
          <span className={`text-[13.5px] font-semibold ${display ? 'text-gray-900' : 'text-gray-400'}`}>
            {display ?? 'Select a date'}
          </span>
          {value
            ? <Check size={13} className="text-green-500 shrink-0" />
            : <ChevronDown size={13} className="text-gray-400 shrink-0" />
          }
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-[60] ${alignRight ? 'right-0' : 'left-0'} bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden ${openUp ? 'bottom-full mb-2' : 'top-full mt-2'}`}
          >
            <CalendarUI
              mode="single"
              selected={selected}
              onSelect={handleSelect}
              disabled={{ before: minDate ? new Date(minDate + 'T00:00:00') : new Date() }}
              initialFocus
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ─── City Autocomplete ──────────────────────────────────────────── */
function CityField({ label, value, onChange, icon: Icon, excludeCity = '', error = '' }: {
  label: string; value: string; onChange: (v: string) => void; icon: React.ElementType
  excludeCity?: string   // city chosen in the other field — not offered here
  error?: string         // shown under the field, red border
}) {
  const [open, setOpen]     = useState(false)
  const [focused, setFocused] = useState(false)
  const [input, setInput]   = useState(value)

  // When value is set externally (e.g. swap), sync input
  useEffect(() => { setInput(value) }, [value])

  const q        = input.trim().toLowerCase()
  const hasMin   = q.length >= 2
  const offered  = excludeCity ? AIRPORTS.filter(a => a.city !== excludeCity) : AIRPORTS
  const filtered = hasMin
    ? offered.filter(a =>
        a.city.toLowerCase().includes(q) ||
        a.code.toLowerCase().includes(q) ||
        a.country.toLowerCase().includes(q)
      )
    : offered.slice(0, 8) // nothing typed yet: show the first airports so the list is discoverable

  const isSelected = value && value === input   // user picked from list
  const code       = isSelected ? getCode(value) : null
  const country    = isSelected ? getCountry(value) : ''

  // stays open with no matches too, so 'No airports found' / 'already chosen' explains why nothing is listed
  const showDropdown = open && focused

  return (
    <div className="relative">
      <div
        className={`${fieldBase(focused)} ${error ? '!border-red-400 !shadow-[0_0_0_3px_rgba(248,113,113,0.12)]' : ''}`}
        style={{ padding: '8px 14px 10px' }}
      >
        {/* Label row */}
        <div className="flex items-center gap-1.5 mb-1">
          <Icon size={11} className={focused ? 'text-orange-500' : 'text-gray-400'} />
          <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: focused ? '#F97316' : '#9CA3AF' }}>
            {label}
          </span>
        </div>
        {/* Input row */}
        <div className="flex items-center gap-2 pl-4">
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value); onChange(''); setOpen(true) }}
            onFocus={() => { setFocused(true); setOpen(true) }}
            onBlur={() => {
              setFocused(false); setTimeout(() => setOpen(false), 160)
              // Typed a city but didn't tap a suggestion: take the best match instead of leaving the field empty
              if (!value && hasMin) {
                const exact = filtered.find(a => a.city.toLowerCase() === q || a.code.toLowerCase() === q)
                const pick = exact || filtered[0]
                if (pick) { const d = airportToString(pick); setInput(d); onChange(d) }
                // typed the city already chosen in the other field: don't leave it sitting in the box
                else if (excludeCity && excludeCity.toLowerCase().includes(q)) setInput('')
              }
            }}
            placeholder="Search airport or city…"
            className="flex-1 bg-transparent text-[13.5px] font-semibold text-gray-900 placeholder:text-gray-300 outline-none min-w-0"
          />
          {code && (
            <span className="shrink-0 text-[10px] font-black text-orange-500 bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded-md leading-none">
              {code}
            </span>
          )}
        </div>
        {/* Country hint below input */}
        {country && (
          <p className="text-[10px] text-gray-400 font-medium pl-[20px] mt-0.5 truncate">{country}</p>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1.5 w-full rounded-2xl overflow-hidden bg-white shadow-2xl border border-gray-100"
          >
            {filtered.length === 0 ? (
              <li className="px-4 py-3.5 flex items-center gap-2.5 text-gray-400">
                <MapPin size={14} className="text-gray-300 shrink-0" />
                <span className="text-[12px] font-medium">
                  {excludeCity && excludeCity.toLowerCase().includes(q)
                    ? `${excludeCity} is already chosen in the other field. Departure and arrival city cannot be the same.`
                    : 'No airports found'}
                </span>
              </li>
            ) : (
              filtered.slice(0, 8).map(airport => {
                const display = airportToString(airport)
                return (
                  <li key={airport.code}>
                    <button
                      type="button"
                      onMouseDown={() => { setInput(display); onChange(display); setOpen(false) }}
                      className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors flex items-center gap-3 group"
                    >
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-black text-orange-600">{airport.code}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[13px] leading-tight">{airport.city}</p>
                        <p className="text-[10.5px] text-gray-400 font-medium">{airport.country} · ({airport.code})</p>
                      </div>
                      <Plane size={12} className="ml-auto text-orange-300 group-hover:text-orange-500 transition-colors shrink-0" />
                    </button>
                  </li>
                )
              })
            )}
          </motion.ul>
        )}
      </AnimatePresence>
      {error && <p role="alert" className="mt-1.5 pl-1 text-[12px] font-semibold text-red-600">{error}</p>}
    </div>
  )
}

/* ─── Generic Text Input ─────────────────────────────────────────── */
function FloatInput({
  label, value, onChange, type = 'text', icon: Icon,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; icon?: React.ElementType
}) {
  const [focused, setFocused] = useState(false)
  const raised = focused || value.length > 0
  return (
    <div className="relative group">
      <div
        className={`relative flex items-center gap-2.5 rounded-xl bg-white transition-all duration-200 ${
          focused
            ? 'border-[1.5px] border-orange-500 shadow-[0_0_0_3px_rgba(249,115,22,0.08)]'
            : 'border border-gray-200 shadow-sm hover:border-orange-300'
        }`}
        style={{ padding: '14px 16px 10px' }}
      >
        {Icon && (
          <Icon size={15} className={`shrink-0 mt-1 transition-colors ${focused ? 'text-orange-500' : 'text-gray-400'}`} />
        )}
        <div className="flex-1 relative">
          <motion.label
            animate={{
              y: raised ? -10 : 0,
              scale: raised ? 0.75 : 1,
              color: raised ? (focused ? '#F97316' : '#9CA3AF') : '#9CA3AF',
            }}
            transition={{ duration: 0.18 }}
            className="absolute left-0 origin-left pointer-events-none font-medium text-sm"
            style={{ top: raised ? 2 : '50%', transform: raised ? 'none' : 'translateY(-50%)' }}
          >
            {label}
          </motion.label>
          <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            className="w-full bg-transparent text-gray-900 text-sm outline-none pt-3 pb-0 font-semibold"
          />
        </div>
        {value && <Check size={13} className="text-green-500 shrink-0 mt-1" />}
      </div>
    </div>
  )
}

/* ─── Select (Light) ─────────────────────────────────────────────── */
function LightSelect({ options, value, onChange, placeholder }: {
  options: string[]; value: string; onChange: (v: string) => void; placeholder: string
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-gray-200 shadow-sm rounded-xl px-4 py-3.5 text-sm outline-none cursor-pointer transition-all
          focus:border-orange-500 focus:shadow-[0_0_0_3px_rgba(249,115,22,0.08)]
          text-gray-900 font-semibold hover:border-gray-300"
      >
        <option value="" disabled className="text-gray-400">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={13} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    </div>
  )
}

/* ─── Step Bar (Light) ───────────────────────────────────────────── */
const STEP_LABELS = ['Route Details', 'Passengers', 'Confirm']

function StepBar({ current }: { current: Step }) {
  return (
    <div className="flex items-center gap-1">
      {STEP_LABELS.map((label, i) => {
        const n = i + 1
        const done   = current > n
        const active = current === n
        return (
          <div key={n} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl transition-all duration-300 flex-1
              ${active ? 'bg-orange-50 border border-orange-200' : done ? 'bg-green-50 border border-green-200' : 'border border-gray-100 bg-gray-50'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 transition-all duration-300
                ${done ? 'bg-green-500 text-white' : active ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/40' : 'bg-gray-200 text-gray-400'}`}>
                {done ? <Check size={11} strokeWidth={3} /> : n}
              </div>
              <span className={`text-[12px] font-bold hidden sm:block transition-colors ${active ? 'text-orange-600' : done ? 'text-green-600' : 'text-gray-400'}`}>
                {label}
              </span>
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div className="w-5 flex justify-center shrink-0">
                <ChevronRight size={14} className={`transition-colors ${current > n ? 'text-green-400' : 'text-gray-300'}`} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Boarding Pass (Premium Dark Card) ─────────────────────────── */
function BoardingPass({ route, passengers, step }: { route: RouteData; passengers: Passenger[]; step: Step }) {
  const fromCode = route.from ? getCode(route.from) : '---'
  const toCode   = route.to   ? getCode(route.to)   : '---'
  const fromCity = route.from ? getCity(route.from) : 'Origin'
  const toCity   = route.to   ? getCity(route.to)   : 'Destination'

  return (
    <motion.div
      layout
      className="relative rounded-3xl overflow-hidden"
      style={{
        background: 'linear-gradient(145deg,#0f1829 0%,#151f36 50%,#0c1424 100%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 40px 80px rgba(0,0,0,0.2), 0 8px 24px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between border-b border-white/5"
        style={{ background: 'linear-gradient(90deg,rgba(249,115,22,0.14),rgba(249,115,22,0.04))' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <PlaneTakeoff size={14} className="text-white" />
          </div>
          <div>
            <p className="text-white text-[11px] font-black tracking-widest uppercase">Visa Ticket</p>
            <p className="text-orange-400/70 text-[9px] font-bold">Embassy Ready</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Flight No.</p>
          <p className="text-orange-400 text-[13px] font-black">ITV-001</p>
        </div>
      </div>

      {/* Route */}
      <div className="px-5 py-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-black text-[36px] leading-none tracking-tight">{fromCode}</p>
            <p className="text-white/40 text-[11px] font-medium mt-1.5">{fromCity}</p>
          </div>
          <div className="flex-1 mx-5 flex flex-col items-center gap-2">
            <div className="flex items-center w-full gap-1.5">
              <div className="flex-1 border-t border-dashed border-white/15" />
              <motion.div
                animate={{ x: [0, 10, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Plane size={18} className="text-orange-400" />
              </motion.div>
              <div className="flex-1 border-t border-dashed border-white/15" />
            </div>
            <p className="text-[9px] font-bold text-white/25 uppercase tracking-wider">
              {route.tripType === 'round-trip' ? 'Round Trip' : 'One Way'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white font-black text-[36px] leading-none tracking-tight">{toCode}</p>
            <p className="text-white/40 text-[11px] font-medium mt-1.5">{toCity}</p>
          </div>
        </div>
      </div>

      {/* Perforated divider */}
      <div className="relative flex items-center">
        <div className="w-5 h-5 rounded-full -ml-2.5 shrink-0" style={{ background: '#f9fafb' }} />
        <div className="flex-1 border-t border-dashed border-white/10" />
        <div className="w-5 h-5 rounded-full -mr-2.5 shrink-0" style={{ background: '#f9fafb' }} />
      </div>

      {/* Details */}
      <div className="px-5 py-4 grid grid-cols-2 gap-3">
        {[
          { label: 'Date',       value: route.departure ? fmtDate(route.departure) : '—' },
          { label: 'No of Travellers', value: `${passengers.length} PAX` },
          { label: 'Class',      value: 'Economy' },
          { label: 'Status',     value: step === 3 ? 'Ready' : 'Pending', highlight: step === 3 },
        ].map(({ label, value, highlight }) => (
          <div key={label}>
            <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest mb-0.5">{label}</p>
            <p className={`text-[13px] font-black ${highlight ? 'text-green-400' : 'text-white'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Barcode */}
      <div className="px-5 pb-4">
        <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-3 flex items-center gap-3">
          <div className="flex-1 flex gap-[2.5px] h-9 items-end">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  height: `${(i * 17 + 7) % 22 + 8}px`,
                  background: 'rgba(249,115,22,0.55)',
                }}
              />
            ))}
          </div>
          <div className="text-right shrink-0">
            <p className="text-[8px] font-black text-white/20 uppercase tracking-widest">Seat</p>
            <p className="text-white font-black text-[18px] leading-none">14A</p>
            <p className="text-[8px] text-orange-400/60 font-bold mt-0.5">VIP GATE</p>
          </div>
        </div>
      </div>

      {/* Progress */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between text-[9px] font-bold text-white/30 uppercase tracking-widest mb-2">
          <span>Application Progress</span>
          <span>{step === 1 ? '33%' : step === 2 ? '66%' : '95%'}</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg,#F97316,#fb923c)' }}
            initial={{ width: '0%' }}
            animate={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '95%' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>
      </div>

      {/* Price */}
      <div className="px-5 pb-5 flex items-center justify-between border-t border-white/5 pt-4">
        <div>
          <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest">
            Service Fee{passengers.length > 1 ? ` · ${passengers.length} pax` : ''}
          </p>
          <p className="text-white font-black text-xl">
            {formatInr(INR_CURRENCY.price * passengers.length)}
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
          <CheckCircle2 size={12} className="text-green-400" />
          <span className="text-green-400 text-[11px] font-bold">Embassy Accepted</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Step 1 ─────────────────────────────────────────────────────── */
function Step1({ route, setRoute, passengerCount, setPassengerCount, onNext }: {
  route: RouteData; setRoute: (r: RouteData) => void
  passengerCount: number; setPassengerCount: (n: number) => void
  onNext: () => void
}) {
  const cityOf = (v: string) => v ? (AIRPORTS.find(a => airportToString(a) === v)?.city ?? v) : ''
  const sameCity = !!route.from && !!route.to && cityOf(route.from) === cityOf(route.to)
  const returnBeforeDeparture = route.tripType === 'round-trip' && !!route.returnDate && !!route.departure && route.returnDate < route.departure

  return (
    <motion.div key="s1" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-6">
        <h3 className="text-gray-900 font-black text-xl">Where are you flying?</h3>
        <p className="text-gray-500 text-sm mt-1">Enter your flight details</p>
      </div>

      {/* Trip Type */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl bg-gray-100 w-fit">
        {(['one-way', 'round-trip'] as TripType[]).map(t => (
          <button
            key={t}
            type="button"
            // One way has no return date: clear it so it is never sent
            onClick={() => setRoute({ ...route, tripType: t, returnDate: t === 'one-way' ? '' : route.returnDate })}
            className={`px-5 py-2.5 rounded-lg text-[12.5px] font-bold transition-all duration-200 ${
              route.tripType === t
                ? 'bg-white text-orange-600 shadow-sm border border-orange-100'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'one-way' ? 'One Way' : 'Round Trip'}
          </button>
        ))}
      </div>

      {/* Cities — the same city can't be both departure and arrival */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2 sm:gap-3 items-start mb-4">
        <CityField label="Departure City" value={route.from} onChange={v => setRoute({ ...route, from: v })} icon={PlaneTakeoff}
          excludeCity={cityOf(route.to)} />
        <button
          type="button"
          onClick={() => setRoute({ ...route, from: route.to, to: route.from })}
          aria-label="Swap departure and arrival"
          className="w-10 h-10 justify-self-center sm:mt-3 rotate-90 sm:rotate-0 rounded-xl bg-white border border-gray-200 hover:bg-orange-50 hover:border-orange-300 flex items-center justify-center transition-all shrink-0 shadow-sm"
        >
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <Plane size={15} className="text-orange-500" />
          </motion.div>
        </button>
        <CityField label="Arrival City" value={route.to} onChange={v => setRoute({ ...route, to: v })} icon={PlaneLanding}
          excludeCity={cityOf(route.from)} error={sameCity ? 'Departure and arrival city cannot be the same.' : ''} />
      </div>

      {/* Dates — Return Date only for a round trip */}
      <div className={`grid gap-3 mb-5 ${route.tripType === 'round-trip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
        <DatePickerField label="Departure Date" value={route.departure} onChange={v => {
          const updated = { ...route, departure: v }
          if (route.returnDate && v > route.returnDate) updated.returnDate = ''
          setRoute(updated)
        }} />
        {route.tripType === 'round-trip' && (
          <div>
            <DatePickerField
              label="Return Date"
              value={route.returnDate}
              onChange={v => setRoute({ ...route, returnDate: v })}
              minDate={route.departure || undefined}
            />
            {returnBeforeDeparture && <p role="alert" className="mt-1.5 pl-1 text-[12px] font-semibold text-red-600">Return date can't be before the departure date.</p>}
          </div>
        )}
      </div>

      {/* Passenger Count */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center shrink-0">
            <Users size={15} className="text-orange-500" />
          </div>
          <div>
            <p className="text-[12px] font-black text-gray-800">Number of Passengers</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 font-black text-lg flex items-center justify-center transition-all"
          >−</button>
          <span className="text-gray-900 font-black text-lg w-5 text-center">{passengerCount}</span>
          <button
            type="button"
            onClick={() => setPassengerCount(Math.min(9, passengerCount + 1))}
            className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-orange-100 hover:text-orange-600 font-black text-lg flex items-center justify-center transition-all"
          >+</button>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Total</p>
          <p className="text-3xl font-black leading-none text-orange-500">{formatInr(INR_CURRENCY.price * passengerCount)}</p>
          <p className="mt-1 text-[11px] text-gray-400">incl. 18% GST</p>
        </div>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            if (!route.from || !route.to) { toast.error('Please choose your departure and arrival cities from the list.'); return }
            if (!route.departure) { toast.error('Please choose your departure date.'); return }
            if (sameCity) { toast.error('Departure and arrival city cannot be the same.'); return }
            if (route.tripType === 'round-trip' && !route.returnDate) { toast.error('Please choose your return date.'); return }
            if (returnBeforeDeparture) { toast.error("Return date can't be before the departure date."); return }
            onNext()
          }}
          className="flex items-center gap-2.5 px-7 py-3 rounded-xl font-bold text-sm text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 8px 24px rgba(249,115,22,0.35)' }}
        >
          Next Step <ArrowRight size={15} />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step 2 ─────────────────────────────────────────────────────── */
function Step2({ passengers, setPassengers, onNext, onBack }: {
  passengers: Passenger[]; setPassengers: (p: Passenger[]) => void; onNext: () => void; onBack: () => void
}) {
  const update = (i: number, field: keyof Passenger, val: string) => {
    const next = [...passengers]; next[i] = { ...next[i], [field]: val }; setPassengers(next)
  }

  return (
    <motion.div key="s2" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-6">
        <h3 className="text-gray-900 font-black text-xl">Passenger Details</h3>
        <p className="text-gray-500 text-sm mt-1">As per passport — details will appear on the ticket</p>
      </div>

      <div className="space-y-4">
        {passengers.map((p, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-orange-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-orange-100 border border-orange-200 flex items-center justify-center">
                  <User size={12} className="text-orange-600" />
                </div>
                <p className="text-orange-600 text-[11px] font-black uppercase tracking-widest">Passenger {i + 1}</p>
              </div>
              {i > 0 && (
                <button
                  type="button"
                  onClick={() => setPassengers(passengers.filter((_, j) => j !== i))}
                  className="text-red-400 hover:text-red-600 text-[11px] font-bold transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="p-4 bg-white space-y-3">
              {i === 0 && (
                <FloatInput label="Email Address" value={p.email} onChange={v => update(i, 'email', v)} type="email" icon={Mail} />
              )}
              {/* Phones: one field per row (three in a row squeezed the name boxes to a few pixels) */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                <div>
                  <LightSelect options={TITLES} value={p.title} onChange={v => update(i, 'title', v)} placeholder="Title" />
                </div>
                <FloatInput label="First Name" value={p.firstName} onChange={v => update(i, 'firstName', v)} icon={User} />
                <FloatInput label="Last Name" value={p.lastName} onChange={v => update(i, 'lastName', v)} icon={User} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => setPassengers([...passengers, { title: '', firstName: '', lastName: '', email: '' }])}
        className="mt-4 flex items-center gap-2 text-orange-500 hover:text-orange-600 text-[13px] font-bold transition-colors group"
      >
        <div className="w-6 h-6 rounded-full border border-orange-300 group-hover:border-orange-500 group-hover:bg-orange-50 flex items-center justify-center transition-all">
          <Plus size={11} />
        </div>
        Add Passenger
      </button>

      <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-sm font-bold transition-all"
        >
          Back
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            for (let i = 0; i < passengers.length; i++) {
              const problem = nameError(passengers[i].firstName, 'first name') || nameError(passengers[i].lastName, 'last name')
              if (problem) { toast.error(`Passenger ${i + 1}: ${problem}`); return }
            }
            if (!isValidEmail(passengers[0].email)) { toast.error('Please enter a valid email for Passenger 1'); return }
            onNext()
          }}
          className="flex items-center gap-2.5 px-7 py-2.5 rounded-xl font-bold text-sm text-white"
          style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 8px 24px rgba(249,115,22,0.35)' }}
        >
          Continue <ArrowRight size={15} />
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Step 3 ─────────────────────────────────────────────────────── */
const STRIPE_PK = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string

function Step3({ route, passengers, onBack }: { route: RouteData; passengers: Passenger[]; onBack: () => void }) {
  const [agreed, setAgreed] = useState(false)
  // Flight-only promo codes (codes made for visa or consultation are refused here)
  const [promo, setPromo] = useState<{ code: string; amountPaise: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  // All customers pay in INR via Razorpay, regardless of the "I'm Applying From" selection
  const currencyInfo = INR_CURRENCY
  const paymentMode = 'razorpay' as 'razorpay' | 'stripe'

  // Stripe imperative state
  const [stripeInst, setStripeInst] = useState<Stripe | null>(null)
  const [cardEl, setCardEl] = useState<StripeCardElement | null>(null)
  const [cardError, setCardError] = useState<string>('')
  const cardMountRef = useRef<HTMLDivElement>(null)

  // Mount / unmount Stripe card element whenever mode switches to stripe
  const initStripe = useCallback(async () => {
    if (!cardMountRef.current) return
    const stripe = await loadStripe(STRIPE_PK)
    if (!stripe || !cardMountRef.current) return
    setStripeInst(stripe)
    const elements = stripe.elements()
    const card = elements.create('card', {
      style: {
        base: {
          fontSize: '14px',
          color: '#1e293b',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          '::placeholder': { color: '#94a3b8' },
        },
        invalid: { color: '#ef4444' },
      },
      hidePostalCode: true,
    })
    card.mount(cardMountRef.current)
    card.on('change', (e) => setCardError(e.error?.message ?? ''))
    setCardEl(card)
    return card
  }, [])

  useEffect(() => {
    if (paymentMode !== 'stripe') {
      cardEl?.destroy()
      setCardEl(null)
      setStripeInst(null)
      return
    }
    let mounted = true
    let card: StripeCardElement | undefined
    // Small delay so the div renders before mounting
    const t = setTimeout(async () => {
      if (!mounted) return
      card = await initStripe() as StripeCardElement | undefined
    }, 80)
    return () => {
      mounted = false
      clearTimeout(t)
      card?.destroy()
      setCardEl(null)
      setStripeInst(null)
    }
  }, [paymentMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const API = import.meta.env.VITE_API_URL || 'https://shop.touristvisaexperts.com/api'
  const payTotal = promo ? promo.amountPaise / 100 : currencyInfo.price * passengers.length

  const confirmRazorpay = async (contactEmail: string) => {
    try {
      const orderRes = await fetch(`${API}/flight/create-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerCount: passengers.length, coupon: promo?.code || '' }),
      })
      const orderData = await orderRes.json()
      if (!orderData.success) throw new Error(orderData.message || 'Could not start payment')

      if (!(window as any).Razorpay) {
        await new Promise<void>((res, rej) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = () => res(); s.onerror = () => rej(new Error('Failed to load Razorpay'))
          document.head.appendChild(s)
        })
      }

      const rzp = new (window as any).Razorpay({
        key: orderData.data.keyId,
        amount: orderData.data.amount,
        currency: orderData.data.currency,
        order_id: orderData.data.orderId,
        name: 'Travel Tourist Visa Expert',
        description: `Flight Reservation — ${getCity(route.from)} → ${getCity(route.to)}`,
        image: '/logo.png',
        prefill: { name: `${passengers[0]?.firstName} ${passengers[0]?.lastName}`.trim(), email: contactEmail },
        theme: { color: '#F97316' },
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch(`${API}/flight/verify`, {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                from: route.from, to: route.to,
                departureDate: route.departure, returnDate: route.returnDate,
                tripType: route.tripType,
                passengers, contactEmail,
              }),
            })
            const verifyData = await verifyRes.json()
            if (!verifyData.success) throw new Error(verifyData.message)
            setLoading(false); setDone(true)
            toast.success('Reservation confirmed! Check your email.')
          } catch (err: any) {
            setLoading(false)
            toast.error(err.message || 'Payment verification failed. Contact support.')
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
    } catch (err: any) {
      setLoading(false)
      toast.error(err.message || 'Something went wrong. Please try again.')
    }
  }

  const confirmStripe = async (contactEmail: string) => {
    try {
      if (!stripeInst || !cardEl) {
        toast.error('Card not ready. Please wait a moment and try again.')
        setLoading(false)
        return
      }

      // 1. Create PaymentIntent on backend (pass currency so backend charges correct amount)
      const piRes = await fetch(`${API}/stripe/create-payment-intent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passengerCount: passengers.length, currency: currencyInfo.code.toLowerCase() }),
      })
      const piData = await piRes.json()
      if (!piData.success) throw new Error(piData.message || 'Could not initiate payment')

      // 2. Confirm card payment with Stripe.js
      const { error, paymentIntent } = await stripeInst.confirmCardPayment(piData.data.clientSecret, {
        payment_method: {
          card: cardEl,
          billing_details: {
            name: `${passengers[0]?.firstName} ${passengers[0]?.lastName}`.trim(),
            email: contactEmail,
          },
        },
      })

      if (error) throw new Error(error.message || 'Card payment failed')
      if (paymentIntent?.status !== 'succeeded') throw new Error('Payment not completed')

      // 3. Save reservation on backend
      const verifyRes = await fetch(`${API}/stripe/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          from: route.from, to: route.to,
          departureDate: route.departure, returnDate: route.returnDate,
          tripType: route.tripType,
          passengers, contactEmail,
        }),
      })
      const verifyData = await verifyRes.json()
      if (!verifyData.success) throw new Error(verifyData.message)

      setLoading(false); setDone(true)
      toast.success('Reservation confirmed! Check your email.')
    } catch (err: any) {
      setLoading(false)
      toast.error(err.message || 'Payment failed. Please try again.')
    }
  }

  const confirm = async () => {
    if (!agreed) { toast.error('Please accept Terms & Privacy Policy'); return }
    const contactEmail = passengers[0]?.email
    if (!contactEmail) { toast.error('Passenger email is required'); return }
    setLoading(true)
    if (paymentMode === 'stripe') {
      await confirmStripe(contactEmail)
    } else {
      await confirmRazorpay(contactEmail)
    }
  }

  if (done) return (
    <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center py-12 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-20 h-20 rounded-full flex items-center justify-center mb-6 relative"
        style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.15),rgba(34,197,94,0.05))', border: '2px solid rgba(34,197,94,0.3)' }}
      >
        <Check size={32} className="text-green-500" strokeWidth={2.5} />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-green-500/30"
          animate={{ scale: [1, 1.5, 1.5], opacity: [0.7, 0, 0] }}
          transition={{ duration: 1.5, repeat: 2 }}
        />
      </motion.div>
      <h3 className="text-2xl font-black text-gray-900 mb-2">Reservation Confirmed!</h3>
      <p className="text-gray-500 text-sm max-w-xs leading-relaxed">
        Your dummy flight ticket has been sent to{' '}
        <span className="text-orange-500 font-semibold">{passengers[0]?.email}</span>
      </p>
      <p className="text-gray-400 text-xs mt-4">Our team will verify and deliver it to your inbox.</p>
    </motion.div>
  )

  return (
    <motion.div key="s3" initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
      <div className="mb-6">
        <h3 className="text-gray-900 font-black text-xl">Review & Confirm</h3>
        <p className="text-gray-500 text-sm mt-1">Verify your details before we issue the ticket</p>
      </div>

      <div className="space-y-2 mb-6">
        {[
          { Icon: Mail,         label: 'Email',      value: passengers[0]?.email ?? '—' },
          { Icon: PlaneTakeoff, label: 'Route',      value: route.from && route.to ? `${getCity(route.from)} → ${getCity(route.to)}` : '—' },
          { Icon: CalendarDays, label: 'Departure',  value: fmtDate(route.departure) },
          { Icon: Users,        label: 'Travellers', value: `${passengers.length} Passenger${passengers.length > 1 ? 's' : ''}${passengers.some(p => p.firstName) ? ` · ${passengers.map(p => `${p.firstName} ${p.lastName}`.trim()).filter(Boolean).join(', ')}` : ''}` },
        ].map(({ Icon, label, value }) => (
          <div
            key={label}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-gray-100 bg-gray-50"
          >
            <div className="w-9 h-9 rounded-xl bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
              <Icon size={15} className="text-orange-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider leading-none mb-0.5">{label}</p>
              <p className="text-gray-900 text-[13px] font-semibold truncate">{value}</p>
            </div>
            <Check size={13} className="text-green-500 shrink-0" />
          </div>
        ))}
      </div>

      {/* Auto-detected payment method banner */}
      <div className={`mb-5 flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 ${
        paymentMode === 'razorpay'
          ? 'border-orange-200 bg-orange-50'
          : 'border-blue-200 bg-blue-50'
      }`}>
        <div className="text-2xl leading-none">{paymentMode === 'razorpay' ? '🇮🇳' : '🌍'}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[12.5px] font-black text-gray-900 leading-tight">
            {paymentMode === 'razorpay' ? 'Razorpay — Indian Rupees (₹)' : `Stripe — ${route.applyingFrom || 'International'}`}
          </p>
          <p className="text-[10.5px] font-medium mt-0.5" style={{ color: paymentMode === 'razorpay' ? '#ea580c' : '#2563eb' }}>
            {paymentMode === 'razorpay'
              ? 'UPI · Cards · Net Banking · Wallets'
              : 'Visa · Mastercard · Amex · Apple Pay'}
          </p>
        </div>
        <div className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
          paymentMode === 'razorpay' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
        }`}>
          <CheckCircle2 size={10} />
          Auto-detected
        </div>
      </div>

      {/* Fee */}
      <div
        className="px-4 py-4 rounded-xl border mb-5"
        style={{
          background: paymentMode === 'stripe' ? 'linear-gradient(135deg,#eff6ff,#f8faff)' : 'linear-gradient(135deg,#fff7ed,#fffbf5)',
          borderColor: paymentMode === 'stripe' ? '#bfdbfe' : '#fed7aa',
        }}
      >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-700 text-sm font-semibold">Total Amount</p>
          <p className="text-gray-400 text-xs mt-0.5">
            {formatInr(currencyInfo.price)} × {passengers.length} passenger{passengers.length > 1 ? 's' : ''}
            {' '}({currencyInfo.code})
          </p>
        </div>
        <div className="text-right">
          {promo && <p className="text-xs text-gray-400 line-through">{formatInr(currencyInfo.price * passengers.length)}</p>}
          <p className={`font-black text-2xl ${paymentMode === 'stripe' ? 'text-blue-500' : 'text-orange-500'}`}>
            {formatInr(payTotal)}
          </p>
        </div>
      </div>
      {(() => {
        const { base, gst } = gstBreakdown(payTotal)
        return (
          <div className="mt-3 pt-3 border-t border-orange-200/70 space-y-1 text-xs text-gray-600">
            <div className="flex justify-between"><span>Base price</span><span className="font-semibold">{formatInr(base)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span className="font-semibold">{formatInr(gst)}</span></div>
          </div>
        )
      })()}
      <div className="mt-3">
        <PromoCodeBox endpoint={`${API}/flight/validate-coupon`} body={{ passengerCount: passengers.length }} applied={promo} onChange={setPromo} />
      </div>
      </div>

      {/* Stripe Card Element */}
      <AnimatePresence>
        {paymentMode === 'stripe' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-5"
          >
            <div className="rounded-2xl border border-blue-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Shield size={13} className="text-blue-600" />
                </div>
                <p className="text-[11px] font-black text-gray-700 uppercase tracking-wider">Card Details</p>
                <span className="ml-auto text-[10px] text-gray-400 font-medium">Secured by Stripe</span>
              </div>
              {/* Stripe mounts here */}
              <div
                ref={cardMountRef}
                className="rounded-xl border border-gray-200 px-3 py-3.5 bg-gray-50 focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all"
              />
              {cardError && (
                <p className="text-red-500 text-[11px] font-medium mt-2">{cardError}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Terms */}
      <label className="flex items-start gap-3 cursor-pointer mb-6 group" onClick={() => setAgreed(!agreed)}>
        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all duration-200
          ${agreed ? 'bg-orange-500 border-orange-500 shadow-lg shadow-orange-500/30' : 'border-gray-300 bg-white group-hover:border-orange-400'}`}>
          {agreed && <Check size={11} className="text-white" strokeWidth={3} />}
        </div>
        <span className="text-gray-500 text-xs leading-relaxed select-none">
          I accept the{' '}
          <span className="text-orange-500 hover:text-orange-600 transition-colors">Terms & Conditions</span>
          {' '}and{' '}
          <span className="text-orange-500 hover:text-orange-600 transition-colors">Privacy Policy</span>
        </span>
      </label>

      <div className="flex justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 text-sm font-bold transition-all"
        >
          Back
        </button>
        <motion.button
          type="button"
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={confirm}
          disabled={loading}
          className="flex items-center gap-2.5 px-7 py-2.5 rounded-xl font-bold text-sm text-white disabled:opacity-70 transition-all"
          style={paymentMode === 'stripe'
            ? { background: 'linear-gradient(135deg,#3b82f6,#2563eb)', boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }
            : { background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 8px 24px rgba(249,115,22,0.35)' }}
        >
          {loading ? (
            <>
              <motion.span
                className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full block"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.7, repeat: Infinity, ease: 'linear' }}
              />
              Processing…
            </>
          ) : (
            <>Confirm & Pay {formatInr(payTotal)}</>
          )}
        </motion.button>
      </div>
    </motion.div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────── */
export default function FlightReservationPage() {
  const [step, setStep] = useState<Step>(1)

  // Each step gets its own browser-history entry, so the phone's Back button goes to the previous
  // step (keeping everything typed) instead of leaving the page and losing the form.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setStep(((e.state && e.state.flightStep) || 1) as Step)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => {
    const current = (window.history.state && window.history.state.flightStep) || 1
    if (step > current) window.history.pushState({ ...window.history.state, flightStep: step }, '')
    else if (step < current) window.history.replaceState({ ...window.history.state, flightStep: step }, '')
  }, [step])
  const [route, setRoute] = useState<RouteData>({ from: '', to: '', departure: '', returnDate: '', tripType: 'one-way', applyingFrom: '' })
  const [passengerCount, setPassengerCount] = useState(1)
  const [passengers, setPassengers] = useState<Passenger[]>([{ title: '', firstName: '', lastName: '', email: '' }])
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [, setLocationDetecting] = useState(true)

  // Auto-detect user country on mount via free IP geolocation
  useEffect(() => {
    detectCountryCode()
      .then(code => {
        const country = code ? COUNTRY_CODE_MAP[code] : undefined
        if (country) setRoute(r => ({ ...r, applyingFrom: country }))
      })
      .finally(() => setLocationDetecting(false))
  }, [])

  const heroRef = useRef<HTMLDivElement>(null)
  const inView = useInView(heroRef, { once: true, margin: '-5%' })
  const formRef = useRef<HTMLDivElement>(null)
  const formInView = useInView(formRef, { once: true, margin: '-10%' })

  const { scrollYProgress } = useScroll()
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 20 })
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 20 })

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }


  const HOW_IT_WORKS = [
    { title: 'Fill Your Details',       desc: 'Enter your flight route, travel dates, and passenger information in under 2 minutes.',    icon: FileCheck,    color: '#F97316' },
    { title: 'We Create Your Ticket',   desc: 'Our team generates a verifiable flight reservation for your visa application and sends it to you.', icon: Plane, color: '#3B82F6' },
    { title: 'Receive & Apply',         desc: 'Get your ticket by email and attach it to your visa application. Done!',                  icon: CheckCircle2, color: '#22C55E' },
  ]

  const FAQS = [
    { q: 'Is this a real flight booking?',     a: 'No — it\'s a verifiable flight reservation specifically created for visa application purposes. It provides authentic reservation details for visa processing without requiring an expensive confirmed ticket upfront.' },
    { q: 'Will the embassy accept this?',      a: 'Yes. Our tickets are accepted by all major embassies including Schengen, UAE, UK, Singapore, USA, and more.' },
    { q: 'How will I receive my ticket?',      a: 'Your ticket is delivered straight to your email inbox once it\'s ready. Our team prepares it as quickly as possible.' },
    { q: 'What if my visa is rejected?',       a: 'Our ₹999 service fee is non-refundable as we create and deliver the ticket regardless of visa outcome. We do offer free revisions on ticket details.' },
  ]

  const TESTIMONIALS = [
    { name: 'Priya S.', dest: 'Schengen Visa', text: 'Got my flight reservation in my inbox within minutes. Accurate route details and very responsive support.', stars: 5 },
    { name: 'Rahul M.', dest: 'UAE Visa',      text: 'Super fast delivery and clean layout. Customer service answered all my questions right away.', stars: 5 },
    { name: 'Anjali K.', dest: 'UK Visa',      text: 'Third time using this service for my visa files. Always reliable, always fast. Worth every rupee!', stars: 5 },
  ]

  return (
    <div
      className="min-h-screen font-['Plus_Jakarta_Sans',sans-serif] bg-white"
      onMouseMove={e => {
        mouseX.set((e.clientX / window.innerWidth - 0.5) * 30)
        mouseY.set((e.clientY / window.innerHeight - 0.5) * 30)
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .plane-float { animation: floatUp 3.5s ease-in-out infinite; }
        @keyframes pulseRing {
          0%   { box-shadow: 0 0 0 0   rgba(249,115,22,0.55); }
          70%  { box-shadow: 0 0 0 12px rgba(249,115,22,0); }
          100% { box-shadow: 0 0 0 0   rgba(249,115,22,0); }
        }
        .pulse-cta { animation: pulseRing 2.2s ease-out infinite; }
        /* Kill the browser autofill / paste grey-blue box on form inputs */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-text-fill-color: #111827;
          -webkit-box-shadow: 0 0 0 1000px #ffffff inset;
          box-shadow: 0 0 0 1000px #ffffff inset;
          caret-color: #111827;
          transition: background-color 9999s ease-in-out 0s;
        }
      `}</style>

      {/* Page scroll progress bar */}
      <motion.div
        className="fixed top-0 left-0 h-[3px] z-[200] origin-left"
        style={{ width: progressWidth, background: 'linear-gradient(90deg,#F97316,#FBBF24)' }}
      />

      {/* ── Navbar ── */}
      <div className="relative z-50"><Navbar /></div>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative overflow-hidden pt-16 pb-20 px-4 sm:px-6"
        style={{ background: 'linear-gradient(160deg,#ffffff 0%,#fff7ed 45%,#ffffff 100%)' }}
      >
        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-35"
          style={{ backgroundImage: 'radial-gradient(circle,#e5e7eb 1px,transparent 1px)', backgroundSize: '28px 28px' }}
        />
        {/* Orange glow */}
        <div
          className="absolute top-0 right-0 w-[650px] h-[650px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 70% 20%,rgba(249,115,22,0.07) 0%,transparent 60%)' }}
        />

        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* Left */}
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={inView ? { opacity: 1, scale: 1 } : {}}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border"
                style={{ background: 'rgba(249,115,22,0.08)', borderColor: 'rgba(249,115,22,0.22)', color: '#EA580C' }}
              >
                <Plane size={11} />
                Visa-Purpose Flight Tickets
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="text-[44px] sm:text-[58px] font-black text-gray-900 leading-[1.03] tracking-tight mb-5"
              >
                Embassy-Ready
                <br />
                <span
                  style={{
                    background: 'linear-gradient(90deg,#F97316 0%,#FB923C 50%,#FBBF24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Flight Reservations
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.22, duration: 0.6 }}
                className="text-gray-500 text-[15.5px] leading-relaxed max-w-md mb-8"
              >
                Verifiable flight reservations for your visa application,
                delivered straight to your inbox.
              </motion.p>

              {/* Trust chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.3, duration: 0.55 }}
                className="flex flex-wrap gap-2.5 mb-10"
              >
                {[
                  { Icon: BadgeCheck, label: 'Embassy Verified', color: '#22C55E', bg: '#f0fdf4', border: '#bbf7d0' },
                  { Icon: Mail,       label: 'Inbox Delivery',   color: '#3B82F6', bg: '#eff6ff', border: '#bfdbfe' },
                  { Icon: Shield,     label: '100% Secure',      color: '#8B5CF6', bg: '#f5f3ff', border: '#ddd6fe' },
                ].map(({ Icon, label, color, bg, border }) => (
                  <motion.div
                    key={label}
                    whileHover={{ y: -2, scale: 1.04 }}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-bold border"
                    style={{ background: bg, borderColor: border, color }}
                  >
                    <Icon size={12} /> {label}
                  </motion.div>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.38, duration: 0.55 }}
                className="flex flex-wrap items-center gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={scrollToForm}
                  className="pulse-cta flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-black text-[15px] text-white"
                  style={{ background: 'linear-gradient(135deg,#F97316,#EA580C)', boxShadow: '0 12px 28px rgba(249,115,22,0.4)' }}
                >
                  Book Now — ₹999
                  <ArrowRight size={16} />
                </motion.button>
              </motion.div>
            </motion.div>

            {/* Right — destination cards */}
            <div className="hidden lg:block relative">
              <motion.div style={{ x: smoothX, y: smoothY }} className="relative">
                <div className="grid grid-cols-2 gap-3">
                  {DEST_CARDS.map(({ src, city, code, color }, i) => (
                    <motion.div
                      key={city}
                      initial={{ opacity: 0, y: 30, scale: 0.88 }}
                      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
                      transition={{ duration: 0.65, delay: 0.2 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className={`relative overflow-hidden rounded-2xl group cursor-pointer ${i % 2 === 1 ? 'mt-8' : ''}`}
                      style={{ height: i % 2 === 0 ? 190 : 160, border: '1.5px solid rgba(0,0,0,0.07)', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                      whileHover={{ scale: 1.04, y: -5 }}
                    >
                      <img src={src} alt={city} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top,rgba(0,0,0,0.7) 0%,transparent 55%)' }} />
                      <div
                        className="absolute top-2.5 right-2.5 px-2 py-1 rounded-lg text-[10px] font-black text-white"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}
                      >
                        {code}
                      </div>
                      <div className="absolute bottom-3 left-3 flex items-center justify-between right-3">
                        <p className="text-white font-black text-[14px]">{city}</p>
                        <MapPin size={13} style={{ color }} />
                      </div>
                    </motion.div>
                  ))}
                </div>

              </motion.div>
            </div>
          </div>
        </div>
      </section>


      {/* ── Booking Form + Boarding Pass ── */}
      <section ref={formRef} className="py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">

          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 mb-4 px-4 py-2 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[11px] font-black uppercase tracking-widest">
              <Ticket size={11} />
              Book Your Ticket
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
              Fill in your flight details
            </h2>
            <p className="text-gray-500 mt-2 text-sm max-w-md mx-auto">
              Takes less than 2 minutes. Your ticket will be delivered to your inbox.
            </p>
          </motion.div>

          {/* Step bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl mb-5 px-4 py-3 bg-gray-50 border border-gray-100 shadow-sm"
          >
            <StepBar current={step} />
          </motion.div>

          <div className="grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_310px] gap-5 items-start">

            {/* Form card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="rounded-3xl p-5 sm:p-7 border border-slate-200"
              style={{ background: '#F1F5F9', boxShadow: '0 4px 28px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <AnimatePresence mode="wait">
                {step === 1 && <Step1 key="s1" route={route} setRoute={setRoute} passengerCount={passengerCount} setPassengerCount={setPassengerCount} onNext={() => {
                  const blank: Passenger = { title: '', firstName: '', lastName: '', email: '' }
                  setPassengers(Array.from({ length: passengerCount }, (_, i) => passengers[i] ?? { ...blank }))
                  setStep(2)
                }} />}
                {step === 2 && <Step2 key="s2" passengers={passengers} setPassengers={setPassengers} onNext={() => setStep(3)} onBack={() => setStep(1)} />}
                {step === 3 && <Step3 key="s3" route={route} passengers={passengers} onBack={() => setStep(2)} />}
              </AnimatePresence>
            </motion.div>

            {/* Boarding pass */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={formInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="lg:sticky lg:top-24"
            >
              <BoardingPass route={route} passengers={passengers} step={step} />
              <div className="mt-4 px-4 py-3.5 rounded-2xl bg-green-50 border border-green-100 flex items-start gap-3">
                <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                <p className="text-gray-600 text-[12px] leading-relaxed">
                  Your ticket is <strong className="text-gray-800">100% embassy-accepted</strong> and will be delivered to your inbox after booking.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: '#F9FAFB' }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">How It Works</h2>
            <p className="text-gray-500 mt-2 text-sm">Three simple steps — from booking to inbox</p>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-8 relative">
            <div className="hidden sm:block absolute top-10 left-[16.67%] right-[16.67%] h-[1.5px] border-t-2 border-dashed border-gray-200" />

            {HOW_IT_WORKS.map(({ title, desc, icon: Icon, color }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.55 }}
                className="flex flex-col items-center text-center relative"
              >
                <div
                  className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 relative z-10 bg-white shadow-md border border-gray-100"
                  style={{ boxShadow: `0 8px 24px ${color}22` }}
                >
                  <Icon size={30} style={{ color }} />
                  <div
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                    style={{ background: color }}
                  >
                    {i + 1}
                  </div>
                </div>
                <h3 className="text-[15px] font-black text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-[200px]">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-16 px-4 sm:px-6 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">What Our Customers Say</h2>
          </motion.div>

          <div className="grid sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ name, dest, text, stars }, i) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-5 border border-gray-100"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: stars }).map((_, j) => (
                    <Star key={j} size={13} className="text-orange-400 fill-orange-400" />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{text}"</p>
                <div>
                  <p className="text-gray-900 font-bold text-[13px]">{name}</p>
                  <p className="text-gray-400 text-[11px]">{dest}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4 sm:px-6" style={{ background: '#F9FAFB' }}>
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Common Questions</h2>
          </motion.div>

          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
              >
                <button
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                >
                  <span className="text-gray-900 font-bold text-[14px] pr-4">{q}</span>
                  <motion.div animate={{ rotate: faqOpen === i ? 180 : 0 }} transition={{ duration: 0.22 }} className="shrink-0">
                    <ChevronUp size={16} className="text-gray-400" />
                  </motion.div>
                </button>
                <AnimatePresence>
                  {faqOpen === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-5 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-3">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      {/* ── Footer ── */}
      <Footer />

      {/* ── Floating Sticky CTA (desktop) ── */}
      <motion.div
        initial={{ opacity: 0, y: 80 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.8, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-6 right-6 z-[100] hidden sm:block"
      >
        <motion.button
          whileHover={{ scale: 1.06, y: -3 }}
          whileTap={{ scale: 0.96 }}
          onClick={scrollToForm}
          className="flex items-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-[13px] text-white"
          style={{
            background: 'linear-gradient(135deg,#F97316,#EA580C)',
            boxShadow: '0 16px 40px rgba(249,115,22,0.5)',
          }}
        >
          <Plane size={15} />
          Book Flight Ticket
        </motion.button>
      </motion.div>
    </div>
  )
}

// Prices shown on the website. All amounts are final INR totals *including* 18% GST.
// The live values come from the API (/api/settings/pricing — edited in the admin portal under
// Pricing & Offers); the defaults below are used until that loads or if it can't be reached.
// The payment server always charges its own copy of these prices, never what the page shows.

export const GST_RATE = 0.18

export type Prices = {
  visaUSA: number
  visaEurope: number
  visaOther: number
  reapplication: number
  reapplicationGuarantee: number
  flightPerPassenger: number
  consultation: number
  addMember: number
}

export const DEFAULT_PRICES: Prices = {
  visaUSA: 25000,
  visaEurope: 15000,
  visaOther: 10000,
  reapplication: 15000,
  reapplicationGuarantee: 25000,
  flightPerPassenger: 999,
  consultation: 999,
  addMember: 10000,
}

// Mutable on purpose: loadPrices() updates it once, then App re-renders so every page reads the live values.
export const PRICES: Prices = { ...DEFAULT_PRICES }

// Schengen countries offered for re-application (client list, Oct 2026)
export const SCHENGEN_COUNTRIES = [
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Czechia', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France',
  'Germany', 'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Malta',
  'Netherlands', 'Norway', 'Poland', 'Portugal', 'Romania', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
]

// Destinations billed at the "Europe" rate (Schengen area + other EU/EFTA countries; UK is billed separately)
export const EUROPE_DESTINATIONS = new Set([...SCHENGEN_COUNTRIES, 'Schengen', 'Europe', 'Cyprus', 'Ireland'])

// Countries where we offer the re-application (visa rejected before) package
export const REAPPLICATION_COUNTRIES = ['Schengen', 'UK', 'USA', 'Canada', 'Australia', 'New Zealand', ...SCHENGEN_COUNTRIES.filter(c => c !== 'Czech Republic')]
const REAPPLICATION_SET = new Set([...REAPPLICATION_COUNTRIES, 'Czech Republic'])
export const isReapplicationCountry = (country: string) => REAPPLICATION_SET.has(country)

/** First-time visa-assistance fee (per applicant, GST inclusive) for a destination. */
export function visaPriceInr(destination: string): number {
  if (destination === 'USA') return PRICES.visaUSA
  if (EUROPE_DESTINATIONS.has(destination)) return PRICES.visaEurope
  return PRICES.visaOther
}

/** Re-application package fee (per applicant, GST inclusive). */
export const reapplicationPriceInr = () => PRICES.reapplication
/** Re-application plans for a previously refused visa: Specialist, or Guarantee (service-fee refund protection). */
export type ReapplyPlan = 'specialist' | 'guarantee'
export const reapplyPlanPriceInr = (plan: ReapplyPlan) => plan === 'guarantee' ? PRICES.reapplicationGuarantee : PRICES.reapplication

let loading: Promise<boolean> | null = null
/** Fetches live prices once. Resolves true if anything changed (so the caller can re-render). */
export function loadPrices(): Promise<boolean> {
  if (loading) return loading
  const API = import.meta.env.VITE_API_URL || '/api'
  loading = fetch(`${API}/settings/pricing`)
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      const live = d?.data
      if (!live || typeof live !== 'object') return false
      let changed = false
      for (const key of Object.keys(DEFAULT_PRICES) as (keyof Prices)[]) {
        const v = Number(live[key])
        if (Number.isFinite(v) && v >= 1 && v !== PRICES[key]) { PRICES[key] = v; changed = true }
      }
      return changed
    })
    .catch(() => false)
  return loading
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Splits a GST-inclusive total into base amount + GST. */
export function gstBreakdown(totalInclGst: number) {
  const base = round2(totalInclGst / (1 + GST_RATE))
  return { base, gst: round2(totalInclGst - base), total: totalInclGst }
}

export const formatInr = (n: number) =>
  `₹${n.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(n) ? 0 : 2, maximumFractionDigits: 2 })}`

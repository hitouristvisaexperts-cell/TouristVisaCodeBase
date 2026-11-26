import { useEffect, useState } from 'react'

export type Review = {
  id: string
  country: string
  quote: string
  name: string
  city: string
  avatar: string            // '' → the card shows the client's initials
  rating: number
  stampDate: string
  stampType: 'DEPARTED' | 'ARRIVED'
}

// Only real approved reviews published from the portal (Admin → Testimonials) are displayed
export const DEFAULT_REVIEWS: Review[] = []

const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')

// "15 MAY 2026" — same style as the passport stamps (dates are stored as UTC midnight)
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const stamp = (iso: unknown) => {
  const d = new Date(String(iso || ''))
  return isNaN(d.getTime()) ? '' : `${String(d.getUTCDate()).padStart(2, '0')} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

type ApiReview = { _id: string; country?: string; quote?: string; name?: string; city?: string; rating?: number; approvedOn?: string; photoPath?: string }

let cached: Review[] | null = null
let loading: Promise<Review[] | null> | null = null

/** Fetches the published reviews once per visit; null/empty = none published. */
function loadReviews() {
  if (!loading) {
    loading = fetch(`${API}/testimonials`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const list: ApiReview[] = Array.isArray(d?.data) ? d.data : []
        if (!list.length) {
          cached = []
          return []
        }
        cached = list.map((t, i) => ({
          id: String(t._id),
          country: String(t.country || '').toUpperCase(),
          quote: String(t.quote || ''),
          name: String(t.name || ''),
          city: String(t.city || ''),
          avatar: t.photoPath ? API + t.photoPath : '',
          rating: Math.min(5, Math.max(1, Math.round(Number(t.rating)) || 5)),
          stampDate: stamp(t.approvedOn),
          stampType: i % 2 ? 'ARRIVED' : 'DEPARTED',
        }))
        return cached
      })
      .catch(() => [])
  }
  return loading
}

/** Reviews for the "What Our Clients Say" sections — live from the database. */
export function useReviews(): Review[] {
  const [list, setList] = useState<Review[]>(cached ?? [])
  useEffect(() => {
    let alive = true
    loadReviews().then(l => { if (alive && l) setList(l) })
    return () => { alive = false }
  }, [])
  return list
}

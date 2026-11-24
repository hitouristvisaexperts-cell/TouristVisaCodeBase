import { useEffect, useState } from 'react'
import avatarRohit from '@/assets/avatar-rohit.jpg'
import avatarAnanya from '@/assets/avatar-ananya.jpg'
import avatarArjun from '@/assets/avatar-arjun.jpg'

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

// Shown until the admin publishes reviews from the portal (Admin → Testimonials)
export const DEFAULT_REVIEWS: Review[] = [
  { id: 'd1', country: 'USA',       quote: 'The team made my USA visa process so easy and stress-free. Got my visa in just a few days!', name: 'Rohit Mehta',   city: 'Mumbai, India',    avatar: avatarRohit,  rating: 5, stampDate: '15 MAY 2024', stampType: 'DEPARTED' },
  { id: 'd2', country: 'UK',        quote: 'Excellent service and guidance at every step. Highly recommended!',                          name: 'Ananya Sharma', city: 'Delhi, India',     avatar: avatarAnanya, rating: 5, stampDate: '22 APR 2024', stampType: 'ARRIVED'  },
  { id: 'd3', country: 'CANADA',    quote: 'Professional, reliable and very responsive. Got my Canada visa without any hassle.',         name: 'Arjun Nair',    city: 'Bangalore, India', avatar: avatarArjun,  rating: 5, stampDate: '10 JUN 2024', stampType: 'DEPARTED' },
  { id: 'd4', country: 'AUSTRALIA', quote: 'Smooth and seamless experience. My Australia visa was approved faster than I expected!',     name: 'Priya Kapoor',  city: 'Chennai, India',   avatar: avatarAnanya, rating: 5, stampDate: '03 MAR 2024', stampType: 'ARRIVED'  },
  { id: 'd5', country: 'SCHENGEN',  quote: 'They handled everything perfectly. Europe trip was a dream come true thanks to this team!',  name: 'Vikram Singh',  city: 'Pune, India',      avatar: avatarRohit,  rating: 5, stampDate: '18 JUL 2024', stampType: 'DEPARTED' },
  { id: 'd6', country: 'DUBAI',     quote: 'Fast, efficient and very professional. Got my Dubai visa within 24 hours. Amazing service!', name: 'Sneha Reddy',   city: 'Hyderabad, India', avatar: avatarArjun,  rating: 5, stampDate: '29 AUG 2024', stampType: 'ARRIVED'  },
]

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

/** Fetches the published reviews once per visit; null = none published (keep the defaults). */
function loadReviews() {
  if (!loading) {
    loading = fetch(`${API}/testimonials`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => {
        const list: ApiReview[] = Array.isArray(d?.data) ? d.data : []
        if (!list.length) return null
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
      .catch(() => null)
  }
  return loading
}

/** Reviews for the "What Our Clients Say" sections — live from the portal, else the built-in ones. */
export function useReviews(): Review[] {
  const [list, setList] = useState<Review[]>(cached ?? DEFAULT_REVIEWS)
  useEffect(() => {
    let alive = true
    loadReviews().then(l => { if (alive && l) setList(l) })
    return () => { alive = false }
  }, [])
  return list
}

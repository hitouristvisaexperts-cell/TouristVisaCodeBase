// Visitor country detection (2-letter ISO code, e.g. "IN") from the visitor's IP.
// ipapi.co alone was rate-limited/blocked (403) for many visitors on the live site, so try two
// free CORS-enabled services in turn, and cache the answer for the session so it runs once per visit.

const CACHE_KEY = 'tve_country_code'

const SOURCES: Array<{ url: string; pick: (d: any) => unknown }> = [
  { url: 'https://api.country.is/', pick: d => d?.country },
  { url: 'https://ipwho.is/', pick: d => (d?.success === false ? null : d?.country_code) },
]

let pending: Promise<string | null> | null = null

async function lookup(): Promise<string | null> {
  for (const { url, pick } of SOURCES) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 4000)
      const res = await fetch(url, { signal: ctrl.signal })
      clearTimeout(timer)
      if (!res.ok) continue
      const code = pick(await res.json())
      if (typeof code === 'string' && /^[A-Z]{2}$/i.test(code)) return code.toUpperCase()
    } catch { /* try the next source */ }
  }
  return null
}

export function detectCountryCode(): Promise<string | null> {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY)
    if (cached) return Promise.resolve(cached)
  } catch { /* storage unavailable (private mode) — just look it up */ }

  if (!pending) {
    pending = lookup().then(code => {
      try { if (code) sessionStorage.setItem(CACHE_KEY, code) } catch { /* ignore */ }
      return code
    })
  }
  return pending
}

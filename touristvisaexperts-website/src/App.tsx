import { useState, useCallback, useEffect, useLayoutEffect, lazy, Suspense } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Toaster } from 'sonner'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import { JourneyBanner } from './components/site/JourneyBanner'
import { Services } from './components/site/Services'
import { Destinations } from './components/site/Destinations'
import { Testimonials } from './components/site/Testimonials'
import { FAQ } from './components/site/FAQ'
import { Blog } from './components/site/Blog'
import { Footer } from './components/site/Footer'
import DestinationShowcase from './components/ui/spatial-product-showcase'
// Everything except the home page is loaded on demand, so the first visit downloads far less JavaScript
const CinematicHero = lazy(() => import('./components/ui/cinematic-landing-hero').then(m => ({ default: m.CinematicHero })))
const AboutStory = lazy(() => import('./components/site/AboutStory').then(m => ({ default: m.AboutStory })))
const VisaDetails = lazy(() => import('./pages/VisaDetails'))
const VisaAssistancePage = lazy(() => import('./pages/VisaAssistancePage'))
const ConsultationPage = lazy(() => import('./pages/ConsultationPage'))
const FlightReservationPage = lazy(() => import('./pages/FlightReservationPage'))
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'))
const ClientPortalPage = lazy(() => import('./pages/ClientPortalPage'))
const RefundGuaranteePage = lazy(() => import('./pages/RefundGuaranteePage'))
const RejectedVisaPage = lazy(() => import('./pages/RejectedVisaPage'))
const DocumentChecklistPage = lazy(() => import('./pages/DocumentChecklistPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'))
const CancellationPage = lazy(() => import('./pages/CancellationPage'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'))
const ConsentPage = lazy(() => import('./pages/ConsentPage'))
const DataRetentionPage = lazy(() => import('./pages/DataRetentionPage'))
const ArticlePage = lazy(() => import('./pages/ArticlePage'))
import { NavigationContext } from './context/NavigationContext'
import { detectCountryCode } from './lib/geo'
import { loadPrices } from './lib/pricing'
import { goToPortal } from './lib/portal'
import type { CheckoutData, ArticleData } from './context/NavigationContext'

function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white" role="status" aria-label="Loading page">
      <span className="h-9 w-9 animate-spin rounded-full border-[3px] border-orange-200 border-t-orange-500" />
    </div>
  )
}

type VisaPage = { from: string; fromFlag: string; to: string; toFlag: string }
type ActivePage = 'home' | 'about-us' | 'visa-assistance' | 'visa-details' | 'consultation' | 'flight-reservation' | 'checkout' | 'client-portal' | 'refund-guarantee' | 'rejected-visa' | 'documents' | 'article' | 'terms' | 'refund-policy' | 'privacy' | 'disclaimer' | 'consent' | 'data-retention' | 'contact-us' | 'resources'

// URL path <-> page mapping
const PATH_TO_PAGE: Record<string, ActivePage> = {
  '/':                   'home',
  '/about':              'about-us',
  '/visa-assistance':    'visa-assistance',
  '/consultation':       'consultation',
  '/flight-reservation': 'flight-reservation',
  '/checkout':           'checkout',
  '/client-portal':      'client-portal',
  '/refund-guarantee':   'refund-guarantee',
  '/rejected-visa':      'rejected-visa',
  '/documents':          'documents',
  '/article':            'article',
  '/terms':              'terms',
  '/refund-policy':      'refund-policy',
  '/cancellation':       'refund-policy', // legacy alias, keeps old links working
  '/privacy':            'privacy',
  '/disclaimer':         'disclaimer',
  '/consent':            'consent',
  '/data-retention':     'data-retention',
  '/contact':            'contact-us',
  '/resources':          'resources',
  // The separate Specialist / Guarantee plan pages were replaced by the new Visa Rejected page
  '/specialist-standard':  'rejected-visa',
  '/guarantee-specialist': 'rejected-visa',
}

// Destination visa URL pattern: /visa/{dest}touristvisa
// (legacy /{fromCode}/visa/... links are still parsed, then redirected to the clean form)
const VISA_URL_RE = /^\/(?:(IN|GB|US|EU|OT)\/)?visa\/(.+?)touristvisa$/i
// Checkout URL pattern: /checkout/{dest}touristvisa (legacy: /checkout/{fromCode}/...)
const CHECKOUT_URL_RE = /^\/checkout\/(?:(IN|GB|US|EU|OT)\/)?(.+?)touristvisa$/i
const FROM_CODE_MAP: Record<string, { name: string; flag: string }> = {
  IN: { name: 'India',  flag: '🇮🇳' },
  GB: { name: 'UK',     flag: '🇬🇧' },
  US: { name: 'USA',    flag: '🇺🇸' },
  EU: { name: 'Europe', flag: '🇪🇺' },
  OT: { name: 'Other',  flag: '🌍' },
}
const DEST_FLAG_MAP: Record<string, string> = {
  USA: '🇺🇸', UK: '🇬🇧', Canada: '🇨🇦', Australia: '🇦🇺', Schengen: '🇪🇺',
  UAE: '🇦🇪', Turkey: '🇹🇷', NewZealand: '🇳🇿', Japan: '🇯🇵', Germany: '🇩🇪',
  France: '🇫🇷', Italy: '🇮🇹', Spain: '🇪🇸', Netherlands: '🇳🇱', Singapore: '🇸🇬',
  Austria: '🇦🇹', Belgium: '🇧🇪', Bulgaria: '🇧🇬', Croatia: '🇭🇷', CzechRepublic: '🇨🇿',
  Denmark: '🇩🇰', Estonia: '🇪🇪', Finland: '🇫🇮', Greece: '🇬🇷', Hungary: '🇭🇺',
  Iceland: '🇮🇸', Latvia: '🇱🇻', Liechtenstein: '🇱🇮', Lithuania: '🇱🇹', Luxembourg: '🇱🇺',
  Malta: '🇲🇹', Norway: '🇳🇴', Poland: '🇵🇱', Portugal: '🇵🇹', Romania: '🇷🇴',
  Slovakia: '🇸🇰', Slovenia: '🇸🇮', Sweden: '🇸🇪', Switzerland: '🇨🇭',
}
const toUrlSlug = (name: string) => name.replace(/\s+/g, '')
// Typed URLs can arrive in any case (/visa/australiatouristvisa) — map them back to the known spelling
const canonicalSlug = (slug: string) => Object.keys(DEST_FLAG_MAP).find(k => k.toLowerCase() === slug.toLowerCase()) || slug
const fromUrlSlug = (rawSlug: string) => {
  const slug = canonicalSlug(rawSlug)
  if (slug === 'NewZealand') return 'New Zealand'
  if (slug === 'CzechRepublic') return 'Czech Republic'
  return slug
}

const SECTION_MAP: Record<string, string> = {
  'home':       '',
  'about':      'about',
  'all-visas':  'destinations',
  'services':   'services',
  'resources':  'blog',
  'contact':    'contact',
}

function scrollToSection(id: string) {
  if (!id) { window.scrollTo({ top: 0, behavior: 'smooth' }); return }
  // After switching to the home page the section may not be rendered yet, and images above it
  // keep shifting the layout while they load — wait for it, then correct the position once.
  let tries = 0
  const attempt = () => {
    const el = document.getElementById(id)
    if (!el) { if (tries++ < 30) setTimeout(attempt, 100); return }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setTimeout(() => {
      const top = el.getBoundingClientRect().top
      if (Math.abs(top) > 40) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 900)
  }
  attempt()
}

// ISO code → { name used in CURRENCY/PRICING maps, flag emoji }
const GEO_MAP: Record<string, { name: string; flag: string }> = {
  IN: { name: 'India',        flag: '🇮🇳' }, GB: { name: 'UK',           flag: '🇬🇧' },
  US: { name: 'USA',          flag: '🇺🇸' }, AE: { name: 'UAE',          flag: '🇦🇪' },
  CA: { name: 'Canada',       flag: '🇨🇦' }, AU: { name: 'Australia',    flag: '🇦🇺' },
  SG: { name: 'Singapore',    flag: '🇸🇬' }, QA: { name: 'Qatar',        flag: '🇶🇦' },
  SA: { name: 'Saudi Arabia', flag: '🇸🇦' }, KW: { name: 'Kuwait',       flag: '🇰🇼' },
  OM: { name: 'Oman',         flag: '🇴🇲' }, BH: { name: 'Bahrain',      flag: '🇧🇭' },
  DE: { name: 'Germany',      flag: '🇩🇪' }, FR: { name: 'France',       flag: '🇫🇷' },
  NL: { name: 'Netherlands',  flag: '🇳🇱' }, IT: { name: 'Italy',        flag: '🇮🇹' },
  ES: { name: 'Spain',        flag: '🇪🇸' }, JP: { name: 'Japan',        flag: '🇯🇵' },
  NZ: { name: 'New Zealand',  flag: '🇳🇿' }, ZA: { name: 'South Africa', flag: '🇿🇦' },
  MY: { name: 'Malaysia',     flag: '🇲🇾' }, PH: { name: 'Philippines',  flag: '🇵🇭' },
}

function App() {
  const navigate = useNavigate()
  const location = useLocation()

  const go = useCallback((path: string, opts?: { replace?: boolean }) => {
    navigate(path, opts)
  }, [navigate])

  const [visaPage, setVisaPage]             = useState<VisaPage | null>(null)
  const [checkoutData, setCheckoutData]     = useState<CheckoutData | null>(null)
  const [rejectedTierChoice, setRejectedTierChoice] = useState<'standard' | 'guarantee' | null>(null) // eslint-disable-line @typescript-eslint/no-unused-vars
  void rejectedTierChoice
  const [currentArticle, setCurrentArticle] = useState<ArticleData | null>(null)
  const [detectedFrom, setDetectedFrom]     = useState<{ name: string; flag: string }>({ name: 'India', flag: '🇮🇳' })
  // Live prices from the admin portal: once loaded, bump a counter so every page re-renders with them
  const [, setPricesVersion] = useState(0)
  useEffect(() => { loadPrices().then(changed => { if (changed) setPricesVersion(v => v + 1) }) }, [])

  // Detect user country via IP (for default "from" in visa details)
  useEffect(() => {
    detectCountryCode().then(code => {
      const g = code ? GEO_MAP[code] : undefined
      if (g) setDetectedFrom(g)
    })
  }, [])

  // Strip legacy /en-XX prefix — redirect to clean URL
  useEffect(() => {
    const m = location.pathname.match(/^\/(en-[A-Z]{2})(\/.*)?$/)
    if (m) navigate(m[2] || '/', { replace: true })
  }, [location.pathname, navigate])

  // Parse visa destination URL: /visa/{dest}touristvisa
  const visaUrlMatch = location.pathname.match(VISA_URL_RE)
  if (visaUrlMatch && !visaPage) {
    const fromInfo = visaUrlMatch[1] ? (FROM_CODE_MAP[visaUrlMatch[1].toUpperCase()] || FROM_CODE_MAP.OT) : detectedFrom
    const destSlug = visaUrlMatch[2]
    const destName = fromUrlSlug(destSlug)
    const destFlag = DEST_FLAG_MAP[canonicalSlug(destSlug)] || '🌍'
    setVisaPage({ from: fromInfo.name, fromFlag: fromInfo.flag, to: destName, toFlag: destFlag })
  }

  // Parse checkout URL: /checkout/{dest}touristvisa
  const checkoutUrlMatch = location.pathname.match(CHECKOUT_URL_RE)
  if (checkoutUrlMatch && !checkoutData) {
    const fromInfo = checkoutUrlMatch[1] ? (FROM_CODE_MAP[checkoutUrlMatch[1].toUpperCase()] || FROM_CODE_MAP.OT) : detectedFrom
    const destSlug = checkoutUrlMatch[2]
    const destName = fromUrlSlug(destSlug)
    setCheckoutData({ visaCountry: destName, fromCountry: fromInfo.name, travellers: 1, rejectedTier: null })
  }

  // Legacy URLs carried the visitor's country code (/IN/visa/..., /checkout/IN/...) — drop it
  useEffect(() => {
    const legacy = visaUrlMatch?.[1] ? `/visa/${visaUrlMatch[2]}touristvisa`
      : checkoutUrlMatch?.[1] ? `/checkout/${checkoutUrlMatch[2]}touristvisa`
      : null
    if (legacy) navigate(legacy + location.search, { replace: true })
  }, [location.pathname]) // eslint-disable-line react-hooks/exhaustive-deps

  // Derive active page from path
  const activePage: ActivePage = visaUrlMatch ? 'visa-details' : checkoutUrlMatch ? 'checkout' : (PATH_TO_PAGE[location.pathname] ?? 'home')

  // Every page opens at the top, instantly, before it is painted (and the browser never restores an old position)
  useLayoutEffect(() => { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual' }, [])
  useLayoutEffect(() => { window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior }) }, [location.pathname, visaPage])

  const navigateTo = useCallback((target: string) => {
    if (target === 'about-us')        { setVisaPage(null); go('/about'); return }
    if (target === 'visa-details')    { return }
    if (target === 'client-portal')   { goToPortal(); return }   // login / sign-up live on the portal
    if (target === 'refund-guarantee'){ setVisaPage(null); go('/refund-guarantee'); return }
    if (target === 'documents')       { go('/documents'); return }
    if (target === 'contact')         { setVisaPage(null); go('/contact'); return }
    if (target === 'resources')       { setVisaPage(null); go('/resources'); return }
    if (target === 'rejected-visa' || target === 'specialist-standard' || target === 'guarantee-specialist') { setVisaPage(null); go('/rejected-visa'); return }

    // Section anchors on the home page
    const sectionId = SECTION_MAP[target] ?? target.replace('#', '')
    if (location.pathname !== '/') {
      go('/')
      setTimeout(() => scrollToSection(sectionId), 100)
    } else {
      scrollToSection(sectionId)
    }
  }, [go, location.pathname])

  const openVisaDetails = useCallback((to: string, toFlag: string) => {
    setVisaPage({ from: detectedFrom.name, fromFlag: detectedFrom.flag, to, toFlag })
    go(`/visa/${toUrlSlug(to)}touristvisa`)
  }, [go, detectedFrom])
  // The All Visas page was removed — send visitors to the home-page destination picker instead
  const openAllDestinations   = useCallback(() => { navigateTo('home') }, [navigateTo])
  const openArticle           = useCallback((article: ArticleData) => { setCurrentArticle(article); go('/article') }, [go])
  const openVisaAssistance    = useCallback(() => { setVisaPage(null); go('/visa-assistance') }, [go])
  const openConsultation      = useCallback(() => { setVisaPage(null); go('/consultation') }, [go])
  const openFlightReservation = useCallback(() => { setVisaPage(null); go('/flight-reservation') }, [go])
  const openCheckout          = useCallback((visaCountry: string, fromCountry: string, travellers = 1, rejectedTier: 'standard' | 'guarantee' | null = null, previouslyRejected: boolean | null = null) => {
    setCheckoutData({ visaCountry, fromCountry, travellers, rejectedTier, previouslyRejected: rejectedTier ? true : previouslyRejected })
    go(`/checkout/${toUrlSlug(visaCountry)}touristvisa`)
  }, [go])
  const openClientPortal      = useCallback(() => { goToPortal() }, [])
  const openRejectedVisa      = useCallback((prefill?: { country?: string; travellers?: number }) => {
    setVisaPage(null)
    const q = new URLSearchParams()
    if (prefill?.country) q.set('country', prefill.country)
    if (prefill?.travellers && prefill.travellers > 1) q.set('travellers', String(prefill.travellers))
    go(`/rejected-visa${q.toString() ? `?${q}` : ''}`)
  }, [go])
  const openCheckoutWithRejectedTier = useCallback((tier: 'standard' | 'guarantee') => { setRejectedTierChoice(tier); go('/checkout') }, [go])

  // Data pages without their state → redirect home (but allow Stripe return or URL-encoded checkout)
  const hasStripeReturn = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('stripe_session')
  useEffect(() => {
    if (activePage === 'checkout' && !checkoutData && !hasStripeReturn && !checkoutUrlMatch) go('/', { replace: true })
    if (activePage === 'article' && !currentArticle) go('/', { replace: true })
  }, [activePage, checkoutData, currentArticle, hasStripeReturn, checkoutUrlMatch])

  return (
    <NavigationContext.Provider value={{ navigateTo, openVisaAssistance, openConsultation, openFlightReservation, openCheckout, openClientPortal, openRejectedVisa, openCheckoutWithRejectedTier, openVisaDetails, openAllDestinations, openArticle }}>
      <Toaster richColors position="top-right" />

      <Suspense fallback={<PageLoader />}>
      {activePage === 'about-us' ? (
        <>
          <Navbar />
          <CinematicHero
            onBookConsultation={openConsultation}
          />
          <AboutStory />
          <Footer />
        </>
      ) : activePage === 'visa-details' && visaPage ? (
        <VisaDetails
          key={visaPage.to}
          from={visaPage.from}
          fromFlag={visaPage.fromFlag}
          to={visaPage.to}
          toFlag={visaPage.toFlag}
        />
      ) : activePage === 'visa-assistance' ? (
        <VisaAssistancePage />
      ) : activePage === 'consultation' ? (
        <ConsultationPage />
      ) : activePage === 'flight-reservation' ? (
        <FlightReservationPage />
      ) : activePage === 'checkout' && (checkoutData || hasStripeReturn) ? (
        <CheckoutPage
          visaCountry={checkoutData?.visaCountry ?? ''}
          fromCountry={checkoutData?.fromCountry ?? 'India'}
          initialTravellers={checkoutData?.travellers ?? 1}
          initialRejectedTier={checkoutData?.rejectedTier ?? null}
          initialPreviouslyRejected={checkoutData?.previouslyRejected ?? null}
        />
      ) : activePage === 'refund-guarantee' ? (
        <RefundGuaranteePage />
      ) : activePage === 'documents' ? (
        <DocumentChecklistPage />
      ) : activePage === 'rejected-visa' ? (
        <RejectedVisaPage />
      ) : activePage === 'contact-us' ? (
        <ContactPage />
      ) : activePage === 'resources' ? (
        <ResourcesPage />
      ) : activePage === 'terms' ? (
        <TermsPage />
      ) : activePage === 'refund-policy' ? (
        <CancellationPage />
      ) : activePage === 'privacy' ? (
        <PrivacyPage />
      ) : activePage === 'disclaimer' ? (
        <DisclaimerPage />
      ) : activePage === 'consent' ? (
        <ConsentPage />
      ) : activePage === 'data-retention' ? (
        <DataRetentionPage />
      ) : activePage === 'article' && currentArticle ? (
        <ArticlePage article={currentArticle} />
      ) : activePage === 'client-portal' ? (
        <ClientPortalPage />
      ) : (
        <>
          <Navbar />
          <div id="hero">
            <Hero
              onCheck={(from, to) => {
                if (from && to) {
                  setVisaPage({ from: from.label, fromFlag: from.flag, to: to.label, toFlag: to.flag })
                  go(`/visa/${toUrlSlug(to.label)}touristvisa`)
                }
              }}
            />
          </div>
          <JourneyBanner />
          <div id="services"><Services /></div>
          <div id="destinations"><Destinations /></div>
          <DestinationShowcase />
          <div id="testimonials"><Testimonials /></div>
          <FAQ />
          <div id="blog"><Blog /></div>
          <div id="contact"><Footer /></div>
        </>
      )}
      </Suspense>
    </NavigationContext.Provider>
  )
}

export default App

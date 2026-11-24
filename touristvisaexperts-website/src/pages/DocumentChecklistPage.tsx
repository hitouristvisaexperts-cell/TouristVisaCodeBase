import { useState } from 'react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { useNavigation } from '../context/NavigationContext'
import { FileText, CheckCircle2, ArrowRight, Search, Globe, AlertTriangle } from 'lucide-react'

/* ─── Data ──────────────────────────────────────────────────────────── */
const ROUTES = [
  {
    id: 1, from: 'UK', to: 'Australia', fromFlag: '🇬🇧', toFlag: '🇦🇺',
    docs: [
      'Immigration Status',
      'Previous Visa Stamping (If Any)',
      'Share Code',
      'Recent Employment Letter',
      'Recent 3 Months\' Payslips',
      'Recent 3 Months\' Bank Statements',
      'Cover Letter',
      'Travel Itinerary',
    ],
    extra: [
      'Previous Visa Stamping',
      'Immigration Status',
      'Share Code',
    ],
  },
  {
    id: 2, from: 'UK', to: 'Turkey', fromFlag: '🇬🇧', toFlag: '🇹🇷',
    docs: [
      'Passport (Original and Copy)',
      'Immigration Status',
      'Previous Visa Stamping (If Any)',
      'Share Code',
      'Recent Employment Letter',
      'Recent 3 Months\' Payslips',
      'Recent 3 Months\' Bank Statements',
      'Hotel Booking',
      'Flight Bookings (Optional)',
      'Two Passport-Size Photos',
      'Cover Letter',
    ],
    extra: [
      'Immigration Status',
      'Previous Visa Stamping',
      'Share Code',
      'Flight Booking',
    ],
  },
  {
    id: 3, from: 'UK', to: 'New Zealand', fromFlag: '🇬🇧', toFlag: '🇳🇿',
    docs: [
      'Passport (Original and Copy)',
      'Immigration Status',
      'Previous Visa Stamping (If Any)',
      'Share Code',
      'Recent Employment Letter',
      'Recent 3 Months\' Payslips',
      'Recent 3 Months\' Bank Statements',
      'Flight Bookings (Optional)',
      'Two Passport-Size Photos',
      'Cover Letter',
    ],
    extra: [
      'Immigration Status',
      'Previous Visa Stamping',
      'Share Code',
      'Flight Booking',
    ],
  },
  {
    id: 4, from: 'UK', to: 'Canada', fromFlag: '🇬🇧', toFlag: '🇨🇦',
    docs: [
      'Application Form',
      'Passport',
      'Immigration Status',
      'Share Code',
      'Recent Employment Letter',
      'Recent 3 Months\' Bank Statements',
      'Recent 3 Months\' Payslips',
      'Hotel Booking',
      'Flight Bookings (Optional)',
      'Educational Documents (SSC to Masters)',
      'Previous Job History',
    ],
    extra: [
      'Immigration Status',
      'Previous Visa Stamping',
      'Share Code',
      'Flight Booking',
      'Educational Proof',
    ],
  },
  {
    id: 5, from: 'India', to: 'UK', fromFlag: '🇮🇳', toFlag: '🇬🇧',
    docs: [
      'Passport',
      '6 Months\' Bank Statements',
      '3–6 Months\' Salary Slips',
      'Employment Letter + Leave Approval / NOC',
      'ITR (2–3 Years)',
      'Flight Itinerary',
      'Hotel Bookings',
      'Detailed Cover Letter',
      'Proof of Assets / Property (if available)',
      'Previous Travel History / Old Visas (if any)',
    ],
    extra: [],
  },
  {
    id: 6, from: 'India', to: 'Australia', fromFlag: '🇮🇳', toFlag: '🇦🇺',
    docs: [
      '6 Months\' Bank Statements',
      'Salary Slips / Business Proof',
      'Employment Letter & Leave Approval',
      'ITRs',
      'Travel Itinerary',
      'Cover Letter',
      'Property / Assets Proof (if available)',
      'Previous Travel History / Visas',
    ],
    extra: [],
  },
  {
    id: 7, from: 'India', to: 'USA', fromFlag: '🇮🇳', toFlag: '🇺🇸',
    docs: [
      'Passport',
      'DS-160 Confirmation Page',
      'Appointment Confirmation',
      'Visa Fee Receipt',
      'Bank Statements (6 Months)',
      'ITRs (2–3 Years)',
      'Salary Slips',
      'Employment Letter / NOC',
      'Travel Itinerary',
      'Property / Assets Proof (if available)',
      'Invitation Letter (if applicable)',
      'Previous Visas and Travel History',
    ],
    extra: [
      'Visa Fee Receipt',
      'Invitation Letter',
      'Property Proof',
      'DS-160 Confirmation',
      'Salary Slips',
    ],
  },
  {
    id: 8, from: 'India', to: 'New Zealand', fromFlag: '🇮🇳', toFlag: '🇳🇿',
    docs: [
      'Passport',
      'Visa Application Form',
      'Passport Photos',
      '6 Months\' Bank Statements',
      'Salary Slips / Business Proof',
      'ITRs',
      'Employment Letter & Leave Approval',
      'Travel Itinerary',
      'Cover Letter',
      'Property / Assets Proof (if available)',
      'Previous Travel History',
      'Invitation Letter (if applicable)',
    ],
    extra: [
      'Salary Slips',
      'ITRs',
      'Invitation Letter',
      'Previous Travel History',
    ],
  },
  {
    id: 9, from: 'India', to: 'Canada', fromFlag: '🇮🇳', toFlag: '🇨🇦',
    docs: [
      'Passport',
      'Visa Application Forms',
      'Digital Photo',
      'Biometrics Appointment Confirmation',
      '6 Months\' Bank Statements',
      'Salary Slips / Business Proof',
      'ITRs',
      'Employment Letter & Leave Approval',
      'Travel Itinerary',
      'Hotel Bookings',
      'Cover Letter',
      'Property / Assets Proof (if available)',
      'Previous Travel History',
      'Invitation Letter (if applicable)',
    ],
    extra: [
      'Digital Photo',
      'Biometrics Appointment',
      'ITRs',
      'Hotel Bookings',
      'Invitation Letter',
      'Previous Travel History',
    ],
  },
  {
    id: 10, from: 'India', to: 'Turkey', fromFlag: '🇮🇳', toFlag: '🇹🇷',
    docs: [
      'Passport',
      'Visa Application Form',
      'Passport Photographs',
      'Bank Statements (3–6 Months)',
      'Salary Slips / Business Proof',
      'ITRs',
      'Employment Letter & Leave Approval',
      'Flight Booking',
      'Hotel Booking',
      'Travel Insurance',
      'Cover Letter',
      'Property / Assets Proof (if available)',
      'Previous Travel History',
    ],
    extra: [
      'ITRs',
      'Flight Tickets',
      'Hotel Bookings',
      'Property Proof',
    ],
  },
]

// Standard docs we prepare for every client
const STANDARD_DOCS = [
  'Accommodation Proof',
  'Application Form',
  'Bank Statement',
  'Cover Letter',
  'Employment Proof',
  'Passport-Size Photo',
  'Travel Insurance',
  'Travel Itinerary',
  'Valid Passport',
]

/* ─── Component ─────────────────────────────────────────────────────── */
export default function DocumentChecklistPage() {
  const { openVisaAssistance, openConsultation } = useNavigation()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'UK' | 'India'>('all')

  const filtered = ROUTES.filter(r => {
    const matchFilter = filter === 'all' || r.from === filter
    const q = search.toLowerCase()
    const matchSearch = !q || r.from.toLowerCase().includes(q) || r.to.toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans',sans-serif]">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');`}</style>
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-4 sm:px-6 pt-16 pb-14"
        style={{ background: 'linear-gradient(160deg,#ffffff 0%,#eff6ff 50%,#ffffff 100%)' }}>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: 'radial-gradient(circle at 70% 20%,rgba(59,130,246,0.07) 0%,transparent 60%)' }} />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border"
            style={{ background: 'rgba(59,130,246,0.07)', borderColor: 'rgba(59,130,246,0.25)', color: '#1d4ed8' }}>
            <FileText size={11} /> Visa Document Checklist
          </div>
          <h1 className="text-[36px] sm:text-[50px] font-black text-gray-900 leading-[1.05] tracking-tight mb-4">
            Know Exactly What<br />
            <span style={{ background: 'linear-gradient(90deg,#1d4ed8,#7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Documents You Need
            </span>
          </h1>
          <p className="text-[16px] text-gray-500 leading-relaxed mb-8 max-w-xl mx-auto">
            Complete document checklists for 10 popular visa routes. Know what's required before you apply.
          </p>

          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by country…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 text-[14px] text-gray-800 font-medium placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden">
              {(['all', 'UK', 'India'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-3 text-[13px] font-black transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  {f === 'all' ? 'All' : `From ${f}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Standard Docs Banner ── */}
      <section className="py-6 px-4 sm:px-6 border-y border-gray-100 bg-blue-50">
        <div className="max-w-5xl mx-auto">
          <p className="text-[11px] font-black uppercase tracking-widest text-blue-600 mb-3 text-center">We Prepare These For Every Client</p>
          <div className="flex flex-wrap justify-center gap-2">
            {STANDARD_DOCS.map(doc => (
              <span key={doc} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-800 bg-white border border-blue-200 rounded-full px-3 py-1.5">
                <CheckCircle2 size={11} className="text-blue-500" /> {doc}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Route Cards ── */}
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Globe size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-semibold">No routes match your search.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {filtered.map(route => (
                <div key={route.id} className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  {/* Route header */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-gray-100 bg-gray-50">
                    <span className="text-[11px] font-black text-gray-400 w-5">{String(route.id).padStart(2, '0')}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{route.fromFlag}</span>
                      <div>
                        <p className="text-[13px] font-black text-gray-900">{route.from}</p>
                      </div>
                      <ArrowRight size={14} className="text-gray-400 mx-1" />
                      <span className="text-2xl">{route.toFlag}</span>
                      <div>
                        <p className="text-[13px] font-black text-gray-900">{route.to}</p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-gray-400">{route.docs.length} documents</span>
                  </div>

                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* All required docs */}
                    <div>
                      <p className="text-[10.5px] font-black uppercase tracking-widest text-gray-400 mb-3">Required Documents</p>
                      <ul className="space-y-1.5">
                        {route.docs.map((doc, i) => (
                          <li key={i} className="flex items-start gap-2 text-[13px] text-gray-700">
                            <CheckCircle2 size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            {doc}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex flex-col gap-4">
                      {/* Standard docs (always prepared) */}
                      <div>
                        <p className="text-[10.5px] font-black uppercase tracking-widest text-gray-400 mb-3">We Prepare (Included in Our Service)</p>
                        <ul className="space-y-1.5">
                          {STANDARD_DOCS.map((doc, i) => (
                            <li key={i} className="flex items-start gap-2 text-[13px] text-gray-600">
                              <CheckCircle2 size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                              {doc}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Extra / special docs */}
                      {route.extra.length > 0 && (
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={12} className="text-amber-600" />
                            <p className="text-[10.5px] font-black uppercase tracking-widest text-amber-700">Additional / Special Requirements</p>
                          </div>
                          <ul className="space-y-1.5">
                            {route.extra.map((doc, i) => (
                              <li key={i} className="flex items-start gap-2 text-[12.5px] text-amber-800 font-medium">
                                <span className="mt-0.5 flex-shrink-0">•</span>
                                {doc}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-14 px-4 sm:px-6 text-center" style={{ background: '#f8fafc' }}>
        <div className="max-w-xl mx-auto">
          <h2 className="text-[26px] sm:text-[32px] font-black text-gray-900 mb-3">
            Not Sure What You Need?
          </h2>
          <p className="text-gray-500 text-[14px] mb-7 leading-relaxed">
            Our specialists review your specific situation and tell you exactly what to prepare — no guesswork.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={openVisaAssistance}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-white text-[14px] font-black transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg,#1d4ed8,#1e40af)', boxShadow: '0 8px 24px rgba(29,78,216,0.35)' }}
            >
              Get Expert Help <ArrowRight size={15} />
            </button>
            <button
              onClick={openConsultation}
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-2xl text-gray-800 text-[14px] font-black border-2 border-gray-200 bg-white transition-all hover:shadow-md"
            >
              Book Free Consultation
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

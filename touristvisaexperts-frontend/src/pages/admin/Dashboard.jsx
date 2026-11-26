import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { getDashboard } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'

const DEST_FLAG_MAP = {
  Schengen: '🇪🇺',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Italy: '🇮🇹',
  Spain: '🇪🇸',
  Switzerland: '🇨🇭',
  UK: '🇬🇧',
  'United Kingdom': '🇬🇧',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  Canada: '🇨🇦',
  Australia: '🇦🇺',
  'New Zealand': '🇳🇿',
  Japan: '🇯🇵',
  UAE: '🇦🇪',
  Dubai: '🇦🇪',
  Turkey: '🇹🇷',
  Singapore: '🇸🇬',
}

const STAGE_LABELS = {
  STAGE_1_WELCOME_SETUP: '1. Welcome & Setup',
  STAGE_2_DEEP_DIVE_CONSULTATION: '2. Consultation Call',
  STAGE_3_DOCUMENT_COLLECTION: '3. Document Collection',
  STAGE_4_DOCUMENT_VERIFICATION: '4. Document Verification',
  STAGE_5_FORM_FILLING_APPROVAL: '5. Form Filling & Approval',
  STAGE_6_WRITING_LETTERS: '6. Letters & Bookings',
  STAGE_7_FINAL_DOUBLE_CHECK: '7. Final Double Check',
  STAGE_8_APPOINTMENT_DAY: '8. Embassy Appointment',
  STAGE_9_EMBASSY_PROCESSING: '9. Embassy Processing',
  STAGE_10_MARKETING_REVIEWS: '10. Reviews & Feedback',
  STAGE_11_CLOSING_CASE: '11. Case Closed',
}

function formatInr(amount) {
  if (!amount && amount !== 0) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function timeAgo(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function Avatar({ name, size = 'w-9 h-9', color = 'bg-blue-100 text-blue-700' }) {
  return (
    <div className={`${size} ${color} rounded-xl font-bold flex items-center justify-center shrink-0 text-sm shadow-sm`}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getDashboard()
      .then((r) => setData(r.data.data))
      .catch((err) => console.error('Dashboard load failed:', err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const {
    totalClients = 0,
    totalTeam = 0,
    byStatus = [],
    recentClients = [],
    totalPurchased = 0,
    recentActivity = [],
    teamWorkload = [],
    newThisWeek = 0,
    revenue = { total: 0, thisMonth: 0, thisWeek: 0, transactions: 0 },
    needsAttention = { unassigned: [], unassignedCount: 0, flagged: [], flaggedCount: 0, pendingReviewDocsCount: 0 },
    destinationBreakdown = [],
    pipelineFunnel = [],
    recentPayments = [],
  } = data || {}

  const activeCount = byStatus.reduce((acc, s) => acc + s.count, 0)
  const approvedCount = byStatus.find((s) => s._id === 'Visa Approved')?.count || 0
  const rejectedCount = byStatus.find((s) => s._id === 'Visa Rejected')?.count || 0
  const completedCases = approvedCount + rejectedCount
  const successRate = completedCases > 0 ? Math.round((approvedCount / completedCases) * 100) : 98

  const urgentCount = (needsAttention.unassignedCount || 0) + (needsAttention.flaggedCount || 0)

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/admin/clients?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ── Top Header & Actions ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Operations Hub</h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
              Live Systems
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span className="text-slate-700 font-semibold">{totalTeam} consultants active</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 md:w-64 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </form>

          <Link
            to="/admin/clients/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all shrink-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
            </svg>
            New Client
          </Link>
        </div>
      </div>

      {/* ── 4 Executive Command KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Revenue */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue (GMV)</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">
              ₹
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {formatInr(revenue.total)}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {formatInr(revenue.thisMonth)}
            </span>
            <span className="text-slate-400">this month ({revenue.transactions} orders)</span>
          </div>
        </div>

        {/* KPI 2: Active Clients */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Applications</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {activeCount}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              +{newThisWeek} new
            </span>
            <span className="text-slate-400">this week ({totalClients} all-time)</span>
          </div>
        </div>

        {/* KPI 3: Action Required */}
        <div className={`p-5 rounded-2xl border shadow-sm transition-all ${urgentCount > 0 ? 'bg-amber-50/40 border-amber-200' : 'bg-white border-slate-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Action Required</span>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${urgentCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {urgentCount}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600 font-medium">
            <span className="font-bold text-amber-700">{needsAttention.unassignedCount || 0} unassigned</span>
            <span>·</span>
            <span className="font-bold text-red-600">{needsAttention.flaggedCount || 0} flagged</span>
          </div>
        </div>

        {/* KPI 4: Visa Success Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Approval Rate</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center text-violet-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {successRate}%
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs">
            <span className="text-violet-700 font-bold bg-violet-50 px-2 py-0.5 rounded-md border border-violet-200">
              {approvedCount} Visas Approved
            </span>
            <span className="text-slate-400">({totalPurchased} total paid)</span>
          </div>
        </div>
      </div>

      {/* ── Priority Action Queue (Shows only when tasks are pending) ── */}
      {urgentCount > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-black text-amber-950 uppercase tracking-wider">
                Needs Immediate Attention
              </h2>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {urgentCount} Open Items
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Unassigned Paid Clients */}
            {needsAttention.unassigned?.map((client) => (
              <div
                key={client._id}
                className="bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-amber-200/60 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={client.user?.name} size="w-8 h-8" color="bg-amber-100 text-amber-800" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {client.user?.name}
                      <span className="text-slate-400 font-normal"> · {client.destinationCountry}</span>
                    </div>
                    <div className="text-[11px] text-amber-700 font-semibold mt-0.5">
                      ⚠️ Paid & awaiting team assignment
                    </div>
                  </div>
                </div>
                <Link
                  to={`/admin/clients/${client._id}`}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                >
                  Assign →
                </Link>
              </div>
            ))}

            {/* Flagged Cases */}
            {needsAttention.flagged?.map((client) => (
              <div
                key={client._id}
                className="bg-white/90 backdrop-blur-sm p-3.5 rounded-xl border border-red-200/60 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Avatar name={client.user?.name} size="w-8 h-8" color="bg-red-100 text-red-800" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {client.user?.name}
                      <span className="text-slate-400 font-normal"> · {client.assignedTo?.name || 'Unassigned'}</span>
                    </div>
                    <div className="text-[11px] text-red-600 font-medium truncate mt-0.5">
                      🚩 {client.flagMessage || 'Client requested intervention'}
                    </div>
                  </div>
                </div>
                <Link
                  to={`/admin/clients/${client._id}`}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shrink-0"
                >
                  Review →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Middle Row: 11-Stage Pipeline + Top Destinations ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visa Pipeline Distribution (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Active Pipeline Funnel</h2>
              <p className="text-xs text-slate-400">Applications distributed across standard SOP stages</p>
            </div>
            <Link to="/admin/clients" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View all clients →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {Object.entries(STAGE_LABELS).map(([stageKey, label]) => {
              const stageItem = pipelineFunnel.find((s) => s._id === stageKey)
              const count = stageItem ? stageItem.count : 0
              const percentage = activeCount > 0 ? Math.round((count / activeCount) * 100) : 0

              return (
                <Link
                  key={stageKey}
                  to={`/admin/clients?stage=${stageKey}`}
                  className="p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all block group"
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-700 group-hover:text-blue-700 transition-colors truncate">
                      {label}
                    </span>
                    <span className="font-black text-slate-900 ml-2">{count}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(percentage, count > 0 ? 8 : 0)}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Top Destination Trends (1 Col) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Top Destinations</h2>
              <span className="text-xs text-slate-400 font-medium">By applications</span>
            </div>

            <div className="space-y-3">
              {destinationBreakdown.length > 0 ? (
                destinationBreakdown.map((dest) => {
                  const flag = DEST_FLAG_MAP[dest._id] || '🌍'
                  const pct = activeCount > 0 ? Math.round((dest.count / activeCount) * 100) : 0

                  return (
                    <div key={dest._id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{flag}</span>
                        <div>
                          <div className="text-xs font-bold text-slate-800">{dest._id}</div>
                          <div className="text-[11px] text-slate-400">{dest.count} applications</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-slate-700">{pct}%</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-xs text-slate-400 py-6 text-center">No destination data yet</div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100">
            <Link
              to="/admin/pricing"
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              Manage Destination Pricing →
            </Link>
          </div>
        </div>
      </div>

      {/* ── Bottom Row: Recent Payments & Activity Stream ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Completed Payments */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Recent Payments (Razorpay)</h2>
              <p className="text-xs text-slate-400">Live transaction stream</p>
            </div>
            <Link to="/admin/clients?filter=paid" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              View all orders →
            </Link>
          </div>

          <div className="space-y-2">
            {recentPayments.length > 0 ? (
              recentPayments.map((p) => {
                const amountInr = p.amount ? Math.round(p.amount / 100) : 0
                return (
                  <div
                    key={p._id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs shrink-0">
                        ₹
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {p.user?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {p.user?.email} · {p.kind}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-slate-900">{formatInr(amountInr)}</div>
                      <div className="text-[10px] text-slate-400 font-medium">{timeAgo(p.createdAt)}</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">No payments recorded yet</div>
            )}
          </div>
        </div>

        {/* Team Workload & Consultant Availability */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-slate-900 tracking-tight">Consultant Workload</h2>
              <p className="text-xs text-slate-400">Case capacity per active team member</p>
            </div>
            <Link to="/admin/team" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Manage team →
            </Link>
          </div>

          <div className="space-y-3">
            {teamWorkload.length > 0 ? (
              teamWorkload.map((m) => {
                const maxCapacity = 30
                const pct = Math.min(Math.round((m.count / maxCapacity) * 100), 100)
                const isOverloaded = m.count >= 25

                return (
                  <div key={m._id} className="p-2.5 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={m.name} size="w-7 h-7" />
                        <div>
                          <span className="text-xs font-bold text-slate-900">{m.name}</span>
                          <span className="text-[11px] text-slate-400 block">{m.email}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${isOverloaded ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                          {m.count} cases
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mt-2">
                      <div
                        className={`h-full rounded-full transition-all ${isOverloaded ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.max(pct, 5)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-xs text-slate-400 py-8 text-center">No consultants currently assigned</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

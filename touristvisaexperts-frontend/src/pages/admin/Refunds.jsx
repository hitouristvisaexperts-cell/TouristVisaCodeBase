import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getClients, processRefund } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import Modal from '../../components/shared/Modal'

function formatInr(amount) {
  if (!amount && amount !== 0) return '₹0'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function timeAgo(date) {
  if (!date) return '—'
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function AdminRefunds() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'full' | 'partial' | 'paid'
  const [refundModalClient, setRefundModalClient] = useState(null)
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' })
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadData = () => {
    setLoading(true)
    getClients({ limit: 100 })
      .then((res) => {
        setClients(res.data.data?.clients || res.data.clients || [])
      })
      .catch((err) => console.error('Failed to load clients for refunds:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  // Calculations
  const paidClients = clients.filter((c) => c.isPurchased || (c.paidAmount && c.paidAmount > 0))
  const refundedClients = clients.filter(
    (c) => (c.refundAmount && c.refundAmount > 0) || (c.refundStatus && c.refundStatus !== 'none')
  )

  const totalPaid = paidClients.reduce((sum, c) => sum + (c.paidAmount || 0), 0)
  const totalRefunded = refundedClients.reduce((sum, c) => sum + (c.refundAmount || 0), 0)
  const netRevenue = Math.max(0, totalPaid - totalRefunded)
  const fullRefundCount = refundedClients.filter((c) => c.refundStatus === 'full').length
  const partialRefundCount = refundedClients.filter((c) => c.refundStatus === 'partial').length

  // Filtered view
  const filteredList = (statusFilter === 'paid' ? paidClients : refundedClients).filter((c) => {
    if (statusFilter === 'full' && c.refundStatus !== 'full') return false
    if (statusFilter === 'partial' && c.refundStatus !== 'partial') return false

    if (search.trim()) {
      const q = search.toLowerCase()
      const name = (c.user?.name || '').toLowerCase()
      const email = (c.user?.email || '').toLowerCase()
      const dest = (c.destinationCountry || '').toLowerCase()
      const reason = (c.refundReason || '').toLowerCase()
      return name.includes(q) || email.includes(q) || dest.includes(q) || reason.includes(q)
    }
    return true
  })

  const openRefundModal = (client) => {
    const remaining = Math.max(0, (client.paidAmount || 0) - (client.refundAmount || 0))
    setRefundModalClient(client)
    setRefundForm({ amount: remaining > 0 ? remaining : '', reason: '' })
    setError('')
    setSuccess('')
  }

  const handleRefundSubmit = async (e) => {
    e.preventDefault()
    if (!refundModalClient) return
    const amt = Number(refundForm.amount)
    if (!amt || amt <= 0) {
      setError('Please enter a valid refund amount.')
      return
    }
    const currentPaid = refundModalClient.paidAmount || 0
    const currentRefund = refundModalClient.refundAmount || 0
    const remaining = Math.max(0, currentPaid - currentRefund)
    if (amt > remaining) {
      setError(`Amount exceeds refundable balance of ₹${remaining.toLocaleString('en-IN')}`)
      return
    }

    setProcessing(true)
    setError('')
    setSuccess('')
    try {
      await processRefund(refundModalClient._id, {
        amount: amt,
        reason: refundForm.reason.trim() || 'Admin processed refund',
      })
      setSuccess('Refund recorded successfully!')
      setTimeout(() => {
        setRefundModalClient(null)
        loadData()
      }, 1000)
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to process refund. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 1200, margin: '0 auto' }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title" style={{ margin: 0 }}>Refund Amount & Management</h1>
            <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 99, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca' }}>
              Financial Tracking
            </span>
          </div>
          <p className="page-subtitle" style={{ marginTop: 4 }}>
            Monitor refund disbursements, reversal amounts, and process client balances
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => loadData()}
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
            Refresh
          </button>
          <Link
            to="/admin/clients"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5 }}
          >
            View All Clients →
          </Link>
        </div>
      </div>

      {/* ── 4 KPI Financial Metric Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {/* Total Refund Amount */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 18, border: '1.5px solid #fee2e2', boxShadow: '0 2px 10px rgba(220,38,38,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Total Refunded Amount
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626', fontSize: 16 }}>
              ↩
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#dc2626', letterSpacing: '-0.02em' }}>
            {formatInr(totalRefunded)}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, fontSize: 12, color: '#64748b' }}>
            <span style={{ fontWeight: 700, color: '#b91c1c', background: '#fef2f2', padding: '1px 8px', borderRadius: 6, border: '1px solid #fee2e2' }}>
              {refundedClients.length} cases
            </span>
            <span>({fullRefundCount} full · {partialRefundCount} partial)</span>
          </div>
        </div>

        {/* Total Gross Paid */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Gross Collections
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f172a', fontWeight: 800, fontSize: 14 }}>
              ₹
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {formatInr(totalPaid)}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Across <strong style={{ color: '#0f172a' }}>{paidClients.length}</strong> paid client orders
          </div>
        </div>

        {/* Net Retained Revenue */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 18, border: '1px solid #dcfce7', boxShadow: '0 2px 10px rgba(22,163,74,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Net Retained Revenue
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', fontWeight: 800, fontSize: 15 }}>
              ✓
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#16a34a', letterSpacing: '-0.02em' }}>
            {formatInr(netRevenue)}
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            Net funds retained after reversals
          </div>
        </div>

        {/* Refund Rate */}
        <div style={{ background: '#fff', padding: 20, borderRadius: 18, border: '1px solid #e2e8f0', boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Refund Rate
            </span>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: '#faf5ff', border: '1px solid #f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea', fontSize: 14 }}>
              %
            </div>
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>
            {totalPaid > 0 ? ((totalRefunded / totalPaid) * 100).toFixed(1) : 0}%
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
            {totalRefunded === 0 ? 'No refunds issued' : 'Of total gross volume'}
          </div>
        </div>
      </div>

      {/* ── Filters & Search ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, background: '#fff', padding: '14px 18px', borderRadius: 16, border: '1px solid #f1f5f9' }}>
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `Refunded Cases (${refundedClients.length})` },
            { key: 'partial', label: `Partial Refunds (${partialRefundCount})` },
            { key: 'full', label: `Full Refunds (${fullRefundCount})` },
            { key: 'paid', label: `All Paid Clients (${paidClients.length})` },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              style={{
                padding: '6px 14px', borderRadius: 10, fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer',
                background: statusFilter === tab.key ? '#0f172a' : '#f8fafc',
                color: statusFilter === tab.key ? '#fff' : '#64748b',
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ position: 'relative', minWidth: 240 }}>
          <input
            type="text"
            placeholder="Search by client or country..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input"
            style={{ width: '100%', paddingLeft: 34, fontSize: 12.5, height: 38 }}
          />
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* ── Refunds Table ── */}
      {loading ? (
        <PageSpinner />
      ) : filteredList.length === 0 ? (
        <EmptyState
          icon="💸"
          title={statusFilter === 'paid' ? 'No paid clients found' : 'No refund records found'}
          description={
            statusFilter === 'paid'
              ? 'No clients have completed payment yet.'
              : 'There are currently no processed refunds matching your filter.'
          }
        />
      ) : (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Client', 'Destination / Package', 'Paid Amount', 'Refund Amount', 'Remaining', 'Refund Status', 'Reason / Date', 'Actions'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredList.map((c, i) => {
                const paid = c.paidAmount || 0
                const refunded = c.refundAmount || 0
                const remaining = Math.max(0, paid - refunded)
                const isFullyRefunded = paid > 0 && refunded >= paid

                return (
                  <tr
                    key={c._id}
                    style={{ borderBottom: i < filteredList.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.1s' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#fafbfc' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Client */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13 }}>
                          {c.user?.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{c.user?.name || 'Unknown'}</div>
                          <div style={{ fontSize: 11.5, color: '#64748b' }}>{c.user?.email || '—'}</div>
                        </div>
                      </div>
                    </td>

                    {/* Destination / Package */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#1e293b' }}>{c.destinationCountry || c.visaType || '—'}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b' }}>{c.packageType || 'Standard'}</div>
                    </td>

                    {/* Paid Amount */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>
                        {paid > 0 ? `₹${paid.toLocaleString('en-IN')}` : '—'}
                      </span>
                    </td>

                    {/* Refund Amount */}
                    <td style={{ padding: '14px 16px' }}>
                      {refunded > 0 ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 800, background: '#fef2f2', padding: '3px 8px', borderRadius: 6, border: '1px solid #fecaca' }}>
                          <span>↩</span> -₹{refunded.toLocaleString('en-IN')}
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>₹0</span>
                      )}
                    </td>

                    {/* Remaining */}
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontWeight: 700, color: remaining > 0 ? '#16a34a' : '#94a3b8' }}>
                        ₹{remaining.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Refund Status */}
                    <td style={{ padding: '14px 16px' }}>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase',
                          background: c.refundStatus === 'full' ? '#fee2e2' : c.refundStatus === 'partial' ? '#fef3c7' : '#f1f5f9',
                          color: c.refundStatus === 'full' ? '#dc2626' : c.refundStatus === 'partial' ? '#d97706' : '#64748b',
                          border: c.refundStatus === 'full' ? '1px solid #fca5a5' : c.refundStatus === 'partial' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                        }}
                      >
                        {c.refundStatus === 'full' ? 'Full Refund' : c.refundStatus === 'partial' ? 'Partial Refund' : 'None'}
                      </span>
                    </td>

                    {/* Reason / Date */}
                    <td style={{ padding: '14px 16px', maxWidth: 180 }}>
                      <div style={{ fontSize: 12, color: '#334155', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={c.refundReason}>
                        {c.refundReason || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                        {timeAgo(c.refundedAt)}
                      </div>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Link
                          to={`/admin/clients/${c._id}`}
                          style={{
                            padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                            background: '#f8fafc', color: '#0f172a', border: '1px solid #e2e8f0', textDecoration: 'none',
                          }}
                        >
                          Details
                        </Link>
                        {c.isPurchased && !isFullyRefunded && (
                          <button
                            type="button"
                            onClick={() => openRefundModal(c)}
                            style={{
                              padding: '6px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                            }}
                          >
                            + Refund
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Issue Refund Modal ── */}
      {refundModalClient && (
        <Modal
          title={`Process Refund — ${refundModalClient.user?.name || 'Client'}`}
          onClose={() => setRefundModalClient(null)}
          maxWidth={460}
        >
          <form onSubmit={handleRefundSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && <div className="alert-error">{error}</div>}
            {success && <div className="alert-success">{success}</div>}

            {/* Current Financial Balance Info */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>Total Paid</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
                  ₹{(refundModalClient.paidAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 600 }}>Already Refunded</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>
                  ₹{(refundModalClient.refundAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ gridColumn: 'span 2', paddingTop: 6, borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>Maximum Additional Refund Allowed</div>
                <div style={{ fontSize: 17, fontWeight: 900, color: '#16a34a' }}>
                  ₹{Math.max(0, (refundModalClient.paidAmount || 0) - (refundModalClient.refundAmount || 0)).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            <div>
              <label className="label">Refund Amount (₹ INR) *</label>
              <input
                type="number"
                min="1"
                max={Math.max(0, (refundModalClient.paidAmount || 0) - (refundModalClient.refundAmount || 0))}
                className="input"
                placeholder="e.g. 5000"
                value={refundForm.amount}
                onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">Reason for Refund *</label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. 100% Refund Guarantee claim approved / Embassy appointment unavailable"
                value={refundForm.reason}
                onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setRefundModalClient(null)}
                disabled={processing}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-danger"
                disabled={processing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {processing ? 'Processing...' : 'Confirm & Process Refund'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}

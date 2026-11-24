import { useState, useEffect } from 'react'
import { getFlightOrders, updateFlightOrder } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'

const STATUS_LABELS = {
  pending_payment: { label: 'Pending Payment', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  paid:            { label: 'Paid',            color: '#3b82f6', bg: 'rgba(59,130,246,0.1)'  },
  in_progress:     { label: 'In Progress',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
  delivered:       { label: 'Delivered',       color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  cancelled:       { label: 'Cancelled',       color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
  flagged:         { label: 'Flagged',         color: '#f97316', bg: 'rgba(249,115,22,0.1)'  },
}

const NEXT_STATUS = {
  paid:        'in_progress',
  in_progress: 'delivered',
}

const FILTER_TABS = [
  { key: '', label: 'All' },
  { key: 'paid', label: 'Paid' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'flagged', label: 'Flagged' },
]

export default function FlightOrders() {
  const [orders, setOrders]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [statusFilter, setStatus] = useState('')
  const [expanded, setExpanded]   = useState(null)
  const [saving, setSaving]       = useState({})
  const [notesMap, setNotesMap]   = useState({})

  const load = (s = statusFilter) => {
    setLoading(true)
    const params = {}
    if (s) params.status = s
    getFlightOrders(params)
      .then(r => setOrders(r.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const update = async (id, payload) => {
    setSaving(p => ({ ...p, [id]: true }))
    try {
      await updateFlightOrder(id, payload)
      load()
    } finally {
      setSaving(p => ({ ...p, [id]: false }))
    }
  }

  const stats = {
    total:       orders.length,
    paid:        orders.filter(o => o.status === 'paid').length,
    in_progress: orders.filter(o => o.status === 'in_progress').length,
    delivered:   orders.filter(o => o.status === 'delivered').length,
    flagged:     orders.filter(o => o.isFlagged).length,
    revenue:     orders.filter(o => o.isPaid).reduce((s, o) => s + (o.amount || 0), 0),
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Flight Orders</h1>
          <p className="page-subtitle">Dummy ticket reservations — manage fulfilment end-to-end</p>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12 }}>
        {[
          { label: 'Total Orders',  value: stats.total,       color: '#3b82f6' },
          { label: 'Paid',          value: stats.paid,        color: '#3b82f6' },
          { label: 'In Progress',   value: stats.in_progress, color: '#8b5cf6' },
          { label: 'Delivered',     value: stats.delivered,   color: '#10b981' },
          { label: 'Flagged',       value: stats.flagged,     color: '#f97316' },
          { label: 'Revenue (₹)',   value: `₹${stats.revenue.toLocaleString('en-IN')}`, color: '#10b981' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {FILTER_TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setStatus(t.key)}
            style={{
              padding: '7px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              background: statusFilter === t.key ? '#3b82f6' : '#f8fafc',
              color: statusFilter === t.key ? '#fff' : '#475569',
              border: `1px solid ${statusFilter === t.key ? '#3b82f6' : '#e2e8f0'}`,
              transition: 'all 0.15s',
            }}
          >{t.label}</button>
        ))}
      </div>

      {/* Table */}
      {loading ? <PageSpinner /> : orders.length === 0 ? (
        <EmptyState title="No orders" subtitle="No flight reservations match this filter." />
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                {['Route', 'Pax', 'Contact', 'Amount', 'Payment ID', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const st = STATUS_LABELS[o.status] || STATUS_LABELS.paid
                const isExpanded = expanded === o._id
                const nextSt = NEXT_STATUS[o.status]
                const isSaving = saving[o._id]

                return (
                  <>
                    <tr
                      key={o._id}
                      onClick={() => setExpanded(isExpanded ? null : o._id)}
                      style={{
                        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                        background: isExpanded ? '#f8faff' : o.isFlagged ? 'rgba(249,115,22,0.03)' : '#fff',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Route */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {o.isFlagged && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316', flexShrink: 0 }} />}
                          ✈ {o.from} → {o.to}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {o.tripType === 'round-trip' ? '↔ Round trip' : '→ One-way'} · Dep: {o.departureDate}
                          {o.returnDate ? ` · Ret: ${o.returnDate}` : ''}
                        </div>
                      </td>
                      {/* Pax */}
                      <td style={{ padding: '12px 14px', color: '#334155' }}>{o.passengers?.length || 0}</td>
                      {/* Contact */}
                      <td style={{ padding: '12px 14px', color: '#334155', maxWidth: 160 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.contactEmail}</div>
                        {o.contactPhone && <div style={{ fontSize: 11, color: '#64748b' }}>{o.contactPhone}</div>}
                      </td>
                      {/* Amount */}
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#10b981' }}>₹{o.amount}</td>
                      {/* Payment ID */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#64748b', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                          {o.paymentId ? o.paymentId.slice(0, 14) + '…' : '—'}
                        </span>
                      </td>
                      {/* Status badge */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      {/* Date */}
                      <td style={{ padding: '12px 14px', color: '#64748b', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {new Date(o.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'nowrap' }}>
                          {nextSt && (
                            <button
                              disabled={isSaving}
                              onClick={() => update(o._id, { status: nextSt })}
                              style={{
                                padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none',
                                background: nextSt === 'in_progress' ? 'rgba(139,92,246,0.12)' : 'rgba(16,185,129,0.12)',
                                color: nextSt === 'in_progress' ? '#8b5cf6' : '#10b981',
                                opacity: isSaving ? 0.6 : 1,
                              }}
                            >
                              {nextSt === 'in_progress' ? 'Start' : '✓ Delivered'}
                            </button>
                          )}
                          <button
                            disabled={isSaving}
                            onClick={() => update(o._id, { isFlagged: !o.isFlagged, flagReason: o.isFlagged ? '' : 'Needs attention' })}
                            style={{
                              padding: '5px 10px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                              border: '1px solid #f97316',
                              background: o.isFlagged ? '#f97316' : 'transparent',
                              color: o.isFlagged ? '#fff' : '#f97316',
                              opacity: isSaving ? 0.6 : 1,
                            }}
                          >
                            {o.isFlagged ? 'Unflag' : 'Flag'}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row — passenger details + notes */}
                    {isExpanded && (
                      <tr key={o._id + '-exp'} style={{ background: '#f8faff' }}>
                        <td colSpan={8} style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
                          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                            {/* Passengers */}
                            <div style={{ flex: '1 1 260px' }}>
                              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Passengers</p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {(o.passengers || []).map((p, i) => (
                                  <div key={i} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px', fontSize: 13 }}>
                                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{p.title} {p.firstName} {p.lastName}</span>
                                    {p.email && <span style={{ color: '#64748b', marginLeft: 8 }}>{p.email}</span>}
                                  </div>
                                ))}
                                {(!o.passengers || o.passengers.length === 0) && (
                                  <p style={{ color: '#64748b', fontSize: 13 }}>No passenger details provided.</p>
                                )}
                              </div>
                            </div>

                            {/* Notes */}
                            <div style={{ flex: '1 1 260px' }}>
                              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Internal Notes</p>
                              <textarea
                                rows={3}
                                className="input"
                                placeholder="Add internal notes about this order…"
                                value={notesMap[o._id] ?? (o.notes || '')}
                                onChange={e => setNotesMap(p => ({ ...p, [o._id]: e.target.value }))}
                                style={{ resize: 'vertical', fontSize: 13 }}
                              />
                              <button
                                disabled={saving[o._id]}
                                onClick={() => update(o._id, { notes: notesMap[o._id] ?? o.notes })}
                                style={{
                                  marginTop: 8, padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                  background: '#3b82f6', color: '#fff', fontSize: 12, fontWeight: 700, opacity: saving[o._id] ? 0.6 : 1,
                                }}
                              >
                                {saving[o._id] ? 'Saving…' : 'Save Notes'}
                              </button>
                            </div>

                            {/* Full payment ID */}
                            <div style={{ flex: '0 0 220px' }}>
                              <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Payment Details</p>
                              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 12px', fontSize: 12 }}>
                                <p style={{ color: '#64748b', marginBottom: 4 }}>Payment ID</p>
                                <p style={{ fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all' }}>{o.paymentId || '—'}</p>
                                <p style={{ color: '#64748b', marginTop: 8, marginBottom: 4 }}>Order ID</p>
                                <p style={{ fontFamily: 'monospace', color: '#0f172a', wordBreak: 'break-all' }}>{o.orderId || '—'}</p>
                                {o.ticketDeliveredAt && (
                                  <>
                                    <p style={{ color: '#64748b', marginTop: 8, marginBottom: 4 }}>Delivered At</p>
                                    <p style={{ color: '#10b981', fontWeight: 600 }}>{new Date(o.ticketDeliveredAt).toLocaleString('en-IN')}</p>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import api from '../../api/axios'
import { PageSpinner } from '../../components/shared/Spinner'

// Website enquiries: paid ₹999 consultations + Contact Us form messages + Abandoned Checkouts
const KIND_TABS = [
  { key: '', label: 'All' },
  { key: 'abandoned_checkout', label: '🔥 Abandoned Checkouts' },
  { key: 'consultation', label: 'Paid Consultations' },
  { key: 'contact', label: 'Contact Messages' },
]
const STATUSES = {
  new:       { label: 'New',       color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  contacted: { label: 'Contacted', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  closed:    { label: 'Closed / Converted', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
}

const fmtDate = (d) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function Enquiries() {
  const [kind, setKind] = useState('')
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)
  const [notes, setNotes] = useState({})
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')

  const load = (k = kind) => {
    setLoading(true); setError('')
    api.get('/admin/leads', { params: k ? { kind: k } : {} })
      .then(r => setLeads(r.data.data || []))
      .catch(() => setError('Could not load enquiries.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const save = async (lead, patch) => {
    setSaving(lead._id)
    try {
      const { data } = await api.put(`/admin/leads/${lead._id}`, patch)
      setLeads(ls => ls.map(l => (l._id === lead._id ? data.data : l)))
    } catch (e) {
      alert(e?.response?.data?.message || 'Could not save.')
    } finally { setSaving(null) }
  }

  const row = (label, value) => value ? (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(90px, 120px) minmax(0, 1fr)', gap: 10, fontSize: 13, padding: '4px 0' }}>
      <span style={{ color: '#64748b' }}>{label}</span><span style={{ color: '#0f172a', fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{value}</span>
    </div>
  ) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 980 }}>
      <div>
        <h1 className="page-title">Enquiries</h1>
        <p className="page-subtitle">Paid consultations and Contact Us messages from the website</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {KIND_TABS.map(t => (
          <button key={t.key} type="button" onClick={() => { setKind(t.key); load(t.key) }} style={{
            padding: '7px 16px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 700,
            background: kind === t.key ? '#3b82f6' : '#fff', color: kind === t.key ? '#fff' : '#475569', borderColor: kind === t.key ? '#3b82f6' : '#e2e8f0',
          }}>{t.label}</button>
        ))}
      </div>

      {error && <div style={{ color: '#e11d48', fontWeight: 600, fontSize: 13 }}>{error}</div>}
      {loading ? <PageSpinner /> : leads.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b', background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9' }}>No enquiries yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {leads.map(l => {
            const st = STATUSES[l.status] || STATUSES.new
            const isOpen = open === l._id
            return (
              <div key={l._id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <button type="button" onClick={() => setOpen(isOpen ? null : l._id)} style={{ width: '100%', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px 12px', padding: '14px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99,
                    background: l.kind === 'abandoned_checkout' ? '#fef3c7' : (l.kind === 'consultation' ? '#fff7ed' : '#eff6ff'),
                    color: l.kind === 'abandoned_checkout' ? '#b45309' : (l.kind === 'consultation' ? '#ea580c' : '#2563eb'),
                    whiteSpace: 'nowrap',
                  }}>
                    {l.kind === 'abandoned_checkout'
                      ? `Abandoned Checkout${l.amount ? ` · ₹${Number(l.amount).toLocaleString('en-IN')}` : ''}`
                      : (l.kind === 'consultation' ? `Consultation${l.amount ? ` · ₹${Number(l.amount).toLocaleString('en-IN')}` : ''}` : 'Contact')}
                  </span>
                  <span style={{ flex: '1 1 200px', minWidth: 0 }}>
                    <span style={{ display: 'block', fontWeight: 700, color: '#0f172a', fontSize: 14 }}>
                      {l.name}
                      {l.convertedToClient && (
                        <span style={{ marginLeft: 8, fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: 4, fontWeight: 800 }}>
                          CONVERTED
                        </span>
                      )}
                    </span>
                    <span style={{ display: 'block', color: '#64748b', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.email}{l.country ? ` · ${l.country}` : ''}{l.packageType ? ` · ${l.packageType}` : ''}
                    </span>
                  </span>
                  <span style={{ fontSize: 11.5, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDate(l.createdAt)}</span>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 99, background: st.bg, color: st.color }}>{st.label}</span>
                </button>
                {isOpen && (
                  <div style={{ padding: '4px 16px 16px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ paddingTop: 10 }}>
                      {row('Email', <a href={`mailto:${l.email}`} style={{ color: '#2563eb' }}>{l.email}</a>)}
                      {row('Phone', l.phone)}
                      {l.phone && (
                        <div style={{ padding: '6px 0 10px' }}>
                          <a
                            href={`https://wa.me/${String(l.phone).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${l.name}, I noticed you were exploring visa assistance for ${l.country || 'your trip'} on Tourist Visa Experts. Would you like any help with requirements or embassy appointments?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 8,
                              background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                              boxShadow: '0 2px 8px rgba(37,211,102,0.3)',
                            }}
                          >
                            💬 Chat on WhatsApp
                          </a>
                        </div>
                      )}
                      {row('WhatsApp', l.whatsapp)}
                      {row('Destination', l.country)}
                      {row('Package', l.packageType)}
                      {row('Applicants', l.numberOfApplicants)}
                      {row('Potential Value', l.amount ? `₹${Number(l.amount).toLocaleString('en-IN')}` : null)}
                      {row('Subject', l.subject)}
                      {row('Message', l.message)}
                      {row('Coupon', l.couponCode)}
                      {row('Payment ID', l.paymentId)}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', marginTop: 12, flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Status</label>
                        <select value={l.status} disabled={saving === l._id} onChange={e => save(l, { status: e.target.value })}
                          style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fff' }}>
                          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                      </div>
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <label style={{ display: 'block', fontSize: 11, color: '#64748b', marginBottom: 4 }}>Internal note</label>
                        <input value={notes[l._id] ?? l.adminNote ?? ''} onChange={e => setNotes(n => ({ ...n, [l._id]: e.target.value }))}
                          placeholder="e.g. Called, slot booked for Friday 4pm"
                          style={{ width: '100%', boxSizing: 'border-box', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 10px', fontSize: 13 }} />
                      </div>
                      <button type="button" disabled={saving === l._id} onClick={() => save(l, { adminNote: notes[l._id] ?? l.adminNote ?? '' })}
                        style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {saving === l._id ? 'Saving…' : 'Save note'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getEscalations, acknowledgeEscalation, resolveEscalation } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import Modal from '../../components/shared/Modal'

const STATUS_CFG = {
  open:         { bg:'#fff1f2', color:'#f43f5e', border:'#fecdd3', label:'Open' },
  acknowledged: { bg:'#fffbeb', color:'#d97706', border:'#fde68a', label:'Acknowledged' },
  resolved:     { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', label:'Resolved' },
}

const TYPE_LABELS = {
  no_response_from_team:   'Team not responding',
  no_response_from_client: 'Client not responding',
  document_issue:          'Document issue',
  delay_in_processing:     'Delay in processing',
  other:                   'Other',
}

const ROLE_CFG = {
  team:   { bg:'#eff6ff', color:'#2563eb' },
  client: { bg:'#faf5ff', color:'#7c3aed' },
}

export default function AdminEscalations() {
  const [escalations, setEscalations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('')
  const [resolveModal, setResolveModal] = useState(null)
  const [resolutionNote, setResolutionNote] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () =>
    getEscalations(filterStatus ? { status: filterStatus } : {})
      .then((r) => setEscalations(r.data.data || []))
      .finally(() => setLoading(false))

  useEffect(() => { setLoading(true); load() }, [filterStatus])

  const handleAcknowledge = async (id) => {
    try { await acknowledgeEscalation(id); load() }
    catch { alert('Failed') }
  }

  const handleResolve = async (e) => {
    e.preventDefault()
    if (!resolutionNote.trim()) return
    setSaving(true)
    try {
      await resolveEscalation(resolveModal._id, resolutionNote)
      setResolveModal(null); setResolutionNote(''); load()
    } catch { alert('Failed') }
    finally { setSaving(false) }
  }

  const open = escalations.filter((e) => e.status === 'open').length
  const acked = escalations.filter((e) => e.status === 'acknowledged').length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>
      <div>
        <h1 className="page-title">Needs Attention</h1>
        <p className="page-subtitle">Cases flagged by team members or clients requiring manager review — resolve with a clear note</p>
      </div>

      {/* Stats */}
      <div className="r-grid-3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        {[
          ['Open', open, '#f43f5e', '#fff1f2', '#fecdd3'],
          ['Acknowledged', acked, '#d97706', '#fffbeb', '#fde68a'],
          ['Total', escalations.length, '#64748b', '#f8fafc', '#e2e8f0'],
        ].map(([label, count, color, bg, border]) => (
          <div key={label} style={{ background:bg, borderRadius:14, border:`1px solid ${border}`, padding:'16px 20px' }}>
            <div style={{ fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>{label}</div>
            <div style={{ fontSize:28, fontWeight:800, color }}>{count}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap: 'wrap' }}>
        {['', 'open', 'acknowledged', 'resolved'].map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} style={{
            padding:'6px 16px', borderRadius:20, fontSize:12.5, fontWeight:600, cursor:'pointer',
            border: filterStatus === s ? '1px solid #6366f1' : '1px solid #e2e8f0',
            background: filterStatus === s ? '#eef2ff' : '#fff',
            color: filterStatus === s ? '#4f46e5' : '#64748b',
          }}>
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <PageSpinner /> : escalations.length === 0 ? (
        <EmptyState title="Nothing flagged" description="All clear — no cases need attention right now" />
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {escalations.map((esc) => {
            const statusCfg = STATUS_CFG[esc.status]
            const roleCfg = ROLE_CFG[esc.raisedByRole] || ROLE_CFG.team
            return (
              <div key={esc._id} style={{
                background:'#fff', borderRadius:16, border: esc.status === 'open' ? '1px solid #fecdd3' : '1px solid #f1f5f9',
                padding:'18px 22px', boxShadow: esc.status === 'open' ? '0 2px 12px rgba(244,63,94,0.06)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, flexWrap:'wrap' }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13.5, fontWeight:700, color:'#0f172a' }}>
                        {TYPE_LABELS[esc.type] || esc.type}
                      </span>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:statusCfg.bg, color:statusCfg.color, border:`1px solid ${statusCfg.border}` }}>
                        {statusCfg.label}
                      </span>
                      <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:roleCfg.bg, color:roleCfg.color }}>
                        Raised by {esc.raisedByRole}
                      </span>
                    </div>

                    <p style={{ fontSize:13.5, color:'#334155', lineHeight:1.6, margin:'0 0 10px' }}>{esc.message}</p>

                    <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap', fontSize:12, color: '#64748b' }}>
                      <span>👤 {esc.raisedBy?.name} ({esc.raisedBy?.email})</span>
                      {esc.client?.destinationCountry && <span>🌍 {esc.client.destinationCountry}</span>}
                      <span>🕐 {new Date(esc.createdAt).toLocaleString()}</span>
                    </div>

                    {esc.status === 'resolved' && esc.resolutionNote && (
                      <div style={{ marginTop:12, background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:'#16a34a', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>
                          Resolution by {esc.resolvedBy?.name} · {esc.resolvedAt ? new Date(esc.resolvedAt).toLocaleDateString() : ''}
                        </div>
                        <div style={{ fontSize:13, color:'#166534' }}>{esc.resolutionNote}</div>
                      </div>
                    )}
                  </div>

                  {esc.status !== 'resolved' && (
                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      {esc.status === 'open' && (
                        <button onClick={() => handleAcknowledge(esc._id)} className="btn-secondary" style={{ fontSize:12 }}>
                          Acknowledge
                        </button>
                      )}
                      <button onClick={() => { setResolveModal(esc); setResolutionNote('') }} className="btn-primary" style={{ fontSize:12, background:'#10b981' }}>
                        Resolve
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Resolve Modal */}
      <Modal open={!!resolveModal} onClose={() => setResolveModal(null)} title="Resolve Escalation">
        {resolveModal && (
          <form onSubmit={handleResolve} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'#f8fafc', borderRadius:10, padding:'12px 14px' }}>
              <div style={{ fontSize:12.5, fontWeight:700, color:'#0f172a', marginBottom:4 }}>{TYPE_LABELS[resolveModal.type]}</div>
              <div style={{ fontSize:13, color:'#64748b', lineHeight:1.5 }}>{resolveModal.message}</div>
            </div>
            <div>
              <label className="label">Resolution Note <span style={{ color:'#f43f5e' }}>*</span></label>
              <textarea
                className="input"
                rows={4}
                required
                placeholder="Explain what action was taken and how this was resolved..."
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                style={{ resize:'vertical' }}
              />
              <div style={{ fontSize:12, color: '#64748b', marginTop:4 }}>This note will be shared with the person who raised the escalation.</div>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
              <button type="button" className="btn-secondary" onClick={() => setResolveModal(null)}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={saving} style={{ background:'#10b981' }}>
                {saving ? 'Saving...' : 'Mark as Resolved'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

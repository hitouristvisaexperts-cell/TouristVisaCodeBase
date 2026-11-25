import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import { getClient, updateClient, assignClient, updateStatus, getTeam, getClientActivity, grantAccess, getClientDocuments, downloadClientDocument, processRefund } from '../../api/admin'
import { resolveFlag } from '../../api/team'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import { INTERNAL_STAGES, STAGE_COUNT, APPOINTMENT_MODULE, taskLabel, stageName } from '../../constants/workflow'

const TABS = ['overview','stages','documents','activity','family','info']

const CLIENT_STATUSES = [
  'Welcome & Consultation Pending','Profile Assessment','Documents Requested',
  'Documents Under Review','Appointment In Progress','Application Preparation',
  'Documents Ready','Appointment Completed','Visa Under Process',
  'Visa Approved','Visa Declined','Feedback & Testimonial','Completed',
]

const ACTIVITY_ROLE_CFG = {
  admin:  { bg:'#eff6ff', color:'#2563eb', border:'#bfdbfe' },
  team:   { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
  client: { bg:'#faf5ff', color:'#7c3aed', border:'#ddd6fe' },
  system: { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' },
}

const IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export default function AdminClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState([])
  const [activityLoading, setActivityLoading] = useState(false)
  const [docs, setDocs] = useState([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [viewDocLoading, setViewDocLoading] = useState(null)
  const [editModal, setEditModal] = useState(false)
  const [assignModal, setAssignModal] = useState(false)
  const [assignTo, setAssignTo] = useState('')
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [grantingSaving, setGrantingSaving] = useState(false)
  const [resolvingFlag, setResolvingFlag] = useState(false)
  const [statusOverride, setStatusOverride] = useState('')
  const [statusSaving, setStatusSaving] = useState(false)
  const [refundModal, setRefundModal] = useState(false)
  const [refundForm, setRefundForm] = useState({ amount: '', reason: '' })
  const [refundSaving, setRefundSaving] = useState(false)
  const [refundError, setRefundError] = useState('')
  const [refundSuccess, setRefundSuccess] = useState('')

  const loadDocs = () => {
    setDocsLoading(true)
    getClientDocuments(id)
      .then((r) => setDocs(r.data.data || []))
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false))
  }

  const load = () => {
    setLoading(true)
    Promise.all([getClient(id), getTeam()])
      .then(([cr, tr]) => {
        setClient(cr.data.data); setTeam(tr.data.data || [])
        setForm({ visaType:cr.data.data.visaType||'', destinationCountry:cr.data.data.destinationCountry||'', packageType:cr.data.data.packageType||'', remarks:cr.data.data.remarks||'' })
        setAssignTo(cr.data.data.assignedTo?._id || '')
      })
      .finally(() => setLoading(false))
    loadDocs()
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    if (activeTab === 'activity') {
      setActivityLoading(true)
      getClientActivity(id).then((r) => setActivity(r.data.data || [])).finally(() => setActivityLoading(false))
    }
  }, [activeTab, id])

  const handleEdit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await updateClient(id, form); load(); setEditModal(false) }
    finally { setSaving(false) }
  }

  const handleAssign = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await assignClient(id, assignTo); load(); setAssignModal(false) }
    finally { setSaving(false) }
  }

  const handleStatusOverride = async () => {
    if (!statusOverride) return
    setStatusSaving(true)
    try { await updateStatus(id, statusOverride); load(); setStatusOverride('') }
    catch { alert('Failed to update status') }
    finally { setStatusSaving(false) }
  }

  const handleToggleAccess = async () => {
    setGrantingSaving(true)
    try {
      await grantAccess(id, !client.isPurchased)
      setClient(c => ({ ...c, isPurchased: !c.isPurchased }))
    } finally {
      setGrantingSaving(false)
    }
  }

  const handleResolveFlag = async () => {
    setResolvingFlag(true)
    try {
      await resolveFlag(id)
      setClient(c => ({ ...c, flagged: false, flagMessage: '' }))
    } catch { alert('Failed to resolve flag') }
    finally { setResolvingFlag(false) }
  }

  const handleViewDoc = async (doc) => {
    setViewDocLoading(doc._id)
    try {
      const res = await downloadClientDocument(id, doc._id)
      const blobUrl = URL.createObjectURL(new Blob([res.data], { type: doc.mimeType || 'application/pdf' }))
      const isImage = IMAGE_TYPES.includes(doc.mimeType)
      setViewDoc({ doc, blobUrl, isImage })
    } catch {
      setViewDoc({ doc, blobUrl: null, isImage: false, error: 'File not found on server or unable to preview.' })
    } finally {
      setViewDocLoading(null)
    }
  }

  const handleProcessRefund = async (e) => {
    e.preventDefault()
    setRefundError('')
    setRefundSuccess('')
    const amt = parseFloat(refundForm.amount)
    if (!amt || amt <= 0) {
      setRefundError('Please enter a valid refund amount greater than 0')
      return
    }
    const maxRefund = (client.paidAmount || 0) - (client.refundAmount || 0)
    if (client.paidAmount > 0 && amt > maxRefund) {
      setRefundError(`Refund amount cannot exceed remaining balance of ₹${maxRefund.toLocaleString('en-IN')}`)
      return
    }
    setRefundSaving(true)
    try {
      const res = await processRefund(id, { refundAmount: amt, reason: refundForm.reason })
      if (res.data?.data) {
        setClient(res.data.data)
      } else {
        load()
      }
      setRefundSuccess(`Successfully recorded refund of ₹${amt.toLocaleString('en-IN')}`)
      setTimeout(() => {
        setRefundModal(false)
        setRefundForm({ amount: '', reason: '' })
        setRefundSuccess('')
      }, 1000)
    } catch (err) {
      setRefundError(err.response?.data?.message || 'Failed to process refund')
    } finally {
      setRefundSaving(false)
    }
  }

  if (loading) return <PageSpinner />
  if (!client) return <div style={{ color:'#f43f5e', padding:20 }}>Client not found</div>

  const completedStages = client.stages?.filter((s) => s.completedAt).length || 0
  const progress = Math.round((completedStages / 12) * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Back */}
      <Link to="/admin/clients" style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#3b82f6', textDecoration:'none', fontSize:13, fontWeight:600 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        All Clients
      </Link>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{
            width:52, height:52, borderRadius:16,
            background:'linear-gradient(135deg,#dbeafe,#eff6ff)',
            border:'1px solid #bfdbfe',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:22, fontWeight:800, color:'#3b82f6',
          }}>
            {client.user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.04em', margin:0 }}>{client.user?.name}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
              <StatusBadge status={client.clientStatus} />
              <span style={{
                padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700,
                background: client.isPurchased ? '#f0fdf4' : '#fef9c3',
                color: client.isPurchased ? '#16a34a' : '#92400e',
                border: client.isPurchased ? '1px solid #bbf7d0' : '1px solid #fde68a',
              }}>
                {client.isPurchased ? `Purchased${client.paidAmount ? ` · ₹${client.paidAmount.toLocaleString('en-IN')}` : ''}` : 'Not Purchased'}
              </span>
              {client.couponUsed && (
                <span style={{
                  padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700,
                  background:'#fef3c7', color:'#92400e', border:'1px solid #fde68a',
                  display:'inline-flex', alignItems:'center', gap:4
                }}>
                  🏷️ {client.couponUsed}
                </span>
              )}
              {client.refundStatus && client.refundStatus !== 'none' && (
                <span style={{
                  padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700,
                  background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca',
                }}>
                  {client.refundStatus === 'full' ? 'Fully Refunded' : `Refunded ₹${client.refundAmount?.toLocaleString('en-IN')}`}
                </span>
              )}
              <span style={{ fontSize:12.5, color: '#64748b' }}>{client.user?.email}</span>
              {client.user?.phone && <span style={{ fontSize:12.5, color: '#64748b' }}>{client.user?.phone}</span>}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <button
            onClick={handleToggleAccess}
            disabled={grantingSaving}
            style={{
              padding:'8px 14px', borderRadius:10, border:'none', cursor: grantingSaving ? 'default' : 'pointer',
              fontSize:13, fontWeight:700, display:'flex', alignItems:'center', gap:6,
              background: client.isPurchased ? '#fef2f2' : '#f0fdf4',
              color: client.isPurchased ? '#dc2626' : '#16a34a',
              border: client.isPurchased ? '1px solid #fecaca' : '1px solid #bbf7d0',
            }}
          >
            {client.isPurchased ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                {grantingSaving ? 'Saving…' : 'Revoke Access'}
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                {grantingSaving ? 'Saving…' : 'Grant Full Access'}
              </>
            )}
          </button>
          <button className="btn-secondary" onClick={() => setAssignModal(true)}>Assign Team</button>
          <button className="btn-primary" onClick={() => setEditModal(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
        </div>
      </div>

      {/* Progress */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:'18px 22px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#334155' }}>Overall Progress</span>
          <span style={{ fontSize:13, color:'#64748b', fontWeight:600 }}>{completedStages}/{STAGE_COUNT} stages · {progress}%</span>
        </div>
        <div style={{ background:'#f1f5f9', borderRadius:99, height:8 }}>
          <div style={{ width:`${progress}%`, height:8, background:'linear-gradient(90deg,#3b82f6,#6366f1)', borderRadius:99, transition:'width 0.8s ease' }} />
        </div>
      </div>

      {/* Status override */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:'16px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#334155', whiteSpace:'nowrap' }}>Override Status:</span>
        <select className="input" style={{ flex:1, maxWidth:280 }} value={statusOverride} onChange={(e) => setStatusOverride(e.target.value)}>
          <option value="">Select new status...</option>
          {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-primary" disabled={!statusOverride || statusSaving} onClick={handleStatusOverride} style={{ background:'#10b981' }}>
          {statusSaving ? 'Saving…' : 'Update Status'}
        </button>
      </div>

      {/* Tabs */}
      <div className="r-tabs" style={{ display:'flex', gap:4, background:'#f8fafc', borderRadius:14, padding:4, width:'fit-content' }}>
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding:'8px 20px', borderRadius:10, fontSize:13, fontWeight:600,
            border:'none', cursor:'pointer', transition:'all 0.15s', textTransform:'capitalize',
            fontFamily:'var(--font-sans)',
            background: activeTab === tab ? '#fff' : 'transparent',
            color: activeTab === tab ? '#0f172a' : '#64748b',
            boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>{tab}</button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

        {/* Flag Alert */}
        {client.flagged && (
          <div style={{ background:'linear-gradient(135deg,#fff7ed,#fef3c7)', border:'2px solid #f97316', borderRadius:16, padding:'18px 22px', display:'flex', alignItems:'flex-start', gap:16 }}>
            <div style={{ width:42, height:42, borderRadius:12, background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="#fff" strokeWidth="2"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:800, fontSize:14.5, color:'#c2410c', marginBottom:3 }}>Client Raised a Flag</div>
              <div style={{ fontSize:13.5, color:'#92400e', lineHeight:1.6 }}>{client.flagMessage || 'No message provided'}</div>
              {client.flaggedAt && <div style={{ fontSize:11.5, color:'#b45309', marginTop:5 }}>Raised on {new Date(client.flaggedAt).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>}
            </div>
            <button
              onClick={handleResolveFlag}
              disabled={resolvingFlag}
              style={{ padding:'8px 18px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', background:'#fff', color:'#f97316', border:'1.5px solid #f97316', flexShrink:0 }}
            >
              {resolvingFlag ? '...' : 'Mark Resolved'}
            </button>
          </div>
        )}

        <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Application Details</h3>
            <InfoRow label="Visa Type" value={client.visaType} />
            <InfoRow label="Destination" value={client.destinationCountry} />
            <InfoRow label="Package" value={client.packageType} />
            <InfoRow label="Current Stage" value={stageName(client.currentStageKey)} />
          </div>
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Assignment</h3>
            <InfoRow label="Assigned To" value={client.assignedTo?.name || 'Unassigned'} />
            <InfoRow label="Team Email" value={client.assignedTo?.email} />
            <InfoRow label="Meet Link" value={client.meetLink ? <a href={client.meetLink} target="_blank" rel="noopener noreferrer" style={{ color:'#3b82f6', fontSize:12 }}>Open Meet ↗</a> : null} />
            <InfoRow label="Meet Time" value={client.meetScheduledAt ? new Date(client.meetScheduledAt).toLocaleString() : null} />
          </div>
          {client.remarks && (
            <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:22, boxShadow:'0 1px 4px rgba(0,0,0,0.04)', gridColumn:'1/-1' }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:10 }}>Remarks</h3>
              <p style={{ fontSize:13.5, color:'#64748b', lineHeight:1.65, margin:0 }}>{client.remarks}</p>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Stages */}
      {activeTab === 'stages' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>

          {/* Appointment Booking — parallel module (read-only) */}
          {client.appointmentModule && (
            <div style={{ background:'#faf5ff', borderRadius:14, border:'1.5px dashed #c4b5fd', padding:'16px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:8 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:16 }}>🗓️</span>
                  <span style={{ fontSize:13.5, fontWeight:700, color:'#6d28d9' }}>{APPOINTMENT_MODULE.name}</span>
                  <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:'#ede9fe', color:'#7c3aed', border:'1px solid #ddd6fe', textTransform:'uppercase' }}>Parallel Module</span>
                </div>
                <span style={{ fontSize:11.5, color:'#7c3aed', fontWeight:600 }}>
                  {client.appointmentModule.tasks.filter(t => t.completed).length}/{client.appointmentModule.tasks.length}
                </span>
              </div>
              <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:12, paddingLeft:26 }}>
                {client.appointmentModule.tasks.map((task) => (
                  <div key={task.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                    <span style={{ color: task.completed ? '#8b5cf6' : '#cbd5e1', fontWeight:700 }}>{task.completed ? '✓' : '○'}</span>
                    <span style={{ color: task.completed ? '#a78bda' : '#64748b', textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {taskLabel(task.name)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {INTERNAL_STAGES.map((stageDef) => {
            const stage = client.stages?.find((s) => s.stageKey === stageDef.key)
            const isCurrent = client.currentStageKey === stageDef.key
            const isCompleted = !!stage?.completedAt
            return (
              <div key={stageDef.key} style={{
                background:'#fff', borderRadius:14, border: isCurrent ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                padding:'16px 20px', boxShadow: isCurrent ? '0 2px 12px rgba(59,130,246,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{
                      width:28, height:28, borderRadius:'50%',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:12, fontWeight:700, flexShrink:0,
                      background: isCompleted ? '#3b82f6' : isCurrent ? '#fff' : '#f1f5f9',
                      color: isCompleted ? '#fff' : isCurrent ? '#3b82f6' : '#94a3b8',
                      border: isCurrent ? '2px solid #3b82f6' : 'none',
                    }}>
                      {isCompleted ? (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : stageDef.key.split('_')[1]}
                    </div>
                    <span style={{ fontSize:13.5, fontWeight:600, color: isCompleted ? '#16a34a' : isCurrent ? '#3b82f6' : '#64748b' }}>
                      {stageDef.name}
                    </span>
                    {isCurrent && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>Current</span>}
                    {isCompleted && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10, fontWeight:700, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>Done</span>}
                  </div>
                  {stage?.completedAt && <span style={{ fontSize:11.5, color: '#64748b' }}>{new Date(stage.completedAt).toLocaleDateString()}</span>}
                </div>

                {stage?.tasks && (
                  <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:12, paddingLeft:40 }}>
                    {stage.tasks.map((task) => (
                      <div key={task.name} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
                        <span style={{ color: task.completed ? '#10b981' : '#cbd5e1', fontWeight:700 }}>{task.completed ? '✓' : '○'}</span>
                        <span style={{ color: task.completed ? '#94a3b8' : '#64748b', textDecoration: task.completed ? 'line-through' : 'none' }}>
                          {taskLabel(task.name)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, color:'#0f172a', margin:0 }}>Uploaded Documents</h3>
              <p style={{ fontSize:12.5, color:'#64748b', margin:'3px 0 0' }}>All documents submitted by this client and prepared by staff</p>
            </div>
            <span style={{ padding:'3px 12px', borderRadius:99, fontSize:12, fontWeight:700, background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }}>
              {docs.length} Total Document{docs.length === 1 ? '' : 's'}
            </span>
          </div>

          {docsLoading ? (
            <PageSpinner />
          ) : docs.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 20px', background:'#f8fafc', borderRadius:14, border:'1px dashed #cbd5e1' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📁</div>
              <p style={{ fontWeight:700, color:'#334155', fontSize:14, margin:0 }}>No documents uploaded yet</p>
              <p style={{ fontSize:12.5, color:'#94a3b8', margin:'4px 0 0' }}>The client has not uploaded any documents for this application yet.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {docs.map((doc) => {
                const isClientUpload = doc.uploadedByRole === 'client'
                const isPdf = doc.mimeType?.includes('pdf')
                const isImage = doc.mimeType?.includes('image')
                return (
                  <div
                    key={doc._id}
                    style={{
                      background:'#fff',
                      borderRadius:14,
                      border:'1.5px solid #f1f5f9',
                      padding:'16px 18px',
                      display:'flex',
                      alignItems:'center',
                      justifyContent:'space-between',
                      gap:16,
                      flexWrap:'wrap',
                      transition:'all 0.15s',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:14, minWidth:0, flex:1 }}>
                      <div style={{
                        width:44, height:44, borderRadius:12, flexShrink:0,
                        background: isPdf ? '#fef2f2' : isImage ? '#f0fdf4' : '#eff6ff',
                        color: isPdf ? '#ef4444' : isImage ? '#16a34a' : '#3b82f6',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:20, border:`1px solid ${isPdf ? '#fecaca' : isImage ? '#bbf7d0' : '#bfdbfe'}`
                      }}>
                        {isPdf ? '📄' : isImage ? '🖼️' : '📎'}
                      </div>
                      <div style={{ minWidth:0, flex:1 }}>
                        <div style={{ fontSize:13.5, fontWeight:700, color:'#0f172a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {doc.originalName}
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:4, flexWrap:'wrap' }}>
                          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10.5, fontWeight:700, background:'#f8fafc', color:'#475569', border:'1px solid #e2e8f0', textTransform:'capitalize' }}>
                            {doc.category?.replace(/_/g, ' ') || 'Document'}
                          </span>
                          {doc.familyMember && (
                            <span style={{ padding:'2px 8px', borderRadius:99, fontSize:10.5, fontWeight:700, background:'#faf5ff', color:'#7c3aed', border:'1px solid #ddd6fe' }}>
                              👤 {doc.familyMember}
                            </span>
                          )}
                          <span style={{ fontSize:11.5, color: isClientUpload ? '#16a34a' : '#2563eb', fontWeight:600 }}>
                            {isClientUpload ? 'Uploaded by Client' : 'Uploaded by Team'}
                          </span>
                          <span style={{ fontSize:11, color:'#94a3b8' }}>
                            · {new Date(doc.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleViewDoc(doc)}
                      disabled={viewDocLoading === doc._id}
                      className="btn-secondary"
                      style={{
                        fontSize:12.5, fontWeight:700, display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:9,
                        background:'#f8fafc', border:'1px solid #cbd5e1', cursor:'pointer'
                      }}
                    >
                      {viewDocLoading === doc._id ? 'Loading…' : '👁 View'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Activity Timeline */}
      {activeTab === 'activity' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#334155' }}>Per-Client Activity Timeline</div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              {Object.entries(ACTIVITY_ROLE_CFG).map(([role, cfg]) => (
                <span key={role} style={{ padding:'2px 10px', borderRadius:99, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                  {role}
                </span>
              ))}
            </div>
          </div>

          {activityLoading ? <PageSpinner /> : activity.length === 0 ? (
            <div style={{ color: '#64748b', fontSize:13, textAlign:'center', padding:32 }}>No activity recorded yet</div>
          ) : (
            <div style={{ position:'relative' }}>
              <div style={{ position:'absolute', left:19, top:0, bottom:0, width:2, background:'#f1f5f9', zIndex:0 }} />
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {activity.map((act, i) => {
                  const roleCfg = ACTIVITY_ROLE_CFG[act.actorRole] || ACTIVITY_ROLE_CFG.system
                  const isEscalation = act.action?.toLowerCase().includes('escalation')
                  return (
                    <div key={act._id || i} style={{ display:'flex', gap:14, paddingBottom:20, position:'relative', zIndex:1 }}>
                      {/* Dot */}
                      <div style={{
                        width:20, height:20, borderRadius:'50%', flexShrink:0, marginTop:2,
                        background: isEscalation ? '#f43f5e' : roleCfg.color,
                        border:`2px solid #fff`,
                        boxShadow:`0 0 0 2px ${isEscalation ? '#fecdd3' : roleCfg.border}`,
                        display:'flex', alignItems:'center', justifyContent:'center',
                      }}>
                        {isEscalation && <span style={{ color:'#fff', fontSize:8, fontWeight:800 }}>!</span>}
                      </div>

                      {/* Content */}
                      <div style={{
                        flex:1, background:'#fff', borderRadius:14,
                        border: isEscalation ? '1px solid #fecdd3' : '1px solid #f1f5f9',
                        padding:'12px 16px',
                        boxShadow: isEscalation ? '0 2px 8px rgba(244,63,94,0.08)' : '0 1px 4px rgba(0,0,0,0.04)',
                      }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, flexWrap:'wrap' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={{ fontSize:13, fontWeight:700, color: isEscalation ? '#f43f5e' : '#0f172a' }}>
                              {act.action}
                            </span>
                            <span style={{ padding:'1px 7px', borderRadius:99, fontSize:10.5, fontWeight:700, background:roleCfg.bg, color:roleCfg.color, border:`1px solid ${roleCfg.border}` }}>
                              {act.actorRole}
                            </span>
                          </div>
                          <span style={{ fontSize:11.5, color: '#64748b', flexShrink:0 }}>
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </div>
                        {act.actorName && (
                          <div style={{ fontSize:12, color:'#64748b', marginTop:3 }}>by {act.actorName}</div>
                        )}
                        {act.details && (
                          <div style={{ fontSize:12.5, color:'#475569', marginTop:6, lineHeight:1.55 }}>{act.details}</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      {activeTab === 'info' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          {/* Personal Information */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
              <span>👤</span> Personal Information
            </h3>
            <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {[
                ['Full Name', client.user?.name],['Email', client.user?.email],
                ['Phone', client.user?.phone],['Passport No', client.passportNumber],
                ['Nationality', client.nationality],['Date of Birth', client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString() : null],
                ['Travel Date', client.travelDate ? new Date(client.travelDate).toLocaleDateString() : null],
                ['No. of Applicants', client.numberOfApplicants],
                ['Joined', new Date(client.user?.createdAt).toLocaleDateString()],
              ].map(([label, value]) => (
                <InfoRow key={label} label={label} value={value} />
              ))}
            </div>
          </div>

          {/* Payment & Coupon Information */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18, display:'flex', alignItems:'center', gap:8 }}>
              <span>💳</span> Payment & Coupon Details
            </h3>
            <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              <InfoRow
                label="Payment Status"
                value={
                  <span style={{
                    fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:6,
                    background: client.isPurchased ? '#f0fdf4' : '#fef9c3',
                    color: client.isPurchased ? '#16a34a' : '#92400e',
                    border: client.isPurchased ? '1px solid #bbf7d0' : '1px solid #fde68a',
                  }}>
                    {client.isPurchased ? 'Paid / Purchased' : 'Unpaid (Free Access)'}
                  </span>
                }
              />
              <InfoRow
                label="Amount Paid"
                value={
                  client.paidAmount ? (
                    <span style={{ fontSize:15, fontWeight:800, color:'#0f172a' }}>
                      ₹{client.paidAmount.toLocaleString('en-IN')}
                    </span>
                  ) : client.isPurchased ? (
                    <span style={{ color:'#64748b', fontStyle:'italic' }}>Granted by admin (₹0)</span>
                  ) : '₹0'
                }
              />
              <InfoRow
                label="Coupon Used"
                value={
                  client.couponUsed ? (
                    <span style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      padding:'3px 10px', borderRadius:6,
                      background:'linear-gradient(135deg,#fef3c7,#fffbeb)',
                      color:'#92400e', fontWeight:700, fontSize:12.5,
                      border:'1px solid #fde68a'
                    }}>
                      🎟️ {client.couponUsed}
                    </span>
                  ) : (
                    <span style={{ color:'#94a3b8' }}>None (Full Price)</span>
                  )
                }
              />
              <InfoRow label="Package Type" value={client.packageType || 'Complete'} />
              <InfoRow
                label="Payment ID"
                value={
                  client.paymentId ? (
                    <span style={{ fontFamily:'monospace', fontSize:12, background:'#f8fafc', padding:'2px 6px', borderRadius:4, border:'1px solid #e2e8f0' }}>
                      {client.paymentId}
                    </span>
                  ) : '—'
                }
              />
              <InfoRow
                label="Last Updated"
                value={client.updatedAt ? new Date(client.updatedAt).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—'}
              />
            </div>
          </div>

          {/* Refund Section & Amount */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
              <div>
                <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', margin:0, display:'flex', alignItems:'center', gap:8 }}>
                  <span>💸</span> Refund Details & Processing
                </h3>
                <p style={{ fontSize:12, color:'#64748b', margin:'4px 0 0' }}>Manage and track refunds for this client's payment</p>
              </div>

              {client.isPurchased && (
                <button
                  type="button"
                  onClick={() => {
                    const remaining = Math.max(0, (client.paidAmount || 0) - (client.refundAmount || 0))
                    setRefundForm({ amount: remaining > 0 ? remaining : '', reason: '' })
                    setRefundError('')
                    setRefundSuccess('')
                    setRefundModal(true)
                  }}
                  disabled={client.paidAmount > 0 && (client.refundAmount || 0) >= client.paidAmount}
                  style={{
                    padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:700, cursor: (client.paidAmount > 0 && (client.refundAmount || 0) >= client.paidAmount) ? 'default' : 'pointer',
                    background: (client.paidAmount > 0 && (client.refundAmount || 0) >= client.paidAmount) ? '#f1f5f9' : '#fef2f2',
                    color: (client.paidAmount > 0 && (client.refundAmount || 0) >= client.paidAmount) ? '#94a3b8' : '#dc2626',
                    border: (client.paidAmount > 0 && (client.refundAmount || 0) >= client.paidAmount) ? '1px solid #e2e8f0' : '1px solid #fecaca',
                    display:'inline-flex', alignItems:'center', gap:6
                  }}
                >
                  <span>↩</span> Issue / Record Refund
                </button>
              )}
            </div>

            {/* Refund Metric Cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))', gap:14, marginBottom:20 }}>
              <div style={{ background:'#f8fafc', borderRadius:12, border:'1px solid #f1f5f9', padding:'14px 16px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Paid Amount</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#0f172a', marginTop:6 }}>
                  ₹{(client.paidAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background:'#fef2f2', borderRadius:12, border:'1px solid #fee2e2', padding:'14px 16px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#991b1b', textTransform:'uppercase', letterSpacing:'0.05em' }}>Total Refunded</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#dc2626', marginTop:6 }}>
                  ₹{(client.refundAmount || 0).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background:'#f0fdf4', borderRadius:12, border:'1px solid #dcfce7', padding:'14px 16px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#166534', textTransform:'uppercase', letterSpacing:'0.05em' }}>Remaining Balance</div>
                <div style={{ fontSize:20, fontWeight:800, color:'#16a34a', marginTop:6 }}>
                  ₹{Math.max(0, (client.paidAmount || 0) - (client.refundAmount || 0)).toLocaleString('en-IN')}
                </div>
              </div>
              <div style={{ background:'#faf5ff', borderRadius:12, border:'1px solid #f3e8ff', padding:'14px 16px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#6b21a8', textTransform:'uppercase', letterSpacing:'0.05em' }}>Refund Status</div>
                <div style={{ marginTop:6 }}>
                  <span style={{
                    fontSize:12, fontWeight:700, padding:'3px 10px', borderRadius:99, textTransform:'uppercase',
                    background: client.refundStatus === 'full' ? '#fee2e2' : client.refundStatus === 'partial' ? '#fef3c7' : '#f1f5f9',
                    color: client.refundStatus === 'full' ? '#dc2626' : client.refundStatus === 'partial' ? '#d97706' : '#64748b',
                    border: client.refundStatus === 'full' ? '1px solid #fca5a5' : client.refundStatus === 'partial' ? '1px solid #fde68a' : '1px solid #e2e8f0',
                  }}>
                    {client.refundStatus === 'full' ? 'Full Refund' : client.refundStatus === 'partial' ? 'Partial Refund' : 'None'}
                  </span>
                </div>
              </div>
            </div>

            {/* Refund History / Details if refunded */}
            {client.refundAmount > 0 && (
              <div style={{ background:'#fafafa', borderRadius:12, border:'1px solid #f1f5f9', padding:'16px 18px', marginTop:14 }}>
                <div style={{ fontSize:12.5, fontWeight:700, color:'#334155', marginBottom:12 }}>Refund Information</div>
                <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
                  <InfoRow label="Reason" value={client.refundReason || 'No reason specified'} />
                  <InfoRow label="Refund Date" value={client.refundedAt ? new Date(client.refundedAt).toLocaleString('en-IN') : '—'} />
                  <InfoRow label="Refunded By" value={client.refundedBy?.name || client.refundedBy?.email || 'Admin'} />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Family Members */}
      {activeTab === 'family' && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4 }}>Family Members</h3>
          <p style={{ fontSize:12.5, color: '#64748b', marginBottom:20 }}>Co-applicants on this visa application</p>
          {(!client.familyMembers || client.familyMembers.length === 0) ? (
            <div style={{ textAlign:'center', padding:'40px 0' }}>
              <div style={{ fontSize:40, marginBottom:8 }}>👨‍👩‍👧‍👦</div>
              <p style={{ fontWeight:600, color: '#64748b', fontSize:14 }}>No family members added</p>
              <p style={{ fontSize:12.5, color: '#64748b', marginTop:4 }}>This client applied individually</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
              {client.familyMembers.map((m, i) => (
                <div key={i} style={{
                  background:'linear-gradient(135deg,#eff6ff,#dbeafe)',
                  border:'1.5px solid #bfdbfe', borderRadius:16,
                  padding:'18px', position:'relative',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{
                      width:44, height:44, borderRadius:14, flexShrink:0,
                      background:'linear-gradient(135deg,#3b82f6,#2563eb)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontWeight:800, fontSize:18,
                    }}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{m.name}</div>
                      {m.relation && (
                        <span style={{ fontSize:10.5, fontWeight:700, color:'#2563eb', background:'#dbeafe', border:'1px solid #bfdbfe', borderRadius:99, padding:'1px 8px', display:'inline-block', marginTop:3 }}>
                          {m.relation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {m.dateOfBirth && (
                      <div style={{ fontSize:12, color:'#1e40af' }}>
                        📅 DOB: {m.dateOfBirth}
                      </div>
                    )}
                    {m.passportNumber && (
                      <div style={{ fontSize:12, color:'#1e40af' }}>
                        🛂 <span style={{ fontFamily:'monospace', fontWeight:600 }}>{m.passportNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Edit Client Info" size="lg">
        <form onSubmit={handleEdit} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[['visaType','Visa Type'],['destinationCountry','Destination Country'],['packageType','Package Type']].map(([key,label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input className="input" value={form[key]||''} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
            </div>
          ))}
          <div style={{ gridColumn:'1/-1' }}>
            <label className="label">Remarks</label>
            <textarea className="input" rows={3} value={form.remarks||''} onChange={(e) => setForm({ ...form, remarks: e.target.value })} style={{ resize:'vertical' }} />
          </div>
          <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={() => setEditModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Team Member">
        <form onSubmit={handleAssign} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Select Team Member</label>
            <select className="input" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} required>
              <option value="">Choose a consultant...</option>
              {team.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.email}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={() => setAssignModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Assign'}</button>
          </div>
        </form>
      </Modal>

      {/* Refund Modal */}
      <Modal open={refundModal} onClose={() => { setRefundModal(false); setRefundError(''); setRefundSuccess('') }} title="Issue / Record Refund" size="md">
        {refundError && (
          <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:10, padding:'10px 14px', color:'#f43f5e', fontSize:13, marginBottom:16 }}>
            {refundError}
          </div>
        )}
        {refundSuccess && (
          <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', color:'#16a34a', fontSize:13, marginBottom:16 }}>
            {refundSuccess}
          </div>
        )}
        <form onSubmit={handleProcessRefund} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0', padding:'12px 14px', fontSize:13 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ color:'#64748b' }}>Client:</span>
              <strong style={{ color:'#0f172a' }}>{client?.user?.name}</strong>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ color:'#64748b' }}>Total Paid:</span>
              <strong style={{ color:'#0f172a' }}>₹{(client?.paidAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
              <span style={{ color:'#64748b' }}>Already Refunded:</span>
              <strong style={{ color:'#dc2626' }}>₹{(client?.refundAmount || 0).toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', paddingTop:6, borderTop:'1px dashed #cbd5e1' }}>
              <span style={{ color:'#64748b', fontWeight:600 }}>Max Refundable Balance:</span>
              <strong style={{ color:'#16a34a' }}>₹{Math.max(0, (client?.paidAmount || 0) - (client?.refundAmount || 0)).toLocaleString('en-IN')}</strong>
            </div>
          </div>

          <div>
            <label className="label">Refund Amount (₹) <span style={{ color:'#f43f5e' }}>*</span></label>
            <input
              type="number"
              step="1"
              min="1"
              max={Math.max(0, (client?.paidAmount || 0) - (client?.refundAmount || 0))}
              className="input"
              required
              value={refundForm.amount}
              onChange={(e) => setRefundForm({ ...refundForm, amount: e.target.value })}
              placeholder="e.g. 5000"
            />
            {/* Quick amount helpers */}
            {client?.paidAmount > 0 && (
              <div style={{ display:'flex', gap:8, marginTop:8, flexWrap:'wrap' }}>
                <button
                  type="button"
                  onClick={() => setRefundForm({ ...refundForm, amount: Math.max(0, (client.paidAmount || 0) - (client.refundAmount || 0)) })}
                  style={{ padding:'4px 10px', fontSize:11.5, borderRadius:6, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontWeight:600 }}
                >
                  Full Remaining (₹{Math.max(0, (client.paidAmount || 0) - (client.refundAmount || 0)).toLocaleString('en-IN')})
                </button>
                {Math.round((client.paidAmount || 0) / 2) <= Math.max(0, (client.paidAmount || 0) - (client.refundAmount || 0)) && (
                  <button
                    type="button"
                    onClick={() => setRefundForm({ ...refundForm, amount: Math.round((client.paidAmount || 0) / 2) })}
                    style={{ padding:'4px 10px', fontSize:11.5, borderRadius:6, border:'1px solid #cbd5e1', background:'#fff', cursor:'pointer', fontWeight:600 }}
                  >
                    50% (₹{Math.round((client.paidAmount || 0) / 2).toLocaleString('en-IN')})
                  </button>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="label">Refund Reason <span style={{ color:'#f43f5e' }}>*</span></label>
            <textarea
              className="input"
              rows={3}
              required
              placeholder="e.g. Visa rejection guarantee reimbursement, cancellation request..."
              value={refundForm.reason}
              onChange={(e) => setRefundForm({ ...refundForm, reason: e.target.value })}
              style={{ resize:'vertical' }}
            />
          </div>

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:6 }}>
            <button type="button" className="btn-secondary" onClick={() => setRefundModal(false)}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={refundSaving || !refundForm.amount || !refundForm.reason}
              style={{ background:'#dc2626', borderColor:'#dc2626' }}
            >
              {refundSaving ? 'Recording...' : 'Confirm Refund'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Protected Document Viewer - View Only, No Download */}
      {viewDoc && (
        <div
          style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.85)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}
          onClick={() => { if (viewDoc.blobUrl) URL.revokeObjectURL(viewDoc.blobUrl); setViewDoc(null) }}
        >
          <div style={{ position:'relative', maxWidth:'90vw', maxHeight:'85vh' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#1e293b', borderRadius: viewDoc.error ? 12 : '12px 12px 0 0' }}>
              <span style={{ color:'#e2e8f0', fontSize:13, fontWeight:600 }}>{viewDoc.doc.originalName}</span>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:11, color: '#94a3b8', background:'#334155', padding:'3px 8px', borderRadius:6 }}>🔒 View Only</span>
                <button onClick={() => { if (viewDoc.blobUrl) URL.revokeObjectURL(viewDoc.blobUrl); setViewDoc(null) }} style={{ background:'none', border:'none', color: '#94a3b8', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
              </div>
            </div>

            {/* Error state */}
            {viewDoc.error && (
              <div style={{ background:'#1e293b', borderRadius:'0 0 12px 12px', padding:'32px 28px', textAlign:'center', minWidth:320 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📁</div>
                <div style={{ color:'#f87171', fontWeight:700, fontSize:14, marginBottom:8 }}>File Not Available</div>
                <div style={{ color: '#94a3b8', fontSize:13, lineHeight:1.6 }}>{viewDoc.error}</div>
              </div>
            )}

            {/* Protected content */}
            {!viewDoc.error && (
              <div
                style={{ position:'relative', overflow:'hidden', borderRadius:'0 0 12px 12px' }}
                onContextMenu={e => e.preventDefault()}
              >
                <div>
                  {viewDoc.isImage ? (
                    <img
                      src={viewDoc.blobUrl}
                      alt="Document"
                      draggable={false}
                      style={{ maxWidth:'85vw', maxHeight:'75vh', display:'block', userSelect:'none', WebkitUserDrag:'none', pointerEvents:'none' }}
                    />
                  ) : (
                    <iframe
                      src={`${viewDoc.blobUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                      style={{ width:'80vw', height:'75vh', border:'none' }}
                      title="Document viewer"
                    />
                  )}
                </div>

                {/* Watermark overlay */}
                <div style={{
                  position:'absolute', inset:0, pointerEvents:'none',
                  background:'repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(100,116,139,0.06) 80px, rgba(100,116,139,0.06) 160px)',
                  display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden',
                }}>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span key={i} style={{
                      position:'absolute',
                      top: `${(i % 4) * 28}%`,
                      left: `${Math.floor(i / 4) * 35}%`,
                      fontSize:13, fontWeight:700, color:'rgba(100,116,139,0.18)',
                      transform:'rotate(-30deg)', whiteSpace:'nowrap', userSelect:'none',
                    }}>
                      CONFIDENTIAL · TOURIST VISA EXPERTS
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:12, marginTop:12 }}>Click outside to close · Downloading is not permitted</p>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }) {
  return (
    <div style={{ padding:'11px 0', borderBottom:'1px solid #f8fafc', display:'flex', gap:16, alignItems:'flex-start' }}>
      <span style={{ fontSize:11.5, fontWeight:700, color: '#64748b', textTransform:'uppercase', letterSpacing:'0.06em', width:120, flexShrink:0, paddingTop:1 }}>{label}</span>
      <span style={{ fontSize:13.5, color: value ? '#0f172a' : '#cbd5e1', fontWeight: value ? 500 : 400 }}>{value || '—'}</span>
    </div>
  )
}

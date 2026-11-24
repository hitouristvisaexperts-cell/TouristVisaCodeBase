import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router'
import { getClient, updateTask, scheduleMeeting, addNote, getNotes, getDocuments, uploadDocument, updateStatus, runOCR, saveExtracted, downloadDocument, raiseEscalation, resolveFlag, raiseClientFlag } from '../../api/manager'

const API_BASE = import.meta.env.VITE_API_URL || 'https://shop.touristvisaexperts.com/api'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import EmptyState from '../../components/shared/EmptyState'
import { INTERNAL_STAGES, APPOINTMENT_MODULE, taskLabel, stageName } from '../../constants/workflow'

const CLIENT_STATUSES = [
  'Welcome & Consultation Pending','Profile Assessment','Documents Requested',
  'Documents Under Review','Appointment In Progress','Application Preparation',
  'Documents Ready','Appointment Completed','Visa Under Process',
  'Visa Approved','Visa Declined','Feedback & Testimonial','Completed',
]

const DOC_CATEGORIES = ['passport','bank_statement','employment','travel_insurance','flight_ticket','hotel_booking','cover_letter','application_form','sponsor_documents','previous_visa_stamps','property_funds','other','custom']

const ESCALATION_TYPES = [
  { value:'no_response_from_client', label:'Client not responding' },
  { value:'document_issue',          label:'Document issue' },
  { value:'delay_in_processing',     label:'Delay in processing' },
  { value:'other',                   label:'Other' },
]

const IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/jpg']

const REVIEW_STATUS_BADGE = {
  pending_review: { bg:'#fffbeb', color:'#d97706', border:'#fde68a', label:'Pending Review' },
  approved:       { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0', label:'Approved' },
  rejected:       { bg:'#fff1f2', color:'#f43f5e', border:'#fecdd3', label:'Rejected' },
}

const TABS = [
  { key:'tasks',     label:'Tasks',     icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> },
  { key:'notes',     label:'Notes',     icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> },
  { key:'documents', label:'Documents', icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg> },
  { key:'meeting',   label:'Meeting',   icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> },
  { key:'escalate',  label:'Needs Attention',  icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg> },
  { key:'family',    label:'Family',    icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { key:'info',      label:'Info',      icon:<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> },
]

export default function TeamClientDetail() {
  const { id } = useParams()
  const [client, setClient] = useState(null)
  const [notes, setNotes] = useState([])
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('tasks')
  const [expandedStages, setExpandedStages] = useState({}) // stageKey -> bool (manual override)
  const [meetModal, setMeetModal] = useState(false)
  const [meetForm, setMeetForm] = useState({ meetLink:'', scheduledAt:'', duration:30, title:'Visa Consultation Call' })
  const [noteText, setNoteText] = useState('')
  const [noteInternal, setNoteInternal] = useState(true)
  const [statusOverride, setStatusOverride] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploadFile, setUploadFile] = useState(null)
  const [uploadCat, setUploadCat] = useState('other')
  const [uploadForClient, setUploadForClient] = useState(false)
  const [uploadCustomType, setUploadCustomType] = useState('')

  // Protected view state
  const [viewDoc, setViewDoc] = useState(null) // { doc, blobUrl, isImage }
  const [viewBlurred, setViewBlurred] = useState(false)
  useEffect(() => {
    if (!viewDoc) return
    const onVis = () => setViewBlurred(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [viewDoc])

  // OCR state
  const [ocrModal, setOcrModal] = useState(null) // { docId, docName, imageUrl }
  const [ocrLoading, setOcrLoading] = useState(false)
  const [ocrResult, setOcrResult] = useState(null) // extracted fields
  const [ocrRawText, setOcrRawText] = useState([])
  const [ocrEdited, setOcrEdited] = useState({})
  const [ocrSaving, setOcrSaving] = useState(false)

  // Escalation state
  const [escalateType, setEscalateType] = useState('')
  const [escalateMsg, setEscalateMsg] = useState('')
  const [escalateSaving, setEscalateSaving] = useState(false)
  const [escalateSuccess, setEscalateSuccess] = useState('')

  // Flag state
  const [resolvingFlag, setResolvingFlag] = useState(false)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [flagMsg, setFlagMsg] = useState('')
  const [raisingFlag, setRaisingFlag] = useState(false)

  const loadClient = () => getClient(id).then((r) => setClient(r.data.data))
  const loadNotes  = () => getNotes(id).then((r) => setNotes(r.data.data || []))
  const loadDocs   = () => getDocuments(id).then((r) => setDocs(r.data.data || []))

  useEffect(() => {
    Promise.all([loadClient(), loadNotes(), loadDocs()]).finally(() => setLoading(false))
  }, [id])

  const handleTaskToggle = async (stageKey, taskName, completed) => {
    try { const r = await updateTask(id, { stageKey, taskName, completed }); setClient(r.data.data) }
    catch (err) { alert(err.response?.data?.message || 'Failed to update task') }
  }

  const handleMeeting = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await scheduleMeeting(id, meetForm); setMeetModal(false); loadClient() }
    catch (err) { alert(err.response?.data?.message || 'Failed to schedule') }
    finally { setSaving(false) }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!noteText.trim()) return
    await addNote(id, { content: noteText, isInternal: noteInternal })
    setNoteText(''); loadNotes()
  }

  const handleStatusOverride = async () => {
    if (!statusOverride) return
    if (!confirm(`Change status to "${statusOverride}"?`)) return
    await updateStatus(id, statusOverride); loadClient(); setStatusOverride('')
  }

  const handleResolveFlag = async () => {
    setResolvingFlag(true)
    try { await resolveFlag(id); setClient(c => ({ ...c, flagged: false, flagMessage: '' })) }
    catch { alert('Failed to resolve flag') }
    finally { setResolvingFlag(false) }
  }

  const handleRaiseFlag = async (e) => {
    e.preventDefault()
    if (!flagMsg.trim()) return
    setRaisingFlag(true)
    try {
      await raiseClientFlag(id, flagMsg.trim())
      setClient(c => ({ ...c, flagged: true, flagMessage: flagMsg.trim(), flaggedAt: new Date().toISOString() }))
      setShowFlagForm(false); setFlagMsg('')
    } catch { alert('Failed to raise flag') }
    finally { setRaisingFlag(false) }
  }

  const handleUpload = async (e) => {
    e.preventDefault(); if (!uploadFile) return; setSaving(true)
    const fd = new FormData()
    fd.append('file', uploadFile)
    fd.append('category', uploadCat)
    fd.append('generatedByTeam', uploadForClient ? 'true' : 'false')
    if (uploadCat === 'custom' && uploadCustomType) fd.append('customType', uploadCustomType)
    try {
      await uploadDocument(id, fd)
      setUploadFile(null); setUploadCat('other'); setUploadForClient(false); setUploadCustomType('')
      loadDocs()
    }
    catch (err) { alert(err.response?.data?.message || 'Upload failed') }
    finally { setSaving(false) }
  }

  const handleRunOCR = async (doc) => {
    const url = `/api/manager/clients/${id}/documents/${doc._id}/download`
    setOcrModal({ docId: doc._id, docName: doc.originalName, imageUrl: url })
    setOcrResult(null); setOcrEdited({}); setOcrRawText([])
    setOcrLoading(true)
    try {
      const r = await runOCR(id, doc._id)
      const { extracted, rawText } = r.data.data
      setOcrResult(extracted)
      setOcrRawText(rawText || [])
      setOcrEdited(extracted || {})
    } catch (err) { alert(err.response?.data?.message || 'OCR failed') }
    finally { setOcrLoading(false) }
  }

  const handleSaveExtracted = async () => {
    setOcrSaving(true)
    try {
      await saveExtracted(id, ocrModal.docId, ocrEdited)
      setOcrModal(null)
    } catch (err) { alert(err.response?.data?.message || 'Save failed') }
    finally { setOcrSaving(false) }
  }

  const handleDownloadTxt = () => {
    const lines = Object.entries(ocrEdited)
      .filter(([k]) => !['mrzLine1','mrzLine2','rawText','note'].includes(k))
      .map(([k, v]) => `${k.replace(/([A-Z])/g,' $1').trim()}: ${v || ''}`)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob)
    a.download = `passport_data_${ocrModal?.docName?.replace(/\.[^.]+$/,'')}.txt`
    a.click()
  }

  const handleViewDoc = async (doc) => {
    try {
      const r = await downloadDocument(id, doc._id)
      const blobUrl = URL.createObjectURL(new Blob([r.data], { type: doc.mimeType }))
      const isImage = IMAGE_TYPES.includes(doc.mimeType)
      setViewDoc({ doc, blobUrl, isImage })
    } catch {
      setViewDoc({ doc, blobUrl: null, isImage: false, error: 'File not found on server. The client may need to re-upload this document.' })
    }
  }

  const handleEscalate = async (e) => {
    e.preventDefault()
    if (!escalateType || !escalateMsg.trim()) return
    setEscalateSaving(true); setEscalateSuccess('')
    try {
      await raiseEscalation(id, { type: escalateType, message: escalateMsg })
      setEscalateSuccess('Flagged as Needs Attention. Admin has been notified.')
      setEscalateType(''); setEscalateMsg('')
    } catch (err) { alert(err.response?.data?.message || 'Failed to flag case') }
    finally { setEscalateSaving(false) }
  }

  if (loading) return <PageSpinner />
  if (!client) return <div style={{ color:'#f43f5e', padding:20 }}>Client not found</div>

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div>
        <Link to="/manager/clients" style={{ display:'inline-flex', alignItems:'center', gap:4, color:'#10b981', textDecoration:'none', fontSize:13, fontWeight:600, marginBottom:10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          My Clients
        </Link>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:52, height:52, borderRadius:16,
              background:'linear-gradient(135deg,#d1fae5,#ecfdf5)',
              border:'1px solid #a7f3d0',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:22, fontWeight:800, color:'#059669',
            }}>
              {client.user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ fontSize:22, fontWeight:800, color:'#0f172a', letterSpacing:'-0.04em', margin:0 }}>{client.user?.name}</h1>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:6, flexWrap:'wrap' }}>
                <StatusBadge status={client.clientStatus} />
                <span style={{ fontSize:12.5, color: '#64748b' }}>{client.user?.email}</span>
                {client.user?.phone && <span style={{ fontSize:12.5, color: '#64748b' }}>{client.user?.phone}</span>}
              </div>
            </div>
          </div>
          <button className="btn-primary" onClick={() => setMeetModal(true)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            Schedule Meeting
          </button>
        </div>
      </div>

      {/* Flag Section */}
      {client.flagged ? (
        <div style={{ background:'linear-gradient(135deg,#fff7ed,#fef3c7)', border:'2px solid #f97316', borderRadius:16, padding:'18px 22px', display:'flex', alignItems:'flex-start', gap:16 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="#fff" strokeWidth="2"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14.5, color:'#c2410c', marginBottom:3 }}>Flag Active</div>
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
      ) : (
        <div style={{ background:'#fff', borderRadius:14, border: showFlagForm ? '2px solid #f97316' : '1.5px solid #fed7aa', padding: showFlagForm ? '18px 20px' : '12px 18px' }}>
          {showFlagForm ? (
            <form onSubmit={handleRaiseFlag}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:34, height:34, borderRadius:10, background:'#fff7ed', border:'1.5px solid #fed7aa', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="#f97316"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13.5, color:'#c2410c' }}>Raise a Flag</div>
                  <div style={{ fontSize:11.5, color: '#64748b' }}>Describe the issue — admin will be notified</div>
                </div>
              </div>
              <textarea
                className="input"
                rows={3}
                required
                autoFocus
                placeholder="Describe the issue (e.g. 'Client not responding for 5 days', 'Missing critical document'...)"
                value={flagMsg}
                onChange={e => setFlagMsg(e.target.value)}
                style={{ resize:'vertical', marginBottom:10 }}
              />
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowFlagForm(false); setFlagMsg('') }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={raisingFlag || !flagMsg.trim()} style={{ background:'#f97316' }}>
                  {raisingFlag ? 'Raising...' : 'Raise Flag'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#f97316"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
                <span style={{ fontSize:13, color:'#78716c', fontWeight:500 }}>No active flag on this client</span>
              </div>
              <button
                onClick={() => setShowFlagForm(true)}
                style={{ padding:'6px 14px', borderRadius:9, fontSize:12.5, fontWeight:700, cursor:'pointer', background:'#fff7ed', color:'#f97316', border:'1.5px solid #fed7aa' }}
              >
                Raise a Flag
              </button>
            </div>
          )}
        </div>
      )}

      {/* Quick info + Status override */}
      <div className="r-grid-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
        {[
          ['Visa Type', client.visaType],
          ['Destination', client.destinationCountry],
          ['Stage', client.currentStageKey?.split('_').slice(0,3).join(' ')],
          ['Meeting', client.meetScheduledAt ? new Date(client.meetScheduledAt).toLocaleDateString() : 'Not scheduled'],
        ].map(([k,v]) => (
          <div key={k} style={{ background:'#fff', borderRadius:14, border:'1px solid #f1f5f9', padding:'14px 16px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize:10, fontWeight:700, color: '#64748b', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>{k}</div>
            <div style={{ fontSize:13.5, fontWeight:700, color: v && v !== 'Not scheduled' ? '#0f172a' : '#94a3b8' }}>{v || '—'}</div>
          </div>
        ))}
      </div>

      {/* Status override */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:'16px 20px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <span style={{ fontSize:13, fontWeight:700, color:'#334155', whiteSpace:'nowrap' }}>Override Status:</span>
        <select className="input" style={{ flex:1, maxWidth:280 }} value={statusOverride} onChange={(e) => setStatusOverride(e.target.value)}>
          <option value="">Select new status...</option>
          {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn-primary" disabled={!statusOverride} onClick={handleStatusOverride} style={{ background:'#10b981' }}>Update Status</button>
      </div>

      {/* Tabs */}
      <div className="r-tabs" style={{ display:'flex', gap:4, background:'#f8fafc', borderRadius:14, padding:4, width:'fit-content' }}>
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600,
            border:'none', cursor:'pointer', transition:'all 0.15s',
            fontFamily:'var(--font-sans)',
            background: activeTab === tab.key ? '#fff' : 'transparent',
            color: activeTab === tab.key ? '#0f172a' : '#64748b',
            boxShadow: activeTab === tab.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
          }}>
            <span style={{ color: activeTab === tab.key ? '#10b981' : 'inherit' }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* ── Appointment Booking — parallel independent module ── */}
          {(() => {
            const appt = client.appointmentModule
            if (!appt) return null
            const aDone = appt.tasks.filter(t => t.completed).length
            const aPct = appt.tasks.length ? Math.round((aDone/appt.tasks.length)*100) : 0
            const aComplete = !!appt.completedAt
            return (
              <div style={{
                background:'#faf5ff', borderRadius:16, border:'1.5px dashed #c4b5fd',
                padding:'18px 20px',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6, flexWrap:'wrap', gap:8 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ fontSize:18 }}>🗓️</span>
                    <span style={{ fontSize:14, fontWeight:700, color:'#6d28d9' }}>{APPOINTMENT_MODULE.name}</span>
                    <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:'#ede9fe', color:'#7c3aed', border:'1px solid #ddd6fe', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                      {aComplete ? '✓ Booked' : 'Parallel Module'}
                    </span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:60, height:4, background:'#ede9fe', borderRadius:99 }}>
                      <div style={{ width:`${aPct}%`, height:4, background:'#8b5cf6', borderRadius:99, transition:'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize:11.5, color:'#7c3aed', fontWeight:600 }}>{aDone}/{appt.tasks.length}</span>
                  </div>
                </div>
                <p style={{ fontSize:11.5, color:'#8b5cf6', marginBottom:12, lineHeight:1.5 }}>
                  Can be started the moment the client pays — runs alongside the numbered stages. {APPOINTMENT_MODULE.note}
                </p>
                <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                  {appt.tasks.map((task) => (
                    <label key={task.name} style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', padding:'6px 0' }}>
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={(e) => handleTaskToggle('APPOINTMENT_MODULE', task.name, e.target.checked)}
                        style={{ width:16, height:16, cursor:'pointer', accentColor:'#8b5cf6', flexShrink:0, marginTop:1 }}
                      />
                      <span style={{ fontSize:12.5, color: task.completed ? '#a78bda' : '#5b21b6', textDecoration: task.completed ? 'line-through' : 'none', lineHeight:1.4 }}>
                        {taskLabel(task.name)}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* ── Numbered SOP stages ── */}
          {(() => {
            const currentOrder = INTERNAL_STAGES.find(s => s.key === client.currentStageKey)?.order || 1
            return client.stages?.map((stage) => {
              const def = INTERNAL_STAGES.find(s => s.key === stage.stageKey)
              const order = def?.order || 0
              const isCurrent = stage.stageKey === client.currentStageKey
              const isCompleted = !!stage.completedAt
              const isLocked = !isCurrent && !isCompleted && order > currentOrder
              const done = stage.tasks.filter(t => t.completed).length
              const pct = stage.tasks.length > 0 ? Math.round((done/stage.tasks.length)*100) : 0

              // Open by default: current stage. Completed/locked collapse until clicked.
              const manuallyToggled = expandedStages[stage.stageKey]
              const isOpen = manuallyToggled !== undefined ? manuallyToggled : isCurrent
              const toggleOpen = () => setExpandedStages(p => ({ ...p, [stage.stageKey]: !isOpen }))

              const state = isCompleted ? 'done' : isCurrent ? 'current' : 'locked'
              const numBg = state==='done' ? '#16a34a' : state==='current' ? '#10b981' : '#e2e8f0'
              const numColor = state==='locked' ? '#94a3b8' : '#fff'

              return (
                <div key={stage.stageKey} style={{
                  background: isLocked ? '#fafbfc' : '#fff',
                  borderRadius:16,
                  border: isCurrent ? '1.5px solid #a7f3d0' : isCompleted ? '1px solid #e7f6ec' : '1px solid #f1f5f9',
                  boxShadow: isCurrent ? '0 2px 12px rgba(16,185,129,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
                  opacity: isLocked ? 0.7 : 1,
                  overflow:'hidden',
                }}>
                  {/* Header — clickable to expand/collapse */}
                  <div
                    onClick={toggleOpen}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, padding:'16px 20px', cursor:'pointer', userSelect:'none' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:10, minWidth:0 }}>
                      <span style={{
                        width:24, height:24, borderRadius:'50%', flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700, background:numBg, color:numColor,
                      }}>
                        {isCompleted ? '✓' : isLocked ? (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>
                        ) : order}
                      </span>
                      <span style={{ fontSize:13.5, fontWeight:700, color: isLocked ? '#94a3b8' : '#0f172a', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                        {stageName(stage.stageKey)}
                      </span>
                      {isCurrent && (
                        <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:'#ecfdf5', color:'#10b981', border:'1px solid #a7f3d0', textTransform:'uppercase', letterSpacing:'0.04em', flexShrink:0 }}>Current</span>
                      )}
                      {isCompleted && (
                        <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0', flexShrink:0 }}>Done</span>
                      )}
                      {isLocked && (
                        <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:600, background:'#f1f5f9', color: '#64748b', border:'1px solid #e2e8f0', flexShrink:0 }}>Upcoming</span>
                      )}
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                      {!isLocked && (
                        <>
                          <div style={{ width:50, height:4, background:'#f1f5f9', borderRadius:99 }}>
                            <div style={{ width:`${pct}%`, height:4, background: isCompleted ? '#16a34a' : '#10b981', borderRadius:99, transition:'width 0.3s' }} />
                          </div>
                          <span style={{ fontSize:11.5, color:'#64748b', fontWeight:600 }}>{done}/{stage.tasks.length}</span>
                        </>
                      )}
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                  </div>

                  {/* Tasks — only when open */}
                  {isOpen && (
                    <div style={{ padding:'0 20px 16px' }}>
                      {isLocked && (
                        <div style={{ fontSize:12, color: '#64748b', background:'#f8fafc', border:'1px dashed #e2e8f0', borderRadius:10, padding:'10px 12px', marginBottom:12 }}>
                          🔒 Finish the current stage to unlock these tasks.
                        </div>
                      )}
                      <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                        {stage.tasks.map((task) => (
                          <label key={task.name} style={{ display:'flex', alignItems:'flex-start', gap:10, cursor: isLocked ? 'not-allowed' : 'pointer', padding:'6px 0' }}>
                            <input
                              type="checkbox"
                              checked={task.completed}
                              disabled={isLocked}
                              onChange={(e) => handleTaskToggle(stage.stageKey, task.name, e.target.checked)}
                              style={{ width:16, height:16, cursor: isLocked ? 'not-allowed' : 'pointer', accentColor:'#10b981', flexShrink:0, marginTop:1 }}
                            />
                            <span style={{ fontSize:12.5, color: isLocked ? '#cbd5e1' : task.completed ? '#94a3b8' : '#334155', textDecoration: task.completed ? 'line-through' : 'none', lineHeight:1.4 }}>
                              {taskLabel(task.name)}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          })()}
        </div>
      )}

      {/* Notes Tab */}
      {activeTab === 'notes' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Add Note</h3>
            <form onSubmit={handleAddNote} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <textarea
                className="input"
                rows={3}
                placeholder="Write a note about this client..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                required
                style={{ resize:'vertical' }}
              />
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'#64748b', fontWeight:500 }}>
                  <input type="checkbox" checked={noteInternal} onChange={(e) => setNoteInternal(e.target.checked)} style={{ accentColor:'#10b981' }} />
                  Internal (hidden from client)
                </label>
                <button type="submit" className="btn-primary" style={{ background:'#10b981' }}>Add Note</button>
              </div>
            </form>
          </div>

          {notes.length === 0 ? <EmptyState title="No notes yet" /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {notes.map((note) => (
                <div key={note._id} style={{
                  background: note.isInternal ? '#fffbeb' : '#fff',
                  borderRadius:14, border: note.isInternal ? '1px solid #fde68a' : '1px solid #f1f5f9',
                  padding:'16px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                    <span style={{ fontSize:13, fontWeight:700, color:'#0f172a' }}>{note.addedBy?.name}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {note.isInternal && (
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#fef3c7', color:'#d97706', border:'1px solid #fde68a' }}>Internal</span>
                      )}
                      <span style={{ fontSize:11.5, color: '#64748b' }}>{new Date(note.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <p style={{ fontSize:13.5, color:'#334155', lineHeight:1.6, margin:0 }}>{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {/* Upload form */}
          <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14 }}>Upload Document</h3>
            <form onSubmit={handleUpload} style={{ display:'flex', gap:14, flexWrap:'wrap', alignItems:'flex-end' }}>
              <div style={{ flex:1, minWidth:180 }}>
                <label className="label">File</label>
                <input type="file" className="input" onChange={(e) => setUploadFile(e.target.files[0])} required />
              </div>
              <div style={{ width:180 }}>
                <label className="label">Category</label>
                <select className="input" value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>
                  {DOC_CATEGORIES.map((c) => <option key={c}>{c.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              {uploadCat === 'custom' && (
                <div style={{ width:200 }}>
                  <label className="label">Custom Label</label>
                  <input className="input" placeholder="e.g. NOC Letter" value={uploadCustomType} onChange={(e) => setUploadCustomType(e.target.value)} />
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:12.5, color:'#64748b', fontWeight:600, marginBottom:4 }}>
                  <input type="checkbox" checked={uploadForClient} onChange={(e) => setUploadForClient(e.target.checked)} style={{ accentColor:'#10b981' }} />
                  For Client Review
                </label>
                <button type="submit" className="btn-primary" disabled={saving} style={{ background:'#10b981' }}>
                  {saving ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>

          {/* Documents list */}
          {docs.length === 0 ? <EmptyState title="No documents yet" /> : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {docs.map((doc) => {
                const isImage = IMAGE_TYPES.includes(doc.mimeType)
                const reviewCfg = doc.generatedByTeam && doc.clientReviewStatus ? REVIEW_STATUS_BADGE[doc.clientReviewStatus] : null
                return (
                  <div key={doc._id} style={{
                    background:'#fff', borderRadius:14, border: doc.generatedByTeam ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
                    padding:'14px 18px', boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
                    display:'flex', alignItems:'center', gap:14,
                  }}>
                    {/* Icon / thumb */}
                    <div style={{
                      width:42, height:42, borderRadius:10, background: isImage ? '#f0f9ff' : '#f8fafc',
                      display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                      border:'1px solid #e2e8f0',
                    }}>
                      {isImage ? '🖼️' : '📄'}
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, color:'#0f172a', fontSize:13.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {doc.originalName}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:'#eff6ff', color:'#3b82f6', border:'1px solid #bfdbfe' }}>
                          {doc.category === 'custom' && doc.customType ? doc.customType : doc.category.replace(/_/g,' ')}
                        </span>
                        {doc.generatedByTeam && (
                          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:'#eff6ff', color:'#2563eb', border:'1px solid #bfdbfe' }}>
                            For Client
                          </span>
                        )}
                        {doc.familyMember && (
                          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:'#faf5ff', color:'#7c3aed', border:'1px solid #ddd6fe' }}>
                            {doc.familyMember}
                          </span>
                        )}
                        {reviewCfg && (
                          <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:reviewCfg.bg, color:reviewCfg.color, border:`1px solid ${reviewCfg.border}` }}>
                            {reviewCfg.label}
                          </span>
                        )}
                        <span style={{ fontSize:11, color: '#64748b' }}>
                          {doc.uploadedByRole === 'client' ? 'By client' : `By ${doc.uploadedBy?.name || 'team'}`}
                        </span>
                        <span style={{ fontSize:11, color: '#64748b' }}>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                      {isImage && (
                        <button onClick={() => handleRunOCR(doc)} className="btn-secondary" style={{ fontSize:12, padding:'5px 12px' }}>
                          🔍 OCR
                        </button>
                      )}
                      <button onClick={() => handleViewDoc(doc)} className="btn-secondary" style={{ fontSize:12, padding:'5px 12px' }}>
                        👁 View
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Escalate Tab */}
      {activeTab === 'escalate' && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #fecdd3', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#f59e0b', marginBottom:6 }}>Flag for Manager Attention</h3>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:20 }}>
            Use this when the client is not responding or there is a document/processing issue. The manager will be notified immediately.
          </p>
          {escalateSuccess && (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', color:'#16a34a', fontSize:13, marginBottom:16 }}>
              ✓ {escalateSuccess}
            </div>
          )}
          <form onSubmit={handleEscalate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label className="label">Issue Type</label>
              <select className="input" required value={escalateType} onChange={(e) => setEscalateType(e.target.value)}>
                <option value="">Select type...</option>
                {ESCALATION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Details</label>
              <textarea className="input" rows={4} required placeholder="Describe the issue clearly..." value={escalateMsg} onChange={(e) => setEscalateMsg(e.target.value)} style={{ resize:'vertical' }} />
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={escalateSaving} style={{ background:'#ef4444' }}>
                {escalateSaving ? 'Flagging...' : 'Flag for Attention'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meeting Tab */}
      {activeTab === 'meeting' && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:16 }}>Current Meeting</h3>
          {client.meetLink ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'#f0fdf4', borderRadius:12, padding:'14px 16px', border:'1px solid #bbf7d0' }}>
                <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Meet Link</div>
                <a href={client.meetLink} target="_blank" rel="noopener noreferrer" style={{ color:'#10b981', fontSize:13.5, wordBreak:'break-all' }}>{client.meetLink}</a>
              </div>
              {client.meetScheduledAt && (
                <div style={{ background:'#f8fafc', borderRadius:12, padding:'14px 16px', border:'1px solid #f1f5f9' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>Scheduled For</div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#0f172a' }}>{new Date(client.meetScheduledAt).toLocaleString()}</div>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontSize:13.5 }}>No meeting scheduled yet.</p>
          )}
          <button className="btn-primary" onClick={() => setMeetModal(true)} style={{ marginTop:16, background:'#10b981' }}>
            Schedule / Update Meeting
          </button>
        </div>
      )}

      {/* Info Tab */}
      {activeTab === 'info' && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:18 }}>Client Information</h3>
          <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
            {[
              ['Email', client.user?.email],['Phone', client.user?.phone],
              ['Visa Type', client.visaType],['Destination', client.destinationCountry],
              ['Package', client.packageType],['Passport No', client.passportNumber],
              ['Nationality', client.nationality],['Applicants', client.numberOfApplicants],
              ['Remarks', client.remarks],
            ].map(([label, value], i) => (
              <div key={label} style={{ padding:'12px 0', borderBottom:'1px solid #f8fafc', display:'flex', gap:16, gridColumn: label==='Remarks' ? '1/-1' : 'auto' }}>
                <span style={{ fontSize:12, fontWeight:700, color: '#64748b', textTransform:'uppercase', letterSpacing:'0.06em', width:100, flexShrink:0 }}>{label}</span>
                <span style={{ fontSize:13.5, color: value ? '#0f172a' : '#cbd5e1', fontWeight: value ? 500 : 400 }}>{value || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Family Members Tab */}
      {activeTab === 'family' && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4 }}>Family Members</h3>
          <p style={{ fontSize:12.5, color: '#64748b', marginBottom:20 }}>Co-applicants on this visa application</p>
          {(!client.familyMembers || client.familyMembers.length === 0) ? (
            <div style={{ textAlign:'center', padding:'40px 0', color: '#64748b' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>👨‍👩‍👧‍👦</div>
              <p style={{ fontWeight:600, color: '#64748b', fontSize:14 }}>No family members added</p>
              <p style={{ fontSize:12.5, color: '#64748b', marginTop:4 }}>This client applied individually</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
              {client.familyMembers.map((m, i) => (
                <div key={i} style={{
                  background:'linear-gradient(135deg,#f0fdf4,#ecfdf5)',
                  border:'1.5px solid #a7f3d0', borderRadius:16,
                  padding:'16px 18px', position:'relative', overflow:'hidden',
                }}>
                  {/* Card header */}
                  <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                    <div style={{
                      width:44, height:44, borderRadius:14, flexShrink:0,
                      background:'linear-gradient(135deg,#10b981,#059669)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontWeight:800, fontSize:18,
                    }}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:14, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{m.name}</div>
                      {m.relation && (
                        <span style={{ fontSize:10.5, fontWeight:700, color:'#059669', background:'#d1fae5', border:'1px solid #a7f3d0', borderRadius:99, padding:'1px 8px', display:'inline-block', marginTop:3 }}>
                          {m.relation}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Details */}
                  <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                    {m.dateOfBirth && (
                      <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'#065f46' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                        {m.dateOfBirth}
                      </div>
                    )}
                    {m.passportNumber && (
                      <div style={{ display:'flex', gap:8, alignItems:'center', fontSize:12, color:'#065f46' }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style={{ fontFamily:'monospace', letterSpacing:'0.05em', fontWeight:600 }}>{m.passportNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* OCR Modal */}
      {ocrModal && (
        <div style={{
          position:'fixed', inset:0, zIndex:1000,
          background:'rgba(15,23,42,0.6)', display:'flex', alignItems:'flex-start', justifyContent:'center',
          padding:'40px 20px', overflowY:'auto',
        }} onClick={(e) => { if (e.target === e.currentTarget) setOcrModal(null) }}>
          <div style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:900, boxShadow:'0 24px 80px rgba(0,0,0,0.18)' }}>
            <div style={{ padding:'20px 24px', borderBottom:'1px solid #f1f5f9', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ fontSize:16, fontWeight:700, color:'#0f172a', margin:0 }}>Passport OCR</h2>
                <p style={{ fontSize:12.5, color: '#64748b', margin:'2px 0 0' }}>{ocrModal.docName}</p>
              </div>
              <button onClick={() => setOcrModal(null)} style={{ background:'none', border:'none', cursor:'pointer', color: '#64748b', fontSize:20, lineHeight:1 }}>✕</button>
            </div>

            <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:0 }}>
              {/* Left: image */}
              <div style={{ padding:20, borderRight:'1px solid #f1f5f9', background:'#f8fafc', borderBottomLeftRadius:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color: '#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>Document Image</div>
                <img
                  src={`${API_BASE}/manager/clients/${id}/documents/${ocrModal.docId}/download`}
                  alt="Document"
                  style={{ width:'100%', borderRadius:10, border:'1px solid #e2e8f0', maxHeight:420, objectFit:'contain', background:'#fff' }}
                  onError={(e) => { e.target.style.display='none' }}
                />
              </div>

              {/* Right: extracted fields */}
              <div style={{ padding:20, borderBottomRightRadius:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color: '#64748b', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12 }}>
                  Extracted Data {ocrLoading && <span style={{ color:'#10b981' }}>— Processing...</span>}
                </div>

                {ocrLoading ? (
                  <div style={{ display:'flex', alignItems:'center', gap:10, color:'#64748b', fontSize:13, padding:20 }}>
                    <span style={{ width:18, height:18, border:'2px solid #e2e8f0', borderTopColor:'#10b981', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} />
                    Running OCR, please wait...
                  </div>
                ) : ocrResult ? (
                  <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                      ['fullName','Full Name'], ['surname','Surname'], ['givenNames','Given Names'],
                      ['passportNumber','Passport No.'], ['nationality','Nationality'],
                      ['dateOfBirth','Date of Birth'], ['expiryDate','Expiry Date'],
                      ['sex','Sex'], ['issuingCountry','Issuing Country'],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label style={{ fontSize:10, fontWeight:700, color: '#64748b', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:3 }}>{label}</label>
                        <input
                          className="input"
                          value={ocrEdited[key] || ''}
                          onChange={(e) => setOcrEdited({ ...ocrEdited, [key]: e.target.value })}
                          style={{ fontSize:13.5, padding:'8px 12px' }}
                        />
                      </div>
                    ))}
                    {ocrResult.note && (
                      <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'#b45309' }}>
                        ⚠️ {ocrResult.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ color: '#64748b', fontSize:13, padding:20 }}>Click OCR to extract data</div>
                )}

                {ocrResult && !ocrResult.note && ocrRawText.length > 0 && (
                  <details style={{ marginTop:14 }}>
                    <summary style={{ fontSize:12, color: '#64748b', cursor:'pointer', fontWeight:600 }}>Raw OCR Text</summary>
                    <div style={{ marginTop:8, padding:12, background:'#f8fafc', borderRadius:8, fontSize:11.5, color:'#475569', lineHeight:1.7, maxHeight:120, overflowY:'auto', fontFamily:'monospace' }}>
                      {ocrRawText.join('\n')}
                    </div>
                  </details>
                )}
              </div>
            </div>

            {ocrResult && (
              <div style={{ padding:'16px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'flex-end', gap:10 }}>
                <button onClick={handleDownloadTxt} className="btn-secondary">
                  ↓ Download .txt
                </button>
                <button onClick={handleSaveExtracted} className="btn-primary" disabled={ocrSaving} style={{ background:'#10b981' }}>
                  {ocrSaving ? 'Saving...' : '✓ Save to Document'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <Modal open={meetModal} onClose={() => setMeetModal(false)} title="Schedule Meeting">
        <form onSubmit={handleMeeting} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Google Meet Link *</label>
            <input className="input" type="url" placeholder="https://meet.google.com/..." required value={meetForm.meetLink} onChange={(e) => setMeetForm({ ...meetForm, meetLink: e.target.value })} />
          </div>
          <div>
            <label className="label">Date & Time *</label>
            <input className="input" type="datetime-local" required value={meetForm.scheduledAt} onChange={(e) => setMeetForm({ ...meetForm, scheduledAt: e.target.value })} />
          </div>
          <div className="r-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
            <div>
              <label className="label">Duration (mins)</label>
              <input className="input" type="number" min={15} max={120} value={meetForm.duration} onChange={(e) => setMeetForm({ ...meetForm, duration: e.target.value })} />
            </div>
            <div>
              <label className="label">Title</label>
              <input className="input" value={meetForm.title} onChange={(e) => setMeetForm({ ...meetForm, title: e.target.value })} />
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={() => setMeetModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ background:'#10b981' }}>{saving ? 'Saving...' : 'Schedule'}</button>
          </div>
        </form>
      </Modal>

      {/* Protected Document Viewer */}
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
                <span style={{ fontSize:11, color: '#64748b', background:'#334155', padding:'3px 8px', borderRadius:6 }}>🔒 View Only</span>
                <button onClick={() => { if (viewDoc.blobUrl) URL.revokeObjectURL(viewDoc.blobUrl); setViewDoc(null) }} style={{ background:'none', border:'none', color: '#64748b', cursor:'pointer', fontSize:20, lineHeight:1 }}>×</button>
              </div>
            </div>

            {/* Error state */}
            {viewDoc.error && (
              <div style={{ background:'#1e293b', borderRadius:'0 0 12px 12px', padding:'32px 28px', textAlign:'center', minWidth:320 }}>
                <div style={{ fontSize:32, marginBottom:12 }}>📁</div>
                <div style={{ color:'#f87171', fontWeight:700, fontSize:14, marginBottom:8 }}>File Not Available</div>
                <div style={{ color: '#64748b', fontSize:13, lineHeight:1.6 }}>{viewDoc.error}</div>
              </div>
            )}

            {/* Protected content */}
            {!viewDoc.error && (
            <div
              style={{ position:'relative', overflow:'hidden', borderRadius:'0 0 12px 12px' }}
              onContextMenu={e => e.preventDefault()}
            >
              <div style={{ filter: viewBlurred ? 'blur(20px)' : 'none', transition:'filter 0.3s' }}>
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
                    CONFIDENTIAL · TRAVEL TOURIST VISA EXPERT
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

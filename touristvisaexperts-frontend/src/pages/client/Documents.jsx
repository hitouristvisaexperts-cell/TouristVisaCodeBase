import { useState, useEffect } from 'react'
import { getDocuments, uploadDocument, confirmDocument, downloadDocument, deleteDocument, raiseEscalation } from '../../api/client'
import { useClientCase } from '../../context/ClientCaseContext'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'
import { DocIcon } from '../../components/shared/DocIcons'

const APPLICANT_CATEGORIES = ['passport','bank_statement','employment','travel_insurance','flight_ticket','hotel_booking','cover_letter','application_form','previous_visa_stamps','property_funds','other']
const SPONSOR_CATEGORIES = ['sponsor_documents']
const DOC_CATEGORIES = [...APPLICANT_CATEGORIES, ...SPONSOR_CATEGORIES]

const CAT_CONFIG = {
  passport:             { label:'Passport',              hint:'Original + copy of all pages. Must be valid for at least 6 months beyond travel.', color:'#4f46e5', bg:'#eef2ff', border:'#c7d2fe' },
  bank_statement:       { label:'Bank Statement',        hint:'Last 3–6 months. Must show consistent balance and regular transactions.', color:'#0d9488', bg:'#f0fdfa', border:'#99f6e4' },
  employment:           { label:'Employment Proof',      hint:'Employment letter on company letterhead with designation, salary and leave approval.', color:'#d97706', bg:'#fffbeb', border:'#fde68a' },
  travel_insurance:     { label:'Travel Insurance',      hint:'Must cover the full travel period and destination country with min. €30,000 cover.', color:'#16a34a', bg:'#f0fdf4', border:'#bbf7d0' },
  flight_ticket:        { label:'Flight Ticket',         hint:'Confirmed or dummy itinerary showing departure and return dates.', color:'#2563eb', bg:'#eff6ff', border:'#bfdbfe' },
  hotel_booking:        { label:'Hotel Booking',         hint:'Confirmed hotel reservation for the full duration of your stay.', color:'#9333ea', bg:'#faf5ff', border:'#e9d5ff' },
  cover_letter:         { label:'Cover Letter',          hint:'Explains the purpose of your trip, itinerary and financial ability. We draft this for you.', color:'#db2777', bg:'#fdf2f8', border:'#fbcfe8' },
  application_form:     { label:'Application Form',      hint:'Completed and signed visa application form for the destination embassy.', color:'#059669', bg:'#ecfdf5', border:'#a7f3d0' },
  sponsor_documents:    { label:'Sponsor Documents',     hint:'ID, bank statements and income proof for anyone financially sponsoring your trip.', color:'#c026d3', bg:'#fdf4ff', border:'#f5d0fe' },
  previous_visa_stamps: { label:'Previous Visa Stampings', hint:'Copies of visa stamps/pages from earlier passports showing your travel history.', color:'#0891b2', bg:'#ecfeff', border:'#a5f3fc' },
  property_funds:       { label:'Property / Mutual Funds', hint:'Property documents, fixed deposits or mutual fund statements showing ties/assets.', color:'#ca8a04', bg:'#fefce8', border:'#fef08a' },
  other:                { label:'Other Document',        hint:'Any supporting document not listed above (e.g. invitation letter, ITR).', color:'#64748b', bg:'#f8fafc', border:'#e2e8f0' },
  custom:               { label:'Custom',                hint:'', color:'#7c3aed', bg:'#f5f3ff', border:'#ddd6fe' },
}

const ESCALATION_TYPES = [
  { value:'no_response_from_team',   label:'Team is not responding' },
  { value:'document_issue',          label:'Issue with my documents' },
  { value:'delay_in_processing',     label:'Delay in processing' },
  { value:'other',                   label:'Other' },
]

/* ── helpers ─────────────────────────────────────────────────────────── */
function fmtDate(d) { return new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) }
function fmtSize(b) {
  if (!b) return ''
  if (b < 1024) return `${b} B`
  if (b < 1024*1024) return `${(b/1024).toFixed(1)} KB`
  return `${(b/(1024*1024)).toFixed(1)} MB`
}

/* ── File picker (custom) ────────────────────────────────────────────── */
function FilePicker({ color, border, bg, file, onChange }) {
  return (
    <label style={{ display:'block', cursor:'pointer' }}>
      <input type="file" onChange={e => onChange(e.target.files[0])} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" style={{ display:'none' }} />
      <div style={{
        border:`2px dashed ${file ? color : '#e2e8f0'}`,
        borderRadius:12, padding:'18px 16px', textAlign:'center',
        background: file ? bg : '#fafbfc', transition:'all 0.2s', cursor:'pointer',
      }}>
        {file ? (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <span style={{ width:36, height:36, borderRadius:10, background:bg, border:`1.5px solid ${border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </span>
            <div style={{ textAlign:'left' }}>
              <p style={{ fontSize:13, fontWeight:700, color, margin:0 }}>{file.name}</p>
              <p style={{ fontSize:11, color:'#94a3b8', margin:'2px 0 0' }}>{fmtSize(file.size)} · tap to change</p>
            </div>
          </div>
        ) : (
          <>
            <div style={{ width:40, height:40, borderRadius:10, margin:'0 auto 8px', background:'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round">
                <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
              </svg>
            </div>
            <p style={{ fontSize:13, fontWeight:600, color:'#475569', margin:'0 0 2px' }}>Click to choose file</p>
            <p style={{ fontSize:11.5, color:'#94a3b8', margin:0 }}>PDF, Word, JPEG, PNG — max 5 MB</p>
          </>
        )}
      </div>
    </label>
  )
}

/* ── Uploaded doc card ───────────────────────────────────────────────── */
function UploadedCard({ doc, cfg, onDownload, onDelete, downloading, deleting }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', gap:12,
      background:'#fff', border:`1.5px solid ${cfg.border}`,
      borderRadius:12, padding:'12px 14px',
    }}>
      {/* Icon */}
      <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <DocIcon category={doc.category} size={20} color={cfg.color} />
      </div>

      {/* Info */}
      <div style={{ flex:1, overflow:'hidden' }}>
        <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{doc.originalName}</p>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:3, flexWrap:'wrap' }}>
          <span style={{ fontSize:11, color:'#94a3b8' }}>{fmtDate(doc.createdAt)}</span>
          {doc.fileSize && <span style={{ fontSize:11, color:'#cbd5e1' }}>· {fmtSize(doc.fileSize)}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
        <button
          onClick={onDownload}
          disabled={downloading}
          title="Download"
          style={{ width:34, height:34, borderRadius:9, border:`1px solid ${cfg.border}`, background:cfg.bg, color:cfg.color, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, transition:'all 0.15s' }}
        >
          {downloading ? '…' : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          )}
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          title="Delete"
          style={{ width:34, height:34, borderRadius:9, border:'1px solid #fecdd3', background:'#fff1f2', color:'#f43f5e', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, transition:'all 0.15s' }}
        >
          {deleting ? '…' : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          )}
        </button>
      </div>
    </div>
  )
}

/* ── One document-type row (expand to view/upload) ──────────────────── */
function CategoryRow({ c, cfg, isOpen, uploaded, file, uploading, downloading, deleting, onToggle, onUpload, onFileChange, onDownload, onDelete }) {
  const hasUploads = uploaded.length > 0
  return (
    <div style={{
      borderRadius:14, overflow:'hidden', transition:'box-shadow 0.2s',
      border: isOpen ? `2px solid ${cfg.color}` : `1.5px solid ${hasUploads ? cfg.border : '#f1f5f9'}`,
      boxShadow: isOpen ? `0 4px 20px ${cfg.color}18` : 'none',
      background: isOpen ? cfg.bg : hasUploads ? `${cfg.bg}88` : '#fafbfc',
    }}>
      {/* Row header */}
      <button
        type="button"
        onClick={onToggle}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:14, padding:'14px 16px', cursor:'pointer', background:'transparent', border:'none', textAlign:'left' }}
      >
        {/* Icon */}
        <div style={{ width:44, height:44, borderRadius:12, flexShrink:0, background: isOpen ? '#fff' : cfg.bg, border:`1.5px solid ${isOpen ? cfg.border : '#e8edf3'}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <DocIcon category={c} size={20} color={isOpen || hasUploads ? cfg.color : '#94a3b8'} />
        </div>

        {/* Label + hint */}
        <div style={{ flex:1, textAlign:'left' }}>
          <p style={{ margin:0, fontSize:13.5, fontWeight:700, color: isOpen ? cfg.color : hasUploads ? '#0f172a' : '#334155' }}>
            {cfg.label}
          </p>
          {!isOpen && (
            <p style={{ margin:'2px 0 0', fontSize:11.5, color:'#94a3b8', lineHeight:1.4 }}>
              {cfg.hint}
            </p>
          )}
        </div>

        {/* Status badge */}
        {hasUploads && (
          <span style={{ flexShrink:0, padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700, background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.border}` }}>
            {uploaded.length} file{uploaded.length > 1 ? 's' : ''}
          </span>
        )}

        {/* Chevron */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={isOpen ? cfg.color : '#94a3b8'} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink:0, transition:'transform 0.2s', transform: isOpen ? 'rotate(180deg)' : 'none' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div style={{ borderTop:`1px solid ${cfg.border}`, padding:'16px' }}>

          {/* Hint */}
          <p style={{ fontSize:12, color: cfg.color, fontWeight:600, margin:'0 0 14px', padding:'8px 12px', background:'#fff', borderRadius:9, border:`1px solid ${cfg.border}` }}>
            ℹ️ {cfg.hint}
          </p>

          {/* Already uploaded docs */}
          {uploaded.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:0 }}>Uploaded</p>
              {uploaded.map(doc => (
                <UploadedCard
                  key={doc._id}
                  doc={doc}
                  cfg={cfg}
                  onDownload={() => onDownload(doc)}
                  onDelete={() => onDelete(doc._id)}
                  downloading={downloading === doc._id}
                  deleting={deleting === doc._id}
                />
              ))}
            </div>
          )}

          {/* Upload new */}
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', margin:'0 0 10px' }}>
              {uploaded.length > 0 ? 'Upload Another' : 'Upload File'}
            </p>
            <form onSubmit={e => onUpload(e, c)}>
              <FilePicker color={cfg.color} border={cfg.border} bg={cfg.bg} file={file} onChange={onFileChange} />
              <button
                type="submit"
                disabled={uploading || !file}
                style={{
                  marginTop:10, width:'100%',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                  padding:'12px 20px', borderRadius:12, fontSize:13.5, fontWeight:700,
                  cursor: file && !uploading ? 'pointer' : 'not-allowed',
                  background: file && !uploading ? cfg.color : '#e2e8f0',
                  color: file && !uploading ? '#fff' : '#94a3b8',
                  border:'none', transition:'all 0.2s',
                }}
              >
                {uploading ? (
                  <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Uploading...</>
                ) : (
                  <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg> Upload {cfg.label}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────────────── */
export default function ClientDocuments() {
  const { activeCaseId, loading: caseLoading } = useClientCase() || {}
  const [docs, setDocs] = useState([])
  const [familyMembers, setFamilyMembers] = useState([])
  const [activeMember, setActiveMember] = useState('') // '' = primary applicant
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)     // which category row is open
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(null)     // docId being deleted
  const [downloading, setDownloading] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirming, setConfirming] = useState(null)
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false)
  const [showEscalate, setShowEscalate] = useState(false)
  const [escalateType, setEscalateType] = useState('')
  const [escalateMsg, setEscalateMsg] = useState('')
  const [escalateSaving, setEscalateSaving] = useState(false)
  const [escalateSuccess, setEscalateSuccess] = useState('')

  const load = () => getDocuments(activeCaseId).then(r => {
    setDocs(r.data.data || [])
    setFamilyMembers(r.data.familyMembers || [])
  }).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => {
    if (caseLoading) return
    setLoading(true)
    load()
  }, [activeCaseId, caseLoading])

  // Filter docs by active member
  const memberDocs = docs.filter(d => (d.familyMember || '') === activeMember)
  const myDocs = memberDocs.filter(d => !d.generatedByTeam)
  const teamDocs = memberDocs.filter(d => d.generatedByTeam)

  // docs grouped by category (for active member)
  const docsByCategory = {}
  myDocs.forEach(d => {
    const key = d.category || 'other'
    if (!docsByCategory[key]) docsByCategory[key] = []
    docsByCategory[key].push(d)
  })

  const toggle = (c) => {
    setExpanded(prev => prev === c ? null : c)
    setFile(null); setError(''); setSuccess('')
  }

  const handleUpload = async (e, cat) => {
    e.preventDefault()
    if (!file) return
    setError(''); setSuccess(''); setUploading(true)
    try {
      await uploadDocument(file, cat, '', activeMember, activeCaseId)
      const label = activeMember ? `${activeMember}'s ${CAT_CONFIG[cat]?.label || cat}` : (CAT_CONFIG[cat]?.label || cat)
      setSuccess(`${label} uploaded!`)
      setFile(null); setExpanded(null); load()
    } catch (err) { setError(err.response?.data?.message || 'Upload failed') }
    finally { setUploading(false) }
  }

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return
    setDeleting(docId)
    try { await deleteDocument(docId, activeCaseId); load() }
    catch { alert('Delete failed') }
    finally { setDeleting(null) }
  }

  const handleDownload = async (doc) => {
    setDownloading(doc._id)
    try {
      const r = await downloadDocument(doc._id, activeCaseId)
      const url = URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a'); a.href = url; a.download = doc.originalName; a.click()
    } catch { alert('Download failed') }
    finally { setDownloading(null) }
  }

  const handleConfirm = async (docId, action) => {
    setConfirming(docId)
    try { await confirmDocument(docId, action, activeCaseId); load() }
    catch (err) { alert(err.response?.data?.message || 'Action failed') }
    finally { setConfirming(null) }
  }

  const handleEscalate = async (e) => {
    e.preventDefault()
    if (!escalateType || !escalateMsg.trim()) return
    setEscalateSaving(true); setEscalateSuccess('')
    try {
      await raiseEscalation({ type: escalateType, message: escalateMsg }, activeCaseId)
      setEscalateSuccess('Your issue has been reported. Our admin will look into it shortly.')
      setEscalateType(''); setEscalateMsg('')
      setTimeout(() => setShowEscalate(false), 3000)
    } catch (err) { alert(err.response?.data?.message || 'Failed') }
    finally { setEscalateSaving(false) }
  }

  if (loading) return <PageSpinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">Documents</h1>
          <p className="page-subtitle">Upload and manage your visa documents securely</p>
        </div>
        <button
          onClick={() => setShowEscalate(!showEscalate)}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', background: showEscalate ? '#fee2e2' : '#fff1f2', color:'#f43f5e', border:'1px solid #fecdd3' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="2.5"/></svg>
          Raise Issue
        </button>
      </div>

      {/* ── Contextual Data Safety & DPDP Privacy Guarantee Banner ── */}
      <div style={{
        background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)',
        border: '1.5px solid #bbf7d0',
        borderRadius: 16,
        padding: '18px 20px',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: '#dcfce7', border: '1.5px solid #86efac',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, color: '#16a34a'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="m9 12 2 2 4-4"/>
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>
                  Bank-Grade Encryption & Data Privacy Guarantee
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' }}>
                  AES-256 Cloud Encrypted
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#e0e7ff', color: '#4338ca', border: '1px solid #c7d2fe' }}>
                  DPDP Act 2023 Compliant
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                Your confidential documents are stored with end-to-end cloud encryption, accessed strictly by your assigned case officer, and automatically purged 30 days after visa processing.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
            style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
              background: '#fff', border: '1px solid #cbd5e1', color: '#334155',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0
            }}
          >
            {showPrivacyDetails ? 'Hide Details' : 'View Privacy Guarantee'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ transform: showPrivacyDetails ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>

        {/* UIDAI Aadhaar Advisory Notice */}
        <div style={{
          marginTop: 12, padding: '10px 14px', borderRadius: 10,
          background: '#fffbeb', border: '1px solid #fde68a',
          display: 'flex', alignItems: 'center', gap: 10
        }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>
            <strong>UIDAI Advisory:</strong> Please do <u>NOT</u> upload Aadhaar cards. For identity verification, embassies accept only valid <strong>Passport</strong> or <strong>Voter ID / Driver's License</strong>.
          </span>
        </div>

        {/* Expandable Privacy & Compliance Commitments */}
        {showPrivacyDetails && (
          <div style={{
            marginTop: 14, paddingTop: 14, borderTop: '1px solid #bbf7d0',
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14
          }}>
            <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span>🔒</span> Purpose Limitation
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>
                Documents are used exclusively to draft visa applications, prepare SOPs, and book official appointments. Never sold or shared with third parties.
              </p>
            </div>
            <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span>🛡️</span> Zero Public Access (Presigned URLs)
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>
                Files cannot be accessed publicly. Downloads require time-limited (15-min) cryptographically signed links issued only to your authenticated account.
              </p>
            </div>
            <div style={{ background: '#fff', padding: '12px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span>🗑️</span> Automated 30-Day Purge
              </div>
              <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', lineHeight: 1.5 }}>
                In accordance with data minimization mandates, all personal financial and passport documents are permanently erased 30 days following visa completion.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Escalation form */}
      {showEscalate && (
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #fecdd3', padding:20, boxShadow:'0 2px 12px rgba(244,63,94,0.08)' }}>
          <h3 style={{ fontSize:14, fontWeight:700, color:'#f43f5e', marginBottom:6 }}>Raise an Issue</h3>
          <p style={{ fontSize:13, color:'#64748b', marginBottom:16 }}>Not hearing back from the team? Let our admin know and we'll look into it immediately.</p>
          {escalateSuccess ? (
            <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'12px 16px', color:'#16a34a', fontSize:13 }}>✓ {escalateSuccess}</div>
          ) : (
            <form onSubmit={handleEscalate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <select className="input" required value={escalateType} onChange={e => setEscalateType(e.target.value)}>
                <option value="">Select issue type...</option>
                {ESCALATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <textarea className="input" rows={3} required placeholder="Describe the issue..." value={escalateMsg} onChange={e => setEscalateMsg(e.target.value)} style={{ resize:'vertical' }} />
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEscalate(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={escalateSaving} style={{ background:'#ef4444' }}>
                  {escalateSaving ? 'Sending...' : 'Submit Issue'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Member Tabs (only if there are family members) */}
      {familyMembers.length > 0 && (
        <div style={{ background:'#fff', borderRadius:14, border:'1px solid #e2e8f0', padding:'4px', display:'flex', gap:4, overflowX:'auto' }}>
          {/* Primary applicant tab */}
          <button
            type="button"
            onClick={() => { setActiveMember(''); setExpanded(null); setFile(null); setError(''); setSuccess('') }}
            style={{
              flex:'0 0 auto', padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
              border:'none', transition:'all 0.15s',
              background: activeMember === '' ? '#4f46e5' : 'transparent',
              color: activeMember === '' ? '#fff' : '#64748b',
            }}
          >
            <span style={{ display:'flex', alignItems:'center', gap:6 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              You
              <span style={{ fontSize:11, opacity:0.8 }}>({docs.filter(d => (d.familyMember || '') === '' && !d.generatedByTeam).length})</span>
            </span>
          </button>
          {/* Family member tabs */}
          {familyMembers.map((m, i) => {
            const memberName = m.name || `Member ${i + 1}`
            const count = docs.filter(d => d.familyMember === memberName && !d.generatedByTeam).length
            return (
              <button
                key={i}
                type="button"
                onClick={() => { setActiveMember(memberName); setExpanded(null); setFile(null); setError(''); setSuccess('') }}
                style={{
                  flex:'0 0 auto', padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
                  border:'none', transition:'all 0.15s',
                  background: activeMember === memberName ? '#7c3aed' : 'transparent',
                  color: activeMember === memberName ? '#fff' : '#64748b',
                }}
              >
                <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  {memberName}
                  {m.relation && <span style={{ fontSize:10, opacity:0.75 }}>· {m.relation}</span>}
                  <span style={{ fontSize:11, opacity:0.8 }}>({count})</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Global messages */}
      {error   && <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:10, padding:'10px 14px', color:'#f43f5e', fontSize:13 }}>{error}</div>}
      {success && <div style={{ background:'#f0fdf4', border:'1px solid #bbf7d0', borderRadius:10, padding:'10px 14px', color:'#16a34a', fontSize:13 }}>✓ {success}</div>}

      {/* Team docs for review */}
      {teamDocs.length > 0 && (
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#2563eb', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:12, display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6', display:'inline-block' }} />
            Documents from Team
            {teamDocs.some(d => d.clientReviewStatus === 'pending_review') && (
              <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>
                {teamDocs.filter(d => d.clientReviewStatus === 'pending_review').length} pending review
              </span>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {teamDocs.map(doc => {
              const cfg = CAT_CONFIG[doc.category] || CAT_CONFIG.other
              const isPending = doc.clientReviewStatus === 'pending_review'
              const isApproved = doc.clientReviewStatus === 'approved'
              const isRejected = doc.clientReviewStatus === 'rejected'
              return (
                <div key={doc._id} style={{ background: isPending ? '#fffbeb' : '#fff', borderRadius:14, padding:'14px 18px', border: isPending ? '1px solid #fde68a' : isApproved ? '1px solid #bbf7d0' : isRejected ? '1px solid #fecdd3' : '1px solid #f1f5f9' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ width:42, height:42, borderRadius:12, flexShrink:0, background:cfg.bg, border:`1px solid ${cfg.border}`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <DocIcon category={doc.category} size={20} color={cfg.color} />
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:700, color:'#0f172a', fontSize:13.5, margin:0 }}>{doc.originalName}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:5, flexWrap:'wrap' }}>
                        <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:600, background:cfg.bg, color:cfg.color }}>{cfg.label}</span>
                        {isPending  && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#fffbeb', color:'#d97706', border:'1px solid #fde68a' }}>Pending Your Review</span>}
                        {isApproved && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0' }}>✓ Approved</span>}
                        {isRejected && <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:'#fff1f2', color:'#f43f5e', border:'1px solid #fecdd3' }}>✗ Rejected</span>}
                        <span style={{ fontSize:11, color:'#94a3b8' }}>{fmtDate(doc.createdAt)}</span>
                      </div>
                      {doc.notes && <p style={{ fontSize:12.5, color:'#64748b', marginTop:6 }}>{doc.notes}</p>}
                    </div>
                  </div>
                  {(isPending || isApproved) && (
                    <div style={{ display:'flex', gap:10, marginTop:12, paddingTop:12, borderTop:'1px solid #f1f5f9', justifyContent:'flex-end' }}>
                      {isPending && (
                        <>
                          <button onClick={() => handleConfirm(doc._id, 'rejected')} disabled={confirming === doc._id}
                            style={{ padding:'7px 16px', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', background:'#fff1f2', color:'#f43f5e', border:'1px solid #fecdd3' }}>
                            {confirming === doc._id ? '...' : '✗ Reject'}
                          </button>
                          <button onClick={() => handleConfirm(doc._id, 'approved')} disabled={confirming === doc._id} className="btn-primary" style={{ background:'#10b981' }}>
                            {confirming === doc._id ? 'Processing...' : '✓ Approve'}
                          </button>
                        </>
                      )}
                      {isApproved && (
                        <button onClick={() => handleDownload(doc)} disabled={downloading === doc._id} className="btn-primary">
                          {downloading === doc._id ? 'Downloading...' : '↓ Download'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Applicant documents */}
      <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <h2 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4 }}>
          {activeMember ? `${activeMember}'s Documents` : 'Applicant Documents'}
        </h2>
        <p style={{ fontSize:12.5, color:'#94a3b8', marginBottom:18 }}>Tap any document type to upload or manage your files.</p>

        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {APPLICANT_CATEGORIES.map(c => (
            <CategoryRow
              key={c} c={c} cfg={CAT_CONFIG[c]}
              isOpen={expanded === c}
              uploaded={docsByCategory[c] || []}
              file={file} uploading={uploading} downloading={downloading} deleting={deleting}
              onToggle={() => toggle(c)}
              onUpload={handleUpload}
              onFileChange={f => { setFile(f); setError('') }}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Sponsor documents — separate group, only shown when relevant to the primary applicant */}
      {!activeMember && (
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize:14, fontWeight:700, color:'#0f172a', marginBottom:4 }}>Sponsor Documents</h2>
          <p style={{ fontSize:12.5, color:'#94a3b8', marginBottom:18 }}>If someone is financially sponsoring your trip, upload their documents here.</p>

          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {SPONSOR_CATEGORIES.map(c => (
              <CategoryRow
                key={c} c={c} cfg={CAT_CONFIG[c]}
                isOpen={expanded === c}
                uploaded={docsByCategory[c] || []}
                file={file} uploading={uploading} downloading={downloading} deleting={deleting}
                onToggle={() => toggle(c)}
                onUpload={handleUpload}
                onFileChange={f => { setFile(f); setError('') }}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {docs.length === 0 && !loading && (
        <EmptyState title="No documents yet" description="Tap any document type above to upload your first file" />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

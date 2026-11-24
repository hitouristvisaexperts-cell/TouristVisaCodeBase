import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { getStatus, updateFamilyMembers, createAddMembersOrder, verifyAddMembersPayment, raiseFlag } from '../../api/client'
import { useClientCase } from '../../context/ClientCaseContext'
import api from '../../api/axios'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'

const RELATIONS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Friend', 'Other']

const DEFAULT_MEMBER_PRICE = 10000

// paidCoApplicants = co-applicant places already paid for (at checkout or later) — those can be named for free
function FamilyEditor({ initial, onSave, onCancel, clientId, paidCoApplicants = 0, pricePerMember = DEFAULT_MEMBER_PRICE }) {
  const PER_MEMBER_PRICE = pricePerMember
  const covered = Math.max(initial.length, paidCoApplicants)
  const blank = { name: '', relation: 'Spouse', dateOfBirth: '', passportNumber: '' }
  const [members, setMembers] = useState(
    initial.length > 0 ? initial.map(m => ({ ...m })) : [{ ...blank }]
  )
  // 'edit' → filling form | 'pay' → payment summary | 'paying' → Razorpay open
  const [step, setStep] = useState('edit')
  const [error, setError] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  const add    = () => setMembers(p => [...p, { ...blank }])
  const remove = (i) => setMembers(p => p.filter((_, j) => j !== i))
  const update = (i, k, v) => setMembers(p => p.map((m, j) => j === i ? { ...m, [k]: v } : m))

  const valid    = members.filter(m => m.name.trim())
  const newCount = Math.max(0, valid.length - covered)   // people beyond the places already paid for
  const totalDue = newCount * PER_MEMBER_PRICE

  // Click "Continue" — validate then go to pay step or free-save
  const handleContinue = () => {
    if (valid.length === 0) { setError('Please enter a name for at least one member.'); return }
    const missingName = members.findIndex(m => !m.name.trim())
    if (missingName !== -1) { setError(`Please enter a name for Member ${missingName + 1}.`); return }
    setError('')
    if (newCount > 0) {
      setStep('pay')   // needs payment
    } else {
      handleFreeSave() // only edits/removals — no charge
    }
  }

  // Free save (no new members added)
  const handleFreeSave = async () => {
    setPayLoading(true); setError('')
    try { await onSave(valid) }
    catch (e) { setError(e?.response?.data?.message || 'Failed to save.'); setPayLoading(false) }
  }

  // Pay via Razorpay then save
  const handlePay = async () => {
    setPayLoading(true); setError('')
    try {
      const { data: res } = await createAddMembersOrder(newCount, clientId)
      if (!res.success) throw new Error(res.message)

      // Load Razorpay script if needed
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script')
          s.src = 'https://checkout.razorpay.com/v1/checkout.js'
          s.onload = resolve; s.onerror = () => reject(new Error('Failed to load Razorpay'))
          document.head.appendChild(s)
        })
      }

      const rzp = new window.Razorpay({
        key:      res.data.keyId,
        amount:   res.data.amount,
        currency: res.data.currency,
        order_id: res.data.orderId,
        name:     'Travel Tourist Visa Expert',
        description: `Adding ${newCount} co-applicant${newCount > 1 ? 's' : ''} to your visa application`,
        theme:    { color: '#8b5cf6' },
        handler: async (response) => {
          try {
            const { data: vRes } = await verifyAddMembersPayment({
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              familyMembers:       valid,
            }, clientId)
            if (!vRes.success) throw new Error(vRes.message)
            await onSave(vRes.data, true, vRes.numberOfApplicants)   // skipApi=true — backend already saved
          } catch (e) {
            setError(e?.response?.data?.message || e.message || 'Payment verification failed.')
            setPayLoading(false)
          }
        },
        modal: { ondismiss: () => { setPayLoading(false); setStep('pay') } },
      })
      rzp.open()
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Could not start payment.')
      setPayLoading(false)
    }
  }

  /* ── Payment summary screen ── */
  if (step === 'pay') return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {/* Who's being added */}
      <div style={{ background:'#f5f3ff', border:'1.5px solid #ddd6fe', borderRadius:14, padding:16 }}>
        <p style={{ fontSize:11, fontWeight:800, color:'#7c3aed', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:10 }}>New Co-applicants</p>
        {valid.slice(covered).map((m, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < valid.length - covered - 1 ? '1px solid #ede9fe' : 'none' }}>
            <div style={{ width:32, height:32, borderRadius:10, background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:800, fontSize:14, flexShrink:0 }}>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight:700, color:'#0f172a', fontSize:13 }}>{m.name}</div>
              <div style={{ fontSize:11, color:'#8b5cf6' }}>{m.relation}</div>
            </div>
            <div style={{ marginLeft:'auto', fontSize:12, fontWeight:700, color:'#64748b' }}>₹{PER_MEMBER_PRICE.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>

      {/* Also show free edits summary if any */}
      {initial.length > 0 && valid.length > newCount && (
        <div style={{ background:'#f0fdf4', border:'1px solid #a7f3d0', borderRadius:12, padding:'10px 14px', fontSize:12, color:'#065f46' }}>
          ✓ Existing {valid.length - newCount} member{valid.length - newCount > 1 ? 's' : ''} will also be updated (no charge)
        </div>
      )}

      {/* Price box */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:'linear-gradient(135deg,#faf5ff,#f5f3ff)', border:'1.5px solid #ddd6fe', borderRadius:14, padding:'14px 18px' }}>
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:'#0f172a', margin:0 }}>Total Due</p>
          <p style={{ fontSize:11.5, color:'#94a3b8', margin:'2px 0 0' }}>₹{PER_MEMBER_PRICE.toLocaleString('en-IN')} × {newCount} person{newCount > 1 ? 's' : ''}</p>
        </div>
        <p style={{ fontSize:22, fontWeight:800, color:'#7c3aed', margin:0 }}>₹{totalDue.toLocaleString('en-IN')}</p>
      </div>

      {error && <p style={{ fontSize:12, color:'#f43f5e', fontWeight:600, margin:0 }}>{error}</p>}

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button onClick={() => { setStep('edit'); setPayLoading(false) }}
          style={{ padding:'9px 18px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:13, fontWeight:700, color:'#64748b', cursor:'pointer' }}>
          Back
        </button>
        <button onClick={handlePay} disabled={payLoading}
          style={{ padding:'9px 22px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#8b5cf6,#7c3aed)', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', opacity: payLoading ? 0.7 : 1, display:'flex', alignItems:'center', gap:8 }}>
          {payLoading
            ? <><span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,0.4)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.7s linear infinite' }} /> Processing…</>
            : <>🔒 Pay ₹{totalDue.toLocaleString('en-IN')}</>}
        </button>
      </div>
    </div>
  )

  /* ── Edit screen ── */
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
      {members.map((m, i) => (
        <div key={i} style={{ border:`1.5px solid ${i >= covered ? '#fde68a' : '#ddd6fe'}`, borderRadius:14, overflow:'hidden' }}>
          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background: i >= covered ? 'linear-gradient(135deg,#fffbeb,#fef3c7)' : 'linear-gradient(135deg,#f5f3ff,#ede9fe)', borderBottom:`1px solid ${i >= covered ? '#fde68a' : '#ddd6fe'}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontSize:11, fontWeight:800, color: i >= covered ? '#d97706' : '#7c3aed', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                {i >= covered ? '⭐ New —' : ''} Member {i + 1}
              </span>
              {i >= covered && (
                <span style={{ fontSize:10, fontWeight:700, color:'#d97706', background:'#fef9c3', border:'1px solid #fde68a', borderRadius:99, padding:'1px 7px' }}>₹{PER_MEMBER_PRICE.toLocaleString('en-IN')}</span>
              )}
            </div>
            <button onClick={() => remove(i)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11.5, fontWeight:700, color:'#f43f5e' }}>Remove</button>
          </div>
          {/* Fields */}
          <div style={{ padding:14, background:'#fff', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Full Name *</label>
              <input value={m.name} onChange={e => update(i, 'name', e.target.value)} placeholder="Legal name"
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, fontWeight:600, color:'#0f172a', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Relation</label>
              <select value={m.relation} onChange={e => update(i, 'relation', e.target.value)}
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, fontWeight:600, color:'#0f172a', outline:'none', background:'#fff', boxSizing:'border-box' }}>
                {RELATIONS.map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Date of Birth</label>
              <input type="date" value={m.dateOfBirth} onChange={e => update(i, 'dateOfBirth', e.target.value)}
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, color:'#0f172a', outline:'none', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:10, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', display:'block', marginBottom:4 }}>Passport No.</label>
              <input value={m.passportNumber} onChange={e => update(i, 'passportNumber', e.target.value)} placeholder="A1234567"
                style={{ width:'100%', border:'1.5px solid #e2e8f0', borderRadius:8, padding:'8px 12px', fontSize:13, fontWeight:600, color:'#0f172a', outline:'none', boxSizing:'border-box' }} />
            </div>
          </div>
        </div>
      ))}

      {/* Add button */}
      <button onClick={add} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', fontSize:12.5, fontWeight:700, color:'#8b5cf6', padding:0 }}>
        <span style={{ width:20, height:20, borderRadius:'50%', border:'1.5px solid #8b5cf6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, lineHeight:1 }}>+</span>
        Add another person
      </button>

      {/* Running cost preview if new members */}
      {newCount > 0 && (
        <div style={{ background:'linear-gradient(135deg,#fffbeb,#fef3c7)', border:'1.5px solid #fde68a', borderRadius:12, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12.5, color:'#92400e', fontWeight:600 }}>
            {newCount} new person{newCount > 1 ? 's' : ''} — payment required
          </span>
          <span style={{ fontSize:14, fontWeight:800, color:'#d97706' }}>₹{totalDue.toLocaleString('en-IN')}</span>
        </div>
      )}

      {error && <p style={{ fontSize:12, color:'#f43f5e', fontWeight:600, margin:0 }}>{error}</p>}

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:4, borderTop:'1px solid #f1f5f9' }}>
        <button onClick={onCancel} style={{ padding:'8px 18px', borderRadius:10, border:'1.5px solid #e2e8f0', background:'#fff', fontSize:13, fontWeight:700, color:'#64748b', cursor:'pointer' }}>
          Cancel
        </button>
        <button onClick={handleContinue} style={{
          padding:'8px 20px', borderRadius:10, border:'none',
          background: newCount > 0 ? 'linear-gradient(135deg,#d97706,#b45309)' : 'linear-gradient(135deg,#8b5cf6,#7c3aed)',
          color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer',
        }}>
          {newCount > 0 ? `Continue → Pay ₹${totalDue.toLocaleString('en-IN')}` : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

export default function ClientStatus() {
  const { user } = useAuth() || {}
  const { activeCaseId, loading: caseLoading } = useClientCase() || {}
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [calendlyUrl, setCalendlyUrl] = useState('')
  const [memberPrice, setMemberPrice] = useState(DEFAULT_MEMBER_PRICE)
  const [editingFamily, setEditingFamily] = useState(false)
  const [showFlagForm, setShowFlagForm] = useState(false)
  const [flagMsg, setFlagMsg] = useState('')
  const [flagSaving, setFlagSaving] = useState(false)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)

  const caseStorageKey = activeCaseId ? `tve_welcome_dismissed_${activeCaseId}` : (user?.id ? `tve_welcome_dismissed_${user.id}` : '')

  useEffect(() => {
    if (caseStorageKey) {
      const isDismissed = localStorage.getItem(caseStorageKey)
      if (isDismissed) setWelcomeDismissed(true)
    }
  }, [caseStorageKey])

  const handleDismissWelcome = () => {
    setWelcomeDismissed(true)
    if (caseStorageKey) {
      localStorage.setItem(caseStorageKey, 'true')
    }
  }

  useEffect(() => {
    if (caseLoading) return
    setLoading(true)
    Promise.all([
      getStatus(activeCaseId).then(r => setData(r.data.data)),
      api.get('/settings/public').then(r => setCalendlyUrl(r.data.data?.calendlyUrl || '')).catch(() => {}),
      api.get('/settings/pricing').then(r => { if (r.data.data?.addMember) setMemberPrice(r.data.data.addMember) }).catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [activeCaseId, caseLoading])

  const handleSaveFamily = async (members, skipApi = false, numberOfApplicants) => {
    if (!skipApi) await updateFamilyMembers(members, activeCaseId)
    setData(d => ({ ...d, familyMembers: members, ...(numberOfApplicants && { numberOfApplicants }) }))
    setEditingFamily(false)
  }

  const handleRaiseFlag = async (e) => {
    e.preventDefault()
    if (!flagMsg.trim()) return
    setFlagSaving(true)
    try {
      await raiseFlag({ flagged: true, message: flagMsg.trim() }, activeCaseId)
      setData(d => ({ ...d, flagged: true, flagMessage: flagMsg.trim() }))
      setShowFlagForm(false); setFlagMsg('')
    } catch { alert('Failed to raise flag. Please try again.') }
    finally { setFlagSaving(false) }
  }

  const handleClearFlag = async () => {
    setFlagSaving(true)
    try {
      await raiseFlag({ flagged: false }, activeCaseId)
      setData(d => ({ ...d, flagged: false, flagMessage: '' }))
    } catch { alert('Failed. Please try again.') }
    finally { setFlagSaving(false) }
  }

  if (loading) return <PageSpinner />
  if (!data) return <div style={{ color:'#f43f5e', padding:20 }}>Could not load your application.</div>

  const { clientStatus, visaType, destinationCountry, travelDate, assignedTo, meetLink, meetScheduledAt, timeline, modules = [], familyMembers = [], flagged, flagMessage } = data
  const showBooking = clientStatus === 'Welcome & Consultation Pending' && !meetLink && calendlyUrl
  const completedCount = timeline.filter((s) => s.isCompleted).length
  const progress = Math.round((completedCount / timeline.length) * 100)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="page-title">My Application</h1>
        <p className="page-subtitle">Track your visa application in real time</p>
      </div>

      {/* ── First-Login Welcome & Onboarding Card ── */}
      {!welcomeDismissed && (
        <div style={{
          background: 'linear-gradient(135deg, #f8faff 0%, #f5f3ff 100%)',
          border: '1.5px solid #c7d2fe',
          borderRadius: 20,
          padding: '24px 26px',
          boxShadow: '0 4px 20px rgba(99, 102, 241, 0.08)',
          position: 'relative',
        }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 14,
                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 22, flexShrink: 0,
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
              }}>
                ✈️
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
                  Welcome to Tourist Visa Experts, {user?.name || data?.name || 'Traveler'}!
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: 13, color: '#64748b' }}>
                  Your visa case is officially active. Here is how our team will guide your application to approval.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissWelcome}
              title="Dismiss welcome card"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #e2e8f0',
                borderRadius: 99,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
                color: '#94a3b8',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s'
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.borderColor = '#cbd5e1' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.borderColor = '#e2e8f0' }}
            >
              Dismiss ×
            </button>
          </div>

          {/* 3 Step Roadmap */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginTop: 18,
          }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e0e7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#e0e7ff', color: '#4338ca', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>Upload Documents</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Submit your passport scan, travel itinerary, and bank proofs in the Documents tab.
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e0e7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dbeafe', color: '#1d4ed8', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>Expert File Review</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                Our specialists verify paperwork, draft custom cover letters, and prepare embassy forms.
              </p>
            </div>

            <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', border: '1px solid #e0e7ff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#dcfce7', color: '#15803d', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b' }}>Embassy Slot & Filing</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
                We book your VFS / Embassy biometric appointment and guide you through the submission.
              </p>
            </div>
          </div>

          {/* Action Footer */}
          <div style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: '1px solid #e0e7ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Assigned Consultant:</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: '#4f46e5', background: '#eef2ff', padding: '3px 10px', borderRadius: 99, border: '1px solid #c7d2fe' }}>
                👤 {assignedTo?.name || 'Senior Visa Desk Assigned'}
              </span>
            </div>
            <Link
              to="/client/documents"
              style={{
                textDecoration: 'none',
                background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                color: '#fff',
                fontSize: 13,
                fontWeight: 700,
                padding: '9px 18px',
                borderRadius: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 10px rgba(79, 70, 229, 0.25)',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              Upload Required Documents →
            </Link>
          </div>
        </div>
      )}

      {/* Hero status banner */}
      <div style={{
        background:'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #8b5cf6 100%)',
        borderRadius:20, padding:'28px 28px', color:'#fff',
        position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'rgba(255,255,255,0.06)' }} />
        <div style={{ position:'absolute', bottom:-30, left:-30, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.04)' }} />

        <div style={{ position:'relative', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
          <div>
            <div style={{ fontSize:12, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(255,255,255,0.65)', marginBottom:8 }}>
              Current Status
            </div>
            <div style={{ fontSize:22, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.2 }}>{clientStatus}</div>
            {visaType && <div style={{ fontSize:14, color:'rgba(255,255,255,0.75)', marginTop:6 }}>
              {visaType} {destinationCountry && <span>→ {destinationCountry}</span>}
            </div>}
            {travelDate && <div style={{ fontSize:12, color:'rgba(255,255,255,0.55)', marginTop:4 }}>
              Travel date: {new Date(travelDate).toLocaleDateString()}
            </div>}
          </div>

          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.12)', borderRadius:16, padding:'16px 24px' }}>
            <div style={{ fontSize:36, fontWeight:800, letterSpacing:'-0.04em' }}>{progress}%</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.7)', fontWeight:500 }}>Complete</div>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ position:'relative', marginTop:20 }}>
          <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:99, height:6 }}>
            <div style={{ background:'#fff', height:6, borderRadius:99, width:`${progress}%`, transition:'width 0.8s ease', boxShadow:'0 0 12px rgba(255,255,255,0.5)' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:6 }}>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{completedCount} stages completed</span>
            <span style={{ fontSize:11, color:'rgba(255,255,255,0.5)' }}>{timeline.length} total</span>
          </div>
        </div>
      </div>

      {/* ── Flag Banner ── */}
      {flagged ? (
        <div style={{ background:'linear-gradient(135deg,#fff7ed,#fef3c7)', border:'2px solid #f97316', borderRadius:16, padding:'18px 22px', display:'flex', alignItems:'flex-start', gap:16 }}>
          <div style={{ width:44, height:44, borderRadius:14, background:'#f97316', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="#fff" strokeWidth="2"/></svg>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:15, color:'#c2410c', marginBottom:4 }}>Issue Flagged</div>
            <div style={{ fontSize:13.5, color:'#92400e', lineHeight:1.6 }}>{flagMessage}</div>
            <div style={{ fontSize:11.5, color:'#b45309', marginTop:6 }}>Our team has been notified and will look into this shortly.</div>
          </div>
          <button
            onClick={handleClearFlag}
            disabled={flagSaving}
            style={{ padding:'7px 16px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', background:'#fff', color:'#f97316', border:'1.5px solid #f97316', flexShrink:0 }}
          >
            {flagSaving ? '...' : 'Clear Flag'}
          </button>
        </div>
      ) : (
        <div style={{ background:'#fff', borderRadius:16, border: showFlagForm ? '2px solid #f97316' : '1.5px solid #fed7aa', padding: showFlagForm ? '18px 22px' : '14px 20px' }}>
          {showFlagForm ? (
            <form onSubmit={handleRaiseFlag}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#fff7ed', border:'1.5px solid #fed7aa', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#f97316" stroke="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="#f97316" strokeWidth="2"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:'#c2410c' }}>Raise a Flag</div>
                  <div style={{ fontSize:12, color:'#94a3b8' }}>Tell us what's wrong — we'll resolve it ASAP</div>
                </div>
              </div>
              <textarea
                className="input"
                rows={3}
                required
                placeholder="Describe the issue (e.g. 'Team has not contacted me for Stage 3', 'My documents are stuck'...)"
                value={flagMsg}
                onChange={e => setFlagMsg(e.target.value)}
                style={{ resize:'vertical', marginBottom:12 }}
              />
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => { setShowFlagForm(false); setFlagMsg('') }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={flagSaving || !flagMsg.trim()} style={{ background:'#f97316' }}>
                  {flagSaving ? 'Sending...' : 'Raise Flag'}
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#f97316" stroke="none"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15" stroke="#f97316" strokeWidth="2"/></svg>
                <span style={{ fontSize:13.5, color:'#78716c', fontWeight:500 }}>Facing an issue with your current stage?</span>
              </div>
              <button
                onClick={() => setShowFlagForm(true)}
                style={{ padding:'7px 16px', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', background:'#fff7ed', color:'#f97316', border:'1.5px solid #fed7aa', flexShrink:0 }}
              >
                Raise a Flag
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:20 }}>
        {/* Timeline — vertical step boxes */}
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a', letterSpacing:'-0.02em', marginBottom:4 }}>Application Timeline</h2>
          <p style={{ fontSize:12.5, color:'#94a3b8', marginBottom:20 }}>Your visa journey, step by step</p>

          <div style={{ position:'relative', display:'flex', flexDirection:'column', gap:10 }}>
            {timeline.map((stage, idx) => {
              const state = stage.isCompleted ? 'done' : stage.isCurrent ? 'current' : 'todo'
              const theme = {
                done:    { box:'#f0fdf4', border:'#bbf7d0', num:'#16a34a', numText:'#fff', title:'#15803d' },
                current: { box:'#f5f3ff', border:'#c4b5fd', num:'#8b5cf6', numText:'#fff', title:'#6d28d9' },
                todo:    { box:'#fff',    border:'#eef2f7', num:'#f1f5f9', numText:'#94a3b8', title:'#475569' },
              }[state]
              return (
                <div key={stage.stageKey} style={{ display:'flex', gap:14, alignItems:'stretch' }}>
                  {/* Left rail: number + connector */}
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', width:32, flexShrink:0 }}>
                    <div style={{
                      width:32, height:32, borderRadius:'50%', flexShrink:0,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:13, fontWeight:800,
                      background: theme.num, color: theme.numText,
                      border: state==='current' ? '2px solid #8b5cf6' : 'none',
                      boxShadow: state==='current' ? '0 0 0 4px rgba(139,92,246,0.15)' : 'none',
                    }}>
                      {state==='done' ? (
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                      ) : stage.order}
                    </div>
                    {idx < timeline.length - 1 && (
                      <div style={{ width:2, flex:1, minHeight:14, background: stage.isCompleted ? '#bbf7d0' : '#eef2f7', marginTop:4 }} />
                    )}
                  </div>

                  {/* Step box */}
                  <div style={{
                    flex:1, marginBottom:idx < timeline.length-1 ? 0 : 0,
                    background: theme.box, border:`1.5px solid ${theme.border}`,
                    borderRadius:14, padding:'13px 16px',
                    opacity: state==='todo' ? 0.85 : 1,
                    boxShadow: state==='current' ? '0 2px 12px rgba(139,92,246,0.1)' : 'none',
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:13.5, fontWeight:700, color: theme.title }}>
                        {stage.stageName}
                      </span>
                      {state==='current' && (
                        <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:'#fff', color:'#8b5cf6', border:'1px solid #c4b5fd' }}>
                          In Progress
                        </span>
                      )}
                      {state==='done' && (
                        <span style={{ padding:'2px 9px', borderRadius:99, fontSize:10, fontWeight:700, background:'#fff', color:'#16a34a', border:'1px solid #bbf7d0' }}>
                          ✓ Done
                        </span>
                      )}
                    </div>
                    {stage.description && (
                      <p style={{ fontSize:12, color: state==='todo' ? '#94a3b8' : '#64748b', lineHeight:1.55, margin:'5px 0 0' }}>
                        {stage.description}
                      </p>
                    )}
                    {stage.completedAt && (
                      <div style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>
                        Completed {new Date(stage.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Calendly self-booking card — shown when welcome call not yet scheduled */}
          {showBooking && (
            <div style={{
              background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)',
              borderRadius: 18, border: '1.5px solid #a7f3d0', padding: 20,
              boxShadow: '0 4px 16px rgba(16,185,129,0.1)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#d1fae5', border:'1px solid #a7f3d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>📅</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#064e3b' }}>Book Your Welcome Call</div>
                  <div style={{ fontSize:11.5, color:'#047857', marginTop:1 }}>Pick a time that works for you</div>
                </div>
              </div>
              <p style={{ fontSize:12.5, color:'#065f46', lineHeight:1.6, margin:'0 0 14px' }}>
                Our team is ready for your welcome consultation. Choose any available slot — even if it's midnight.
              </p>
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                  background:'linear-gradient(135deg,#10b981,#059669)',
                  color:'#fff', borderRadius:10, padding:'11px',
                  textDecoration:'none', fontSize:13, fontWeight:700,
                  boxShadow:'0 4px 12px rgba(16,185,129,0.35)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Schedule Now →
              </a>
            </div>
          )}

          {/* Consultant */}
          {assignedTo && (
            <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:14, letterSpacing:'-0.01em' }}>Your Consultant</h3>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:44, height:44, borderRadius:14,
                  background:'linear-gradient(135deg,#d1fae5,#ecfdf5)',
                  border:'1px solid #a7f3d0',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:18, fontWeight:800, color:'#059669', flexShrink:0,
                }}>
                  {assignedTo.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{assignedTo.name}</div>
                  <div style={{ color:'#94a3b8', fontSize:12 }}>{assignedTo.email}</div>
                  {assignedTo.phone && <div style={{ color:'#cbd5e1', fontSize:11 }}>{assignedTo.phone}</div>}
                </div>
              </div>
            </div>
          )}

          {/* Meeting */}
          {meetLink && (
            <div style={{ background:'linear-gradient(135deg,#eff6ff,#f0f9ff)', borderRadius:18, border:'1px solid #bfdbfe', padding:20 }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:'#1e40af', marginBottom:10 }}>Upcoming Meeting</h3>
              {meetScheduledAt && (
                <div style={{ fontSize:13, color:'#1d4ed8', fontWeight:500, marginBottom:12 }}>
                  {new Date(meetScheduledAt).toLocaleString()}
                </div>
              )}
              <a href={meetLink} target="_blank" rel="noopener noreferrer" style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                background:'#2563eb', color:'#fff', borderRadius:10, padding:'10px',
                textDecoration:'none', fontSize:13, fontWeight:700,
                boxShadow:'0 4px 12px rgba(37,99,235,0.3)',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/></svg>
                Join Google Meet
              </a>
            </div>
          )}

          {/* Independent modules — run in parallel with the timeline */}
          {modules.length > 0 && (
            <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:4 }}>Running in Parallel</h3>
              <p style={{ fontSize:11.5, color:'#94a3b8', marginBottom:14 }}>These happen alongside your main steps</p>
              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {modules.map((m) => {
                  const pct = m.total ? Math.round((m.done / m.total) * 100) : 0
                  const isAppt = m.icon === 'calendar' || m.key === 'APPOINTMENT_MODULE'
                  const accent = isAppt ? '#8b5cf6' : '#2563eb'
                  const accentBg = isAppt ? '#f5f3ff' : '#eff6ff'
                  const accentBorder = isAppt ? '#ddd6fe' : '#bfdbfe'
                  return (
                    <div key={m.key} style={{ background:accentBg, border:`1px solid ${accentBorder}`, borderRadius:14, padding:'13px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:6 }}>
                        <div style={{ width:30, height:30, borderRadius:9, flexShrink:0, background:'#fff', border:`1px solid ${accentBorder}`, display:'flex', alignItems:'center', justifyContent:'center', color:accent }}>
                          {isAppt ? (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          ) : (
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Z"/><path d="M9 7h6M9 11h6M9 15h3"/></svg>
                          )}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12.5, fontWeight:700, color:'#0f172a' }}>{m.name}</div>
                        </div>
                        {m.isComplete && (
                          <span style={{ fontSize:10, fontWeight:700, color:accent, background:'#fff', border:`1px solid ${accentBorder}`, borderRadius:99, padding:'2px 8px' }}>✓ Done</span>
                        )}
                      </div>
                      {m.info && <p style={{ fontSize:11, color:'#64748b', lineHeight:1.5, margin:'0 0 9px' }}>{m.info}</p>}
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <div style={{ flex:1, height:5, background:'#fff', borderRadius:99, overflow:'hidden', border:`1px solid ${accentBorder}` }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:accent, borderRadius:99, transition:'width 0.5s' }} />
                        </div>
                        <span style={{ fontSize:10.5, fontWeight:700, color:accent, flexShrink:0 }}>{m.done}/{m.total}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Status card */}
          <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:12 }}>Current Status</h3>
            <StatusBadge status={clientStatus} />
          </div>
        </div>
      </div>

      {/* Family Members */}
      <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:24, boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
          <div>
            <h2 style={{ fontSize:15, fontWeight:700, color:'#0f172a', letterSpacing:'-0.02em', margin:0 }}>Family / Friends</h2>
            <p style={{ fontSize:12.5, color:'#94a3b8', margin:'4px 0 0' }}>Co-applicants on this visa application</p>
          </div>
          {!editingFamily && (
            <button onClick={() => setEditingFamily(true)} style={{
              padding:'7px 16px', borderRadius:10, border:'1.5px solid #ddd6fe',
              background:'#f5f3ff', fontSize:12.5, fontWeight:700, color:'#7c3aed',
              cursor:'pointer', display:'flex', alignItems:'center', gap:6,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              {familyMembers.length > 0 ? 'Edit' : 'Add Members'}
            </button>
          )}
        </div>

        <div style={{ marginTop:20 }}>
          {editingFamily ? (
            <FamilyEditor
              initial={familyMembers}
              onSave={handleSaveFamily}
              onCancel={() => setEditingFamily(false)}
              clientId={activeCaseId}
              paidCoApplicants={Math.max(0, (data.numberOfApplicants || 1) - 1)}
              pricePerMember={memberPrice}
            />
          ) : familyMembers.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'#cbd5e1' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>👨‍👩‍👧‍👦</div>
              <p style={{ fontWeight:600, color:'#94a3b8', fontSize:13.5, margin:0 }}>No co-applicants added yet</p>
              <p style={{ fontSize:12, color:'#cbd5e1', marginTop:4 }}>
                Applying with family or friends? Add them so our team can process everyone together.
              </p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
              {familyMembers.map((m, i) => (
                <div key={i} style={{
                  background:'linear-gradient(135deg,#f5f3ff,#ede9fe)',
                  border:'1.5px solid #ddd6fe', borderRadius:16, padding:'16px 18px',
                  display:'flex', flexDirection:'column', gap:6,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div style={{
                      width:38, height:38, borderRadius:12, flexShrink:0,
                      background:'linear-gradient(135deg,#8b5cf6,#7c3aed)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'#fff', fontWeight:800, fontSize:16,
                    }}>
                      {m.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{m.name}</div>
                      {m.relation && <div style={{ fontSize:11, color:'#8b5cf6', fontWeight:600, marginTop:1 }}>{m.relation}</div>}
                    </div>
                  </div>
                  {m.dateOfBirth && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748b' }}>
                      <span style={{ color:'#a78bfa' }}>◆</span> DOB: {m.dateOfBirth}
                    </div>
                  )}
                  {m.passportNumber && (
                    <div style={{ fontSize:11.5, color:'#6d28d9', fontWeight:600, background:'#ede9fe', borderRadius:8, padding:'3px 10px', width:'fit-content' }}>
                      {m.passportNumber}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getClients, createClient, getTeam, assignClient } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'
import Modal from '../../components/shared/Modal'
import EmptyState from '../../components/shared/EmptyState'

const CLIENT_STATUSES = [
  'Welcome & Consultation Pending','Profile Assessment','Documents Requested',
  'Documents Under Review','Appointment In Progress','Application Preparation',
  'Documents Ready','Appointment Completed','Visa Under Process',
  'Visa Approved','Visa Declined','Feedback & Testimonial','Completed',
]

const TABS = [
  { key: 'all', label: 'All Clients' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'free', label: 'Free / Unpurchased' },
]

export default function AdminClients() {
  const [clients, setClients] = useState([])
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [tab, setTab] = useState('all')
  const [createModal, setCreateModal] = useState(false)
  const [assignModal, setAssignModal] = useState(null)
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', visaType:'', destinationCountry:'' })
  const [assignTo, setAssignTo] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchClients = () => {
    setLoading(true)
    const params = {}
    if (statusFilter) params.status = statusFilter
    if (search) params.search = search
    if (tab === 'purchased') params.purchased = 'true'
    if (tab === 'free') params.purchased = 'false'
    getClients(params).then((r) => setClients(r.data.data || [])).finally(() => setLoading(false))
  }

  useEffect(() => { fetchClients() }, [statusFilter, tab])
  useEffect(() => { getTeam().then((r) => setTeam(r.data.data || [])) }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await createClient(form)
      setCreateModal(false)
      setForm({ name:'', email:'', phone:'', password:'', visaType:'', destinationCountry:'' })
      fetchClients()
    } catch (err) { setError(err.response?.data?.message || 'Failed to create client') }
    finally { setSaving(false) }
  }

  const handleAssign = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await assignClient(assignModal._id, assignTo); setAssignModal(null); fetchClients() }
    catch (err) { setError(err.response?.data?.message || 'Failed to assign') }
    finally { setSaving(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Clients</h1>
          <p className="page-subtitle">{clients.length} total clients</p>
        </div>
        <button className="btn-primary" onClick={() => setCreateModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Client
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, background:'#f8fafc', borderRadius:12, padding:4, border:'1px solid #f1f5f9', width:'fit-content' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600,
            background: tab === t.key ? '#fff' : 'transparent',
            color: tab === t.key ? '#0f172a' : '#64748b',
            boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
            transition:'all 0.15s',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ position:'relative', flex:1, minWidth:200 }}>
          <svg style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color: '#64748b' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={{ paddingLeft:36 }}
            className="input"
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchClients()}
          />
        </div>
        {tab !== 'purchased' && (
          <select className="input" style={{ width:220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        )}
        <button className="btn-secondary" onClick={fetchClients}>Search</button>
      </div>

      {/* Table */}
      {loading ? <PageSpinner /> : clients.length === 0 ? (
        <EmptyState icon="👥" title="No clients found" description="Create your first client to get started" />
      ) : (
        <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
            <thead>
              <tr style={{ background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
                {(tab === 'purchased'
                  ? ['Client','Package','Payment ID','Purchase Date','Status','Assigned To','Actions']
                  : ['Client','Visa / Country','Status','Assigned To','Access','Actions']
                ).map(h => (
                  <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c._id} style={{ borderBottom: i < clients.length-1 ? '1px solid #f8fafc' : 'none', transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fafbfc'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{
                        width:34, height:34, borderRadius:10,
                        background: c.isPurchased ? 'linear-gradient(135deg,#fef3c7,#fffbeb)' : 'linear-gradient(135deg,#dbeafe,#eff6ff)',
                        border: c.isPurchased ? '1px solid #fcd34d' : '1px solid #bfdbfe',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:13, fontWeight:700, color: c.isPurchased ? '#d97706' : '#3b82f6', flexShrink:0,
                      }}>
                        {c.user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ fontWeight:600, color:'#0f172a' }}>{c.user?.name}</span>
                          {c.flagged && (
                            <span title={c.flagMessage || 'Issue flagged'} style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:99, fontSize:10.5, fontWeight:700, background:'#fff7ed', color:'#f97316', border:'1px solid #fed7aa' }}>
                              <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
                              Flag
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#64748b', fontSize:12 }}>{c.user?.email}</div>
                        {c.user?.phone && <div style={{ color: '#64748b', fontSize:11 }}>{c.user?.phone}</div>}
                      </div>
                    </div>
                  </td>

                  {tab === 'purchased' ? (
                    <>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{ background:'#fef3c7', color:'#92400e', fontSize:12, fontWeight:600, padding:'3px 8px', borderRadius:6 }}>
                          {c.packageType || 'Complete'}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        {c.paymentId ? (
                          <span style={{ fontFamily:'monospace', fontSize:11, color:'#475569', background:'#f8fafc', padding:'2px 6px', borderRadius:4 }}>
                            {c.paymentId}
                          </span>
                        ) : (
                          <span style={{ color: '#64748b', fontSize:12 }}>Manual grant</span>
                        )}
                      </td>
                      <td style={{ padding:'14px 16px', color:'#334155', fontSize:12 }}>
                        {c.updatedAt ? new Date(c.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                      </td>
                      <td style={{ padding:'14px 16px' }}><StatusBadge status={c.clientStatus} /></td>
                      <td style={{ padding:'14px 16px', color:'#334155' }}>
                        {c.assignedTo?.name || <span style={{ color: '#64748b', fontStyle:'italic' }}>Unassigned</span>}
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ fontWeight:500, color:'#334155' }}>{c.visaType || '—'}</div>
                        <div style={{ color: '#64748b', fontSize:12 }}>{c.destinationCountry || ''}</div>
                      </td>
                      <td style={{ padding:'14px 16px' }}><StatusBadge status={c.clientStatus} /></td>
                      <td style={{ padding:'14px 16px', color:'#334155' }}>
                        {c.assignedTo?.name || <span style={{ color: '#64748b', fontStyle:'italic' }}>Unassigned</span>}
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <span style={{
                          fontSize:11.5, fontWeight:600, padding:'3px 8px', borderRadius:6,
                          background: c.isPurchased ? '#f0fdf4' : '#fef9c3',
                          color: c.isPurchased ? '#16a34a' : '#92400e',
                        }}>
                          {c.isPurchased ? 'Purchased' : 'Free'}
                        </span>
                      </td>
                    </>
                  )}

                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <Link to={`/admin/clients/${c._id}`} style={{
                        fontSize:12, fontWeight:600, color:'#3b82f6', textDecoration:'none',
                        padding:'4px 10px', borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe',
                        transition:'all 0.15s',
                      }}>View</Link>
                      <button onClick={() => { setAssignModal(c); setAssignTo(c.assignedTo?._id || '') }}
                        style={{
                          fontSize:12, fontWeight:600, color:'#0f172a', border:'1px solid #e2e8f0',
                          padding:'4px 10px', borderRadius:6, background:'#fff', cursor:'pointer',
                          transition:'all 0.15s',
                        }}>Assign</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createModal} onClose={() => { setCreateModal(false); setError('') }} title="Create New Client" size="lg">
        {error && <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:10, padding:'10px 14px', color:'#f43f5e', fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[['name','Full Name','text',true],['email','Email','email',true],['phone','Phone','text',false],['password','Password','password',true],['visaType','Visa Type','text',false],['destinationCountry','Destination Country','text',false]].map(([key,label,type,req]) => (
            <div key={key}>
              <label className="label">{label} {req && <span style={{ color:'#f43f5e' }}>*</span>}</label>
              <input type={type} className="input" required={req} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} placeholder={key === 'visaType' ? 'e.g. Schengen Tourist' : key === 'destinationCountry' ? 'e.g. Germany' : ''} />
            </div>
          ))}
          <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button type="button" className="btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Client'}</button>
          </div>
        </form>
      </Modal>

      {/* Assign Modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={`Assign: ${assignModal?.user?.name}`}>
        <form onSubmit={handleAssign} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Team Member</label>
            <select className="input" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} required>
              <option value="">Select team member</option>
              {team.map((t) => <option key={t._id} value={t._id}>{t.name} — {t.email}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Assign'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

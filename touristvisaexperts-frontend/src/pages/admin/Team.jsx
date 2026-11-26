import { useState, useEffect } from 'react'
import { getTeam, createTeamMember, toggleTeamStatus } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import Modal from '../../components/shared/Modal'
import EmptyState from '../../components/shared/EmptyState'

export default function AdminTeam() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', phone:'', password:'', role:'team' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => getTeam().then((r) => setTeam(r.data.data || [])).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault(); setError(''); setSaving(true)
    try {
      await createTeamMember(form)
      setModal(false)
      setForm({ name:'', email:'', phone:'', password:'', role:'team' })
      load()
    } catch (err) { setError(err.response?.data?.message || 'Failed to create') }
    finally { setSaving(false) }
  }

  const handleToggle = async (id) => { await toggleTeamStatus(id); load() }

  if (loading) return <PageSpinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Team Members</h1>
          <p className="page-subtitle">{team.filter(m => m.role === 'team').length} consultants · {team.filter(m => m.role === 'manager').length} managers</p>
        </div>
        <button className="btn-primary" onClick={() => setModal(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Member
        </button>
      </div>

      {team.length === 0 ? (
        <EmptyState icon="👥" title="No team members yet" description="Add your first consultant to get started" />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {team.map((m) => (
            <div key={m._id} style={{
              background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20,
              boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
              display:'flex', flexDirection:'column', gap:12,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background:'linear-gradient(135deg,#d1fae5,#ecfdf5)',
                    border:'1px solid #a7f3d0',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, fontWeight:800, color:'#059669', flexShrink:0,
                  }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{m.name}</div>
                    <div style={{ color: '#64748b', fontSize:12 }}>{m.email}</div>
                    {m.phone && <div style={{ color: '#64748b', fontSize:11, marginTop:1 }}>{m.phone}</div>}
                  </div>
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
                  <span style={{
                    padding:'3px 8px', borderRadius:99, fontSize:11, fontWeight:700,
                    background: m.isActive ? '#dcfce7' : '#fee2e2',
                    color: m.isActive ? '#16a34a' : '#dc2626',
                    border: `1px solid ${m.isActive ? '#bbf7d0' : '#fecaca'}`,
                  }}>
                    {m.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{
                    padding:'2px 7px', borderRadius:99, fontSize:10, fontWeight:700,
                    background: m.role === 'manager' ? '#fef3c7' : '#eff6ff',
                    color: m.role === 'manager' ? '#d97706' : '#3b82f6',
                    border: `1px solid ${m.role === 'manager' ? '#fde68a' : '#bfdbfe'}`,
                  }}>
                    {m.role === 'manager' ? 'Manager' : 'Team'}
                  </span>
                </div>
              </div>

              <div style={{ borderTop:'1px solid #f8fafc', paddingTop:12 }}>
                <button
                  onClick={() => handleToggle(m._id)}
                  style={{
                    width:'100%', padding:'7px', borderRadius:8,
                    fontSize:12, fontWeight:600, cursor:'pointer',
                    border: `1px solid ${m.isActive ? '#fecaca' : '#bbf7d0'}`,
                    background: m.isActive ? '#fff1f2' : '#f0fdf4',
                    color: m.isActive ? '#dc2626' : '#16a34a',
                    transition:'all 0.15s',
                  }}
                >
                  {m.isActive ? 'Deactivate Account' : 'Activate Account'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => { setModal(false); setError('') }} title="Add Team Member">
        {error && <div style={{ background:'#fff1f2', border:'1px solid #fecdd3', borderRadius:10, padding:'10px 14px', color:'#f43f5e', fontSize:13, marginBottom:16 }}>{error}</div>}
        <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          {[['name','Full Name','text',true],['email','Email','email',true],['phone','Phone','tel',false],['password','Password','password',true]].map(([key,label,type,req]) => (
            <div key={key}>
              <label className="label">{label} {req && <span style={{ color:'#f43f5e' }}>*</span>}</label>
              <input
                type={type}
                className="input"
                required={req}
                minLength={key==='password'?8:undefined}
                maxLength={key === 'phone' ? 10 : undefined}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: key === 'phone' ? e.target.value.replace(/\D/g, '').slice(0, 10) : e.target.value })}
                placeholder={key === 'phone' ? '10-digit phone number' : ''}
              />
            </div>
          ))}
          <div>
            <label className="label">Role <span style={{ color:'#f43f5e' }}>*</span></label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="team">Team Member</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, paddingTop:4 }}>
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Adding...' : 'Add Member'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

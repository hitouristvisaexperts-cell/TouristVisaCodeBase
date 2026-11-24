import { useState, useEffect } from 'react'
import { getTeam } from '../../api/manager'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'

export default function ManagerTeam() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { getTeam().then((r) => setTeam(r.data.data || [])).finally(() => setLoading(false)) }, [])

  if (loading) return <PageSpinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="page-title">Team Members</h1>
        <p className="page-subtitle">{team.length} consultants</p>
      </div>

      {team.length === 0 ? (
        <EmptyState icon="👥" title="No team members yet" description="Ask admin to add team members" />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {team.map((m) => (
            <div key={m._id} style={{
              background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20,
              boxShadow:'0 1px 4px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', gap:12,
            }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background:'linear-gradient(135deg,#fef3c7,#fffbeb)', border:'1px solid #fcd34d',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:16, fontWeight:800, color:'#d97706', flexShrink:0,
                  }}>
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{m.name}</div>
                    <div style={{ color: '#64748b', fontSize:12 }}>{m.email}</div>
                    {m.phone && <div style={{ color: '#64748b', fontSize:11, marginTop:1 }}>{m.phone}</div>}
                  </div>
                </div>
                <span style={{
                  padding:'3px 8px', borderRadius:99, fontSize:11, fontWeight:700,
                  background: m.isActive ? '#dcfce7' : '#fee2e2',
                  color: m.isActive ? '#16a34a' : '#dc2626',
                  border: `1px solid ${m.isActive ? '#bbf7d0' : '#fecaca'}`,
                }}>
                  {m.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{ fontSize:12, color: '#64748b', paddingTop:4, borderTop:'1px solid #f8fafc' }}>
                <span style={{ color:'#475569', fontWeight:600 }}>Role:</span> Team Member
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

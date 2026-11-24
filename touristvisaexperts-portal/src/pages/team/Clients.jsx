import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getMyClients } from '../../api/team'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'
import EmptyState from '../../components/shared/EmptyState'

const CLIENT_STATUSES = [
  'Welcome & Consultation Pending','Profile Assessment','Documents Requested',
  'Documents Under Review','Appointment In Progress','Application Preparation',
  'Documents Ready','Appointment Completed','Visa Under Process',
  'Visa Approved','Visa Declined','Feedback & Testimonial','Completed',
]

export default function TeamClients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = statusFilter ? { status: statusFilter } : {}
    getMyClients(params).then((r) => setClients(r.data.data || [])).finally(() => setLoading(false))
  }, [statusFilter])

  const filtered = search
    ? clients.filter(c =>
        c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.email?.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  if (loading) return <PageSpinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="page-title">My Clients</h1>
          <p className="page-subtitle">{clients.length} assigned to you</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color: '#64748b' }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="input" style={{ paddingLeft:32, width:180 }} placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width:200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {CLIENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState title={search || statusFilter ? 'No clients match filters' : 'No clients assigned'} description="No clients have been assigned to you yet" />
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
          {filtered.map((c) => (
            <Link key={c._id} to={`/team/clients/${c._id}`} style={{ textDecoration:'none' }}>
              <div style={{
                background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', padding:20,
                boxShadow:'0 1px 4px rgba(0,0,0,0.04)',
                transition:'all 0.2s ease', cursor:'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.1)'; e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.borderColor='#e2e8f0' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform='none'; e.currentTarget.style.borderColor='#f1f5f9' }}
              >
                {/* Top row */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
                  <div style={{
                    width:44, height:44, borderRadius:14,
                    background:'linear-gradient(135deg,#d1fae5,#ecfdf5)',
                    border:'1px solid #a7f3d0',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:18, fontWeight:800, color:'#059669',
                  }}>
                    {c.user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    {c.flagged && (
                      <span title={c.flagMessage || 'Client raised an issue'} style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 9px', borderRadius:99, fontSize:11, fontWeight:700, background:'#fff7ed', color:'#f97316', border:'1.5px solid #fed7aa' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/></svg>
                        Issue
                      </span>
                    )}
                    <StatusBadge status={c.clientStatus} />
                  </div>
                </div>

                {/* Name & email */}
                <div style={{ fontWeight:700, color:'#0f172a', fontSize:15, letterSpacing:'-0.02em' }}>{c.user?.name}</div>
                <div style={{ color: '#64748b', fontSize:12.5, marginTop:2 }}>{c.user?.email}</div>
                {c.user?.phone && <div style={{ color: '#64748b', fontSize:11.5, marginTop:1 }}>{c.user?.phone}</div>}

                {/* Footer */}
                <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f8fafc' }}>
                  <div style={{ fontSize:12.5, color:'#64748b', fontWeight:500 }}>
                    {c.visaType || 'No visa type'} {c.destinationCountry && <span style={{ color: '#64748b' }}>→ {c.destinationCountry}</span>}
                  </div>
                  <div style={{ fontSize:11.5, color: '#64748b', marginTop:4 }}>
                    Updated {new Date(c.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getAuditLogs } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'

const ACTION_STYLES = {
  LOGIN:               { bg:'#eff6ff', color:'#3b82f6', border:'#bfdbfe' },
  CREATE_CLIENT:       { bg:'#f0fdf4', color:'#16a34a', border:'#bbf7d0' },
  STATUS_UPDATED:      { bg:'#faf5ff', color:'#9333ea', border:'#e9d5ff' },
  MANUAL_STATUS_UPDATE:{ bg:'#fff7ed', color:'#ea580c', border:'#fed7aa' },
  ASSIGN_CLIENT:       { bg:'#f0fdfa', color:'#0d9488', border:'#99f6e4' },
  CREATE_TEAM_MEMBER:  { bg:'#eef2ff', color:'#4f46e5', border:'#c7d2fe' },
  CHANGE_PASSWORD:     { bg:'#fefce8', color:'#ca8a04', border:'#fef08a' },
}

export default function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    setLoading(true)
    getAuditLogs({ page, limit:50 })
      .then((r) => { setLogs(r.data.data || []); setTotal(r.data.total || 0) })
      .finally(() => setLoading(false))
  }, [page])

  if (loading) return <PageSpinner />

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="page-title">Audit Logs</h1>
        <p className="page-subtitle">{total} total events recorded</p>
      </div>

      <div style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13.5 }}>
          <thead>
            <tr style={{ background:'#f8fafc', borderBottom:'1px solid #f1f5f9' }}>
              {['Time','Action','Performed By','Description'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'12px 16px', fontSize:11, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => {
              const style = ACTION_STYLES[log.action] || { bg:'#f8fafc', color:'#64748b', border:'#e2e8f0' }
              return (
                <tr key={log._id} style={{ borderBottom: i < logs.length-1 ? '1px solid #f8fafc' : 'none' }}
                  onMouseEnter={e => e.currentTarget.style.background='#fafbfc'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'14px 16px', color:'#64748b', fontSize:12, whiteSpace:'nowrap' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{
                      display:'inline-flex', alignItems:'center',
                      padding:'3px 10px', borderRadius:99, fontSize:11, fontWeight:700,
                      background: style.bg, color: style.color, border:`1px solid ${style.border}`,
                      letterSpacing:'0.02em',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ fontWeight:600, color:'#0f172a', fontSize:13 }}>{log.performedBy?.name}</div>
                    <div style={{ color: '#64748b', fontSize:11, textTransform:'capitalize' }}>{log.performedBy?.role}</div>
                  </td>
                  <td style={{ padding:'14px 16px', color:'#64748b', maxWidth:320 }}>{log.description}</td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {logs.length === 0 && (
          <div style={{ padding:'48px', textAlign:'center', color: '#64748b', fontSize:13 }}>No audit logs found</div>
        )}
      </div>

      {total > 50 && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:12 }}>
          <button className="btn-secondary" disabled={page===1} onClick={() => setPage(p => p-1)}>← Previous</button>
          <span style={{ fontSize:13, color:'#64748b', fontWeight:500 }}>Page {page} of {Math.ceil(total/50)}</span>
          <button className="btn-secondary" disabled={page*50>=total} onClick={() => setPage(p => p+1)}>Next →</button>
        </div>
      )}
    </div>
  )
}

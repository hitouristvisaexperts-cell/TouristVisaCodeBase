import { useState, useEffect } from 'react'
import { getFAQs } from '../../api/client'
import { PageSpinner } from '../../components/shared/Spinner'

const CAT_COLORS = {
  'Booking Appointment': '#3b82f6', 'Travel Insurance': '#10b981', 'Flights': '#6366f1',
  'Hotel Accommodation': '#f59e0b', 'Before Appointment': '#8b5cf6', 'After Appointment': '#ec4899', 'Every Category': '#64748b',
}

export default function ClientFAQs() {
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [openItem, setOpenItem] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    getFAQs().then((r) => setGrouped(r.data.data || {})).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const filteredGrouped = Object.entries(grouped).reduce((acc, [cat, items]) => {
    const filtered = items.filter(
      (item) =>
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        (item.answer || '').toLowerCase().includes(search.toLowerCase())
    )
    if (filtered.length > 0) acc[cat] = filtered
    return acc
  }, {})

  const totalFAQs = Object.values(grouped).reduce((a, b) => a + b.length, 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <h1 className="page-title">FAQs</h1>
        <p className="page-subtitle">{totalFAQs} frequently asked questions</p>
      </div>

      {/* Search */}
      <div style={{ position:'relative', maxWidth:440 }}>
        <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input
          className="input"
          style={{ paddingLeft:40 }}
          placeholder="Search FAQs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {Object.keys(filteredGrouped).length === 0 ? (
        <div style={{ textAlign:'center', padding:'48px 24px', color:'#94a3b8', fontSize:14 }}>
          No FAQs found{search && ` for "${search}"`}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {Object.entries(filteredGrouped).map(([cat, items]) => {
            const color = CAT_COLORS[cat] || '#64748b'
            return (
              <div key={cat} style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
                {/* Category header */}
                <div style={{ padding:'16px 20px', borderBottom:'1px solid #f8fafc', display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', background:color }} />
                  <span style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{cat}</span>
                  <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:`${color}14`, color }}>
                    {items.length}
                  </span>
                </div>

                {/* FAQ accordion */}
                <div style={{ padding:'8px 12px' }}>
                  {items.map((item) => {
                    const isOpen = openItem === item.id
                    return (
                      <div key={item.id} style={{
                        borderRadius:10, marginBottom:4,
                        border: isOpen ? `1px solid ${color}22` : '1px solid transparent',
                        background: isOpen ? `${color}06` : 'transparent',
                        transition:'all 0.15s',
                      }}>
                        <button
                          onClick={() => setOpenItem(isOpen ? null : item.id)}
                          style={{
                            width:'100%', display:'flex', alignItems:'flex-start', justifyContent:'space-between',
                            gap:12, padding:'13px 14px', textAlign:'left',
                            background:'none', border:'none', cursor:'pointer', fontFamily:'var(--font-sans)',
                          }}
                        >
                          <span style={{ fontSize:13.5, fontWeight:600, color:'#334155', lineHeight:1.4, flex:1 }}>
                            {item.question}
                          </span>
                          <span style={{
                            width:22, height:22, borderRadius:6, flexShrink:0,
                            background: isOpen ? `${color}14` : '#f1f5f9',
                            display:'flex', alignItems:'center', justifyContent:'center',
                            color: isOpen ? color : '#94a3b8', transition:'all 0.2s',
                            transform: isOpen ? 'rotate(180deg)' : 'none',
                          }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
                          </span>
                        </button>

                        {isOpen && (
                          <div style={{ padding:'0 14px 14px', fontSize:13.5, color:'#64748b', lineHeight:1.65 }}>
                            {item.answer || (
                              <span style={{ fontStyle:'italic', color:'#94a3b8' }}>
                                Answer coming soon. Please contact your consultant.
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

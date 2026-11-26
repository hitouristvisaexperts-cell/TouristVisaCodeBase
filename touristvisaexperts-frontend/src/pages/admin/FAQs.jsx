import { useState, useEffect } from 'react'
import { getFAQs, createFAQ, updateFAQ, deleteFAQ } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import Modal from '../../components/shared/Modal'

const CATEGORIES = [
  'Booking Appointment','Travel Insurance','Flights','Hotel Accommodation',
  'Before Appointment','After Appointment','Every Category',
]

const CAT_COLORS = {
  'Booking Appointment': '#3b82f6', 'Travel Insurance': '#10b981', 'Flights': '#6366f1',
  'Hotel Accommodation': '#f59e0b', 'Before Appointment': '#8b5cf6', 'After Appointment': '#ec4899', 'Every Category': '#64748b',
}

export default function AdminFAQs() {
  const [grouped, setGrouped] = useState({})
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState({ category:'', question:'', answer:'', order:0 })
  const [saving, setSaving] = useState(false)
  const [openItems, setOpenItems] = useState({})

  const load = () => getFAQs().then((r) => setGrouped(r.data.data || {})).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openCreate = () => { setEditItem(null); setForm({ category:CATEGORIES[0], question:'', answer:'', order:0 }); setModal(true) }
  const openEdit = (cat, item) => { setEditItem(item); setForm({ category:cat, question:item.question, answer:item.answer||'', order:0 }); setModal(true) }

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editItem) await updateFAQ(editItem.id, form)
      else await createFAQ(form)
      setModal(false); load()
    } finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this FAQ?')) return
    await deleteFAQ(id); load()
  }

  const toggleItem = (id) => setOpenItems(prev => ({ ...prev, [id]: !prev[id] }))

  if (loading) return <PageSpinner />

  const totalFAQs = Object.values(grouped).reduce((a, b) => a + b.length, 0)

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">FAQs</h1>
          <p className="page-subtitle">{totalFAQs} questions across {Object.keys(grouped).length} categories</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add FAQ
        </button>
      </div>

      {Object.entries(grouped).map(([cat, items]) => {
        const color = CAT_COLORS[cat] || '#64748b'
        return (
          <div key={cat} style={{ background:'#fff', borderRadius:18, border:'1px solid #f1f5f9', overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,0.04)' }}>
            {/* Category header */}
            <div style={{ padding:'16px 20px', borderBottom:'1px solid #f8fafc', display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background:color, flexShrink:0 }} />
              <span style={{ fontWeight:700, color:'#0f172a', fontSize:14 }}>{cat}</span>
              <span style={{ padding:'2px 8px', borderRadius:99, fontSize:11, fontWeight:700, background:`${color}14`, color, border:`1px solid ${color}30` }}>
                {items.length}
              </span>
            </div>

            {/* FAQ items */}
            <div style={{ padding:'8px 12px' }}>
              {items.map((item) => {
                const isOpen = openItems[item.id]
                return (
                  <div key={item.id} style={{ borderRadius:10, marginBottom:4, border:'1px solid transparent', transition:'all 0.15s', ...(isOpen ? { border:`1px solid ${color}22`, background:`${color}06` } : {}) }}>
                    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 14px' }}>
                      <button onClick={() => toggleItem(item.id)} style={{
                        flex:1, textAlign:'left', background:'none', border:'none', cursor:'pointer', padding:0,
                        fontFamily:'var(--font-sans)',
                      }}>
                        <div style={{ fontSize:13.5, fontWeight:600, color:'#334155' }}>{item.question}</div>
                        {isOpen && item.answer && (
                          <div style={{ fontSize:13, color:'#64748b', marginTop:8, lineHeight:1.6 }}>{item.answer}</div>
                        )}
                        {isOpen && !item.answer && (
                          <div style={{ fontSize:12, color:'#f59e0b', fontStyle:'italic', marginTop:6 }}>No answer yet — add one below</div>
                        )}
                      </button>
                      <div style={{ display:'flex', gap:6, alignItems:'center', flexShrink:0 }}>
                        <button onClick={() => openEdit(cat, item)} style={{
                          fontSize:11, fontWeight:600, color:'#3b82f6', padding:'4px 10px',
                          borderRadius:6, background:'#eff6ff', border:'1px solid #bfdbfe',
                          cursor:'pointer', transition:'all 0.15s',
                        }}>Edit</button>
                        <button onClick={() => handleDelete(item.id)} style={{
                          fontSize:11, fontWeight:600, color:'#dc2626', padding:'4px 10px',
                          borderRadius:6, background:'#fff1f2', border:'1px solid #fecaca',
                          cursor:'pointer', transition:'all 0.15s',
                        }}>Remove</button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <Modal open={modal} onClose={() => setModal(false)} title={editItem ? 'Edit FAQ' : 'Add FAQ'} size="lg">
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Question *</label>
            <input className="input" required value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Enter the question..." />
          </div>
          <div>
            <label className="label">Answer</label>
            <textarea className="input" rows={4} placeholder="Leave empty to fill later..." value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} style={{ resize:'vertical' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save FAQ'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

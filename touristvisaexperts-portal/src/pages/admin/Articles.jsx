import { useState, useEffect } from 'react'
import { getArticles, createArticle, updateArticle, deleteArticle } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'

const TAG_OPTIONS = ['Visa Guide', 'Travel Tips', 'Destination', 'News', 'Document Help', 'General']
const TAG_COLORS  = [
  { label: 'Orange',  value: '#f97316' },
  { label: 'Blue',    value: '#3b82f6' },
  { label: 'Green',   value: '#10b981' },
  { label: 'Purple',  value: '#8b5cf6' },
  { label: 'Red',     value: '#ef4444' },
  { label: 'Pink',    value: '#ec4899' },
]

const EMPTY_FORM = {
  title: '', tag: 'Visa Guide', tagColor: '#f97316',
  excerpt: '', imageUrl: '', date: '', readTime: '5 min read',
  content: '', isPublished: true, order: 0,
}

export default function AdminArticles() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)   // article _id being edited
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [error, setError]       = useState('')

  const load = () => {
    setLoading(true)
    getArticles()
      .then(r => setArticles(r.data.data || []))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setError('')
    setShowForm(true)
  }

  const openEdit = (a) => {
    setEditing(a._id)
    setForm({
      title: a.title, tag: a.tag, tagColor: a.tagColor,
      excerpt: a.excerpt, imageUrl: a.imageUrl, date: a.date,
      readTime: a.readTime, content: a.content || '',
      isPublished: a.isPublished, order: a.order,
    })
    setError('')
    setShowForm(true)
  }

  const closeForm = () => { setShowForm(false); setEditing(null); setError('') }

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required'); return }
    setSaving(true); setError('')
    try {
      if (editing) await updateArticle(editing, form)
      else          await createArticle(form)
      closeForm()
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this article?')) return
    setDeleting(id)
    try {
      await deleteArticle(id)
      load()
    } finally {
      setDeleting(null)
    }
  }

  const togglePublish = async (a) => {
    try {
      await updateArticle(a._id, { ...a, isPublished: !a.isPublished })
      load()
    } catch {}
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Articles</h1>
          <p className="page-subtitle">Manage blog posts shown on the marketing site</p>
        </div>
        <button
          onClick={openCreate}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff',
            fontSize: 13, fontWeight: 700, boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Article
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12 }}>
        {[
          { label: 'Total',     value: articles.length,                                  color: '#3b82f6' },
          { label: 'Published', value: articles.filter(a => a.isPublished).length,        color: '#10b981' },
          { label: 'Draft',     value: articles.filter(a => !a.isPublished).length,       color: '#64748b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Article list */}
      {loading ? <PageSpinner /> : articles.length === 0 ? (
        <EmptyState title="No articles" subtitle="Create your first article to display on the website." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {articles.map(a => (
            <div key={a._id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>

              {/* Cover thumb */}
              {a.imageUrl ? (
                <div style={{ width: 72, height: 50, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={a.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none' }} />
                </div>
              ) : (
                <div style={{ width: 72, height: 50, borderRadius: 8, background: '#f1f5f9', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 22 }}>📰</span>
                </div>
              )}

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: a.tagColor + '20', color: a.tagColor, letterSpacing: '0.04em',
                  }}>{a.tag}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: a.isPublished ? 'rgba(16,185,129,0.1)' : '#f1f5f9',
                    color: a.isPublished ? '#10b981' : '#94a3b8',
                  }}>{a.isPublished ? 'Published' : 'Draft'}</span>
                  {a.order > 0 && (
                    <span style={{ fontSize: 10, color: '#64748b' }}>Order: {a.order}</span>
                  )}
                </div>
                <p style={{ fontWeight: 700, color: '#0f172a', fontSize: 14, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
                {a.excerpt && (
                  <p style={{ fontSize: 12, color: '#64748b', margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.excerpt}</p>
                )}
                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                  {a.date && <span style={{ fontSize: 11, color: '#64748b' }}>📅 {a.date}</span>}
                  {a.readTime && <span style={{ fontSize: 11, color: '#64748b' }}>⏱ {a.readTime}</span>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => togglePublish(a)}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569',
                  }}
                >{a.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button
                  onClick={() => openEdit(a)}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: 'none', background: 'rgba(59,130,246,0.1)', color: '#3b82f6',
                  }}
                >Edit</button>
                <button
                  disabled={deleting === a._id}
                  onClick={() => remove(a._id)}
                  style={{
                    padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                    opacity: deleting === a._id ? 0.5 : 1,
                  }}
                >{deleting === a._id ? '…' : 'Delete'}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal Form ── */}
      {showForm && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        }} onClick={closeForm}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 560,
              maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {editing ? 'Edit Article' : 'New Article'}
              </h2>
              <button onClick={closeForm} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 20, color: '#64748b' }}>×</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>
                {error}
              </div>
            )}

            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Title */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Title *</label>
                <input
                  className="input"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="e.g. UAE Visa Requirements for Indian Citizens"
                />
              </div>

              {/* Tag + Color row */}
              <div className="r-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Category Tag</label>
                  <select className="input" value={form.tag} onChange={e => set('tag', e.target.value)}>
                    {TAG_OPTIONS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Tag Colour</label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {TAG_COLORS.map(c => (
                      <button
                        key={c.value} type="button"
                        onClick={() => set('tagColor', c.value)}
                        style={{
                          width: 24, height: 24, borderRadius: '50%', border: form.tagColor === c.value ? '3px solid #0f172a' : '2px solid transparent',
                          background: c.value, cursor: 'pointer', outline: form.tagColor === c.value ? '2px solid #fff' : 'none', outlineOffset: '-4px',
                        }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Cover Image URL</label>
                <input
                  className="input"
                  value={form.imageUrl}
                  onChange={e => set('imageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                />
                {form.imageUrl && (
                  <img src={form.imageUrl} alt="" style={{ marginTop: 8, height: 80, borderRadius: 8, objectFit: 'cover', width: '100%' }} onError={e => e.target.style.display = 'none'} />
                )}
              </div>

              {/* Excerpt */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Excerpt / Summary</label>
                <textarea
                  className="input"
                  rows={3}
                  value={form.excerpt}
                  onChange={e => set('excerpt', e.target.value)}
                  placeholder="Brief summary shown under the article title on the website…"
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Date + Read Time + Order */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Display Date</label>
                  <input
                    className="input"
                    value={form.date}
                    onChange={e => set('date', e.target.value)}
                    placeholder="Jun 21, 2026"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Read Time</label>
                  <input
                    className="input"
                    value={form.readTime}
                    onChange={e => set('readTime', e.target.value)}
                    placeholder="5 min read"
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>Order</label>
                  <input
                    className="input"
                    type="number" min="0"
                    value={form.order}
                    onChange={e => set('order', Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Full HTML Content */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }}>
                  Article Content <span style={{ color: '#64748b', fontWeight: 400 }}>(HTML supported — &lt;h2&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;blockquote&gt;…)</span>
                </label>
                <textarea
                  className="input"
                  rows={10}
                  value={form.content}
                  onChange={e => set('content', e.target.value)}
                  placeholder="<h2>Introduction</h2><p>Write your article here…</p>"
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                />
              </div>

              {/* Published toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => set('isPublished', !form.isPublished)}
                  style={{
                    width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
                    background: form.isPublished ? '#10b981' : '#e2e8f0',
                    position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                  }}
                >
                  <div style={{
                    position: 'absolute', top: 3, left: form.isPublished ? 20 : 3,
                    width: 16, height: 16, borderRadius: '50%', background: '#fff',
                    transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }} />
                </button>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>
                  {form.isPublished ? 'Published — visible on website' : 'Draft — hidden from website'}
                </span>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  type="button" onClick={closeForm}
                  style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}
                >Cancel</button>
                <button
                  type="submit" disabled={saving}
                  style={{
                    flex: 2, padding: '11px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff',
                    fontSize: 13, fontWeight: 700, opacity: saving ? 0.7 : 1,
                  }}
                >{saving ? 'Saving…' : editing ? 'Save Changes' : 'Create Article'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import api from '../../api/axios'
import {
  getTestimonials, createTestimonial, updateTestimonial, deleteTestimonial,
  reorderTestimonials, importDefaultTestimonials,
} from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'

const MAX_QUOTE  = 600   // room for a proper review; the website cards grow to fit
const PHOTO_SIZE = 320   // saved photo: 320×320 JPEG (~30 KB) — sharp on the website's round avatar
const FRAME      = 240   // on-screen crop box
const COUNTRIES  = ['USA', 'UK', 'Canada', 'Australia', 'New Zealand', 'Schengen', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Switzerland', 'Singapore', 'Japan', 'Dubai']
// Same colours as the website's passport cards
const C = { cream: '#faf6ee', navy: '#1a2a5e', navyDeep: '#0f1d45', orange: '#d96b1e', blue: '#1e3d8f', red: '#c24520' }

const label = { fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 6 }
const photoUrl = (p) => (p ? (api.defaults.baseURL || '/api').replace(/\/$/, '') + p : '')
const initials = (name) => (name || '').trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() || '').join('') || '?'
// "15 MAY 2026", like the website's stamps
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
const stampDate = (d) => {
  const x = d ? new Date(d) : new Date()
  return isNaN(x) ? '' : `${String(x.getUTCDate()).padStart(2, '0')} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`
}
const toInputDate = (d) => {
  const x = d ? new Date(d) : null
  return x && !isNaN(x) ? x.toISOString().slice(0, 10) : ''
}

const EMPTY = { name: '', city: '', country: '', quote: '', rating: 5, approvedOn: '', isPublished: true, photo: undefined, photoPreview: '' }

function Avatar({ src, name, size }) {
  if (src) {
    return <img src={src} alt="" style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, boxShadow: '0 0 0 2px rgba(26,42,94,0.12)' }} />
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: C.navy, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: Math.round(size * 0.38), flexShrink: 0 }}>
      {initials(name)}
    </div>
  )
}

function Stars({ value, size = 13, onChange }) {
  return (
    <div style={{ display: 'flex', gap: onChange ? 0 : 2 }}>
      {[1, 2, 3, 4, 5].map(n => {
        const star = (
          <svg width={size} height={size} viewBox="0 0 24 24" fill={n <= value ? C.orange : 'none'} stroke={C.orange} strokeWidth="2" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        )
        return onChange
          ? <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`} style={{ border: 'none', background: 'none', padding: 3, cursor: 'pointer', lineHeight: 0 }}>{star}</button>
          : <span key={n} style={{ lineHeight: 0 }}>{star}</span>
      })}
    </div>
  )
}

// Mirrors the "Visa Approved" ticket card on the website
function TicketPreview({ t }) {
  return (
    <div style={{ background: C.cream, borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: 20, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ margin: 0, fontWeight: 700, color: C.blue, letterSpacing: '0.2em', fontSize: 12 }}>VISA APPROVED</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <div style={{ flex: 1, borderTop: `1px dashed ${C.blue}66` }} />
          <p style={{ margin: 0, fontWeight: 700, color: C.orange, letterSpacing: '0.15em', fontSize: 15 }}>{(t.country || 'Country').toUpperCase()}</p>
          <div style={{ flex: 1, borderTop: `1px dashed ${C.blue}66` }} />
        </div>
      </div>
      <div style={{ marginTop: 12, flex: 1 }}>
        <span style={{ fontSize: 34, lineHeight: 0.8, color: C.blue, fontFamily: 'Georgia, serif', display: 'block' }}>“</span>
        <div style={{ marginTop: 4 }}><Stars value={t.rating} /></div>
        <p style={{ margin: '8px 0 0', color: 'rgba(15,29,69,0.85)', lineHeight: 1.6, fontSize: 14, overflowWrap: 'anywhere' }}>
          {t.quote || 'The review text appears here…'}
        </p>
      </div>
      <div style={{ borderTop: '1px dashed rgba(26,42,94,0.2)', marginTop: 12, paddingTop: 12, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <Avatar src={t.photoPreview} name={t.name} size={44} />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontWeight: 600, color: C.navyDeep, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name || 'Client name'}</p>
            <p style={{ margin: 0, fontSize: 11, color: 'rgba(26,42,94,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.city || 'City, Country'}</p>
          </div>
        </div>
        <div style={{ flexShrink: 0, border: `2px solid ${C.blue}`, color: C.blue, borderRadius: 4, padding: '3px 8px', textAlign: 'center', transform: 'rotate(-4deg)' }}>
          <p style={{ margin: 0, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em' }}>IMMIGRATION</p>
          <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700 }}>{stampDate(t.approvedOn)}</p>
          <p style={{ margin: 0, fontSize: 8, fontWeight: 700, letterSpacing: '0.08em' }}>APPROVED</p>
        </div>
      </div>
    </div>
  )
}

// Drag to position, slide to zoom — exports a square PHOTO_SIZE JPEG whatever the original size
function PhotoCropper({ file, onChange, onDone, onCancel }) {
  const [img, setImg]   = useState(null)
  const [zoom, setZoom] = useState(1)
  const [pos, setPos]   = useState({ x: 0, y: 0 })   // image top-left inside the frame
  const [note, setNote] = useState('')
  const drag = useRef(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const im = new Image()
    im.onload = () => {
      const s = FRAME / Math.min(im.naturalWidth, im.naturalHeight)
      setImg(im); setZoom(1)
      setPos({ x: (FRAME - im.naturalWidth * s) / 2, y: (FRAME - im.naturalHeight * s) / 2 })
      setNote(Math.min(im.naturalWidth, im.naturalHeight) < 200 ? 'This photo is small and may look blurry — 400×400 or bigger works best.' : '')
    }
    im.onerror = () => setNote('This file could not be opened. Please choose a JPG, PNG or WEBP photo.')
    im.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const base  = img ? FRAME / Math.min(img.naturalWidth, img.naturalHeight) : 1
  const scale = base * zoom
  const clamp = (p, s) => ({
    x: Math.min(0, Math.max(FRAME - img.naturalWidth * s, p.x)),
    y: Math.min(0, Math.max(FRAME - img.naturalHeight * s, p.y)),
  })

  const changeZoom = (z) => {
    // zoom around the centre of the frame
    const cx = (FRAME / 2 - pos.x) / scale, cy = (FRAME / 2 - pos.y) / scale
    const s1 = base * z
    setZoom(z)
    setPos(clamp({ x: FRAME / 2 - cx * s1, y: FRAME / 2 - cy * s1 }, s1))
  }

  // Re-export shortly after every move so the card preview stays live
  useEffect(() => {
    if (!img) return
    const id = setTimeout(() => {
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = PHOTO_SIZE
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#fff'   // transparent PNGs get a white background
      ctx.fillRect(0, 0, PHOTO_SIZE, PHOTO_SIZE)
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, -pos.x / scale, -pos.y / scale, FRAME / scale, FRAME / scale, 0, 0, PHOTO_SIZE, PHOTO_SIZE)
      onChange(canvas.toDataURL('image/jpeg', 0.85))
    }, 120)
    return () => clearTimeout(id)
  }, [img, pos, scale]) // eslint-disable-line react-hooks/exhaustive-deps

  const end = () => { drag.current = null }

  return (
    <div style={{ border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 14, background: '#f8fafc' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', margin: '0 0 2px' }}>Adjust the photo</p>
      <p style={{ fontSize: 11.5, color: '#64748b', margin: '0 0 10px' }}>Drag to move · use the slider to zoom. The circle is what shows on the website.</p>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div
          style={{ width: FRAME, height: FRAME, position: 'relative', overflow: 'hidden', borderRadius: 12, background: '#0f172a', cursor: 'grab', touchAction: 'none', userSelect: 'none', flexShrink: 0 }}
          onPointerDown={e => { if (!img) return; e.currentTarget.setPointerCapture(e.pointerId); drag.current = { sx: e.clientX, sy: e.clientY, px: pos.x, py: pos.y } }}
          onPointerMove={e => { const d = drag.current; if (d) setPos(clamp({ x: d.px + e.clientX - d.sx, y: d.py + e.clientY - d.sy }, scale)) }}
          onPointerUp={end} onPointerCancel={end}
        >
          {img && (
            <img src={img.src} alt="" draggable={false}
              style={{ position: 'absolute', left: pos.x, top: pos.y, width: img.naturalWidth * scale, height: img.naturalHeight * scale, maxWidth: 'none', pointerEvents: 'none' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', boxShadow: '0 0 0 999px rgba(15,23,42,0.45)', border: '2px solid rgba(255,255,255,0.9)', pointerEvents: 'none' }} />
        </div>
        <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={label}>Zoom</label>
          <input type="range" min="1" max="3" step="0.01" value={zoom} disabled={!img} onChange={e => changeZoom(Number(e.target.value))} style={{ width: '100%' }} />
          <p style={{ fontSize: 11.5, color: '#64748b', margin: 0 }}>Saved as a {PHOTO_SIZE}×{PHOTO_SIZE} square — any photo size is fine.</p>
          {note && <p style={{ fontSize: 11.5, color: '#b45309', margin: 0, fontWeight: 600 }}>{note}</p>}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button type="button" onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button type="button" onClick={onDone} disabled={!img} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Done</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminTestimonials() {
  const [list, setList]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [pageError, setPageErr] = useState('')
  const [form, setForm]         = useState(null)   // null = editor closed
  const [editing, setEditing]   = useState(null)   // _id being edited
  const [cropFile, setCropFile] = useState(null)
  const [saving, setSaving]     = useState(false)
  const [busy, setBusy]         = useState(null)   // row id being changed
  const [error, setError]       = useState('')
  const beforeCrop = useRef(null)
  const fileInput  = useRef(null)

  const load = () => {
    setLoading(true)
    getTestimonials()
      .then(r => { setList(r.data.data || []); setPageErr('') })
      .catch(() => setPageErr('Could not load testimonials.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const close = () => { setForm(null); setEditing(null); setCropFile(null); setError('') }

  const openNew = () => { setEditing(null); setForm({ ...EMPTY }); setCropFile(null); setError('') }
  const openEdit = (t) => {
    setEditing(t._id)
    setForm({
      name: t.name, city: t.city || '', country: t.country, quote: t.quote, rating: t.rating || 5,
      approvedOn: toInputDate(t.approvedOn), isPublished: t.isPublished,
      photo: undefined, photoPreview: photoUrl(t.photoPath),
    })
    setCropFile(null); setError('')
  }

  const pickFile = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) { setError('Please choose a JPG, PNG or WEBP photo (iPhone HEIC photos: export as JPG first).'); return }
    if (file.size > 15 * 1024 * 1024) { setError('That photo is over 15 MB — please choose a smaller one.'); return }
    beforeCrop.current = { photo: form.photo, photoPreview: form.photoPreview }
    setError('')
    setCropFile(file)
  }
  const cancelCrop = () => {
    setForm(f => ({ ...f, ...beforeCrop.current }))
    setCropFile(null)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.country.trim() || !form.quote.trim()) {
      setError('Please fill in the client name, visa country and review.'); return
    }
    if (form.quote.length > MAX_QUOTE) { setError(`Please keep the review under ${MAX_QUOTE} characters.`); return }
    const body = {
      name: form.name, city: form.city, country: form.country, quote: form.quote,
      rating: form.rating, approvedOn: form.approvedOn || null, isPublished: form.isPublished,
    }
    if (form.photo !== undefined) body.photo = form.photo   // new photo, or null = removed
    setSaving(true); setError('')
    try {
      if (editing) await updateTestimonial(editing, body)
      else         await createTestimonial(body)
      close()
      load()
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const move = async (i, d) => {
    const j = i + d
    if (j < 0 || j >= list.length) return
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]]
    setList(next)
    try { await reorderTestimonials(next.map(t => t._id)) } catch { load() }
  }

  const togglePublish = async (t) => {
    setBusy(t._id)
    try {
      await updateTestimonial(t._id, { isPublished: !t.isPublished })
      setList(l => l.map(x => (x._id === t._id ? { ...x, isPublished: !t.isPublished } : x)))
    } finally { setBusy(null) }
  }

  const remove = async (t) => {
    if (!window.confirm(`Delete the review from ${t.name}? This cannot be undone.`)) return
    setBusy(t._id)
    try { await deleteTestimonial(t._id); load() } finally { setBusy(null) }
  }

  const importDefaults = async () => {
    setLoading(true)
    try { const r = await importDefaultTestimonials(); setList(r.data.data || []) }
    catch (err) { setPageErr(err.response?.data?.message || 'Import failed') }
    finally { setLoading(false) }
  }

  const live = list.filter(t => t.isPublished).length
  const btn = (bg, color) => ({ padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none', background: bg, color })
  const arrow = { width: 26, height: 22, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 11, lineHeight: 1 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        .tm-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
        @media (min-width: 900px) { .tm-grid { grid-template-columns: minmax(0, 1fr) 300px; } }
        .tm-quote { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Testimonials</h1>
          <p className="page-subtitle">Client reviews shown in “What Our Clients Say” on the home page and every visa page</p>
        </div>
        <button onClick={openNew} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: '0 4px 12px rgba(59,130,246,0.3)',
        }}>
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> Add Testimonial
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12 }}>
        {[
          { label: 'Total',      value: list.length,        color: '#3b82f6' },
          { label: 'On website', value: live,               color: '#10b981' },
          { label: 'Hidden',     value: list.length - live, color: '#64748b' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '14px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
            <p style={{ fontSize: 11, color: '#64748b', marginTop: 4, fontWeight: 600 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {pageError && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', color: '#ef4444', fontSize: 13 }}>{pageError}</div>
      )}

      {loading ? <PageSpinner /> : list.length === 0 ? (
        <div className="card" style={{ padding: '36px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', margin: 0 }}>No testimonials managed here yet</p>
          <p style={{ fontSize: 13, color: '#64748b', margin: '6px auto 18px', maxWidth: 460 }}>
            The website is showing its 6 built-in sample reviews. Import them to edit their text and photos, or add your own real client reviews.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={importDefaults} style={{ padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#0f172a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Import the 6 website reviews
            </button>
            <button onClick={openNew} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              Add a new review
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>The website shows them in this order — use the arrows to move a review up or down.</p>
          {list.map((t, i) => (
            <div key={t._id} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', opacity: busy === t._id ? 0.6 : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button type="button" style={{ ...arrow, opacity: i === 0 ? 0.35 : 1 }} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">▲</button>
                <button type="button" style={{ ...arrow, opacity: i === list.length - 1 ? 0.35 : 1 }} disabled={i === list.length - 1} onClick={() => move(i, 1)} aria-label="Move down">▼</button>
              </div>
              <Avatar src={photoUrl(t.photoPath)} name={t.name} size={52} />
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                  <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 14 }}>{t.name}</span>
                  {t.city && <span style={{ fontSize: 12, color: '#64748b' }}>{t.city}</span>}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 99, background: 'rgba(217,107,30,0.12)', color: C.orange, letterSpacing: '0.06em' }}>{t.country.toUpperCase()}</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: t.isPublished ? 'rgba(16,185,129,0.1)' : '#f1f5f9', color: t.isPublished ? '#10b981' : '#94a3b8',
                  }}>{t.isPublished ? 'On website' : 'Hidden'}</span>
                  {!t.photoPath && <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, background: '#fef3c7', color: '#b45309' }}>No photo</span>}
                </div>
                <Stars value={t.rating} size={12} />
                <p className="tm-quote" style={{ fontSize: 12.5, color: '#475569', margin: '4px 0 0', lineHeight: 1.5 }}>{t.quote}</p>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button onClick={() => togglePublish(t)} disabled={busy === t._id} style={{ ...btn('#f8fafc', '#475569'), border: '1px solid #e2e8f0' }}>{t.isPublished ? 'Hide' : 'Show'}</button>
                <button onClick={() => openEdit(t)} style={btn('rgba(59,130,246,0.1)', '#3b82f6')}>Edit</button>
                <button onClick={() => remove(t)} disabled={busy === t._id} style={btn('rgba(239,68,68,0.1)', '#ef4444')}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Editor — rendered on <body> so it sits over the whole screen, not inside the page's content area ── */}
      {form && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, overflowY: 'auto', background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={close}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: 26, width: '100%', maxWidth: 940, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', margin: 0 }}>{editing ? 'Edit Testimonial' : 'New Testimonial'}</h2>
              <button onClick={close} aria-label="Close" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 22, color: '#64748b' }}>×</button>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, color: '#ef4444', fontSize: 13 }}>{error}</div>
            )}

            <div className="tm-grid">
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* Photo */}
                <div>
                  <label style={label}>Client photo</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                    <Avatar src={form.photoPreview} name={form.name} size={64} />
                    <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={pickFile} style={{ display: 'none' }} />
                    <button type="button" onClick={() => fileInput.current?.click()} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {form.photoPreview ? 'Change photo' : 'Upload photo'}
                    </button>
                    {form.photoPreview && !cropFile && (
                      <button type="button" onClick={() => setForm(f => ({ ...f, photo: null, photoPreview: '' }))} style={{ padding: '8px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Remove
                      </button>
                    )}
                  </div>
                  {!form.photoPreview && <p style={{ fontSize: 11.5, color: '#64748b', margin: '6px 0 0' }}>No photo? The website shows the client's initials instead.</p>}
                </div>
                {cropFile && (
                  <PhotoCropper
                    file={cropFile}
                    onChange={url => setForm(f => ({ ...f, photo: url, photoPreview: url }))}
                    onDone={() => setCropFile(null)}
                    onCancel={cancelCrop}
                  />
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                  <div>
                    <label style={label}>Client name *</label>
                    <input className="input" value={form.name} maxLength={60} onChange={e => set('name', e.target.value)} placeholder="e.g. Rohit Mehta" />
                  </div>
                  <div>
                    <label style={label}>City</label>
                    <input className="input" value={form.city} maxLength={60} onChange={e => set('city', e.target.value)} placeholder="e.g. Mumbai, India" />
                  </div>
                  <div>
                    <label style={label}>Visa country *</label>
                    <input className="input" list="tm-countries" value={form.country} maxLength={24} onChange={e => set('country', e.target.value)} placeholder="e.g. USA" />
                    <datalist id="tm-countries">{COUNTRIES.map(c => <option key={c} value={c} />)}</datalist>
                  </div>
                  <div>
                    <label style={label}>Visa approved on</label>
                    <input className="input" type="date" value={form.approvedOn} onChange={e => set('approvedOn', e.target.value)} />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <label style={label}>Review *</label>
                    <span style={{ fontSize: 11, fontWeight: 700, color: form.quote.length > MAX_QUOTE - 20 ? '#b45309' : '#94a3b8' }}>{form.quote.length}/{MAX_QUOTE}</span>
                  </div>
                  <textarea className="input" rows={7} maxLength={MAX_QUOTE} value={form.quote} onChange={e => set('quote', e.target.value)}
                    placeholder="What the client said about us, in 1–3 short sentences." style={{ resize: 'vertical' }} />
                  <p style={{ fontSize: 11.5, color: '#64748b', margin: '4px 0 0' }}>Up to {MAX_QUOTE} characters. The review shows in full on the website.</p>
                </div>

                <div>
                  <label style={label}>Rating</label>
                  <Stars value={form.rating} size={22} onChange={n => set('rating', n)} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button type="button" onClick={() => set('isPublished', !form.isPublished)} aria-label="Show on website"
                    style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: form.isPublished ? '#10b981' : '#e2e8f0', position: 'relative', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: 3, left: form.isPublished ? 20 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>{form.isPublished ? 'Shown on the website' : 'Hidden from the website'}</span>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  <button type="button" onClick={close} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button type="submit" disabled={saving || !!cropFile} title={cropFile ? 'Click Done on the photo first' : undefined}
                    style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontSize: 13, fontWeight: 700, opacity: saving || cropFile ? 0.6 : 1 }}>
                    {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Testimonial'}
                  </button>
                </div>
              </form>

              {/* Live preview */}
              <div>
                <p style={{ ...label, marginBottom: 10 }}>Preview — how it looks on the website</p>
                <TicketPreview t={form} />
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

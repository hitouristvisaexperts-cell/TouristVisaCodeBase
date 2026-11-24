import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../../api/admin'
import { PageSpinner } from '../../components/shared/Spinner'

export default function AdminSettings() {
  const [form, setForm]       = useState({ calendlyUrl: '', adminWhatsApp: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState(null) // { type: 'success'|'error', text }

  useEffect(() => {
    getSettings()
      .then(r => {
        const d = r.data.data || {}
        setForm({
          calendlyUrl:   d.calendlyUrl   || '',
          adminWhatsApp: d.adminWhatsApp || '917667373732',
        })
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      await updateSettings(form)
      setMsg({ type: 'success', text: 'Settings saved successfully.' })
    } catch {
      setMsg({ type: 'error', text: 'Failed to save settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  const inputStyle = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: 10,
    padding: '10px 14px', fontSize: 14, color: '#0f172a',
    outline: 'none', transition: 'border 0.15s',
    boxSizing: 'border-box', background: '#fff',
    fontFamily: 'var(--font-sans)',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 640 }}>
      <div>
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Configure booking links and contact details</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Calendly */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Calendly Meeting Link</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Clients will use this to book consultations</div>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            Calendly URL
          </label>
          <input
            style={inputStyle}
            type="url"
            placeholder="https://calendly.com/your-name/visa-consultation"
            value={form.calendlyUrl}
            onChange={e => setForm(f => ({ ...f, calendlyUrl: e.target.value }))}
            onFocus={e => e.target.style.borderColor = '#3b82f6'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          {form.calendlyUrl && (
            <a
              href={form.calendlyUrl}
              target="_blank"
              rel="noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 8, fontSize: 12, color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              Preview link
            </a>
          )}
        </div>

        {/* Admin WhatsApp */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#16a34a"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.115.554 4.099 1.523 5.819L0 24l6.336-1.501A11.937 11.937 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.805 9.805 0 0 1-5.001-1.369l-.358-.213-3.761.891.951-3.659-.234-.375A9.78 9.78 0 0 1 2.182 12C2.182 6.57 6.57 2.182 12 2.182c5.43 0 9.818 4.388 9.818 9.818 0 5.43-4.388 9.818-9.818 9.818z"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Admin WhatsApp Number</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Used in new-client notification emails (with country code, no +)</div>
            </div>
          </div>

          <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            WhatsApp Number
          </label>
          <input
            style={inputStyle}
            type="text"
            placeholder="917667373732"
            value={form.adminWhatsApp}
            onChange={e => setForm(f => ({ ...f, adminWhatsApp: e.target.value.replace(/\D/g, '') }))}
            onFocus={e => e.target.style.borderColor = '#22c55e'}
            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
          />
          <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
            Format: country code + number, e.g. <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>917667373732</code> for +91 76673 73732
          </div>
        </div>

        {/* Message */}
        {msg && (
          <div style={{
            padding: '12px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600,
            background: msg.type === 'success' ? '#f0fdf4' : '#fff1f2',
            color:      msg.type === 'success' ? '#16a34a' : '#e11d48',
            border:     `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecdd3'}`,
          }}>
            {msg.text}
          </div>
        )}

        {/* Save */}
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '12px 28px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: saving ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#2563eb)',
            color: '#fff', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em',
            boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            transition: 'all 0.15s', alignSelf: 'flex-start',
            fontFamily: 'var(--font-sans)',
          }}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

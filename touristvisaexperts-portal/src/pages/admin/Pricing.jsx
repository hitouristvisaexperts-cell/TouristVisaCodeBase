import { useState, useEffect } from 'react'
import { PageSpinner } from '../../components/shared/Spinner'
import api from '../../api/axios'

// Every value on this page is used live: the website shows these prices and the
// payment server charges them. All amounts are in ₹ and INCLUDE 18% GST.
const PRICE_FIELDS = [
  { key: 'visaUSA',            label: 'Visa assistance — USA',                    hint: 'First-time application, per person' },
  { key: 'visaEurope',         label: 'Visa assistance — Schengen / Europe',      hint: 'First-time application, per person' },
  { key: 'visaOther',          label: 'Visa assistance — UK & all other countries', hint: 'First-time application, per person' },
  { key: 'reapplication',      label: 'Specialist Re-application (visa rejected before)', hint: 'Per person — Schengen, UK, USA, Canada, Australia, New Zealand' },
  { key: 'reapplicationGuarantee', label: 'Guarantee Re-application (visa rejected before)', hint: 'Per person — includes 100% service-fee refund on eligible refusals' },
  { key: 'flightPerPassenger', label: 'Flight reservation',                       hint: 'Per passenger' },
  { key: 'consultation',       label: '1-on-1 consultation',                      hint: 'Paid on the Consultation page' },
  { key: 'addMember',          label: 'Add a co-applicant (client portal)',        hint: 'Per extra person added after purchase' },
]
const DEFAULT_PRICES = { visaUSA: 25000, visaEurope: 15000, visaOther: 10000, reapplication: 15000, reapplicationGuarantee: 25000, flightPerPassenger: 999, consultation: 999, addMember: 10000 }

const DEFAULT_CASHBACK = {
  enabled: true,
  India: { amount: 2500, symbol: '₹' },
  rejectedPerPerson: 5000,
  steps: [
    'Share a Video Testimonial – Tell us about your experience!',
    "Send a Photo with Your Visa Copy – Email us, and we'll feature it on our website & social media.",
    'Post on your Social Media & WhatsApp Status – Spread the word about your journey!',
    'Leave a Review – Share your feedback on our website & social media.',
  ],
  footerText: "Once you complete these steps, we'll credit your reward!",
}

const inr = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`
const gstSplit = (total) => {
  const base = Math.round((Number(total || 0) / 1.18) * 100) / 100
  return { base, gst: Math.round((Number(total || 0) - base) * 100) / 100 }
}

export default function AdminPricing() {
  const [prices,   setPrices]   = useState(DEFAULT_PRICES)
  const [cashback, setCashback] = useState(DEFAULT_CASHBACK)
  const [coupons,  setCoupons]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState(null)
  const [tab,      setTab]      = useState('pricing') // 'pricing' | 'cashback' | 'coupons'

  const load = () => Promise.all([
    api.get('/settings/pricing').then(r => r.data.data).catch(() => DEFAULT_PRICES),
    api.get('/settings/cashback').then(r => r.data.data).catch(() => DEFAULT_CASHBACK),
    api.get('/settings/coupons').then(r => r.data.data).catch(() => []),
  ]).then(([p, c, cp]) => {
    setPrices({ ...DEFAULT_PRICES, ...(p || {}) })
    setCashback({ ...DEFAULT_CASHBACK, ...(c || {}), India: { ...DEFAULT_CASHBACK.India, ...(c?.India || {}) }, steps: c?.steps || DEFAULT_CASHBACK.steps })
    setCoupons(Array.isArray(cp) ? cp : [])
  })

  useEffect(() => { load().finally(() => setLoading(false)) }, [])

  const updatePrice = (key, val) => setPrices(p => ({ ...p, [key]: val === '' ? '' : Number(val) }))
  const updateStep = (i, val) => setCashback(p => { const steps = [...p.steps]; steps[i] = val; return { ...p, steps } })
  // Where a code works — each service has its own codes (Oct 2026)
  const SERVICES = [
    { key: 'visa',         label: 'Visa services',  hint: 'Visa checkout, re-application & guarantee plans' },
    { key: 'consultation', label: 'Consultation',   hint: '₹999 1-on-1 consultation' },
    { key: 'flight',       label: 'Flight tickets', hint: 'Dummy flight reservations' },
  ]
  const toggleService = (i, key) => setCoupons(p => p.map((c, idx) => {
    if (idx !== i) return c
    const cur = Array.isArray(c.services) ? c.services : ['visa']   // old coupons count as visa-only
    return { ...c, services: cur.includes(key) ? cur.filter(s => s !== key) : [...cur, key] }
  }))
  const addCoupon = () => setCoupons(p => [...p, { code: '', discountType: 'percent', discountValue: 10, active: true, services: ['visa'] }])
  const removeCoupon = (i) => setCoupons(p => p.filter((_, idx) => idx !== i))
  const updateCoupon = (i, field, val) =>
    setCoupons(p => p.map((c, idx) => idx === i ? { ...c, [field]: field === 'discountValue' ? Number(val) || 0 : val } : c))

  const handleSave = async (e) => {
    e.preventDefault()
    const bad = PRICE_FIELDS.find(f => !(Number(prices[f.key]) >= 1))
    if (bad) { setMsg({ type: 'error', text: `Please enter a price for "${bad.label}".` }); setTab('pricing'); return }
    const badCoupon = coupons.find(c => !String(c.code || '').trim())
    if (badCoupon) { setMsg({ type: 'error', text: 'Every coupon needs a code (or delete the empty row).' }); setTab('coupons'); return }
    const noService = coupons.find(c => Array.isArray(c.services) && c.services.length === 0)
    if (noService) { setMsg({ type: 'error', text: `Coupon ${noService.code}: tick at least one service it works on.` }); setTab('coupons'); return }
    setSaving(true); setMsg(null)
    try {
      await api.put('/settings', {
        prices: JSON.stringify(prices),
        cashback: JSON.stringify(cashback),
        coupons: JSON.stringify(coupons),
      })
      await load() // show exactly what the server stored
      setMsg({ type: 'success', text: 'Saved. The website and payments use the new values within 30 seconds.' })
    } catch (err) {
      setMsg({ type: 'error', text: err?.response?.data?.message || 'Failed to save.' })
    } finally { setSaving(false) }
  }

  if (loading) return <PageSpinner />

  const inp = {
    width: '100%', border: '1px solid #e2e8f0', borderRadius: 8,
    padding: '8px 12px', fontSize: 14, color: '#0f172a',
    outline: 'none', background: '#fff', boxSizing: 'border-box',
  }
  const sel = { ...inp, cursor: 'pointer' }
  const card = { background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 24, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }

  const TABS = [
    { key: 'pricing', label: '💰 Prices' },
    { key: 'cashback', label: '🎉 Cashback' },
    { key: 'coupons', label: '🏷️ Coupons' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 860 }}>
      <div>
        <h1 className="page-title">Pricing & Offers</h1>
        <p className="page-subtitle">Prices, cashback and coupon codes used live on the website and at payment</p>
      </div>

      <div style={{ display: 'flex', gap: 8, borderBottom: '2px solid #f1f5f9', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)} style={{
            padding: '8px 20px', borderRadius: '8px 8px 0 0', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700,
            background: tab === t.key ? '#3b82f6' : '#f8fafc',
            color: tab === t.key ? '#fff' : '#64748b',
            borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
            marginBottom: -2,
          }}>{t.label}</button>
        ))}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── PRICES TAB ── */}
        {tab === 'pricing' && (
          <div style={card}>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Prices (₹, including 18% GST)</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, marginBottom: 18 }}>
              Customers everywhere pay in rupees through Razorpay. The base amount and GST split shown to customers are worked out from these totals.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {PRICE_FIELDS.map(f => {
                const { base, gst } = gstSplit(prices[f.key])
                return (
                  <div key={f.key} className="r-price-row" style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 14, alignItems: 'center', padding: 14, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{f.label}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{f.hint}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Base {inr(base)} + GST {inr(gst)}</div>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700 }}>₹</span>
                      <input type="number" min="1" step="1" required value={prices[f.key]} onChange={e => updatePrice(f.key, e.target.value)}
                        style={{ ...inp, paddingLeft: 26, fontWeight: 700 }} onFocus={e => e.target.style.borderColor = '#3b82f6'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── CASHBACK TAB ── */}
        {tab === 'cashback' && (
          <>
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Cashback Reward</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Shown on the checkout page and the Visa Rejected page</div>
                </div>
                <div onClick={() => setCashback(p => ({ ...p, enabled: !p.enabled }))} style={{ width: 44, height: 24, borderRadius: 12, position: 'relative', background: cashback.enabled ? '#10b981' : '#cbd5e1', cursor: 'pointer', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: cashback.enabled ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
                <div style={{ padding: 14, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fafafa' }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>First-time application (₹)</label>
                  <input type="number" min="0" value={cashback.India?.amount ?? 0} onChange={e => setCashback(p => ({ ...p, India: { ...p.India, amount: Number(e.target.value) || 0, symbol: '₹' }, Other: { amount: Number(e.target.value) || 0, symbol: '₹' } }))} style={inp} />
                </div>
                <div style={{ padding: 14, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fafafa' }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Re-application, per person (₹)</label>
                  <input type="number" min="0" value={cashback.rejectedPerPerson ?? 5000} onChange={e => setCashback(p => ({ ...p, rejectedPerPerson: Number(e.target.value) || 0 }))} style={inp} />
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>Only paid if the new visa is approved and the steps below are done.</div>
                </div>
              </div>
            </div>

            <div style={card}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', marginBottom: 4 }}>Popup Steps Text</div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>These 4 steps appear in the cashback popup</div>
              {(cashback.steps || DEFAULT_CASHBACK.steps).map((step, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Step {i + 1} {['🎥', '📸', '📢', '⭐'][i]}</label>
                  <input type="text" value={step} onChange={e => updateStep(i, e.target.value)} style={inp} />
                </div>
              ))}
              <div style={{ marginTop: 4 }}>
                <label style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', marginBottom: 4, display: 'block' }}>Footer Message 💰</label>
                <input type="text" value={cashback.footerText || DEFAULT_CASHBACK.footerText} onChange={e => setCashback(p => ({ ...p, footerText: e.target.value }))} style={inp} />
              </div>
            </div>
          </>
        )}

        {/* ── COUPONS TAB ── */}
        {tab === 'coupons' && (
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>Coupon Codes</div>
                <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>Each code works only on the services you tick — visa services, the consultation and flight tickets are kept separate. Codes are private and not case-sensitive.</div>
              </div>
              <button type="button" onClick={addCoupon} style={{ padding: '8px 16px', borderRadius: 10, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add Coupon</button>
            </div>
            <div style={{ fontSize: 11.5, color: '#64748b', marginBottom: 16 }}>A coupon can never bring a payment below ₹1 (Razorpay's minimum). Turn a coupon off with the Active switch instead of deleting it to keep a record.</div>

            {coupons.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#64748b', fontSize: 14 }}>No coupons yet. Click "Add Coupon" to create one.</div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {coupons.map((coupon, i) => {
                const isFull = coupon.discountType === 'percent' && Number(coupon.discountValue) >= 100
                return (
                  <div key={i} className="r-coupon-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto', gap: 10, alignItems: 'end', padding: 14, borderRadius: 12, border: '1px solid #f1f5f9', background: '#fafafa' }}>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'block' }}>Coupon Code</label>
                      <input type="text" placeholder="e.g. SAVE10" maxLength={30} value={coupon.code}
                        onChange={e => updateCoupon(i, 'code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
                        style={{ ...inp, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'block' }}>Discount Type</label>
                      <select value={coupon.discountType} onChange={e => updateCoupon(i, 'discountType', e.target.value)} style={sel}>
                        <option value="percent">Percentage (%)</option>
                        <option value="flat_inr">Flat ₹ off</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, color: '#64748b', marginBottom: 3, display: 'block' }}>
                        {coupon.discountType === 'percent' ? `Discount % ${isFull ? '(charges ₹1)' : ''}` : 'Amount off (₹)'}
                      </label>
                      <input type="number" min="1" max={coupon.discountType === 'percent' ? 100 : undefined} value={coupon.discountValue}
                        onChange={e => updateCoupon(i, 'discountValue', e.target.value)} style={inp} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <label style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Active</label>
                      <div onClick={() => updateCoupon(i, 'active', !coupon.active)} style={{ width: 36, height: 20, borderRadius: 10, position: 'relative', background: coupon.active ? '#10b981' : '#cbd5e1', cursor: 'pointer' }}>
                        <div style={{ position: 'absolute', top: 2, left: coupon.active ? 18 : 2, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                    <button type="button" onClick={() => removeCoupon(i)} aria-label="Delete coupon" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #fecdd3', background: '#fff1f2', color: '#e11d48', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>✕</button>
                    {/* Works on — one row under the fields */}
                    <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                      <span style={{ fontSize: 11, color: '#64748b', fontWeight: 700, marginRight: 4 }}>Works on:</span>
                      {SERVICES.map(sv => {
                        const on = (Array.isArray(coupon.services) ? coupon.services : ['visa']).includes(sv.key)
                        return (
                          <button key={sv.key} type="button" onClick={() => toggleService(i, sv.key)} title={sv.hint} aria-pressed={on}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 11px', borderRadius: 99, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                              border: `1.5px solid ${on ? '#3b82f6' : '#e2e8f0'}`, background: on ? '#eff6ff' : '#fff', color: on ? '#1d4ed8' : '#64748b' }}>
                            <span style={{ width: 14, height: 14, borderRadius: 4, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                              background: on ? '#3b82f6' : '#fff', border: `1.5px solid ${on ? '#3b82f6' : '#cbd5e1'}`, color: '#fff' }}>{on ? '✓' : ''}</span>
                            {sv.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {msg && (
          <div style={{ padding: '12px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: msg.type === 'success' ? '#f0fdf4' : '#fff1f2', color: msg.type === 'success' ? '#16a34a' : '#e11d48', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecdd3'}` }}>
            {msg.text}
          </div>
        )}

        <button type="submit" disabled={saving} style={{ padding: '12px 28px', borderRadius: 12, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: saving ? '#94a3b8' : 'linear-gradient(135deg,#3b82f6,#2563eb)', color: '#fff', fontWeight: 700, fontSize: 14, boxShadow: '0 4px 14px rgba(37,99,235,0.35)', transition: 'all 0.15s', alignSelf: 'flex-start' }}>
          {saving ? 'Saving...' : 'Save All Changes'}
        </button>
      </form>
    </div>
  )
}

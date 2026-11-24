import { useState } from 'react'
import { CheckCircle2, AlertCircle, Tag, X } from 'lucide-react'
import { formatInr } from '../../lib/pricing'

/* Promo code field with an Apply button. Each service checks its own codes on the server
   (flight codes only on flights, consultation codes only on consultations). */
type Props = {
  endpoint: string                          // e.g. `${API}/flight/validate-coupon`
  body: Record<string, unknown>             // extra request fields (e.g. passengerCount)
  codeField?: 'coupon' | 'promoCode'        // request field name for the code
  applied: { code: string; amountPaise: number } | null
  onChange: (v: { code: string; amountPaise: number } | null) => void
  label?: string
}

export function PromoCodeBox({ endpoint, body, codeField = 'coupon', applied, onChange, label = 'Have a promo code?' }: Props) {
  const [code, setCode] = useState('')
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  const apply = async () => {
    const c = code.trim()
    if (!c) return
    setChecking(true); setError('')
    try {
      const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...body, [codeField]: c }) })
      const d = await r.json()
      if (!d.success) throw new Error(d.message || 'Invalid promo code.')
      onChange({ code: d.code || c.toUpperCase(), amountPaise: d.finalAmount })
    } catch (e: any) {
      onChange(null); setError(e.message || 'Invalid promo code.')
    } finally { setChecking(false) }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" /> Code "{applied.code}" applied — now {formatInr(applied.amountPaise / 100)}
        </p>
        <button type="button" onClick={() => { onChange(null); setCode('') }} aria-label="Remove promo code" className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
      </div>
    )
  }
  return (
    <div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="text" value={code} placeholder={label}
            onChange={e => { setCode(e.target.value); setError('') }}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); apply() } }}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-orange-400 focus:outline-none" />
        </div>
        <button type="button" onClick={apply} disabled={!code.trim() || checking}
          className="rounded-xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-50">
          {checking ? 'Checking…' : 'Apply'}
        </button>
      </div>
      {error && <p className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold text-red-600"><AlertCircle className="h-3.5 w-3.5" /> {error}</p>}
    </div>
  )
}

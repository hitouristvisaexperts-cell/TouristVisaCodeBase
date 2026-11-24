import { useState } from 'react'
import { motion } from 'motion/react'
import { toast } from 'sonner'
import { Mail, MapPin, Send, User, MessageSquare, Tag, CheckCircle2, Headphones, ArrowRight, Phone, MessageCircle } from 'lucide-react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { useNavigation } from '../context/NavigationContext'
import { CONTACT } from '../lib/contact'
import { SOCIAL_LINKS } from '../components/site/SocialIcons'
import { CountryCodeSelect, DEFAULT_DIAL_CODE, withDialCode } from '../components/site/CountryCodeSelect'
import { nameError, isValidEmail, phoneError, cleanPhone, phoneMaxDigits } from '../lib/validate'

const SUBJECTS = ['Visa assistance', 'Visa rejected / re-application', 'Flight reservation', 'Payment or refund', 'Something else']

export default function ContactPage() {
  const { openConsultation } = useNavigation()
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: SUBJECTS[0], message: '' })
  const [dial, setDial] = useState(DEFAULT_DIAL_CODE)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nameProblem = nameError(form.name)
    if (nameProblem) return setError(nameProblem)
    if (!isValidEmail(form.email)) return setError('Please enter a valid email address.')
    if (form.phone.trim()) { const phoneProblem = phoneError(dial, form.phone, 'phone number'); if (phoneProblem) return setError(phoneProblem) }
    if (form.message.trim().length < 5) return setError('Please write a short message.')
    setError(''); setSending(true)
    try {
      const API = import.meta.env.VITE_API_URL || '/api'
      const res = await fetch(`${API}/contact`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, phone: withDialCode(dial, form.phone) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not send your message. Please try again.')
      setSent(true)
      toast.success("Message sent — we'll get back to you shortly.")
    } catch (err: any) {
      setError(err.message)
    } finally { setSending(false) }
  }

  const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
  const label = 'mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500'

  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0f2040] to-[#1a3560] px-4 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-orange-400">
            <Mail size={12} /> Contact Us
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Got Questions?
            <span className="block bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">We're here to help.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/60">
            Send us a message about your visa, a rejection, a flight reservation or a payment — our team will reply by email.
          </motion.p>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 py-14">
        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Form */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Contact form</p>
              <h2 className="text-xl font-black text-white">Send us a message</h2>
            </div>
            {sent ? (
              <div className="px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 border-green-200 bg-green-50">
                  <CheckCircle2 className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-black text-[#0A1628]">Thanks, {form.name.split(' ')[0]}!</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">We've received your message and will reply to <b className="text-slate-700">{form.email}</b> shortly.</p>
                <button type="button" onClick={() => { setSent(false); setForm(f => ({ ...f, message: '' })) }}
                  className="mt-6 text-sm font-bold text-orange-500 hover:text-orange-600">Send another message</button>
              </div>
            ) : (
              <form onSubmit={submit} className="grid grid-cols-1 gap-4 px-6 py-6 sm:grid-cols-2" noValidate>
                <div className="sm:col-span-2">
                  <label htmlFor="c-name" className={label}>Full name *</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input id="c-name" className={`${inputCls} pl-10`} value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" maxLength={120} />
                  </div>
                </div>
                <div>
                  <label htmlFor="c-email" className={label}>Email *</label>
                  <input id="c-email" type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" maxLength={200} />
                </div>
                <div>
                  <label htmlFor="c-phone" className={label}>Phone (optional)</label>
                  <div className="flex items-center rounded-xl border border-slate-200 bg-white transition focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100">
                    <CountryCodeSelect value={dial} onChange={setDial} className="border-r border-slate-200 py-3 pl-4 pr-2.5 text-sm text-slate-700" />
                    <input id="c-phone" type="tel" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-[15px] text-slate-800 outline-none placeholder:text-slate-400" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: cleanPhone(dial, e.target.value) }))} placeholder="98765 43210" autoComplete="tel-national" inputMode="numeric" maxLength={phoneMaxDigits(dial)} />
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="c-subject" className={label}>What is it about?</label>
                  <div className="relative">
                    <Tag className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <select id="c-subject" className={`${inputCls} cursor-pointer pl-10`} value={form.subject} onChange={set('subject')}>
                      {SUBJECTS.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="c-message" className={label}>Message *</label>
                  <div className="relative">
                    <MessageSquare className="pointer-events-none absolute left-4 top-4 h-4 w-4 text-slate-400" />
                    <textarea id="c-message" rows={5} className={`${inputCls} resize-y pl-10`} value={form.message} onChange={set('message')} placeholder="Tell us how we can help — destination, travel dates, your question…" maxLength={2000} />
                  </div>
                </div>
                {error && <p role="alert" className="text-sm font-semibold text-red-600 sm:col-span-2">{error}</p>}
                <div className="sm:col-span-2">
                  <button type="submit" disabled={sending}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-[0_8px_24px_rgba(249,115,22,0.35)] transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
                    {sending ? 'Sending…' : <>Send message <Send className="h-4 w-4" /></>}
                  </button>
                  <p className="mt-3 text-[11.5px] text-slate-400">We use your details only to reply to this message. See our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
                </div>
              </form>
            )}
          </div>

          {/* Side info */}
          <div className="flex flex-col gap-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Direct Contact</p>
              
              <div className="mt-4 flex flex-col gap-3.5">
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-orange-600 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Email Support</p>
                    <p className="font-semibold text-slate-800">{CONTACT.email}</p>
                  </div>
                </a>

                <a href={`tel:${CONTACT.phoneTel}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-orange-600 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Phone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Phone Support</p>
                    <p className="font-semibold text-slate-800">{CONTACT.phoneDisplay}</p>
                  </div>
                </a>

                <a href={`https://wa.me/${CONTACT.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-700 hover:text-green-600 transition-colors">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                    <MessageCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">WhatsApp Chat</p>
                    <p className="font-semibold text-slate-800">Quick reply on WhatsApp</p>
                  </div>
                </a>
              </div>

              <div className="my-5 border-t border-slate-100" />

              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Our Office</p>
              <div className="mt-2.5 flex items-start gap-3 text-xs leading-relaxed text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" /> {CONTACT.address}
              </div>

              <div className="mt-5 flex gap-2.5">
                {SOCIAL_LINKS.map(({ label: l, href, Icon }) => (
                  <a key={l} href={href} target="_blank" rel="noopener noreferrer" aria-label={l} title={l}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-orange-500 hover:bg-orange-500 hover:text-white">
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-[#0A1628] p-6 text-white">
              <Headphones className="h-6 w-6 text-orange-400" />
              <h3 className="mt-3 text-lg font-black">Prefer to talk it through?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">Book a 30-minute, 1-on-1 consultation with a visa expert.</p>
              <button type="button" onClick={openConsultation}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600">
                Book a consultation <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

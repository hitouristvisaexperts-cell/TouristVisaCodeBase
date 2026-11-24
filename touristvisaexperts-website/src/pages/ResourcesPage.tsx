import { motion } from 'motion/react'
import { BookOpen, FileText, Newspaper, PlaneTakeoff, ArrowRight, Sparkles, Clock, Calendar } from 'lucide-react'
import Navbar from '../components/Navbar'
import { Footer } from '../components/site/Footer'
import { useNavigation } from '../context/NavigationContext'
import { FALLBACK_ARTICLES } from '../data/fallbackArticles'
import type { ArticleData } from '../context/NavigationContext'

const UPCOMING = [
  { Icon: BookOpen, title: 'Visa Guides', text: 'Step-by-step guides for Schengen, UK, USA, Canada and more.' },
  { Icon: FileText, title: 'Document Checklists', text: 'Essential checklists for every destination we cover.' },
  { Icon: Newspaper, title: 'Embassy Updates', text: 'Changes to rules, fees, and appointment wait times.' },
  { Icon: PlaneTakeoff, title: 'Travel Tips', text: 'Practical advice for your trip, from booking to boarding.' },
]

export default function ResourcesPage() {
  const { openConsultation, navigateTo, openArticle } = useNavigation()
  return (
    <div className="min-h-screen bg-[#F8F9FB]">
      <Navbar />

      <section className="relative overflow-hidden bg-gradient-to-br from-[#0A1628] via-[#0f2040] to-[#1a3560] px-4 pb-20 pt-28">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/4 top-0 h-[500px] w-[500px] rounded-full bg-orange-500/10 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-blue-500/10 blur-[100px]" />
        </div>
        <div className="container relative z-10 mx-auto max-w-4xl text-center">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-orange-400">
            <Sparkles size={12} /> Knowledge Base & Guides
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
            Visa Guides &amp; Travel Insights
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-white/70">
            Comprehensive visa requirements, document checklists, and application advice prepared by our visa consultants.
          </motion.p>
        </div>
      </section>

      {/* Published Guides Grid */}
      <section className="container mx-auto -mt-8 max-w-5xl px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {FALLBACK_ARTICLES.map((article) => (
            <div
              key={article._id}
              onClick={() => openArticle(article as ArticleData)}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col group"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange-600 shadow-sm">
                  {article.tag}
                </span>
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex items-center gap-4 text-xs text-slate-400 mb-2.5">
                  <span className="flex items-center gap-1"><Calendar size={13} /> {article.date}</span>
                  <span className="flex items-center gap-1"><Clock size={13} /> {article.readTime}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-orange-500 transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed line-clamp-2 mb-4 flex-1">
                  {article.excerpt}
                </p>
                <div className="flex items-center gap-1.5 text-sm font-bold text-orange-500 mt-auto">
                  Read full guide <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto mt-4 max-w-5xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {UPCOMING.map(({ Icon, title, text }, i) => (
            <motion.div key={title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="absolute right-4 top-4 rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-orange-500">Soon</span>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Icon className="h-5 w-5" /></div>
              <h3 className="mt-4 font-black text-[#0A1628]">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{text}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-slate-500">Need help right now?</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={openConsultation}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(249,115,22,0.3)] transition hover:bg-orange-600">
              Book a consultation <ArrowRight className="h-4 w-4" />
            </button>
            <button type="button" onClick={() => navigateTo('contact')}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-orange-300">
              Contact us
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

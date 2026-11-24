import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import DOMPurify from 'dompurify'
import Navbar from '../components/Navbar'
import { useNavigation } from '../context/NavigationContext'

interface Article {
  _id: string
  title: string
  tag: string
  tagColor: string
  excerpt: string
  imageUrl: string
  date: string
  readTime: string
  content: string
}

interface ArticlePageProps {
  article: Article
}

export default function ArticlePage({ article }: ArticlePageProps) {
  const { navigateTo } = useNavigation()

  // Sanitize HTML to prevent XSS — allow safe formatting tags only
  const safeContent = useMemo(() =>
    DOMPurify.sanitize(article.content, {
      ALLOWED_TAGS: ['h2','h3','p','ul','ol','li','strong','em','a','blockquote','br','span'],
      ALLOWED_ATTR: ['href','target','rel'],
      ALLOW_DATA_ATTR: false,
    }),
  [article.content])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [article._id])

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <Navbar />

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: 420, overflow: 'hidden' }}>
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt={article.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg,#0A1628,#1e3a5f)' }} />
        )}

        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(10,22,40,0.2) 0%, rgba(10,22,40,0.75) 60%, rgba(10,22,40,0.97) 100%)',
        }} />

        {/* Back button */}
        <button
          onClick={() => window.history.back()}
          style={{
            position: 'absolute', top: 88, left: 24,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.2)', borderRadius: 99,
            color: '#fff', padding: '7px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.22)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)' }}
        >
          <ArrowLeft size={14} /> Back to Blog
        </button>

        {/* Hero text */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '0 24px 40px',
          maxWidth: 800, margin: '0 auto',
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ maxWidth: 800 }}
          >
            {/* Tag */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: article.tagColor, color: '#fff',
              fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '4px 12px', borderRadius: 99, marginBottom: 14,
            }}>
              <Tag size={10} />
              {article.tag}
            </div>

            <h1 style={{
              color: '#fff', fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800,
              lineHeight: 1.25, letterSpacing: '-0.02em', margin: '0 0 16px',
            }}>
              {article.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              {article.date && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <Calendar size={13} /> {article.date}
                </span>
              )}
              {article.readTime && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <Clock size={13} /> {article.readTime}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 24px 80px' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15 }}
        >
          {/* Excerpt lead */}
          {article.excerpt && (
            <p style={{
              fontSize: 18, color: '#334155', lineHeight: 1.75, fontWeight: 500,
              borderLeft: `4px solid ${article.tagColor}`, paddingLeft: 20, marginBottom: 36,
              background: article.tagColor + '08', padding: '16px 20px',
              borderRadius: '0 10px 10px 0',
            }}>
              {article.excerpt}
            </p>
          )}

          {/* Full HTML content — sanitized via DOMPurify */}
          <div
            className="article-content"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {/* CTA */}
          <div style={{
            marginTop: 56, borderRadius: 20,
            background: 'linear-gradient(135deg,#0A1628,#1e3a5f)',
            padding: '36px 32px', textAlign: 'center',
          }}>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 8px' }}>
              Need Expert Help?
            </p>
            <h3 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              Get Your Visa Approved — Fast.
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, lineHeight: 1.7, margin: '0 0 24px' }}>
              Our expert team handles everything from document preparation to submission — with a track record that speaks for itself.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigateTo('consultation')}
                style={{
                  padding: '12px 28px', borderRadius: 99, border: 'none', cursor: 'pointer',
                  background: 'linear-gradient(135deg,#F97316,#f85c00)', color: '#fff',
                  fontSize: 14, fontWeight: 700, boxShadow: '0 4px 16px rgba(249,115,22,0.4)',
                }}
              >
                Book Free Consultation
              </button>
              <button
                onClick={() => navigateTo('resources')}
                style={{
                  padding: '12px 28px', borderRadius: 99, cursor: 'pointer',
                  background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                }}
              >
                More Articles
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Article content typography styles */}
      <style>{`
        .article-content h2 {
          font-size: 22px;
          font-weight: 800;
          color: #0A1628;
          margin: 36px 0 12px;
          letter-spacing: -0.02em;
        }
        .article-content h3 {
          font-size: 17px;
          font-weight: 700;
          color: #1e293b;
          margin: 24px 0 8px;
        }
        .article-content p {
          font-size: 15.5px;
          color: #334155;
          line-height: 1.85;
          margin: 0 0 18px;
        }
        .article-content ul, .article-content ol {
          margin: 0 0 20px;
          padding-left: 24px;
        }
        .article-content li {
          font-size: 15px;
          color: #334155;
          line-height: 1.75;
          margin-bottom: 6px;
        }
        .article-content strong {
          color: #0f172a;
          font-weight: 700;
        }
        .article-content em {
          font-style: italic;
        }
        .article-content blockquote {
          margin: 32px 0;
          padding: 20px 24px;
          background: #fff7ed;
          border-left: 4px solid #F97316;
          border-radius: 0 12px 12px 0;
          font-size: 15px;
          color: #7c2d12;
          line-height: 1.75;
          font-weight: 500;
        }
        .article-content a {
          color: #F97316;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        @media (max-width: 600px) {
          .article-content h2 { font-size: 19px; }
        }
      `}</style>
    </div>
  )
}

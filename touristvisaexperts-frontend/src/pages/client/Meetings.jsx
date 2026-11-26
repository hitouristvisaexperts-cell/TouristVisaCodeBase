import { useState, useEffect } from 'react'
import { getMeetings } from '../../api/client'
import { useClientCase } from '../../context/ClientCaseContext'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function ClientMeetings() {
  const { activeCaseId, loading: caseLoading } = useClientCase() || {}
  const [meetings, setMeetings]         = useState([])
  const [calendlyUrl, setCalendlyUrl]   = useState('')
  const [loading, setLoading]           = useState(true)

  useEffect(() => {
    if (caseLoading) return
    setLoading(true)
    Promise.all([
      getMeetings(activeCaseId).then(r => setMeetings(r.data.data || [])),
      fetch(`${API_BASE}/settings/public`)
        .then(r => r.json())
        .then(d => { if (d.data?.calendlyUrl) setCalendlyUrl(d.data.calendlyUrl) })
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [activeCaseId, caseLoading])

  if (loading) return <PageSpinner />

  const upcoming = meetings.filter(m => m.status === 'scheduled' && new Date(m.scheduledAt) > new Date())
  const past     = meetings.filter(m => m.status !== 'scheduled' || new Date(m.scheduledAt) <= new Date())

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 className="page-title">Meetings</h1>
        <p className="page-subtitle">Schedule and manage your consultation calls</p>
      </div>

      {/* ── Calendly embed ── */}
      {calendlyUrl ? (
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>Book a Consultation</div>
              <div style={{ fontSize: 12, color: '#94a3b8' }}>Choose a time that works for you</div>
            </div>
          </div>
          <iframe
            src={`${calendlyUrl}?hide_gdpr_banner=1&background_color=ffffff&text_color=0f172a&primary_color=f97316`}
            width="100%"
            height="630"
            frameBorder="0"
            title="Book a Consultation"
            style={{ display: 'block' }}
          />
        </div>
      ) : (
        <div style={{
          background: 'linear-gradient(135deg,#eff6ff,#f0f9ff)',
          border: '1px dashed #bfdbfe',
          borderRadius: 16,
          padding: '24px 20px',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#1e40af' }}>Booking Coming Soon</div>
            <div style={{ fontSize: 13, color: '#3b82f6', marginTop: 2 }}>Your consultant will reach out to schedule your first call.</div>
          </div>
        </div>
      )}

      {/* ── Scheduled meetings ── */}
      {meetings.length === 0 ? (
        <EmptyState title="No meetings yet" description="Your consultant will schedule a call with you after reviewing your application" />
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Upcoming ({upcoming.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map(m => <MeetingCard key={m._id} meeting={m} isUpcoming />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div style={{ marginTop: upcoming.length > 0 ? 8 : 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
                Past ({past.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {past.map(m => <MeetingCard key={m._id} meeting={m} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function MeetingCard({ meeting, isUpcoming }) {
  const statusStyle = {
    scheduled: { bg: '#eff6ff', color: '#3b82f6', border: '#bfdbfe' },
    completed:  { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    cancelled:  { bg: '#fff1f2', color: '#f43f5e', border: '#fecdd3' },
  }[meeting.status] || { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' }

  return (
    <div style={{
      background: isUpcoming ? 'linear-gradient(135deg,#eff6ff,#f0f9ff)' : '#fff',
      borderRadius: 18,
      border: isUpcoming ? '1px solid #bfdbfe' : '1px solid #f1f5f9',
      padding: 22,
      boxShadow: isUpcoming ? '0 4px 20px rgba(59,130,246,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            {isUpcoming && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 0 3px rgba(59,130,246,0.2)', flexShrink: 0 }} />
            )}
            <span style={{ fontWeight: 700, color: '#0f172a', fontSize: 15 }}>{meeting.title}</span>
            <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.border}` }}>
              {meeting.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4b5563', fontSize: 13.5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            {new Date(meeting.scheduledAt).toLocaleString()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12.5, marginTop: 4 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {meeting.duration} minutes
          </div>
          {meeting.notes && <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, fontStyle: 'italic' }}>{meeting.notes}</div>}
        </div>
        {isUpcoming && (
          <a href={meeting.meetLink} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: '#2563eb', color: '#fff', borderRadius: 12, padding: '10px 18px',
            textDecoration: 'none', fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 10l4.553-2.069A1 1 0 0 1 21 8.845v6.31a1 1 0 0 1-1.447.894L15 14M3 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/></svg>
            Join Meet
          </a>
        )}
      </div>
    </div>
  )
}

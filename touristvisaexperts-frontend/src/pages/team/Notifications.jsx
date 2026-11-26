import { useState, useEffect } from 'react'
import { getNotifications, markRead, markAllRead } from '../../api/team'
import { useSocket } from '../../context/SocketContext'
import { PageSpinner } from '../../components/shared/Spinner'
import EmptyState from '../../components/shared/EmptyState'

const TYPE_CONFIG = {
  status_update:      { icon: '📊', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  document_request:   { icon: '📄', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  meeting_scheduled:  { icon: '📅', color: '#8b5cf6', bg: '#f5f3ff', border: '#e9d5ff' },
  escalation:         { icon: '⚠️', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  general:            { icon: '🔔', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
}

export default function TeamNotifications() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const { clearUnread } = useSocket()

  const load = () =>
    getNotifications()
      .then(r => setNotifs(r.data.data || []))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
    clearUnread()
  }, [])

  const handleRead = async (id) => {
    await markRead(id)
    setNotifs(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n))
  }

  const handleReadAll = async () => {
    await markAllRead()
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  if (loading) return <PageSpinner />

  const unreadCount = notifs.filter(n => !n.isRead).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? <span style={{ color: '#10b981', fontWeight: 600 }}>{unreadCount} unread</span>
              : 'All caught up!'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleReadAll} style={{ fontSize: 13 }}>
            Mark all as read
          </button>
        )}
      </div>

      {notifs.length === 0 ? (
        <EmptyState title="No notifications" description="You'll be notified when clients upload documents or take actions" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifs.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.general
            return (
              <div key={n._id} style={{
                background: n.isRead ? '#fff' : cfg.bg,
                borderRadius: 16, padding: 18,
                border: n.isRead ? '1px solid #f1f5f9' : `1px solid ${cfg.border}`,
                boxShadow: n.isRead ? '0 1px 4px rgba(0,0,0,0.04)' : `0 2px 12px ${cfg.bg}`,
                display: 'flex', gap: 14, alignItems: 'flex-start',
                transition: 'all 0.15s',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, flexShrink: 0,
                  background: n.isRead ? '#f8fafc' : cfg.bg,
                  border: `1px solid ${n.isRead ? '#f1f5f9' : cfg.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}>
                  {cfg.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: n.isRead ? 600 : 700, color: n.isRead ? '#334155' : '#0f172a' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{n.message}</div>
                      <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 6 }}>
                        {new Date(n.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {!n.isRead && (
                        <>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.color, boxShadow: `0 0 0 3px ${cfg.bg}` }} />
                          <button onClick={() => handleRead(n._id)} style={{
                            fontSize: 12, fontWeight: 600, color: cfg.color,
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: '4px 8px', borderRadius: 6, fontFamily: 'var(--font-sans)',
                          }}>
                            Mark read
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

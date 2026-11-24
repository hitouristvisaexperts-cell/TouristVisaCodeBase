import { useState, useEffect } from 'react'
import { Link } from 'react-router'
import { getDashboard } from '../../api/manager'
import { PageSpinner } from '../../components/shared/Spinner'
import StatusBadge from '../../components/shared/StatusBadge'

const STATUS_COLOR = {
  'Welcome & Consultation Pending': '#f59e0b',
  'Profile Assessment': '#3b82f6',
  'Document Collection': '#8b5cf6',
  'Application Preparation': '#06b6d4',
  'Application Submitted': '#10b981',
  'Visa Approved': '#22c55e',
  'Visa Rejected': '#ef4444',
}

function Avatar({ name, size = 34, color = '#f59e0b' }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.3,
      background: `${color}18`, border: `1.5px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 800, color, flexShrink: 0,
    }}>
      {name?.charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function StatCard({ label, value, sub, color, icon, trend, linkTo }) {
  const card = (
    <div style={{
      background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9',
      padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'box-shadow 0.2s, transform 0.2s',
      cursor: linkTo ? 'pointer' : 'default',
    }}
      onMouseEnter={e => { if (linkTo) { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)' } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}12`, border: `1px solid ${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        {trend !== undefined && (
          <span style={{ fontSize: 11, fontWeight: 700, color: trend >= 0 ? '#10b981' : '#ef4444', background: trend >= 0 ? '#f0fdf4' : '#fff1f2', padding: '2px 8px', borderRadius: 99, border: `1px solid ${trend >= 0 ? '#bbf7d0' : '#fecdd3'}` }}>
            {trend >= 0 ? '+' : ''}{trend} this week
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  )
  return linkTo ? <Link to={linkTo} style={{ textDecoration: 'none' }}>{card}</Link> : card
}

function SectionHeader({ title, sub, linkTo, linkLabel = 'View all' }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
      <div>
        <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{sub}</div>}
      </div>
      {linkTo && (
        <Link to={linkTo} style={{ fontSize: 12, color: '#f59e0b', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
          {linkLabel}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>
      )}
    </div>
  )
}

function ActionLabel(action) {
  const map = {
    CREATE_CLIENT: { label: 'Client created', color: '#3b82f6' },
    UPDATE_CLIENT: { label: 'Client updated', color: '#8b5cf6' },
    LOGIN: { label: 'Logged in', color: '#10b981' },
    CHANGE_PASSWORD: { label: 'Password changed', color: '#f59e0b' },
    CREATE_TEAM: { label: 'Team member added', color: '#06b6d4' },
    STATUS_UPDATED: { label: 'Status updated', color: '#f97316' },
    ASSIGN_CLIENT: { label: 'Client assigned', color: '#22c55e' },
  }
  return map[action] || { label: action?.replace(/_/g, ' ').toLowerCase(), color: '#64748b' }
}

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function ManagerDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageSpinner />

  const { totalClients, totalTeam, byStatus, recentClients, totalPurchased, recentActivity, teamWorkload, newThisWeek } = data || {}
  const activeCount = (byStatus || []).reduce((a, b) => a + b.count, 0)
  const approvedCount = (byStatus || []).find(s => s._id === 'Visa Approved')?.count || 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', margin: 0 }}>Manager Dashboard</h1>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div className="r-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatCard label="Total Clients" value={totalClients || 0} sub="All registered accounts" color="#f59e0b" trend={newThisWeek} linkTo="/manager/clients"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
        <StatCard label="Team Members" value={totalTeam || 0} sub="Active consultants" color="#10b981" linkTo="/manager/team"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
        />
        <StatCard label="Active Applications" value={activeCount} sub="Across all statuses" color="#8b5cf6" linkTo="/manager/clients"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>}
        />
        <StatCard label="Paid Clients" value={totalPurchased || 0} sub={`${approvedCount} visas approved`} color="#3b82f6"
          icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>}
        />
      </div>

      <div className="r-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <SectionHeader title="Applications by Status" sub={`${activeCount} total`} linkTo="/manager/clients" linkLabel="View clients" />
          {byStatus?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byStatus.map(s => {
                const pct = Math.round((s.count / activeCount) * 100)
                const color = STATUS_COLOR[s._id] || '#64748b'
                return (
                  <Link key={s._id} to={`/manager/clients?status=${encodeURIComponent(s._id)}`} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '8px 10px', borderRadius: 10, transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                        <StatusBadge status={s._id} />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>{s.count}</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '24px 0' }}>No data yet</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <SectionHeader title="Team Workload" sub="Clients per member" linkTo="/manager/team" linkLabel="View team" />
          {teamWorkload?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {teamWorkload.map((m, i) => {
                const maxCount = Math.max(...teamWorkload.map(x => x.count), 1)
                const pct = Math.round((m.count / maxCount) * 100)
                const colors = ['#f59e0b', '#10b981', '#8b5cf6', '#3b82f6', '#06b6d4', '#f97316']
                const col = colors[i % colors.length]
                return (
                  <div key={m._id} style={{ padding: '8px 10px', borderRadius: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <Avatar name={m.name} size={28} color={col} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1 }}>{m.name}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: col, background: `${col}12`, padding: '2px 8px', borderRadius: 6 }}>{m.count} clients</span>
                    </div>
                    <div style={{ height: 5, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 99, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '24px 0' }}>No team data yet</p>
          )}
        </div>
      </div>

      <div className="r-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <SectionHeader title="Recent Clients" sub="Latest registrations" linkTo="/manager/clients" />
          {recentClients?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentClients.map(c => (
                <Link key={c._id} to={`/manager/clients/${c._id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between', padding: '9px 10px', borderRadius: 10, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: '1 1 200px', minWidth: 0 }}>
                      <Avatar name={c.user?.name} size={32} color="#f59e0b" />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>{c.user?.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b' }}>
                          {c.destinationCountry ? `→ ${c.destinationCountry}` : c.user?.email}
                          {c.assignedTo ? ` · ${c.assignedTo.name}` : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3, marginLeft: 'auto' }}>
                      <StatusBadge status={c.clientStatus} />
                      {c.isPurchased && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', padding: '1px 6px', borderRadius: 4, border: '1px solid #fde68a' }}>Paid</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '24px 0' }}>No clients yet</p>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #f1f5f9', padding: 22, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <SectionHeader title="Recent Activity" sub="Team actions & events" />
          {recentActivity?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {recentActivity.map((a, i) => {
                const { label, color } = ActionLabel(a.action)
                return (
                  <div key={a._id || i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px', borderRadius: 10, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0f172a' }}>
                        <span style={{ color }}>{label}</span>
                        {a.description ? ` — ${a.description.replace(/^Admin (created|updated) client /, '')}` : ''}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                        {a.performedBy?.name || 'System'} · {timeAgo(a.createdAt)}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p style={{ fontSize: 13, color: '#64748b', textAlign: 'center', padding: '24px 0' }}>No activity yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

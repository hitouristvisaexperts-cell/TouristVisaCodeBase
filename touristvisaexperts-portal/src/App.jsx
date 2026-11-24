import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import { useEffect } from 'react'
import { getMe } from './api/auth'

import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'

// Receives token from marketing site login, stores it, redirects to dashboard
function AuthCallback() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    const token = new URLSearchParams(search).get('token')
    if (!token) { navigate('/login', { replace: true }); return }
    // A stale/expired token can still be sitting in localStorage from a
    // previous session. If AuthProvider's own mount-time getMe() check races
    // this and hits a 401 first, the axios interceptor hard-redirects to
    // /login via window.location — which throws away this fresh ?token=
    // entirely. Clearing it before writing the new one prevents that stale
    // call from ever firing with bad credentials.
    localStorage.removeItem('fv_token')
    localStorage.removeItem('fv_user')
    localStorage.setItem('fv_token', token)
    getMe()
      .then(res => {
        loginUser(token, res.data.user)
        const role = res.data.user?.role
        if (role === 'admin') navigate('/admin/dashboard', { replace: true })
        else if (role === 'manager') navigate('/manager/dashboard', { replace: true })
        else if (role === 'team') navigate('/team/clients', { replace: true })
        else navigate('/client/status', { replace: true })
      })
      .catch(() => navigate('/login', { replace: true }))
  }, [])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
      <div style={{ width:36, height:36, border:'3px solid #f97316', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

// Admin
import AdminDashboard from './pages/admin/Dashboard'
import AdminClients from './pages/admin/Clients'
import AdminClientDetail from './pages/admin/ClientDetail'
import AdminTeam from './pages/admin/Team'
import AdminFAQs from './pages/admin/FAQs'
import AuditLogs from './pages/admin/AuditLogs'
import AdminSettings from './pages/admin/Settings'
import AdminEscalations from './pages/admin/Escalations'
import AdminNotifications from './pages/admin/Notifications'
import AdminFlightOrders from './pages/admin/FlightOrders'
import AdminArticles from './pages/admin/Articles'
import AdminPricing from './pages/admin/Pricing'
import AdminEnquiries from './pages/admin/Enquiries'
import AdminTestimonials from './pages/admin/Testimonials'

// Manager
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerClients from './pages/manager/Clients'
import ManagerClientDetail from './pages/manager/ClientDetail'
import ManagerTeam from './pages/manager/Team'
import ManagerEscalations from './pages/manager/Escalations'
import ManagerNotifications from './pages/manager/Notifications'

// Team
import TeamClients from './pages/team/Clients'
import TeamClientDetail from './pages/team/ClientDetail'
import TeamNotifications from './pages/team/Notifications'

// Client
import ClientStatus from './pages/client/Status'
import ClientDocuments from './pages/client/Documents'
import ClientMeetings from './pages/client/Meetings'
import ClientNotifications from './pages/client/Notifications'
import ClientFAQs from './pages/client/FAQs'
import ClientSupport from './pages/client/Support'

function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />
  if (user.role === 'team') return <Navigate to="/team/clients" replace />
  return <Navigate to="/client/status" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/change-password" element={<ProtectedRoute roles={['admin','manager','team','client']}><ChangePassword /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="clients/:id" element={<AdminClientDetail />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="faqs" element={<AdminFAQs />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="escalations" element={<AdminEscalations />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="flight-orders" element={<AdminFlightOrders />} />
            <Route path="articles"     element={<AdminArticles />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
          </Route>

          {/* Manager Routes */}
          <Route path="/manager" element={<ProtectedRoute roles={['manager', 'admin']}><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="clients" element={<ManagerClients />} />
            <Route path="clients/:id" element={<ManagerClientDetail />} />
            <Route path="team" element={<ManagerTeam />} />
            <Route path="escalations" element={<ManagerEscalations />} />
            <Route path="notifications" element={<ManagerNotifications />} />
          </Route>

          {/* Team Routes */}
          <Route path="/team" element={<ProtectedRoute roles={['team', 'admin']}><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/team/clients" replace />} />
            <Route path="clients" element={<TeamClients />} />
            <Route path="clients/:id" element={<TeamClientDetail />} />
            <Route path="notifications" element={<TeamNotifications />} />
          </Route>

          {/* Client Routes */}
          <Route path="/client" element={<ProtectedRoute roles={['client']}><AppLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/client/status" replace />} />
            <Route path="status" element={<ClientStatus />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="meetings" element={<ClientMeetings />} />
            <Route path="notifications" element={<ClientNotifications />} />
            <Route path="faqs" element={<ClientFAQs />} />
            <Route path="support" element={<ClientSupport />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}

import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import ProtectedRoute from './components/layout/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import { useEffect } from 'react'
import { getMe } from './api/auth'

// Auth Pages
import Login from './pages/Login'
import AdminLogin from './pages/AdminLogin'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ChangePassword from './pages/ChangePassword'

// Admin Pages
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
import AdminRefunds from './pages/admin/Refunds'

// Manager Pages
import ManagerDashboard from './pages/manager/Dashboard'
import ManagerClients from './pages/manager/Clients'
import ManagerClientDetail from './pages/manager/ClientDetail'
import ManagerTeam from './pages/manager/Team'
import ManagerEscalations from './pages/manager/Escalations'
import ManagerNotifications from './pages/manager/Notifications'

// Team Pages
import TeamClients from './pages/team/Clients'
import TeamClientDetail from './pages/team/ClientDetail'
import TeamNotifications from './pages/team/Notifications'

// Client Pages
import ClientStatus from './pages/client/Status'
import ClientDocuments from './pages/client/Documents'
import ClientMeetings from './pages/client/Meetings'
import ClientNotifications from './pages/client/Notifications'
import ClientFAQs from './pages/client/FAQs'
import ClientSupport from './pages/client/Support'

// Public Website App
import WebsiteApp from './WebsiteApp'

/**
 * Handles callback from magic link, OAuth, or payment success token exchange
 */
function AuthCallback() {
  const { loginUser } = useAuth()
  const navigate = useNavigate()
  const { search } = useLocation()

  useEffect(() => {
    const token = new URLSearchParams(search).get('token')
    if (!token) { navigate('/login', { replace: true }); return }
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
  }, [loginUser, navigate, search])

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f8fafc' }}>
      <div style={{ width:36, height:36, border:'3px solid #f97316', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Routes>
          {/* ── Authentication Routes ── */}
          <Route path="/login" element={<Login />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/auth" element={<AuthCallback />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/change-password" element={
            <ProtectedRoute roles={['admin','manager','team','client']}>
              <ChangePassword />
            </ProtectedRoute>
          } />

          {/* ── Admin Dashboard & Management Routes ── */}
          <Route path="/admin" element={
            <ProtectedRoute roles={['admin']} loginPath="/admin/login">
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="clients" element={<AdminClients />} />
            <Route path="clients/:id" element={<AdminClientDetail />} />
            <Route path="refunds" element={<AdminRefunds />} />
            <Route path="team" element={<AdminTeam />} />
            <Route path="faqs" element={<AdminFAQs />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="escalations" element={<AdminEscalations />} />
            <Route path="notifications" element={<AdminNotifications />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="pricing" element={<AdminPricing />} />
            <Route path="enquiries" element={<AdminEnquiries />} />
            <Route path="flight-orders" element={<AdminFlightOrders />} />
            <Route path="articles" element={<AdminArticles />} />
            <Route path="testimonials" element={<AdminTestimonials />} />
          </Route>

          {/* ── Manager Routes ── */}
          <Route path="/manager" element={
            <ProtectedRoute roles={['manager', 'admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/manager/dashboard" replace />} />
            <Route path="dashboard" element={<ManagerDashboard />} />
            <Route path="clients" element={<ManagerClients />} />
            <Route path="clients/:id" element={<ManagerClientDetail />} />
            <Route path="team" element={<ManagerTeam />} />
            <Route path="escalations" element={<ManagerEscalations />} />
            <Route path="notifications" element={<ManagerNotifications />} />
          </Route>

          {/* ── Team Consultant Routes ── */}
          <Route path="/team" element={
            <ProtectedRoute roles={['team', 'admin']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/team/clients" replace />} />
            <Route path="clients" element={<TeamClients />} />
            <Route path="clients/:id" element={<TeamClientDetail />} />
            <Route path="notifications" element={<TeamNotifications />} />
          </Route>

          {/* ── Client Portal Routes ── */}
          <Route path="/client" element={
            <ProtectedRoute roles={['client']}>
              <AppLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/client/status" replace />} />
            <Route path="status" element={<ClientStatus />} />
            <Route path="documents" element={<ClientDocuments />} />
            <Route path="meetings" element={<ClientMeetings />} />
            <Route path="notifications" element={<ClientNotifications />} />
            <Route path="faqs" element={<ClientFAQs />} />
            <Route path="support" element={<ClientSupport />} />
          </Route>

          {/* ── Public Website Routes (Homepage, Visas, Checkout, About, Contact, etc.) ── */}
          <Route path="/*" element={<WebsiteApp />} />
        </Routes>
      </SocketProvider>
    </AuthProvider>
  )
}

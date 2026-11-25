import { Navigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { PageSpinner } from '../shared/Spinner'

export default function ProtectedRoute({ children, roles, loginPath }) {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />

  if (!user) {
    const isStrictAdminRoute = roles && roles.includes('admin') && !roles.includes('client')
    return <Navigate to={loginPath || (isStrictAdminRoute ? '/admin/login' : '/login')} replace />
  }

  // Role-based protection: prevent unauthorized cross-role access
  if (roles && !roles.includes(user.role)) {
    // Admins must not be allowed to access Client Dashboard
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />
    }
    // Clients must not be allowed to access Admin Dashboard
    if (user.role === 'client') {
      return <Navigate to="/client/status" replace />
    }
    if (user.role === 'manager') return <Navigate to="/manager/dashboard" replace />
    if (user.role === 'team') return <Navigate to="/team/clients" replace />
    return <Navigate to="/login" replace />
  }

  return children
}

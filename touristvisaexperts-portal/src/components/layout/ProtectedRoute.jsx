import { Navigate } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { PageSpinner } from '../shared/Spinner'

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()

  if (loading) return <PageSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />

  return children
}

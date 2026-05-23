import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export default function AdminRoute({ children }) {
  const { user, isLoading } = useAuth()

  if (isLoading) return null

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== 'admin') return <Navigate to="/unauthorized" replace />

  return children
}

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import PrivateRoute from '@/components/routing/PrivateRoute'
import AdminRoute from '@/components/routing/AdminRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import ProfilePage from '@/pages/voter/ProfilePage'
import UsersPage from '@/pages/admin/UsersPage'

function RootRedirect() {
  const { user, isLoading } = useAuth()
  if (isLoading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin/elections' : '/elections'} replace />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Voter routes */}
      <Route path="/elections" element={<PrivateRoute><div>Elections (coming soon)</div></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/elections" element={<AdminRoute><div>Admin Elections (coming soon)</div></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
    </Routes>
  )
}

export default App

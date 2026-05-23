import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import PrivateRoute from '@/components/routing/PrivateRoute'
import AdminRoute from '@/components/routing/AdminRoute'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import ProfilePage from '@/pages/voter/ProfilePage'
import VoterElectionsPage from '@/pages/voter/ElectionsPage'
import UsersPage from '@/pages/admin/UsersPage'
import AdminElectionsPage from '@/pages/admin/ElectionsPage'
import ElectionFormPage from '@/pages/admin/ElectionFormPage'
import ElectionDetailPage from '@/pages/admin/ElectionDetailPage'
import ResultsPage from '@/pages/admin/ResultsPage'
import BallotPage from '@/pages/voter/BallotPage'
import VotingHistoryPage from '@/pages/voter/VotingHistoryPage'

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
      <Route path="/elections" element={<PrivateRoute><VoterElectionsPage /></PrivateRoute>} />
      <Route path="/elections/:id/vote" element={<PrivateRoute><BallotPage /></PrivateRoute>} />
      <Route path="/history" element={<PrivateRoute><VotingHistoryPage /></PrivateRoute>} />
      <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/elections" element={<AdminRoute><AdminElectionsPage /></AdminRoute>} />
      <Route path="/admin/elections/new" element={<AdminRoute><ElectionFormPage /></AdminRoute>} />
      <Route path="/admin/elections/:id/edit" element={<AdminRoute><ElectionFormPage /></AdminRoute>} />
      <Route path="/admin/elections/:id" element={<AdminRoute><ElectionDetailPage /></AdminRoute>} />
      <Route path="/admin/elections/:id/results" element={<AdminRoute><ResultsPage /></AdminRoute>} />
      <Route path="/admin/users" element={<AdminRoute><UsersPage /></AdminRoute>} />
    </Routes>
  )
}

export default App

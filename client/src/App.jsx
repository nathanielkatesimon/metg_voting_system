import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import PrivateRoute from '@/components/routing/PrivateRoute'
import AdminRoute from '@/components/routing/AdminRoute'
import VoterLayout from '@/components/layout/VoterLayout'
import AdminLayout from '@/components/layout/AdminLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import UnauthorizedPage from '@/pages/UnauthorizedPage'
import NotFoundPage from '@/pages/NotFoundPage'
import ProfilePage from '@/pages/voter/ProfilePage'
import VoterElectionsPage from '@/pages/voter/ElectionsPage'
import BallotPage from '@/pages/voter/BallotPage'
import VotingHistoryPage from '@/pages/voter/VotingHistoryPage'
import UsersPage from '@/pages/admin/UsersPage'
import AdminElectionsPage from '@/pages/admin/ElectionsPage'
import ElectionFormPage from '@/pages/admin/ElectionFormPage'
import ElectionDetailPage from '@/pages/admin/ElectionDetailPage'
import ResultsPage from '@/pages/admin/ResultsPage'

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

      {/* Voter routes — wrapped in VoterLayout */}
      <Route element={<PrivateRoute><VoterLayout /></PrivateRoute>}>
        <Route path="/elections" element={<VoterElectionsPage />} />
        <Route path="/elections/:id/vote" element={<BallotPage />} />
        <Route path="/history" element={<VotingHistoryPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      {/* Admin routes — wrapped in AdminLayout */}
      <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route path="/admin/elections" element={<AdminElectionsPage />} />
        <Route path="/admin/elections/new" element={<ElectionFormPage />} />
        <Route path="/admin/elections/:id/edit" element={<ElectionFormPage />} />
        <Route path="/admin/elections/:id" element={<ElectionDetailPage />} />
        <Route path="/admin/elections/:id/results" element={<ResultsPage />} />
        <Route path="/admin/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default App

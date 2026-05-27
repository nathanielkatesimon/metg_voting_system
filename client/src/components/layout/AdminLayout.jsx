import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

function SidebarLink({ to, icon, label, end, sub }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        sub
          ? `flex items-center gap-2 px-3 py-1.5 rounded-md text-xs transition-colors ${
              isActive
                ? 'font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`
          : `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
              isActive
                ? 'bg-muted font-medium text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`
      }
    >
      {icon && <i className={`bx ${icon} text-base`} />}
      {label}
    </NavLink>
  )
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 w-56 border-r border-border bg-background flex flex-col',
          'transition-transform duration-200',
          'sm:static sm:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {/* User info */}
        <div className="px-4 pt-6 pb-4 border-b border-border shrink-0">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
            <i className="bx bx-user text-xl text-muted-foreground" />
          </div>
          <p className="font-semibold text-sm leading-tight truncate">{user?.fullName ?? 'Administrator'}</p>
          <p className="text-xs text-muted-foreground">Admin</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto" onClick={() => setSidebarOpen(false)}>
          <SidebarLink to="/admin/elections" end icon="bx-grid-alt" label="Dashboard" />

          <div className="pt-4 pb-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Manage
            </p>
          </div>

          <SidebarLink to="/admin/users" end icon="bx-group" label="Manage Voters" />
          <div className="pl-5 space-y-0.5">
            <SidebarLink to="/admin/users?add=1" label="Add Voter" sub />
            <SidebarLink to="/admin/users?delete=1" label="Delete Voter" sub />
          </div>

          <SidebarLink to="/admin/candidates" end icon="bx-id-card" label="Manage Candidates" />
          <div className="pl-5 space-y-0.5">
            <SidebarLink to="/admin/candidates?add=1" label="Add Candidate" sub />
            <SidebarLink to="/admin/candidates?delete=1" label="Delete Candidate" sub />
          </div>
        </nav>

        {/* Log Out */}
        <div className="p-3 border-t border-border shrink-0">
          <button
            onClick={() => setLogoutConfirm(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <i className="bx bx-log-out text-base" />
            Log Out
          </button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="flex items-center h-14 px-4 border-b border-border sm:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-muted mr-2"
            aria-label="Open menu"
          >
            <i className="bx bx-menu text-xl" />
          </button>
          <span className="font-bold text-sm">CCF Ballota 2026</span>
        </div>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {logoutConfirm && (
        <ConfirmDialog
          title="Log Out"
          description="Are you sure you want to log out?"
          confirmLabel="Log Out"
          onConfirm={handleLogout}
          onClose={() => setLogoutConfirm(false)}
          isLoading={isLoggingOut}
        />
      )}
    </div>
  )
}

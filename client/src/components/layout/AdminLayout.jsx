import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

const links = [
  { to: '/admin/elections', label: 'Elections' },
  { to: '/admin/users', label: 'Voters' },
]

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
        <div className="flex items-center h-14 px-4 border-b border-border shrink-0">
          <span className="font-bold text-sm">Purok Elections</span>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {links.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1 shrink-0">
          <p className="px-3 py-1 text-xs text-muted-foreground truncate">{user?.fullName}</p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => setLogoutConfirm(true)}
          >
            Logout
          </Button>
        </div>
      </aside>

      {/* Content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header with hamburger */}
        <div className="flex items-center h-14 px-4 border-b border-border sm:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md hover:bg-muted mr-3"
            aria-label="Open menu"
          >
            <div className="w-5 space-y-1">
              <span className="block h-0.5 bg-foreground rounded" />
              <span className="block h-0.5 bg-foreground rounded" />
              <span className="block h-0.5 bg-foreground rounded" />
            </div>
          </button>
          <span className="font-bold text-sm">Purok Elections</span>
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

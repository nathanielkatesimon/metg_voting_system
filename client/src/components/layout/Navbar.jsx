import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [logoutConfirm, setLogoutConfirm] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    await logout()
    navigate('/login', { replace: true })
  }

  const links = user?.role === 'admin'
    ? [
        { to: '/admin/elections', label: 'Elections' },
        { to: '/admin/users', label: 'Voters' },
      ]
    : [
        { to: '/elections', label: 'Elections' },
        { to: '/history', label: 'History' },
        { to: '/profile', label: 'Profile' },
      ]

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-border bg-background">
      <div className="flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-5">
          <span className="font-bold text-sm">Purok Elections</span>
          <nav className="hidden sm:flex items-center gap-1">
            {links.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-muted text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-muted-foreground">{user?.fullName}</span>
          <Button variant="ghost" size="sm" onClick={() => setLogoutConfirm(true)}>
            Logout
          </Button>
        </div>
      </div>
      {/* Mobile nav */}
      <nav className="flex sm:hidden items-center gap-1 px-3 pb-2">
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-1 rounded-md text-sm transition-colors ${
                isActive
                  ? 'bg-muted text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </header>

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
    </>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function AdminLoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ voterId: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === 'admin' ? '/admin/elections' : '/elections', { replace: true })
    }
  }, [user, isLoading, navigate])

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.voterId || !form.password) return setError('Username and password are required.')
    setIsSubmitting(true)
    try {
      const userData = await login(form)
      if (userData.role !== 'admin') {
        setError('This account does not have admin access.')
        return
      }
      navigate('/admin/elections', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid username or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Title */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Admin Login</h1>
          <hr className="border-border" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="voterId">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <i className="bx bx-user text-base" />
              </span>
              <input
                id="voterId"
                name="voterId"
                type="text"
                autoComplete="username"
                value={form.voterId}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="Enter username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <i className="bx bx-lock-alt text-base" />
              </span>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-input bg-background pl-9 pr-10 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-base`} />
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full bg-foreground text-background hover:bg-foreground/90" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign In as Admin'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="hover:text-foreground transition-colors"
          >
            ← Back to Voter Login
          </button>
        </p>
      </div>
    </div>
  )
}

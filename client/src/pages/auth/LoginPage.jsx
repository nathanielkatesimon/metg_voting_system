import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const { user, isLoading, login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ voterId: '', password: '' })
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

    if (!form.voterId || !form.password) {
      return setError('Voter ID and password are required.')
    }

    setIsSubmitting(true)
    try {
      const userData = await login(form)
      navigate(userData.role === 'admin' ? '/admin/elections' : '/elections', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid voter ID or password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="voterId">Voter ID</label>
            <input
              id="voterId"
              name="voterId"
              type="text"
              autoComplete="username"
              value={form.voterId}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="e.g. VTR-2024-001"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

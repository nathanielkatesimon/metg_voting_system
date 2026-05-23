import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { updateProfile, changePassword } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { showSuccess, showError } from '@/lib/toast'

function ProfileForm({ user, onUpdated }) {
  const [fullName, setFullName] = useState(user.fullName)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!fullName.trim()) return setError('Name is required.')

    setIsSubmitting(true)
    try {
      const updated = await updateProfile({ fullName: fullName.trim() })
      onUpdated(updated)
      showSuccess('Profile updated.')
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="fullName">Full Name</label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={e => { setFullName(e.target.value); setError('') }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Voter ID</label>
        <input
          type="text"
          value={user.voterId}
          disabled
          className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">Voter ID cannot be changed.</p>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Role</label>
        <input
          type="text"
          value={user.role}
          disabled
          className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground capitalize"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving…' : 'Save Changes'}
      </Button>
    </form>
  )
}

function PasswordForm() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
      return setError('All fields are required.')
    }
    if (form.newPassword.length < 8) {
      return setError('New password must be at least 8 characters.')
    }
    if (form.newPassword !== form.confirmPassword) {
      return setError('New passwords do not match.')
    }

    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword })
      showSuccess('Password changed successfully.')
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {[
        { name: 'currentPassword', label: 'Current Password' },
        { name: 'newPassword', label: 'New Password', hint: 'Min. 8 characters' },
        { name: 'confirmPassword', label: 'Confirm New Password' },
      ].map(({ name, label, hint }) => (
        <div key={name} className="space-y-1">
          <label className="text-sm font-medium" htmlFor={name}>{label}</label>
          <input
            id={name}
            name={name}
            type="password"
            value={form[name]}
            onChange={handleChange}
            placeholder={hint}
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      ))}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Updating…' : 'Change Password'}
      </Button>
    </form>
  )
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [currentUser, setCurrentUser] = useState(user)

  const initials = currentUser.fullName
    ? currentUser.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : currentUser.voterId.slice(0, 2).toUpperCase()

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center text-2xl font-bold shrink-0 select-none">
          {initials}
        </div>
        <div className="min-w-0 space-y-0.5">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">My Account</p>
          <h1 className="text-xl font-bold truncate">{currentUser.fullName || 'Community Voter'}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
            <i className="bx bx-id-card text-base" />
            {currentUser.voterId}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 capitalize">
            <i className="bx bx-shield text-sm" />
            {currentUser.role}
          </p>
        </div>
      </div>

      {/* Info tiles */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <i className="bx bx-user text-sm" /> Full Name
          </p>
          <p className="text-sm font-medium truncate">{currentUser.fullName || '—'}</p>
        </div>
        <div className="rounded-xl border border-border p-4 space-y-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <i className="bx bx-id-card text-sm" /> Voter ID
          </p>
          <p className="text-sm font-medium font-mono truncate">{currentUser.voterId}</p>
        </div>
      </div>

      {/* Personal info form */}
      <section className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <i className="bx bx-edit-alt text-primary text-lg" />
          Personal Information
        </h2>
        <ProfileForm user={currentUser} onUpdated={setCurrentUser} />
      </section>

      {/* Change password form */}
      <section className="rounded-xl border border-border p-6 space-y-4">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <i className="bx bx-lock-alt text-primary text-lg" />
          Change Password
        </h2>
        <PasswordForm />
      </section>

    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getElection, createElection, updateElection } from '@/services/electionService'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'

function toDateInputValue(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toISOString().slice(0, 10)
}

export default function ElectionFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [form, setForm] = useState({ title: '', description: '', startDate: '', endDate: '' })
  const [isLoading, setIsLoading] = useState(isEdit)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isEdit) return
    getElection(id)
      .then(data => {
        setForm({
          title: data.title,
          description: data.description || '',
          startDate: toDateInputValue(data.startDate),
          endDate: toDateInputValue(data.endDate),
        })
      })
      .catch(() => setError('Failed to load election.'))
      .finally(() => setIsLoading(false))
  }, [id, isEdit])

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('Title is required.')

    setIsSubmitting(true)
    setError('')
    try {
      if (isEdit) {
        await updateElection(id, form)
      } else {
        await createElection(form)
      }
      navigate('/admin/elections')
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-7 w-36" />
      </div>
      <div className="rounded-xl border border-border p-6 space-y-4">
        <div className="space-y-1">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-20 w-full" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/elections">← Back</Link>
        </Button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Election' : 'New Election'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-border p-6 space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="title">Title *</label>
          <input
            id="title"
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Purok 5 Officers Election 2025"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={form.description}
            onChange={handleChange}
            placeholder="Optional description or instructions for voters"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="startDate">Start Date</label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              value={form.startDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="endDate">End Date</label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              value={form.endDate}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end pt-2">
          <Button type="button" variant="outline" asChild>
            <Link to="/admin/elections">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Election'}
          </Button>
        </div>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { createPosition, updatePosition } from '@/services/positionService'
import { Button } from '@/components/ui/button'

export default function PositionFormModal({ electionId, position, onSuccess, onClose }) {
  const isEdit = Boolean(position)
  const [form, setForm] = useState({
    name: position?.name ?? '',
    order: position?.order ?? 0,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    const value = e.target.name === 'order' ? Number(e.target.value) : e.target.value
    setForm(prev => ({ ...prev, [e.target.name]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Position name is required.')

    setIsSubmitting(true)
    try {
      const saved = isEdit
        ? await updatePosition(position._id, form)
        : await createPosition(electionId, form)
      onSuccess(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold">{isEdit ? 'Edit Position' : 'Add Position'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="pos-name">Name *</label>
            <input
              id="pos-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Purok Chairman"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="pos-order">Display Order</label>
            <input
              id="pos-order"
              name="order"
              type="number"
              min="0"
              value={form.order}
              onChange={handleChange}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            <p className="text-xs text-muted-foreground">Lower numbers appear first on the ballot.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Position'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

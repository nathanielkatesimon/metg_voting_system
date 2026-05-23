import { useState, useRef } from 'react'
import { createCandidate, updateCandidate } from '@/services/candidateService'
import { Button } from '@/components/ui/button'

export default function CandidateFormModal({ electionId, positionId, candidate, onSuccess, onClose }) {
  const isEdit = Boolean(candidate)
  const [form, setForm] = useState({
    name: candidate?.name ?? '',
    party: candidate?.party ?? '',
    platform: candidate?.platform ?? '',
    imageFile: null,
  })
  const [imagePreview, setImagePreview] = useState(candidate?.imagePath ?? null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  function handleImageChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setForm(prev => ({ ...prev, imageFile: file }))
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return setError('Candidate name is required.')

    const data = new FormData()
    data.append('name', form.name.trim())
    data.append('party', form.party.trim())
    data.append('platform', form.platform.trim())
    if (!isEdit) {
      data.append('electionId', electionId)
      data.append('positionId', positionId)
    }
    if (form.imageFile) data.append('image', form.imageFile)

    setIsSubmitting(true)
    try {
      const saved = isEdit
        ? await updateCandidate(candidate._id, data)
        : await createCandidate(data)
      onSuccess(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-md space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="font-semibold">{isEdit ? 'Edit Candidate' : 'Add Candidate'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="cand-name">Name *</label>
            <input
              id="cand-name"
              name="name"
              type="text"
              value={form.name}
              onChange={handleChange}
              placeholder="Full name"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="cand-party">Party / Affiliation</label>
            <input
              id="cand-party"
              name="party"
              type="text"
              value={form.party}
              onChange={handleChange}
              placeholder="Optional"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="cand-platform">Platform</label>
            <textarea
              id="cand-platform"
              name="platform"
              rows={3}
              value={form.platform}
              onChange={handleChange}
              placeholder="Brief description of goals or platform"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Photo</label>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-20 h-20 rounded-full object-cover border border-border"
              />
            )}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                {imagePreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <p className="text-xs text-muted-foreground">JPEG, PNG, or WebP · max 2 MB</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Candidate'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

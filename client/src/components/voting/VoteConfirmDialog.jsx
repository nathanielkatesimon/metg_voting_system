import { useState } from 'react'
import { castVote } from '@/services/voteService'
import { Button } from '@/components/ui/button'

export default function VoteConfirmDialog({ election, position, candidates, onSuccess, onClose }) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    try {
      for (const c of candidates) {
        await castVote({ electionId: election._id, positionId: position._id, candidateId: c._id })
      }
      onSuccess(candidates.map(c => c._id))
    } catch (err) {
      setError(err.response?.data?.message || 'Vote failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold">Confirm Vote{candidates.length > 1 ? 's' : ''}</h2>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>
            You are voting for the following candidate{candidates.length > 1 ? 's' : ''} for{' '}
            <span className="font-medium text-foreground">{position.name}</span>:
          </p>
          <ul className="list-disc list-inside">
            {candidates.map(c => (
              <li key={c._id} className="font-medium text-foreground">{c.name}</li>
            ))}
          </ul>
          <p className="pt-1">This action cannot be undone.</p>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

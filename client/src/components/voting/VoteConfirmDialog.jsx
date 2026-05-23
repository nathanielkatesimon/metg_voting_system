import { useState } from 'react'
import { castVote } from '@/services/voteService'
import { Button } from '@/components/ui/button'

export default function VoteConfirmDialog({ election, position, candidate, onSuccess, onClose }) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    try {
      await castVote({
        electionId: election._id,
        positionId: position._id,
        candidateId: candidate._id,
      })
      onSuccess()
    } catch (err) {
      setError(err.response?.data?.message || 'Vote failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold">Confirm Vote</h2>
        <p className="text-sm text-muted-foreground">
          You are voting for{' '}
          <span className="font-medium text-foreground">{candidate.name}</span>
          {' '}for{' '}
          <span className="font-medium text-foreground">{position.name}</span>.
          This action cannot be undone.
        </p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting…' : 'Confirm Vote'}
          </Button>
        </div>
      </div>
    </div>
  )
}

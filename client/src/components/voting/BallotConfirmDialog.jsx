import { useState } from 'react'
import { castVote } from '@/services/voteService'
import { Button } from '@/components/ui/button'

export default function BallotConfirmDialog({ election, positions, candidatesByPosition, selections, onSuccess, onClose }) {
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Build list of positions that have selections
  const selectedPositions = positions
    .map(pos => ({
      position: pos,
      candidates: (candidatesByPosition[pos._id] || []).filter(c => selections[pos._id]?.has(c._id)),
    }))
    .filter(({ candidates }) => candidates.length > 0)

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    const committed = {}
    try {
      for (const { position, candidates } of selectedPositions) {
        for (const c of candidates) {
          await castVote({ electionId: election._id, positionId: position._id, candidateId: c._id })
        }
        committed[position._id] = candidates.map(c => c._id)
      }
      onSuccess(committed)
    } catch (err) {
      setError(err.response?.data?.message || 'Vote failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold text-base">Confirm Your Vote</h2>

        <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
          {selectedPositions.map(({ position, candidates }) => (
            <div key={position._id}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                {position.name}
              </p>
              <ul className="space-y-0.5">
                {candidates.map(c => (
                  <li key={c._id} className="text-sm font-medium flex items-center gap-2">
                    <i className="bx bx-check text-primary text-base" />
                    {c.name}
                    {c.party && <span className="text-xs text-muted-foreground font-normal">— {c.party}</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground">This action cannot be undone.</p>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-foreground text-background hover:bg-foreground/90"
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Submitting…' : 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  )
}

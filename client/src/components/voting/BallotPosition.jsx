import { useState } from 'react'
import CandidateCard from '@/components/candidates/CandidateCard'
import VoteConfirmDialog from '@/components/voting/VoteConfirmDialog'
import { Button } from '@/components/ui/button'

export default function BallotPosition({ election, position, candidates, votedCandidateIds, onVoteCast }) {
  const seats = position.seats ?? 1
  const votedSet = new Set(votedCandidateIds.map(String))
  const remainingSeats = seats - votedCandidateIds.length
  const fullyVoted = remainingSeats <= 0

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  function handleSelect(candidateId) {
    if (fullyVoted || votedSet.has(String(candidateId))) return
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(candidateId)) {
        next.delete(candidateId)
      } else if (next.size < remainingSeats) {
        next.add(candidateId)
      }
      return next
    })
  }

  function handleVoteSuccess(newCandidateIds) {
    setShowConfirm(false)
    onVoteCast(newCandidateIds)
    setSelectedIds(new Set())
  }

  const selectedCandidates = candidates.filter(c => selectedIds.has(c._id))
  const votedCandidates = candidates.filter(c => votedSet.has(String(c._id)))

  function statusBadge() {
    if (fullyVoted) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
          Voted
        </span>
      )
    }
    if (votedCandidateIds.length > 0) {
      return (
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700">
          Voted {votedCandidateIds.length} of {seats}
        </span>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{position.name}</span>
          {seats > 1 && (
            <span className="text-xs text-muted-foreground">({seats} seats)</span>
          )}
          {statusBadge()}
        </div>
        {!fullyVoted && seats > 1 && (
          <span className="text-xs text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} of ${remainingSeats} selected`
              : `Select up to ${remainingSeats}`}
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No candidates.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {candidates.map(candidate => {
              const isVoted = votedSet.has(String(candidate._id))
              const isSelected = selectedIds.has(candidate._id)
              return (
                <CandidateCard
                  key={candidate._id}
                  candidate={candidate}
                  selected={isVoted || isSelected}
                  voted={isVoted}
                  onClick={isVoted || fullyVoted ? undefined : () => handleSelect(candidate._id)}
                />
              )
            })}
          </div>
        )}

        {!fullyVoted && candidates.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={() => setShowConfirm(true)} disabled={selectedIds.size === 0}>
              Cast Vote{selectedIds.size > 1 ? `s (${selectedIds.size})` : ''}
            </Button>
          </div>
        )}

        {votedCandidates.length > 0 && (
          <p className="text-sm text-muted-foreground text-center">
            {fullyVoted ? 'You voted for' : 'Already voted for'}:{' '}
            <span className="font-medium text-foreground">
              {votedCandidates.map(c => c.name).join(', ')}
            </span>
          </p>
        )}
      </div>

      {showConfirm && selectedCandidates.length > 0 && (
        <VoteConfirmDialog
          election={election}
          position={position}
          candidates={selectedCandidates}
          onSuccess={handleVoteSuccess}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

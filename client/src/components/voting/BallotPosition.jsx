import { useState } from 'react'
import CandidateCard from '@/components/candidates/CandidateCard'
import VoteConfirmDialog from '@/components/voting/VoteConfirmDialog'
import { Button } from '@/components/ui/button'

export default function BallotPosition({ election, position, candidates, votedCandidateId, onVoteCast }) {
  const alreadyVoted = votedCandidateId !== null
  const [selectedId, setSelectedId] = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)

  function handleSelect(candidateId) {
    if (alreadyVoted) return
    setSelectedId(prev => prev === candidateId ? null : candidateId)
  }

  function handleVoteSuccess() {
    setShowConfirm(false)
    onVoteCast(selectedId)
    setSelectedId(null)
  }

  const selectedCandidate = candidates.find(c => c._id === selectedId) ?? null
  const votedCandidate = candidates.find(c => c._id === votedCandidateId) ?? null

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="font-semibold">{position.name}</span>
          {alreadyVoted && (
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
              Voted
            </span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {candidates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No candidates.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {candidates.map(candidate => (
              <CandidateCard
                key={candidate._id}
                candidate={candidate}
                selected={alreadyVoted
                  ? candidate._id === votedCandidateId
                  : candidate._id === selectedId}
                onClick={alreadyVoted ? undefined : () => handleSelect(candidate._id)}
              />
            ))}
          </div>
        )}

        {!alreadyVoted && candidates.length > 0 && (
          <div className="flex justify-end">
            <Button onClick={() => setShowConfirm(true)} disabled={!selectedId}>
              Cast Vote
            </Button>
          </div>
        )}

        {alreadyVoted && votedCandidate && (
          <p className="text-sm text-muted-foreground text-center">
            You voted for <span className="font-medium text-foreground">{votedCandidate.name}</span>
          </p>
        )}
      </div>

      {showConfirm && selectedCandidate && (
        <VoteConfirmDialog
          election={election}
          position={position}
          candidate={selectedCandidate}
          onSuccess={handleVoteSuccess}
          onClose={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

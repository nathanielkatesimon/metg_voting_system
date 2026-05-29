import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getPositions } from '@/services/positionService'
import { getCandidates } from '@/services/candidateService'
import { getMyVotes } from '@/services/voteService'
import BallotPosition from '@/components/voting/BallotPosition'
import BallotConfirmDialog from '@/components/voting/BallotConfirmDialog'
import VoteSuccessModal from '@/components/voting/VoteSuccessModal'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'

export default function BallotPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [positions, setPositions] = useState([])
  const [candidatesByPosition, setCandidatesByPosition] = useState({})
  const [votedMap, setVotedMap] = useState({})
  // selections: { [positionId]: Set<candidateId> }
  const [selections, setSelections] = useState({})
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [lastCommitted, setLastCommitted] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getElection(id), getPositions(id), getCandidates(id), getMyVotes(id)])
      .then(([electionData, positionsData, candidatesData, myVotes]) => {
        if (electionData.status !== 'active') {
          navigate('/elections', { replace: true })
          return
        }
        setElection(electionData)
        setPositions(positionsData)

        const byPosition = candidatesData.reduce((acc, c) => {
          if (!acc[c.positionId]) acc[c.positionId] = []
          acc[c.positionId].push(c)
          return acc
        }, {})
        setCandidatesByPosition(byPosition)

        const vMap = {}
        for (const v of myVotes) {
          vMap[v.positionId] = v.candidateIds || []
        }
        setVotedMap(vMap)

        // Init selection sets
        const initSel = {}
        positionsData.forEach(p => { initSel[p._id] = new Set() })
        setSelections(initSel)
      })
      .catch(() => setError('Failed to load ballot.'))
      .finally(() => setIsLoading(false))
  }, [id, navigate])

  function handleToggle(positionId, candidateId, seats) {
    setSelections(prev => {
      const cur = new Set(prev[positionId] || [])
      if (cur.has(candidateId)) {
        cur.delete(candidateId)
      } else if (cur.size < seats) {
        cur.add(candidateId)
      } else if (seats === 1) {
        // Radio behavior: replace the existing selection
        cur.clear()
        cur.add(candidateId)
      }
      return { ...prev, [positionId]: cur }
    })
  }

  function handleVotesCommitted(committed) {
    // committed: { [positionId]: candidateId[] }
    setVotedMap(prev => {
      const next = { ...prev }
      for (const [pid, cids] of Object.entries(committed)) {
        next[pid] = [...(prev[pid] || []), ...cids]
      }
      return next
    })
    setSelections(prev => {
      const next = { ...prev }
      for (const pid of Object.keys(committed)) {
        next[pid] = new Set()
      }
      return next
    })
    setShowConfirm(false)
    setLastCommitted(committed)
    setShowSuccess(true)
  }

  const hasAnySelection = Object.values(selections).some(s => s.size > 0)

  if (isLoading) return (
    <div className="px-4 py-8 space-y-8 max-w-2xl mx-auto">
      {[1, 2, 3].map(i => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-32" />
          <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
            {[1, 2].map(j => (
              <div key={j} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  // Positions still available to vote on (not fully voted)
  const pendingPositions = positions.filter(p => (votedMap[p._id] || []).length < (p.seats ?? 1))

  return (
    <div className="px-4 py-8 max-w-2xl mx-auto space-y-8">
      {/* Positions */}
      {positions.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-10">No positions available.</p>
      ) : (
        <div className="space-y-8">
          {positions.map(position => (
            <BallotPosition
              key={position._id}
              position={position}
              candidates={candidatesByPosition[position._id] || []}
              votedCandidateIds={votedMap[position._id] ?? []}
              selectedIds={selections[position._id] ?? new Set()}
              onToggle={(candidateId) => handleToggle(position._id, candidateId, position.seats ?? 1)}
            />
          ))}
        </div>
      )}

      {/* Submit area */}
      {pendingPositions.length > 0 && (
        <div className="pt-4 border-t border-border space-y-2">
          <Button
            className="w-full bg-foreground text-background hover:bg-foreground/90"
            size="lg"
            disabled={!hasAnySelection}
            onClick={() => setShowConfirm(true)}
          >
            Submit Vote
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your vote is final once submitted
          </p>
        </div>
      )}

      {showConfirm && (
        <BallotConfirmDialog
          election={election}
          positions={positions}
          candidatesByPosition={candidatesByPosition}
          selections={selections}
          onSuccess={handleVotesCommitted}
          onClose={() => setShowConfirm(false)}
        />
      )}

      {showSuccess && (
        <VoteSuccessModal
          committed={lastCommitted}
          positions={positions}
          candidatesByPosition={candidatesByPosition}
          onClose={() => setShowSuccess(false)}
        />
      )}
    </div>
  )
}

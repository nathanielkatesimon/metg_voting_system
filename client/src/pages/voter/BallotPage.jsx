import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getPositions } from '@/services/positionService'
import { getCandidates } from '@/services/candidateService'
import { getMyVotes } from '@/services/voteService'
import BallotPosition from '@/components/voting/BallotPosition'
import { Skeleton } from '@/components/ui/Skeleton'

export default function BallotPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [election, setElection] = useState(null)
  const [positions, setPositions] = useState([])
  const [candidatesByPosition, setCandidatesByPosition] = useState({})
  const [votedMap, setVotedMap] = useState({})
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
      })
      .catch(() => setError('Failed to load ballot.'))
      .finally(() => setIsLoading(false))
  }, [id, navigate])

  function handleVoteCast(positionId, newCandidateIds) {
    setVotedMap(prev => ({
      ...prev,
      [positionId]: [...(prev[positionId] || []), ...newCandidateIds],
    }))
  }

  if (isLoading) return (
    <div className="px-4 py-8 space-y-8 max-w-3xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/60 border-b border-border">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="rounded-xl border border-border p-3 space-y-2">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4 mx-auto" />
                    <Skeleton className="h-3 w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  const votedCount = positions.filter(p => (votedMap[p._id] || []).length >= p.seats).length
  const totalPositions = positions.length

  return (
    <div className="px-4 py-8 space-y-8 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{election.title}</h1>
        {election.description && (
          <p className="text-sm text-muted-foreground mt-1">{election.description}</p>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          {votedCount} of {totalPositions} position{totalPositions !== 1 ? 's' : ''} voted
        </p>
      </div>

      {positions.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No positions available.
        </div>
      ) : (
        <div className="space-y-6">
          {positions.map(position => (
            <BallotPosition
              key={position._id}
              election={election}
              position={position}
              candidates={candidatesByPosition[position._id] || []}
              votedCandidateIds={votedMap[position._id] ?? []}
              onVoteCast={(newCandidateIds) => handleVoteCast(position._id, newCandidateIds)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

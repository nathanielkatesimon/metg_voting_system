import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getPositions } from '@/services/positionService'
import { getCandidates } from '@/services/candidateService'
import { getMyVotes } from '@/services/voteService'
import BallotPosition from '@/components/voting/BallotPosition'

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
          vMap[v.positionId] = v.candidateId
        }
        setVotedMap(vMap)
      })
      .catch(() => setError('Failed to load ballot.'))
      .finally(() => setIsLoading(false))
  }, [id, navigate])

  function handleVoteCast(positionId, candidateId) {
    setVotedMap(prev => ({ ...prev, [positionId]: candidateId }))
  }

  if (isLoading) return <div className="px-4 py-8 text-sm text-muted-foreground">Loading…</div>
  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  const votedCount = Object.keys(votedMap).length
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
              votedCandidateId={votedMap[position._id] ?? null}
              onVoteCast={(candidateId) => handleVoteCast(position._id, candidateId)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

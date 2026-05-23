import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getResults, getStats } from '@/services/resultsService'
import ParticipationStatsCards from '@/components/results/ParticipationStatsCards'
import VoteBarChart from '@/components/results/VoteBarChart'
import CandidateRankingTable from '@/components/results/CandidateRankingTable'
import { Button } from '@/components/ui/button'

export default function ResultsPage() {
  const { id } = useParams()
  const [election, setElection] = useState(null)
  const [results, setResults] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getElection(id), getResults(id), getStats(id)])
      .then(([electionData, resultsData, statsData]) => {
        setElection(electionData)
        setResults(resultsData)
        setStats(statsData)
      })
      .catch(() => setError('Failed to load results.'))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) return <div className="px-4 py-8 text-sm text-muted-foreground">Loading…</div>
  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  const totalVotes = results.reduce(
    (sum, pos) => sum + pos.candidates.reduce((s, c) => s + c.voteCount, 0),
    0
  )

  return (
    <div className="px-4 py-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to={`/admin/elections/${id}`}>← Back to Election</Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{election.title} — Results</h1>
            {election.description && (
              <p className="text-sm text-muted-foreground mt-1">{election.description}</p>
            )}
          </div>
          <a href={`/api/elections/${id}/export/results`} download>
            <Button variant="outline" size="sm" disabled={totalVotes === 0}>
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {/* Participation stats */}
      {stats && <ParticipationStatsCards stats={stats} />}

      {/* Per-position results */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          No positions found for this election.
        </div>
      ) : (
        <div className="space-y-8">
          {results.map(pos => (
            <div key={pos.positionId} className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/60 border-b border-border">
                <h2 className="font-semibold">{pos.positionName}</h2>
              </div>
              <div className="p-4 space-y-4">
                {pos.candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No candidates.</p>
                ) : (
                  <>
                    <VoteBarChart candidates={pos.candidates} />
                    <CandidateRankingTable candidates={pos.candidates} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

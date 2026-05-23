import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getResults, getStats } from '@/services/resultsService'
import ParticipationStatsCards from '@/components/results/ParticipationStatsCards'
import VoteBarChart from '@/components/results/VoteBarChart'
import CandidateRankingTable from '@/components/results/CandidateRankingTable'
import { Skeleton } from '@/components/ui/Skeleton'
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

  if (isLoading) return (
    <div className="px-4 py-8 space-y-8 max-w-4xl">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-80" />
            <Skeleton className="h-4 w-60" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border p-4 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-8">
        {[1, 2].map(i => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3 bg-muted/60 border-b border-border">
              <Skeleton className="h-5 w-40" />
            </div>
            <div className="p-4 space-y-4">
              <Skeleton className="h-40 w-full" />
              <div className="space-y-2">
                {[1, 2, 3].map(j => (
                  <div key={j} className="flex items-center justify-between py-1">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-20" />
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
              <div className="px-4 py-3 bg-muted/60 border-b border-border flex items-center gap-3">
                <h2 className="font-semibold">{pos.positionName}</h2>
                {pos.seats > 1 && (
                  <span className="text-xs text-muted-foreground">({pos.seats} seats)</span>
                )}
              </div>
              <div className="p-4 space-y-4">
                {pos.candidates.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No candidates.</p>
                ) : (
                  <>
                    <VoteBarChart candidates={pos.candidates} />
                    <CandidateRankingTable candidates={pos.candidates} seats={pos.seats} />
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

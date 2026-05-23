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
    <div className="px-6 py-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-80" />
              <Skeleton className="h-4 w-60" />
            </div>
            <Skeleton className="h-9 w-28" />
          </div>
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
    <div className="px-6 py-8 space-y-8">

      {/* Back + Hero */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to={`/admin/elections/${id}`}>
            <i className="bx bx-arrow-back mr-1 text-base" /> Back to Election
          </Link>
        </Button>

        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Election Results</p>
              <h1 className="text-2xl font-bold">{election.title}</h1>
              {election.description && (
                <p className="text-sm text-muted-foreground">{election.description}</p>
              )}
            </div>
            <a href={`/api/elections/${id}/export/results`} download>
              <Button variant="outline" size="sm" disabled={totalVotes === 0}>
                <i className="bx bx-download mr-1 text-base" /> Export CSV
              </Button>
            </a>
          </div>

          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <i className="bx bx-check-circle text-green-500 text-sm" />
              {totalVotes} total vote{totalVotes !== 1 ? 's' : ''} cast
            </span>
            <span className="flex items-center gap-1.5">
              <i className="bx bx-list-ul text-sm" />
              {results.length} position{results.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Participation stats */}
      {stats && <ParticipationStatsCards stats={stats} />}

      {/* Per-position results */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center space-y-2">
          <i className="bx bx-bar-chart text-3xl text-muted-foreground" />
          <p className="text-sm font-medium">No positions found</p>
          <p className="text-xs text-muted-foreground">This election has no positions configured.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {results.map(pos => (
            <div key={pos.positionId} className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/60 border-b border-border flex items-center gap-3">
                <i className="bx bx-trophy text-primary text-base" />
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

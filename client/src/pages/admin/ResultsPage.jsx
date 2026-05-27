import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getResults, getStats } from '@/services/resultsService'
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
    <div className="px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-24" />
      </div>
      <Skeleton className="h-4 w-32" />
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-48 shrink-0" />
          <Skeleton className="h-4 flex-1 rounded" />
          <Skeleton className="h-4 w-16 shrink-0" />
        </div>
      ))}
    </div>
  )

  if (error) return <div className="px-6 py-8 text-sm text-destructive">{error}</div>

  const allCandidates = results.flatMap(pos => pos.candidates)
  const maxVotes = Math.max(1, ...allCandidates.map(c => c.voteCount))
  const totalVotes = allCandidates.reduce((s, c) => s + c.voteCount, 0)

  return (
    <div className="px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" asChild className="-ml-2">
            <Link to={`/admin/elections/${id}`}>
              <i className="bx bx-arrow-back mr-1 text-base" /> Back
            </Link>
          </Button>
          <h1 className="text-xl font-bold">{election.title}</h1>
        </div>
        <a href={`/api/elections/${id}/export/results`} download>
          <Button variant="outline" size="sm" disabled={totalVotes === 0}>
            <i className="bx bx-export mr-1.5 text-base" /> Export
          </Button>
        </a>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center space-y-2">
          <i className="bx bx-bar-chart text-3xl text-muted-foreground" />
          <p className="text-sm font-medium">No results yet</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold mb-5">Results Overview</h2>

          <div className="space-y-0.5">
            {results.map((pos, posIdx) => (
              <div key={pos.positionId}>
                {/* Section label row between position groups */}
                {posIdx > 0 && (
                  <div className="pt-5 pb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {pos.positionName}
                      {pos.seats > 1 && (
                        <span className="normal-case ml-1">(top {pos.seats} elected)</span>
                      )}
                    </span>
                  </div>
                )}

                {pos.candidates.map((candidate, cIdx) => {
                  const barPct = (candidate.voteCount / maxVotes) * 100
                  const isWinner = cIdx < pos.seats

                  return (
                    <div key={candidate.candidateId} className="flex items-center gap-3 py-1.5">
                      <span className="text-sm w-52 shrink-0 truncate text-foreground">
                        {pos.positionName} — {candidate.name}
                      </span>
                      <div className="flex-1 h-4 bg-muted rounded overflow-hidden">
                        <div
                          className={`h-full rounded transition-all ${isWinner ? 'bg-foreground' : 'bg-muted-foreground/35'}`}
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                      <span className="text-sm w-20 text-right shrink-0">
                        {candidate.voteCount} votes
                      </span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voter stats */}
      {stats && (
        <div className="border-t border-border pt-6">
          <h2 className="text-sm font-semibold mb-4">Total Voters</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Registered" value={stats.totalVoters} />
            <StatCard label="Votes Cast" value={stats.participatingVoters} />
            <StatCard label="Not Yet Voted" value={Math.max(0, stats.totalVoters - stats.participatingVoters)} />
            <StatCard label="Turnout" value={`${stats.turnout}%`} highlight />
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, highlight }) {
  return (
    <div className="rounded-xl border border-border p-4 text-center space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
    </div>
  )
}

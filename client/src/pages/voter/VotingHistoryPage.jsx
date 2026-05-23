import { useState, useEffect } from 'react'
import { getAllMyVotes } from '@/services/voteService'
import { getResults } from '@/services/resultsService'
import { getCandidates } from '@/services/candidateService'
import CandidateCard from '@/components/candidates/CandidateCard'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'

export default function VotingHistoryPage() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')

  useEffect(() => {
    getAllMyVotes()
      .then(setHistory)
      .catch(() => setError('Failed to load voting history.'))
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setDetail(null)
    setDetailError('')
    setDetailLoading(true)
    Promise.all([
      getResults(selected.election._id),
      getCandidates(selected.election._id),
    ])
      .then(([results, allCandidates]) => setDetail({ results, allCandidates }))
      .catch(() => setDetailError('Failed to load election details.'))
      .finally(() => setDetailLoading(false))
  }, [selected])

  if (isLoading) return (
    <div className="px-4 py-8 space-y-8 max-w-2xl mx-auto">
      <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8 space-y-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16 rounded-full shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  if (selected) {
    const { election, votes } = selected

    const votedByPosition = {}
    for (const { position, candidate } of votes) {
      const posId = String(position._id)
      if (!votedByPosition[posId]) votedByPosition[posId] = []
      votedByPosition[posId].push(candidate)
    }

    return (
      <div className="px-4 py-8 space-y-10 max-w-3xl mx-auto">
        <div>
          <Button variant="ghost" size="sm" className="-ml-2 mb-4" onClick={() => setSelected(null)}>
            <i className="bx bx-arrow-back mr-1 text-base" /> Back to History
          </Button>
          <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Election Detail</p>
                <h1 className="text-2xl font-bold">{election.title}</h1>
                {election.description && (
                  <p className="text-sm text-muted-foreground">{election.description}</p>
                )}
              </div>
              <ElectionStatusBadge status={election.status} />
            </div>
            <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <i className="bx bx-check-circle text-green-500 text-base" />
                {votes.length} position{votes.length !== 1 ? 's' : ''} voted
              </span>
            </div>
          </div>
        </div>

        {detailLoading && (
          <div className="space-y-6">
            {[1, 2].map(i => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <div className="px-4 py-3 bg-muted/60 border-b border-border">
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="divide-y divide-border">
                  {[1, 2, 3].map(j => (
                    <div key={j} className="flex items-center justify-between px-4 py-2.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        {detailError && <div className="text-sm text-destructive">{detailError}</div>}

        {detail && (
          <>
            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <i className="bx bx-bar-chart-alt-2 text-primary text-lg" />
                Results
              </h2>
              {detail.results.length === 0 ? (
                <div className="rounded-xl border border-border px-6 py-8 text-center text-sm text-muted-foreground">
                  No results available.
                </div>
              ) : (
                <div className="space-y-6">
                  {detail.results.map(pos => (
                    <div key={pos.positionId} className="rounded-xl border border-border overflow-hidden">
                      <div className="px-4 py-3 bg-muted/60 border-b border-border flex items-center gap-3">
                        <h3 className="font-semibold">{pos.positionName}</h3>
                        {pos.seats > 1 && (
                          <span className="text-xs text-muted-foreground">({pos.seats} seats)</span>
                        )}
                      </div>
                      <div className="divide-y divide-border">
                        {pos.candidates.slice(0, pos.seats).filter(c => c.voteCount > 0).map((c, i) => (
                          <div key={c.candidateId} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              {i === 0 && <i className="bx bxs-medal text-amber-500 text-sm" />}
                              {i > 0 && <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>}
                              <span className="text-sm font-medium">{c.name}</span>
                              {c.party && <span className="text-xs text-muted-foreground">· {c.party}</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">{c.voteCount} vote{c.voteCount !== 1 ? 's' : ''}</span>
                          </div>
                        ))}
                        {pos.candidates.slice(0, pos.seats).filter(c => c.voteCount > 0).length === 0 && (
                          <p className="px-4 py-3 text-sm text-muted-foreground">No votes yet.</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <i className="bx bx-user-check text-primary text-lg" />
                Your Votes
              </h2>
              <div className="space-y-6">
                {detail.results.map(pos => {
                  const candidates = detail.allCandidates.filter(
                    c => String(c.positionId) === String(pos.positionId)
                  )
                  const myVoted = votedByPosition[String(pos.positionId)] || []
                  const myVotedIds = new Set(myVoted.map(c => String(c._id)))

                  return (
                    <div key={pos.positionId} className="rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">{pos.positionName}</span>
                          {pos.seats > 1 && (
                            <span className="text-xs text-muted-foreground">({pos.seats} seats)</span>
                          )}
                        </div>
                        {myVoted.length > 0 ? (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700">
                            <i className="bx bx-check text-sm" /> Voted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground">
                            <i className="bx bx-minus text-sm" /> Not voted
                          </span>
                        )}
                      </div>
                      <div className="p-4 space-y-4">
                        {candidates.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">No candidates.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                            {candidates.map(candidate => {
                              const isVoted = myVotedIds.has(String(candidate._id))
                              return (
                                <CandidateCard
                                  key={candidate._id}
                                  candidate={candidate}
                                  selected={isVoted}
                                  voted={isVoted}
                                />
                              )
                            })}
                          </div>
                        )}
                        {myVoted.length > 0 && (
                          <p className="text-sm text-muted-foreground text-center">
                            You voted for:{' '}
                            <span className="font-medium text-foreground">
                              {myVoted.map(c => c.name).join(', ')}
                            </span>
                          </p>
                        )}
                        {myVoted.length === 0 && candidates.length > 0 && (
                          <p className="text-sm text-muted-foreground text-center">
                            You did not vote for this position.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 py-8 space-y-8 max-w-2xl mx-auto">

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Voting Record</p>
        <h1 className="text-2xl font-bold">My Voting History</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          A record of every election you've participated in. Select one to view results and your ballot.
        </p>
        <div className="pt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
            <i className="bx bx-list-check text-primary text-sm" />
            {history.length} election{history.length !== 1 ? 's' : ''} participated
          </span>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Past Elections</h2>

        {history.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center space-y-2">
            <i className="bx bx-box-open text-3xl text-muted-foreground" />
            <p className="text-sm font-medium">No voting history yet</p>
            <p className="text-xs text-muted-foreground">Elections you've voted in will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map(({ election, votes }) => (
              <button
                key={election._id}
                onClick={() => setSelected({ election, votes })}
                className="w-full text-left rounded-xl border border-border overflow-hidden hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <p className="font-semibold truncate">{election.title}</p>
                    {election.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">{election.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <i className="bx bx-check-circle text-green-500 text-sm" />
                      {votes.length} position{votes.length !== 1 ? 's' : ''} voted
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ElectionStatusBadge status={election.status} />
                    <i className="bx bx-chevron-right text-muted-foreground text-xl" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { getAllMyVotes } from '@/services/voteService'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function VotingHistoryPage() {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getAllMyVotes()
      .then(setHistory)
      .catch(() => setError('Failed to load voting history.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingSpinner />
  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  return (
    <div className="px-4 py-8 space-y-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">My Voting History</h1>

      {history.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          You haven't voted in any elections yet.
        </div>
      ) : (
        <div className="space-y-6">
          {history.map(({ election, votes }) => (
            <div key={election._id} className="rounded-xl border border-border overflow-hidden">
              <div className="px-4 py-3 bg-muted/60 border-b border-border">
                <h2 className="font-semibold">{election.title}</h2>
              </div>
              <div className="divide-y divide-border">
                {votes.map(({ position, candidate }) => (
                  <div key={position._id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-muted-foreground">{position.name}</span>
                    <span className="text-sm font-medium">{candidate.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

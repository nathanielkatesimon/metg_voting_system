import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getElections } from '@/services/electionService'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'

export default function VoterElectionsPage() {
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getElections()
      .then(data => setElections(data.filter(e => e.status === 'active')))
      .catch(() => setError('Failed to load elections.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-4 w-60" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-border p-6 space-y-3">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-9 w-24" />
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Active Elections</h1>
        <p className="text-sm text-muted-foreground mt-1">Cast your vote in the elections below.</p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {elections.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No active elections at this time. Check back later.
        </div>
      ) : (
        <div className="space-y-4">
          {elections.map(election => (
            <div key={election._id} className="rounded-xl border border-border p-6 space-y-3">
              <h2 className="text-lg font-semibold">{election.title}</h2>
              {election.description && (
                <p className="text-sm text-muted-foreground">{election.description}</p>
              )}
              <Button asChild>
                <Link to={`/elections/${election._id}/vote`}>Vote Now</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

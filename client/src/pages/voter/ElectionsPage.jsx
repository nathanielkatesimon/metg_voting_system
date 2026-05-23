import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { getElections } from '@/services/electionService'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { AuthContext } from '@/context/AuthContext'

function HowItWorksStep({ number, title, description }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">
        {number}
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

export default function VoterElectionsPage() {
  const { user } = useContext(AuthContext)
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getElections()
      .then(data => setElections(data.filter(e => e.status === 'active')))
      .catch(() => setError('Failed to load elections.'))
      .finally(() => setIsLoading(false))
  }, [])

  const firstName = user?.name?.split(' ')[0] ?? 'Neighbor'

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

      {/* Hero */}
      <div className="rounded-2xl border border-border bg-muted/30 px-6 py-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Purok E-Voting</p>
        <h1 className="text-2xl font-bold leading-snug">
          Welcome back, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your voice matters. Participate in your community's elections and help shape the future of your purok.
        </p>
        <div className="pt-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium">
            <i className="bx bx-radio-circle-marked text-green-500 text-sm animate-pulse" />
            {isLoading ? '—' : elections.length} Active Election{elections.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border p-5 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">How it works</p>
        <div className="space-y-4">
          <HowItWorksStep number="1" title="Choose an election" description="Select any active election listed below to view its positions and candidates." />
          <HowItWorksStep number="2" title="Review candidates" description="Read each candidate's information before making your choice." />
          <HowItWorksStep number="3" title="Submit your ballot" description="Confirm your selections — your vote is final and cannot be changed." />
        </div>
      </div>

      {/* Elections list */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Active Elections</h2>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-border p-6 space-y-3">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-9 w-24" />
              </div>
            ))}
          </div>
        ) : elections.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center space-y-1">
            <p className="text-sm font-medium">No active elections right now</p>
            <p className="text-xs text-muted-foreground">Check back later — upcoming elections will appear here once they open.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {elections.map((election, i) => (
              <div
                key={election._id}
                className="rounded-xl border border-border p-6 space-y-4 hover:bg-muted/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">#{i + 1}</span>
                      <h3 className="text-base font-semibold leading-tight truncate">{election.title}</h3>
                    </div>
                    {election.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{election.description}</p>
                    )}
                  </div>
                  <span className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-green-200 bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <i className="bx bx-radio-circle-marked text-sm" />
                    Live
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild size="sm">
                    <Link to={`/elections/${election._id}/vote`}>Vote Now</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">Your vote is secret and secure.</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

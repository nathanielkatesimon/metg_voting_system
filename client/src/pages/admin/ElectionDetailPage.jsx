import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getPositions, deletePosition } from '@/services/positionService'
import { getCandidates, deleteCandidate } from '@/services/candidateService'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'
import PositionFormModal from '@/components/positions/PositionFormModal'
import CandidateCard from '@/components/candidates/CandidateCard'
import CandidateFormModal from '@/components/candidates/CandidateFormModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { showSuccess, showError } from '@/lib/toast'

export default function ElectionDetailPage() {
  const { id } = useParams()
  const [election, setElection] = useState(null)
  const [positions, setPositions] = useState([])
  const [candidates, setCandidates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const [positionModal, setPositionModal] = useState(null)
  const [deletePositionConfirm, setDeletePositionConfirm] = useState(null)
  const [isDeletingPosition, setIsDeletingPosition] = useState(false)

  const [candidateModal, setCandidateModal] = useState(null)
  const [deleteCandidateConfirm, setDeleteCandidateConfirm] = useState(null)
  const [isDeletingCandidate, setIsDeletingCandidate] = useState(false)

  useEffect(() => {
    Promise.all([getElection(id), getPositions(id), getCandidates(id)])
      .then(([electionData, positionsData, candidatesData]) => {
        setElection(electionData)
        setPositions(positionsData)
        setCandidates(candidatesData)
      })
      .catch(() => setError('Failed to load election.'))
      .finally(() => setIsLoading(false))
  }, [id])

  function handlePositionSaved(saved) {
    setPositions(prev => {
      const exists = prev.some(p => p._id === saved._id)
      const updated = exists ? prev.map(p => p._id === saved._id ? saved : p) : [...prev, saved]
      return updated.sort((a, b) => a.order - b.order)
    })
    setPositionModal(null)
  }

  async function handleDeletePosition(position) {
    setIsDeletingPosition(true)
    try {
      await deletePosition(position._id)
      setPositions(prev => prev.filter(p => p._id !== position._id))
      setCandidates(prev => prev.filter(c => c.positionId !== position._id))
      setDeletePositionConfirm(null)
      showSuccess(`Position "${position.name}" deleted.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeletingPosition(false)
    }
  }

  function handleCandidateSaved(saved) {
    setCandidates(prev => {
      const exists = prev.some(c => c._id === saved._id)
      return exists ? prev.map(c => c._id === saved._id ? saved : c) : [...prev, saved]
    })
    setCandidateModal(null)
  }

  async function handleDeleteCandidate(candidate) {
    setIsDeletingCandidate(true)
    try {
      await deleteCandidate(candidate._id)
      setCandidates(prev => prev.filter(c => c._id !== candidate._id))
      setDeleteCandidateConfirm(null)
      showSuccess(`${candidate.name} removed.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeletingCandidate(false)
    }
  }

  if (isLoading) return (
    <div className="px-6 py-8 space-y-8">
      <div className="space-y-3">
        <Skeleton className="h-8 w-24 mb-1" />
        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-64" />
              <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <div className="flex gap-4 pt-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>
      </div>
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-6">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
                <Skeleton className="h-5 w-40" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-14" />
                  <Skeleton className="h-8 w-14" />
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {[1, 2, 3].map(j => (
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
      </section>
    </div>
  )

  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  const canEdit = election.status !== 'closed'
  const candidatesByPosition = candidates.reduce((acc, c) => {
    const key = c.positionId
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="px-6 py-8 space-y-8">

      {/* Back + Hero */}
      <div className="space-y-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to="/admin/elections">
            <i className="bx bx-arrow-back mr-1 text-base" /> Elections
          </Link>
        </Button>

        <div className="rounded-2xl border border-border bg-muted/30 px-6 py-6 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Election</p>
              <h1 className="text-2xl font-bold">{election.title}</h1>
              {election.description && (
                <p className="text-sm text-muted-foreground">{election.description}</p>
              )}
            </div>
            <ElectionStatusBadge status={election.status} />
          </div>

          <div className="flex items-center gap-4 pt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1.5">
              <i className="bx bx-list-ul text-sm" />
              {positions.length} position{positions.length !== 1 ? 's' : ''}
            </span>
            <span className="flex items-center gap-1.5">
              <i className="bx bx-group text-sm" />
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </span>
            {election.status === 'upcoming' && (
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/elections/${id}/edit`}>
                    <i className="bx bx-edit mr-1 text-sm" /> Edit Election
                  </Link>
                </Button>
              </div>
            )}
            {election.status === 'closed' && (
              <div className="ml-auto">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/admin/elections/${id}/results`}>
                    <i className="bx bx-bar-chart-alt-2 mr-1 text-sm" /> View Results
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Positions + Candidates */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <i className="bx bx-layout text-primary text-xl" />
            Positions & Candidates
          </h2>
          {canEdit && (
            <Button size="sm" onClick={() => setPositionModal({ mode: 'create' })}>
              <i className="bx bx-plus mr-1 text-base" /> Add Position
            </Button>
          )}
        </div>

        {positions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center space-y-2">
            <i className="bx bx-list-plus text-3xl text-muted-foreground" />
            <p className="text-sm font-medium">No positions yet</p>
            {canEdit && <p className="text-xs text-muted-foreground">Add a position to start adding candidates.</p>}
          </div>
        ) : (
          <div className="space-y-6">
            {positions.map(position => {
              const positionCandidates = candidatesByPosition[position._id] || []
              return (
                <div key={position._id} className="rounded-xl border border-border overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-6 text-center">{position.order}</span>
                      <span className="font-semibold">{position.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {positionCandidates.length} candidate{positionCandidates.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPositionModal({ mode: 'edit', position })}
                        >
                          <i className="bx bx-edit mr-1 text-sm" /> Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletePositionConfirm(position)}
                        >
                          <i className="bx bx-trash mr-1 text-sm" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {positionCandidates.map(candidate => (
                        <div key={candidate._id} className="space-y-1">
                          <CandidateCard candidate={candidate} />
                          {canEdit && (
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => setCandidateModal({ mode: 'edit', candidate })}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="flex-1 text-xs"
                                onClick={() => setDeleteCandidateConfirm(candidate)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      {canEdit && (
                        <button
                          onClick={() => setCandidateModal({ mode: 'create', positionId: position._id })}
                          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-4 min-h-[140px] text-muted-foreground hover:bg-muted/40 hover:border-muted-foreground/40 transition-colors text-sm gap-1"
                        >
                          <i className="bx bx-user-plus text-2xl" />
                          <span>Add Candidate</span>
                        </button>
                      )}
                    </div>

                    {positionCandidates.length === 0 && !canEdit && (
                      <p className="text-sm text-muted-foreground text-center py-4">No candidates.</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {positionModal && (
        <PositionFormModal
          electionId={id}
          position={positionModal.mode === 'edit' ? positionModal.position : undefined}
          onSuccess={handlePositionSaved}
          onClose={() => setPositionModal(null)}
        />
      )}

      {deletePositionConfirm && (
        <ConfirmDialog
          title="Delete Position"
          description={`Delete "${deletePositionConfirm.name}" and all its candidates? This action cannot be undone.`}
          onConfirm={() => handleDeletePosition(deletePositionConfirm)}
          onClose={() => setDeletePositionConfirm(null)}
          isLoading={isDeletingPosition}
        />
      )}

      {candidateModal && (
        <CandidateFormModal
          electionId={id}
          positionId={candidateModal.mode === 'create' ? candidateModal.positionId : undefined}
          candidate={candidateModal.mode === 'edit' ? candidateModal.candidate : undefined}
          onSuccess={handleCandidateSaved}
          onClose={() => setCandidateModal(null)}
        />
      )}

      {deleteCandidateConfirm && (
        <ConfirmDialog
          title="Delete Candidate"
          description={`Remove ${deleteCandidateConfirm.name}? This action cannot be undone.`}
          onConfirm={() => handleDeleteCandidate(deleteCandidateConfirm)}
          onClose={() => setDeleteCandidateConfirm(null)}
          isLoading={isDeletingCandidate}
        />
      )}
    </div>
  )
}

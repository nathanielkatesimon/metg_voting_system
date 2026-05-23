import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getPositions, deletePosition } from '@/services/positionService'
import { getCandidates, deleteCandidate } from '@/services/candidateService'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'
import PositionFormModal from '@/components/positions/PositionFormModal'
import CandidateCard from '@/components/candidates/CandidateCard'
import CandidateFormModal from '@/components/candidates/CandidateFormModal'
import { Button } from '@/components/ui/button'

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
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
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
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeletingCandidate(false)
    }
  }

  if (isLoading) return <div className="px-4 py-8 text-sm text-muted-foreground">Loading…</div>
  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  const canEdit = election.status !== 'closed'

  const candidatesByPosition = candidates.reduce((acc, c) => {
    const key = c.positionId
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {})

  return (
    <div className="px-4 py-8 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
          <Link to="/admin/elections">← Elections</Link>
        </Button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{election.title}</h1>
            {election.description && (
              <p className="text-sm text-muted-foreground mt-1">{election.description}</p>
            )}
          </div>
          <ElectionStatusBadge status={election.status} />
        </div>
      </div>

      {/* Positions + Candidates */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Positions & Candidates</h2>
          {canEdit && (
            <Button size="sm" onClick={() => setPositionModal({ mode: 'create' })}>
              Add Position
            </Button>
          )}
        </div>

        {positions.length === 0 ? (
          <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
            No positions yet.{canEdit ? ' Add one to get started.' : ''}
          </div>
        ) : (
          <div className="space-y-6">
            {positions.map(position => {
              const positionCandidates = candidatesByPosition[position._id] || []
              return (
                <div key={position._id} className="rounded-xl border border-border overflow-hidden">
                  {/* Position header */}
                  <div className="flex items-center justify-between px-4 py-3 bg-muted/60 border-b border-border">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-muted-foreground w-6 text-center">{position.order}</span>
                      <span className="font-semibold">{position.name}</span>
                      <span className="text-xs text-muted-foreground">{positionCandidates.length} candidate{positionCandidates.length !== 1 ? 's' : ''}</span>
                    </div>
                    {canEdit && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setPositionModal({ mode: 'edit', position })}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletePositionConfirm(position)}
                        >
                          Delete
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Candidates grid */}
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
                          <span className="text-2xl leading-none">+</span>
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

      {/* Position form modal */}
      {positionModal && (
        <PositionFormModal
          electionId={id}
          position={positionModal.mode === 'edit' ? positionModal.position : undefined}
          onSuccess={handlePositionSaved}
          onClose={() => setPositionModal(null)}
        />
      )}

      {/* Delete position confirmation */}
      {deletePositionConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete Position</h2>
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-medium text-foreground">"{deletePositionConfirm.name}"</span> and all its candidates?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeletePositionConfirm(null)} disabled={isDeletingPosition}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeletePosition(deletePositionConfirm)} disabled={isDeletingPosition}>
                {isDeletingPosition ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate form modal */}
      {candidateModal && (
        <CandidateFormModal
          electionId={id}
          positionId={candidateModal.mode === 'create' ? candidateModal.positionId : undefined}
          candidate={candidateModal.mode === 'edit' ? candidateModal.candidate : undefined}
          onSuccess={handleCandidateSaved}
          onClose={() => setCandidateModal(null)}
        />
      )}

      {/* Delete candidate confirmation */}
      {deleteCandidateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete Candidate</h2>
            <p className="text-sm text-muted-foreground">
              Remove <span className="font-medium text-foreground">{deleteCandidateConfirm.name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteCandidateConfirm(null)} disabled={isDeletingCandidate}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeleteCandidate(deleteCandidateConfirm)} disabled={isDeletingCandidate}>
                {isDeletingCandidate ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

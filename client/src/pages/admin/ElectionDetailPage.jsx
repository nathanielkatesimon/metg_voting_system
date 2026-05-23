import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getElection } from '@/services/electionService'
import { getPositions, deletePosition } from '@/services/positionService'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'
import PositionFormModal from '@/components/positions/PositionFormModal'
import { Button } from '@/components/ui/button'

export default function ElectionDetailPage() {
  const { id } = useParams()
  const [election, setElection] = useState(null)
  const [positions, setPositions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [positionModal, setPositionModal] = useState(null) // null | { mode: 'create' } | { mode: 'edit', position }
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    Promise.all([getElection(id), getPositions(id)])
      .then(([electionData, positionsData]) => {
        setElection(electionData)
        setPositions(positionsData)
      })
      .catch(() => setError('Failed to load election.'))
      .finally(() => setIsLoading(false))
  }, [id])

  function handlePositionSaved(saved) {
    setPositions(prev => {
      const exists = prev.find(p => p._id === saved._id)
      const updated = exists
        ? prev.map(p => p._id === saved._id ? saved : p)
        : [...prev, saved]
      return updated.sort((a, b) => a.order - b.order || a.createdAt?.localeCompare(b.createdAt))
    })
    setPositionModal(null)
  }

  async function handleDeletePosition(position) {
    setIsDeleting(true)
    try {
      await deletePosition(position._id)
      setPositions(prev => prev.filter(p => p._id !== position._id))
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) return <div className="px-4 py-8 text-sm text-muted-foreground">Loading…</div>
  if (error) return <div className="px-4 py-8 text-sm text-destructive">{error}</div>

  const canEdit = election.status !== 'closed'

  return (
    <div className="px-4 py-8 space-y-8 max-w-3xl">
      {/* Header */}
      <div className="space-y-1">
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

      {/* Positions */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Positions</h2>
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
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium w-12">Order</th>
                  <th className="text-left px-4 py-3 font-medium">Name</th>
                  {canEdit && <th className="px-4 py-3 w-32" />}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {positions.map(position => (
                  <tr key={position._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{position.order}</td>
                    <td className="px-4 py-3 font-medium">{position.name}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
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
                            onClick={() => setDeleteConfirm(position)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Candidates section — coming in Phase 6 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Candidates</h2>
        <div className="rounded-xl border border-border px-6 py-10 text-center text-sm text-muted-foreground">
          Candidate management coming soon.
        </div>
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

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete Position</h2>
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-medium text-foreground">"{deleteConfirm.name}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDeletePosition(deleteConfirm)} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

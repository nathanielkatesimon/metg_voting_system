import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminElections, deleteElection, openElection, closeElection } from '@/services/electionService'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'
import { Button } from '@/components/ui/button'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ElectionsPage() {
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    fetchElections()
  }, [])

  async function fetchElections() {
    setIsLoading(true)
    setError('')
    try {
      const data = await getAdminElections()
      setElections(data)
    } catch {
      setError('Failed to load elections.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleOpen(election) {
    setActionLoading(election._id + '-open')
    try {
      const updated = await openElection(election._id)
      setElections(prev => prev.map(e => e._id === updated._id ? updated : e))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to open election.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleClose(election) {
    setActionLoading(election._id + '-close')
    try {
      const updated = await closeElection(election._id)
      setElections(prev => prev.map(e => e._id === updated._id ? updated : e))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to close election.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleDelete(election) {
    setIsDeleting(true)
    try {
      await deleteElection(election._id)
      setElections(prev => prev.filter(e => e._id !== election._id))
      setDeleteConfirm(null)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete election.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Elections</h1>
          <p className="text-sm text-muted-foreground">{elections.length} total</p>
        </div>
        <Button asChild>
          <Link to="/admin/elections/new">New Election</Link>
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : elections.length === 0 ? (
        <div className="rounded-xl border border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No elections yet. Create one to get started.
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Title</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Start Date</th>
                <th className="text-left px-4 py-3 font-medium">End Date</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {elections.map(election => (
                <tr key={election._id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3 font-medium">{election.title}</td>
                  <td className="px-4 py-3">
                    <ElectionStatusBadge status={election.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(election.startDate)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(election.endDate)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/elections/${election._id}`}>Manage</Link>
                      </Button>
                      {election.status === 'upcoming' && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/elections/${election._id}/edit`}>Edit</Link>
                          </Button>
                          <Button
                            size="sm"
                            disabled={actionLoading === election._id + '-open'}
                            onClick={() => handleOpen(election)}
                          >
                            {actionLoading === election._id + '-open' ? 'Opening…' : 'Open'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setDeleteConfirm(election)}
                          >
                            Delete
                          </Button>
                        </>
                      )}
                      {election.status === 'active' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={actionLoading === election._id + '-close'}
                          onClick={() => handleClose(election)}
                        >
                          {actionLoading === election._id + '-close' ? 'Closing…' : 'Close'}
                        </Button>
                      )}
                      {election.status === 'closed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/elections/${election._id}/results`}>Results</Link>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete Election</h2>
            <p className="text-sm text-muted-foreground">
              Delete <span className="font-medium text-foreground">"{deleteConfirm.title}"</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => handleDelete(deleteConfirm)} disabled={isDeleting}>
                {isDeleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

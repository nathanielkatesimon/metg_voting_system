import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getAdminElections, deleteElection, openElection, closeElection } from '@/services/electionService'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { showSuccess, showError } from '@/lib/toast'

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function StatTile({ icon, label, value, color = 'text-foreground' }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
        <i className={`bx ${icon} text-sm`} />
        {label}
      </p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

export default function ElectionsPage() {
  const [elections, setElections] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [openConfirm, setOpenConfirm] = useState(null)
  const [closeConfirm, setCloseConfirm] = useState(null)

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
      setOpenConfirm(null)
      showSuccess(`"${election.title}" is now open for voting.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to open election.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleClose(election) {
    setActionLoading(election._id + '-close')
    try {
      const updated = await closeElection(election._id)
      setElections(prev => prev.map(e => e._id === updated._id ? updated : e))
      setCloseConfirm(null)
      showSuccess(`"${election.title}" has been closed.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to close election.')
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
      showSuccess('Election deleted.')
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete election.')
    } finally {
      setIsDeleting(false)
    }
  }

  const active = elections.filter(e => e.status === 'active').length
  const upcoming = elections.filter(e => e.status === 'upcoming').length
  const closed = elections.filter(e => e.status === 'closed').length

  return (
    <div className="px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Elections</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage all community elections from here.</p>
        </div>
        <Button asChild>
          <Link to="/admin/elections/new">
            <i className="bx bx-plus text-base mr-1" />
            New Election
          </Link>
        </Button>
      </div>

      {/* Stat tiles */}
      {!isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile icon="bx-calendar" label="Total" value={elections.length} />
          <StatTile icon="bx-radio-circle-marked" label="Active" value={active} color="text-green-600" />
          <StatTile icon="bx-time-five" label="Upcoming" value={upcoming} color="text-blue-600" />
          <StatTile icon="bx-lock-alt" label="Closed" value={closed} color="text-muted-foreground" />
        </div>
      )}

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-xl border border-border p-4 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-10" />
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
              {[1, 2, 3, 4].map(i => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-48" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-16 rounded-full" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-8 w-20 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : elections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center space-y-2">
          <i className="bx bx-calendar-x text-3xl text-muted-foreground" />
          <p className="text-sm font-medium">No elections yet</p>
          <p className="text-xs text-muted-foreground">Create your first election to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
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
                    <div className="flex items-center justify-end gap-2 flex-wrap">
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/admin/elections/${election._id}`}>
                          <i className="bx bx-cog mr-1 text-sm" /> Manage
                        </Link>
                      </Button>
                      {election.status === 'upcoming' && (
                        <>
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/elections/${election._id}/edit`}>
                              <i className="bx bx-edit mr-1 text-sm" /> Edit
                            </Link>
                          </Button>
                          <Button size="sm" onClick={() => setOpenConfirm(election)}>
                            <i className="bx bx-play mr-1 text-sm" /> Open
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(election)}>
                            <i className="bx bx-trash mr-1 text-sm" /> Delete
                          </Button>
                        </>
                      )}
                      {election.status === 'active' && (
                        <Button variant="destructive" size="sm" onClick={() => setCloseConfirm(election)}>
                          <i className="bx bx-stop mr-1 text-sm" /> Close
                        </Button>
                      )}
                      {election.status === 'closed' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/admin/elections/${election._id}/results`}>
                            <i className="bx bx-bar-chart-alt-2 mr-1 text-sm" /> Results
                          </Link>
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
        <ConfirmDialog
          title="Delete Election"
          description={`Delete "${deleteConfirm.title}"? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          isLoading={isDeleting}
        />
      )}

      {openConfirm && (
        <ConfirmDialog
          title="Open Election"
          description={`Open "${openConfirm.title}" for voting? Voters will be able to cast their votes immediately.`}
          confirmLabel="Open Election"
          confirmVariant="default"
          onConfirm={() => handleOpen(openConfirm)}
          onClose={() => setOpenConfirm(null)}
          isLoading={actionLoading === openConfirm._id + '-open'}
        />
      )}

      {closeConfirm && (
        <ConfirmDialog
          title="Close Election"
          description={`Close "${closeConfirm.title}"? Voting will stop immediately and this cannot be undone.`}
          confirmLabel="Close Election"
          onConfirm={() => handleClose(closeConfirm)}
          onClose={() => setCloseConfirm(null)}
          isLoading={actionLoading === closeConfirm._id + '-close'}
        />
      )}
    </div>
  )
}

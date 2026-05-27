import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAllAdminCandidates, deleteCandidate } from '@/services/candidateService'
import CandidateFormModal from '@/components/candidates/CandidateFormModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { showSuccess, showError } from '@/lib/toast'
import ElectionStatusBadge from '@/components/elections/ElectionStatusBadge'

export default function ManageCandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('delete') === '1' ? 'delete'
    : searchParams.get('add') === '1' ? 'add'
    : 'view'

  const [candidates, setCandidates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { fetchCandidates() }, [])

  async function fetchCandidates() {
    setIsLoading(true)
    setError('')
    try {
      setCandidates(await getAllAdminCandidates())
    } catch {
      setError('Failed to load candidates.')
    } finally {
      setIsLoading(false)
    }
  }

  function closeAddModal() {
    setSearchParams({}, { replace: true })
    setAddModal(false)
  }

  function handleSaved(saved) {
    setCandidates(prev => {
      const exists = prev.some(c => c._id === saved._id)
      return exists ? prev.map(c => c._id === saved._id ? saved : c) : [saved, ...prev]
    })
    closeAddModal()
    setEditModal(null)
  }

  async function handleDelete(candidate) {
    setIsDeleting(true)
    try {
      await deleteCandidate(candidate._id)
      setCandidates(prev => prev.filter(c => c._id !== candidate._id))
      setDeleteConfirm(null)
      showSuccess(`${candidate.name} removed.`)
    } catch (err) {
      showError(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = candidates.filter(c => {
    const q = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(q) ||
      (c.party || '').toLowerCase().includes(q) ||
      (c.positionId?.name || '').toLowerCase().includes(q) ||
      (c.electionId?.title || '').toLowerCase().includes(q)
    )
  })

  const titles = {
    view:   { heading: 'Manage Candidates', sub: 'View and edit all candidates.' },
    add:    { heading: 'Add Candidate',     sub: 'Add a candidate to an election.' },
    delete: { heading: 'Delete Candidate',  sub: 'Remove a candidate from the system.' },
  }

  return (
    <div className="px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">{titles[mode].heading}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{titles[mode].sub}</p>
        </div>
        {mode === 'add' && (
          <Button onClick={() => setAddModal(true)}>
            <i className="bx bx-plus mr-1 text-base" /> Add Candidate
          </Button>
        )}
      </div>

      {/* Search + count */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
          <i className="bx bx-group text-primary text-sm" />
          {isLoading ? '—' : candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
        </span>
        <div className="relative flex-1 min-w-48 max-w-64">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base pointer-events-none" />
          <input
            type="text" placeholder="Search by name, party, position…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
      {isLoading ? (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Candidate</th>
                <th className="text-left px-4 py-3 font-medium">Party</th>
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-left px-4 py-3 font-medium">Election</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1,2,3,4,5].map(i => (
                <tr key={i}>
                  <td className="px-4 py-3"><div className="flex items-center gap-2.5"><Skeleton className="w-8 h-8 rounded-full shrink-0" /><Skeleton className="h-4 w-36" /></div></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-24" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center space-y-2">
          <i className="bx bx-user-x text-3xl text-muted-foreground" />
          <p className="text-sm font-medium">
            {search ? 'No candidates match your search.' : 'No candidates yet.'}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Candidate</th>
                <th className="text-left px-4 py-3 font-medium">Party</th>
                <th className="text-left px-4 py-3 font-medium">Position</th>
                <th className="text-left px-4 py-3 font-medium">Election</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(c => {
                const initials = c.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <tr key={c._id} className="hover:bg-muted/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {c.imagePath ? (
                          <img src={c.imagePath} alt={c.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                            {initials}
                          </div>
                        )}
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.party || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.positionId?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[160px]">{c.electionId?.title || '—'}</span>
                        {c.electionId?.status && <ElectionStatusBadge status={c.electionId.status} />}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {mode === 'delete' ? (
                        <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(c)}>
                          <i className="bx bx-trash mr-1 text-sm" /> Delete
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setEditModal(c)}>
                          <i className="bx bx-edit mr-1 text-sm" /> Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {addModal && <CandidateFormModal onSuccess={handleSaved} onClose={closeAddModal} />}
      {editModal && <CandidateFormModal candidate={editModal} onSuccess={handleSaved} onClose={() => setEditModal(null)} />}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Candidate"
          description={`Remove ${deleteConfirm.name}? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}

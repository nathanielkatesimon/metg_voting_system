import { useState, useEffect } from 'react'
import { getAdminUsers, deleteAdminUser } from '@/services/userService'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { showSuccess, showError } from '@/lib/toast'

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    fetchUsers(page)
  }, [page])

  async function fetchUsers(p) {
    setIsLoading(true)
    setError('')
    try {
      const data = await getAdminUsers(p, 20)
      setUsers(data.users)
      setTotal(data.total)
      setPages(data.pages)
    } catch {
      setError('Failed to load voters.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDelete(user) {
    setIsDeleting(true)
    try {
      await deleteAdminUser(user._id)
      setDeleteConfirm(null)
      showSuccess(`${user.fullName} has been removed.`)
      fetchUsers(page)
    } catch (err) {
      showError(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.voterId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-6 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Registered Voters</h1>
        <p className="text-sm text-muted-foreground mt-0.5">View and manage all voters registered in the system.</p>
      </div>

      {/* Stat + search row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
            <i className="bx bx-group text-primary text-sm" />
            {isLoading ? '—' : total} registered voter{total !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="relative w-full sm:w-64">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or voter ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="rounded-xl border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Full Name</th>
                <th className="text-left px-4 py-3 font-medium">Voter ID</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <tr key={i}>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-36" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-28" /></td>
                  <td className="px-4 py-3"><Skeleton className="h-4 w-12" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Full Name</th>
                  <th className="text-left px-4 py-3 font-medium">Voter ID</th>
                  <th className="text-left px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center">
                      <div className="space-y-1">
                        <i className="bx bx-search-alt text-2xl text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No voters found.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr key={u._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 select-none">
                            {u.fullName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
                          </div>
                          <span className="font-medium">{u.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{u.voterId}</td>
                      <td className="px-4 py-3 capitalize">
                        <span className="inline-flex items-center gap-1 text-xs font-medium">
                          {u.role === 'admin'
                            ? <><i className="bx bx-shield text-primary text-sm" /> Admin</>
                            : <><i className="bx bx-user text-muted-foreground text-sm" /> Voter</>
                          }
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirm(u)}
                        >
                          <i className="bx bx-trash mr-1 text-sm" /> Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <i className="bx bx-chevron-left text-base" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next <i className="bx bx-chevron-right text-base" />
              </Button>
            </div>
          )}
        </>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Voter"
          description={`Remove ${deleteConfirm.fullName} (${deleteConfirm.voterId})? This action cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}

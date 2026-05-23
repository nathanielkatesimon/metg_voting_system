import { useState, useEffect } from 'react'
import { getAdminUsers, deleteAdminUser } from '@/services/userService'
import { Button } from '@/components/ui/button'

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
      fetchUsers(page)
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.')
    } finally {
      setIsDeleting(false)
    }
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.voterId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Registered Voters</h1>
          <p className="text-sm text-muted-foreground">{total} total</p>
        </div>
        <input
          type="text"
          placeholder="Search by name or voter ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-64 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading…</div>
      ) : (
        <>
          <div className="rounded-xl border border-border overflow-hidden">
            <table className="w-full text-sm">
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
                    <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                      No voters found.
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr key={u._id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3 font-medium">{u.fullName}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{u.voterId}</td>
                      <td className="px-4 py-3 capitalize">{u.role}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteConfirm(u)}
                        >
                          Delete
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
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
            <h2 className="font-semibold">Delete Voter</h2>
            <p className="text-sm text-muted-foreground">
              Remove <span className="font-medium text-foreground">{deleteConfirm.fullName}</span> ({deleteConfirm.voterId})?
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

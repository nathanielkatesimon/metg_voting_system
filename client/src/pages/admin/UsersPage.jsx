import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser, importAdminUsers } from '@/services/userService'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { Skeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/button'
import { showSuccess, showError } from '@/lib/toast'

function CsvImportModal({ onDone, onClose }) {
  const fileRef = useRef(null)
  const [file, setFile] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  async function handleUpload() {
    if (!file) return setError('Please select a CSV file.')
    setError('')
    setIsUploading(true)
    try {
      const data = await importAdminUsers(file)
      setResult(data)
      if (data.created > 0) onDone()
    } catch (err) {
      setError(err.response?.data?.message || 'Import failed.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Import Voters via CSV</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <i className="bx bx-x text-xl" />
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-sm text-muted-foreground">
              Upload a CSV with columns: <code className="bg-muted px-1 rounded text-xs">fullName</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">voterId</code>,{' '}
              <code className="bg-muted px-1 rounded text-xs">password</code>. Existing voter IDs are skipped.
            </p>
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/60 hover:bg-muted/40 transition-colors"
            >
              <i className="bx bx-upload text-2xl text-muted-foreground" />
              <p className="text-sm mt-1 text-muted-foreground">
                {file ? file.name : 'Click to choose a .csv file'}
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={e => { setFile(e.target.files[0] || null); setError('') }}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <Button type="button" variant="outline" onClick={onClose} disabled={isUploading}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!file || isUploading}>
                {isUploading ? 'Importing…' : 'Import'}
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <i className="bx bx-check-circle text-base" />
                <span>{result.created} voter{result.created !== 1 ? 's' : ''} created</span>
              </div>
              {result.skipped > 0 && (
                <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <i className="bx bx-skip-next text-base" />
                  <span>{result.skipped} row{result.skipped !== 1 ? 's' : ''} skipped (duplicate Voter ID)</span>
                </div>
              )}
              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-destructive">
                    <i className="bx bx-error-circle text-base" />
                    <span>{result.errors.length} row{result.errors.length !== 1 ? 's' : ''} failed validation</span>
                  </div>
                  <ul className="ml-5 space-y-0.5 text-xs text-muted-foreground list-disc">
                    {result.errors.map((e, i) => (
                      <li key={i}>Row {e.row}: {e.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="flex justify-end pt-1">
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function VoterFormModal({ voter, onSuccess, onClose }) {
  const isEdit = Boolean(voter)
  const [form, setForm] = useState({
    fullName: voter?.fullName ?? '',
    voterId: voter?.voterId ?? '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fullName.trim() || !form.voterId.trim()) {
      return setError('Full name and Voter ID are required.')
    }
    if (!isEdit && !form.password) return setError('Password is required.')
    if (form.password && form.password.length < 8) {
      return setError('Password must be at least 8 characters.')
    }
    setIsSubmitting(true)
    try {
      const payload = { fullName: form.fullName, voterId: form.voterId }
      if (form.password) payload.password = form.password
      const saved = isEdit
        ? await updateAdminUser(voter._id, payload)
        : await createAdminUser({ ...payload, password: form.password })
      showSuccess(isEdit ? 'Voter updated.' : `${saved.fullName} added as a voter.`)
      onSuccess(saved)
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold">{isEdit ? 'Edit Voter' : 'Add Voter'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="vf-fullName">Full Name *</label>
            <input
              id="vf-fullName" name="fullName" type="text" autoComplete="off"
              value={form.fullName} onChange={handleChange} placeholder="e.g. Juan dela Cruz"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="vf-voterId">Voter ID *</label>
            <input
              id="vf-voterId" name="voterId" type="text" autoComplete="off"
              value={form.voterId} onChange={handleChange} placeholder="e.g. VTR-2026-001"
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="vf-password">
              Password {isEdit ? <span className="text-muted-foreground font-normal">(leave blank to keep)</span> : '*'}
            </label>
            <div className="relative">
              <input
                id="vf-password" name="password" autoComplete="new-password"
                type={showPassword ? 'text' : 'password'}
                value={form.password} onChange={handleChange}
                placeholder={isEdit ? 'New password…' : 'Min. 8 characters'}
                className="w-full rounded-lg border border-input bg-background px-3 pr-10 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-base`} />
              </button>
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Voter'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function UsersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode = searchParams.get('delete') === '1' ? 'delete'
    : searchParams.get('add') === '1' ? 'add'
    : 'view'

  const [users, setUsers] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [search, setSearch] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [addModal, setAddModal] = useState(false)
  const [editModal, setEditModal] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [importModal, setImportModal] = useState(false)

  useEffect(() => { fetchUsers(page) }, [page])

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

  function closeAddModal() {
    setSearchParams({}, { replace: true })
    setAddModal(false)
  }

  function handleSaved(saved) {
    closeAddModal()
    setEditModal(null)
    setUsers(prev => {
      const exists = prev.some(u => u._id === saved._id)
      if (exists) return prev.map(u => u._id === saved._id ? saved : u)
      setTotal(t => t + 1)
      return [saved, ...prev].slice(0, 20)
    })
  }

  async function handleDelete(user) {
    setIsDeleting(true)
    try {
      await deleteAdminUser(user._id)
      setDeleteConfirm(null)
      setTotal(t => t - 1)
      setUsers(prev => prev.filter(u => u._id !== user._id))
      showSuccess(`${user.fullName} has been removed.`)
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

  const titles = {
    view: { heading: 'Manage Voters', sub: 'View and edit registered voters.' },
    add:  { heading: 'Add Voter',     sub: 'Register a new voter account.' },
    delete: { heading: 'Delete Voter', sub: 'Remove a voter from the system.' },
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModal(true)}>
              <i className="bx bx-import mr-1 text-base" /> Import CSV
            </Button>
            <Button onClick={() => setAddModal(true)}>
              <i className="bx bx-plus mr-1 text-base" /> Add Voter
            </Button>
          </div>
        )}
      </div>

      {/* Search */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium">
          <i className="bx bx-group text-primary text-sm" />
          {isLoading ? '—' : total} registered voter{total !== 1 ? 's' : ''}
        </span>
        <div className="relative w-full sm:w-64">
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-base pointer-events-none" />
          <input
            type="text" placeholder="Search by name or voter ID…"
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Table */}
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
              {[1,2,3,4,5].map(i => (
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
                      <i className="bx bx-search-alt text-2xl text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-1">No voters found.</p>
                    </td>
                  </tr>
                ) : filtered.map(u => (
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
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-medium">
                        {u.role === 'admin'
                          ? <><i className="bx bx-shield text-primary text-sm" /> Admin</>
                          : <><i className="bx bx-user text-muted-foreground text-sm" /> Voter</>}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {mode === 'delete' ? (
                        <Button variant="destructive" size="sm" onClick={() => setDeleteConfirm(u)}>
                          <i className="bx bx-trash mr-1 text-sm" /> Delete
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => setEditModal(u)}>
                          <i className="bx bx-edit mr-1 text-sm" /> Edit
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pages > 1 && (
            <div className="flex items-center gap-2 justify-end">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <i className="bx bx-chevron-left text-base" /> Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>
                Next <i className="bx bx-chevron-right text-base" />
              </Button>
            </div>
          )}
        </>
      )}

      {importModal && (
        <CsvImportModal
          onDone={() => { fetchUsers(1); setPage(1) }}
          onClose={() => setImportModal(false)}
        />
      )}
      {addModal && <VoterFormModal onSuccess={handleSaved} onClose={closeAddModal} />}
      {editModal && <VoterFormModal voter={editModal} onSuccess={handleSaved} onClose={() => setEditModal(null)} />}

      {deleteConfirm && (
        <ConfirmDialog
          title="Delete Voter"
          description={`Remove ${deleteConfirm.fullName} (${deleteConfirm.voterId})? This cannot be undone.`}
          onConfirm={() => handleDelete(deleteConfirm)}
          onClose={() => setDeleteConfirm(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  )
}

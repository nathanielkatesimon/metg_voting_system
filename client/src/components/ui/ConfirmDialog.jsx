import { Button } from '@/components/ui/button'

export default function ConfirmDialog({ title, description, confirmLabel = 'Delete', onConfirm, onClose, isLoading = false }) {
  const loadingLabel = confirmLabel === 'Delete' ? 'Deleting…' : `${confirmLabel}…`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4">
        <h2 className="font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? loadingLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

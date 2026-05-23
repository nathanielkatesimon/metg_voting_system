import { toast } from 'sonner'

export function showSuccess(message) {
  toast.success(message, { duration: 4000 })
}

export function showError(message) {
  toast.error(message, { duration: 4000 })
}

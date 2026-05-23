import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-4">
      <h1 className="text-3xl font-bold">Access Denied</h1>
      <p className="text-muted-foreground">You don't have permission to view this page.</p>
      <Button asChild>
        <Link to="/">Go Home</Link>
      </Button>
    </div>
  )
}

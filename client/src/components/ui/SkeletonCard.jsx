export default function SkeletonCard({ lines = 3 }) {
  return (
    <div className="rounded-xl border border-border p-4 space-y-3 animate-pulse">
      <div className="h-4 bg-muted rounded w-3/4" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <div key={i} className="h-3 bg-muted rounded" style={{ width: `${60 + (i % 3) * 15}%` }} />
      ))}
    </div>
  )
}

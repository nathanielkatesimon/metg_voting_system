export default function CandidateCard({ candidate, selected, onClick }) {
  const initials = candidate.name
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div
      onClick={onClick}
      className={[
        'rounded-xl border p-4 space-y-3 transition-colors',
        onClick ? 'cursor-pointer' : '',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:bg-muted/40',
      ].join(' ')}
    >
      <div className="flex justify-center">
        {candidate.imagePath ? (
          <img
            src={candidate.imagePath}
            alt={candidate.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-semibold text-muted-foreground">
            {initials}
          </div>
        )}
      </div>

      <div className="text-center space-y-0.5">
        <p className="font-semibold text-sm leading-tight">{candidate.name}</p>
        {candidate.party && (
          <p className="text-xs text-muted-foreground">{candidate.party}</p>
        )}
        {candidate.platform && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{candidate.platform}</p>
        )}
      </div>

      {selected && (
        <p className="text-center text-xs font-medium text-primary">✓ Selected</p>
      )}
    </div>
  )
}

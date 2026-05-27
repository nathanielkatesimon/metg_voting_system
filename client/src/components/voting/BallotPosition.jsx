export default function BallotPosition({ position, candidates, votedCandidateIds, selectedIds, onToggle }) {
  const seats = position.seats ?? 1
  const votedSet = new Set(votedCandidateIds.map(String))
  const fullyVoted = votedCandidateIds.length >= seats
  const isMulti = seats > 1

  function handleClick(candidateId) {
    if (fullyVoted || votedSet.has(String(candidateId))) return
    onToggle(candidateId)
  }

  return (
    <div>
      {/* Position header */}
      <div className="mb-2">
        <h2 className="text-base font-semibold">{position.name}</h2>
        <p className="text-xs text-muted-foreground">
          {fullyVoted
            ? isMulti
              ? `Voted (${seats} selected)`
              : 'Voted'
            : isMulti
              ? `Select ${seats} out of ${candidates.length} candidates`
              : 'Select 1 candidate'}
        </p>
      </div>

      {/* Candidate rows */}
      <div className="rounded-lg border border-border overflow-hidden divide-y divide-border">
        {candidates.length === 0 ? (
          <p className="px-4 py-3 text-sm text-muted-foreground">No candidates.</p>
        ) : (
          candidates.map(candidate => {
            const isVoted = votedSet.has(String(candidate._id))
            const isSelected = selectedIds.has(candidate._id)
            const checked = isVoted || isSelected
            const disabled = fullyVoted && !isVoted

            return (
              <button
                key={candidate._id}
                type="button"
                disabled={disabled || isVoted}
                onClick={() => handleClick(candidate._id)}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                  isVoted
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : isSelected
                      ? 'bg-primary/5'
                      : disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-muted/50 cursor-pointer',
                ].join(' ')}
              >
                {/* Radio / Checkbox indicator */}
                {isMulti ? (
                  <span className={[
                    'w-4 h-4 rounded border-2 flex items-center justify-center shrink-0',
                    isVoted
                      ? 'border-green-500 bg-green-500'
                      : isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground',
                  ].join(' ')}>
                    {checked && <i className="bx bx-check text-white text-xs" />}
                  </span>
                ) : (
                  <span className={[
                    'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0',
                    isVoted
                      ? 'border-green-500'
                      : isSelected
                        ? 'border-primary'
                        : 'border-muted-foreground',
                  ].join(' ')}>
                    {checked && (
                      <span className={[
                        'w-2 h-2 rounded-full',
                        isVoted ? 'bg-green-500' : 'bg-primary',
                      ].join(' ')} />
                    )}
                  </span>
                )}

                {/* Candidate info */}
                <span className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{candidate.name}</span>
                </span>
                {candidate.party && (
                  <span className="text-xs text-muted-foreground shrink-0">{candidate.party}</span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

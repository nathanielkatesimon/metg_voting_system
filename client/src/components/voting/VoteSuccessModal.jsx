import { Button } from '@/components/ui/button'

export default function VoteSuccessModal({ committed, positions, candidatesByPosition, onClose }) {
  const votedPositions = positions.filter(p => committed[p._id]?.length > 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-background rounded-xl border border-border shadow-lg p-6 w-full max-w-sm space-y-4 text-center">
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 mx-auto">
          <i className="bx bx-check-circle text-green-600 dark:text-green-400 text-4xl" />
        </div>

        <div>
          <h2 className="font-semibold text-lg">Successfully voted!</h2>
          <p className="text-sm text-muted-foreground mt-1">Your selections have been recorded.</p>
        </div>

        {votedPositions.length > 0 && (
          <div className="text-left space-y-2 max-h-48 overflow-y-auto pr-1">
            {votedPositions.map(pos => {
              const candidates = (candidatesByPosition[pos._id] || []).filter(c =>
                committed[pos._id]?.includes(c._id)
              )
              return (
                <div key={pos._id}>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                    {pos.name}
                  </p>
                  {candidates.map(c => (
                    <p key={c._id} className="text-sm font-medium flex items-center gap-1.5">
                      <i className="bx bx-user text-primary text-base" />
                      {c.name}
                      {c.party && <span className="text-xs text-muted-foreground font-normal">— {c.party}</span>}
                    </p>
                  ))}
                </div>
              )
            })}
          </div>
        )}

        <Button
          className="w-full bg-foreground text-background hover:bg-foreground/90"
          onClick={onClose}
        >
          Done
        </Button>
      </div>
    </div>
  )
}

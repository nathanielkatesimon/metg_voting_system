export default function CandidateRankingTable({ candidates }) {
  const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-muted-foreground">
            <th className="py-2 px-3 font-medium">#</th>
            <th className="py-2 px-3 font-medium">Candidate</th>
            <th className="py-2 px-3 font-medium">Party</th>
            <th className="py-2 px-3 font-medium text-right">Votes</th>
            <th className="py-2 px-3 font-medium text-right">%</th>
          </tr>
        </thead>
        <tbody>
          {candidates.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-6 text-center text-muted-foreground">No candidates.</td>
            </tr>
          ) : (
            candidates.map((c, i) => {
              const pct = totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(1) : '0.0'
              const isLeader = i === 0 && c.voteCount > 0
              return (
                <tr
                  key={c.candidateId}
                  className={[
                    'border-b border-border last:border-0',
                    isLeader ? 'bg-primary/5 font-medium' : '',
                  ].join(' ')}
                >
                  <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                  <td className="py-2 px-3">{c.name}</td>
                  <td className="py-2 px-3 text-muted-foreground">{c.party || '—'}</td>
                  <td className="py-2 px-3 text-right">{c.voteCount}</td>
                  <td className="py-2 px-3 text-right">{pct}%</td>
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

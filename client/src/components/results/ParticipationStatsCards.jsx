export default function ParticipationStatsCards({ stats }) {
  const { totalVoters, participatingVoters, turnout } = stats
  const turnoutNum = parseFloat(turnout)
  const turnoutColor = turnoutNum >= 75
    ? 'text-green-600'
    : turnoutNum >= 50
      ? 'text-yellow-600'
      : 'text-red-600'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border p-5 space-y-1">
        <p className="text-sm text-muted-foreground">Total Voters</p>
        <p className="text-3xl font-bold">{totalVoters}</p>
      </div>
      <div className="rounded-xl border border-border p-5 space-y-1">
        <p className="text-sm text-muted-foreground">Participated</p>
        <p className="text-3xl font-bold">{participatingVoters}</p>
      </div>
      <div className="rounded-xl border border-border p-5 space-y-1">
        <p className="text-sm text-muted-foreground">Turnout</p>
        <p className={`text-3xl font-bold ${turnoutColor}`}>{turnout}%</p>
      </div>
    </div>
  )
}

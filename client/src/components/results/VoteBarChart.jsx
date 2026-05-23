import { BarChart, Bar, XAxis, YAxis, Tooltip, LabelList, ResponsiveContainer } from 'recharts'

export default function VoteBarChart({ candidates }) {
  const data = candidates.map(c => ({ name: c.name, votes: c.voteCount }))

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 24, right: 10, left: -10, bottom: 5 }}>
        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="votes" fill="#6366f1" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="votes" position="top" style={{ fontSize: 12, fill: '#6b7280' }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

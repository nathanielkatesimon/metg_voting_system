const styles = {
  upcoming: 'bg-gray-100 text-gray-700',
  active: 'bg-green-100 text-green-700',
  closed: 'bg-red-100 text-red-700',
}

export default function ElectionStatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] ?? styles.upcoming}`}>
      {status}
    </span>
  )
}

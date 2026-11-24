const STATUS_COLORS = {
  'Welcome & Consultation Pending': 'bg-gray-100 text-gray-700',
  'Profile Assessment': 'bg-purple-100 text-purple-700',
  'Documents Requested': 'bg-yellow-100 text-yellow-700',
  'Documents Under Review': 'bg-orange-100 text-orange-700',
  'Appointment In Progress': 'bg-blue-100 text-blue-700',
  'Application Preparation': 'bg-indigo-100 text-indigo-700',
  'Documents Ready': 'bg-cyan-100 text-cyan-700',
  'Appointment Completed': 'bg-teal-100 text-teal-700',
  'Visa Under Process': 'bg-sky-100 text-sky-700',
  'Visa Approved': 'bg-green-100 text-green-700',
  'Visa Declined': 'bg-red-100 text-red-700',
  'Feedback & Testimonial': 'bg-pink-100 text-pink-700',
  Completed: 'bg-emerald-100 text-emerald-700',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
  return (
    <span className={`badge ${cls}`}>{status}</span>
  )
}

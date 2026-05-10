export const STATUS_OPTIONS = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'expired', label: 'Expired' },
];

export function statusTone(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
    case 'expired':
      return 'bg-rose-100 text-rose-700 hover:bg-rose-100';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
    case 'active':
    default:
      return 'bg-violet-100 text-violet-700 hover:bg-violet-100';
  }
}

export function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'expired') return 'Expired';
  if (status === 'scheduled') return 'Scheduled';
  return 'Active';
}

export function isEditableStatus(status) {
  return status === 'scheduled' || status === 'active';
}

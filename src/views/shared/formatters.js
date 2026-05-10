export function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(value) {
  const date = typeof value === 'number' ? new Date(value) : new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'Not synced yet';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

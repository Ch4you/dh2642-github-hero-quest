export function LoadingSpinner({ className = 'h-4 w-4', label = 'Loading' }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className={`${className} inline-block animate-spin rounded-full border-2 border-slate-300 border-t-slate-700`}
        aria-hidden="true"
      />
      <span className="text-sm text-slate-600">{label}</span>
    </span>
  );
}


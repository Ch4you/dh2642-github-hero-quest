import { cn } from './utils.js';

export function Progress({ value = 0, className, ...props }) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)} {...props}>
      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
    </div>
  );
}


import { Badge } from '../../components/ui/badge.jsx';
import { cn } from '../../components/ui/utils.js';
import { STATUS_OPTIONS, statusTone } from '../shared/goalStatus.js';

export default function GoalStatusCardsView({ statusFilter, statusCounts = {}, onStatusFilterChange }) {
  return (
    <div className="grid gap-4 md:grid-cols-4">
      {STATUS_OPTIONS.map((status) => {
        const active = statusFilter === status.key;
        return (
          <button
            key={status.key}
            type="button"
            onClick={() => onStatusFilterChange?.(status.key)}
            className={cn(
              'rounded-[24px] border p-5 text-left shadow-sm transition',
              active ? 'border-slate-300 bg-slate-100' : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <Badge className={cn('rounded-full', statusTone(status.key))}>{status.label}</Badge>
            <div className="mt-4 text-3xl font-bold text-slate-900">{statusCounts[status.key] ?? 0}</div>
            <div className="mt-1 text-sm text-slate-500">{status.label} goals</div>
          </button>
        );
      })}
    </div>
  );
}

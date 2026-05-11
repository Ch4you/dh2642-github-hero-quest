import { Badge } from '../../components/ui/badge.jsx';
import { Progress } from '../../components/ui/progress.jsx';
import { cn } from '../../components/ui/utils.js';
import { formatDate } from '../shared/formatters.js';
import { statusLabel, statusTone } from '../shared/goalStatus.js';

export default function ActiveGoalsListView({ goals, onComplete }) {
  const activeGoals = Array.isArray(goals) ? goals : [];

  if (!activeGoals.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No active goals right now.</div>;
  }

  return (
    <div className="max-h-[min(520px,58vh)] space-y-3 overflow-y-auto pr-1">
      {activeGoals.map((goal) => (
        <div key={goal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={cn('rounded-full', statusTone(goal.status))}>{statusLabel(goal.status)}</Badge>
                <span className="text-sm text-slate-500">{goal.metricLabel}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-slate-900">{goal.title}</h3>
              {goal.description && <p className="mt-1 text-sm leading-6 text-slate-600">{goal.description}</p>}
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-sm text-slate-500">{formatDate(goal.startDate)} – {formatDate(goal.endDate)}</div>
              {goal.status === 'active' && onComplete && (goal.progress?.percentage ?? 0) >= 100 && (
                <button
                  onClick={() => onComplete(goal.id)}
                  className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-200 transition-colors"
                >
                  Complete
                </button>
              )}
            </div>
          </div>
          <div className="mt-4">
            <Progress value={goal.progress?.percentage ?? 0} className="h-3 rounded-full" />
            <div className="mt-2 flex items-center justify-between text-sm text-slate-600">
              <span>{goal.progress?.current ?? 0} / {goal.progress?.goal ?? 1}</span>
              <span>{goal.progress?.percentage ?? 0}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

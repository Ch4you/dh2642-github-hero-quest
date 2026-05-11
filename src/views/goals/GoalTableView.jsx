import { Eye, Pencil, Trash2, CheckCircle2  } from 'lucide-react';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../components/ui/utils.js';
import { formatDate } from '../shared/formatters.js';
import { isEditableStatus, statusLabel, statusTone } from '../shared/goalStatus.js';

export default function GoalTableView({ requests = [], onViewRequest, onEditRequest, onDeleteRequest, onCompleteRequest }) {
  return (
    <div className="max-h-[410px] overflow-auto rounded-3xl border border-slate-200">
      <table className="min-w-[920px] w-full divide-y divide-slate-200 text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Index</th>
            <th className="px-4 py-3">Goal</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Target</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Date range</th>
            <th className="px-4 py-3">Reward</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {requests.length === 0 && (
            <tr>
              <td colSpan="9" className="px-4 py-8 text-center text-slate-500">No goals match this status.</td>
            </tr>
          )}
          {requests.map((goal, index) => {
            const canEdit = isEditableStatus(goal.status);
            const canComplete =
              goal.status === 'active' &&
              (goal.progress?.current ?? 0) >= (goal.progress?.goal ?? 1);
            return (
              <tr key={goal.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <div className="max-w-[220px] truncate font-medium text-slate-900" title={goal.title}>{goal.title}</div>
                  {goal.description && <div className="max-w-[220px] truncate text-xs text-slate-500" title={goal.description}>{goal.description}</div>}
                </td>
                <td className="px-4 py-3"><Badge className={cn('rounded-full', statusTone(goal.status))}>{statusLabel(goal.status)}</Badge></td>
                <td className="px-4 py-3 text-slate-600">{goal.metricLabel}</td>
                <td className="px-4 py-3 text-slate-600">{goal.targetValue}</td>
                <td className="px-4 py-3 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span>{goal.progress?.current ?? 0}/{goal.progress?.goal ?? 1}</span>
                   
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(goal.startDate)} – {formatDate(goal.endDate)}</td>
                <td className="px-4 py-3 text-slate-600">+{goal.rewardXp ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => onViewRequest?.(goal.id)} title="View goal">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {canEdit && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 rounded-xl border-slate-200"
                        onClick={() => onEditRequest?.(goal.id)}
                        title="Edit goal"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    )}
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteRequest?.(goal.id)} title="Delete goal">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {goal.status === 'active' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        disabled={!canComplete}
                        className="h-9 w-9 rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 disabled:border-slate-200 disabled:text-slate-300 disabled:hover:bg-white"
                        onClick={() => canComplete && onCompleteRequest?.(goal.id)}
                        title={canComplete ? 'Complete goal' : 'Goal can be completed after it reaches the target'}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

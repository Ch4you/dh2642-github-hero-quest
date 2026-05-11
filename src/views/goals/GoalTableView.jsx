import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../components/ui/utils.js';
import { formatDate } from '../shared/formatters.js';
import { isEditableStatus, statusLabel, statusTone } from '../shared/goalStatus.js';

export default function GoalTableView({ requests = [], onViewRequest, onEditRequest, onDeleteRequest, onCompleteRequest }) {
  return (
    <div className="max-h-[calc(100vh-440px)] overflow-auto rounded-3xl border border-slate-200">
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
                    {goal.status === 'active' && (goal.progress?.current ?? 0) >= (goal.progress?.goal ?? 1) && (
                      <Button type="button" size="sm" className="h-7 rounded-xl bg-emerald-600 px-2 text-xs text-white hover:bg-emerald-700" onClick={() => onCompleteRequest?.(goal.id)}>
                        Complete
                      </Button>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{formatDate(goal.startDate)} – {formatDate(goal.endDate)}</td>
                <td className="px-4 py-3 text-slate-600">+{goal.rewardXp ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex gap-2">
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => onViewRequest?.(goal.id)} title="View goal">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" disabled={!canEdit} className="h-9 w-9 rounded-xl border-slate-200" onClick={() => canEdit && onEditRequest?.(goal.id)} title={canEdit ? 'Edit goal' : 'Only scheduled and active goals can be edited'}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteRequest?.(goal.id)} title="Delete goal">
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

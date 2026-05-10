import { X } from 'lucide-react';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../components/ui/utils.js';
import { formatDate, formatDateTime } from '../shared/formatters.js';
import { isEditableStatus, statusLabel, statusTone } from '../shared/goalStatus.js';

export default function GoalDetailModalView({ goal, memberContributionRows, onClose, onEditRequest, onDeleteRequest }) {
  if (!goal) return null;
  const sortedRows = [...memberContributionRows].sort((a, b) => Number(b.contribution ?? 0) - Number(a.contribution ?? 0));
  const canEdit = isEditableStatus(goal.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-900">{goal.title}</h2>
            <Badge className={cn('rounded-full', statusTone(goal.status))}>{statusLabel(goal.status)}</Badge>
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Metric</div>
              <div className="mt-2 font-semibold text-slate-900">{goal.metricLabel}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Progress</div>
              <div className="mt-2 font-semibold text-slate-900">{goal.progress?.current ?? 0}/{goal.progress?.goal ?? 1}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Date range</div>
              <div className="mt-2 font-semibold text-slate-900">{formatDate(goal.startDate)} – {formatDate(goal.endDate)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div className="text-xs uppercase tracking-wide text-slate-500">Reward pool</div>
              <div className="mt-2 font-semibold text-slate-900">+{goal.rewardXp ?? 0} XP</div>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Index</th>
                  <th className="px-4 py-3">Username</th>
                  <th className="px-4 py-3">Contribution</th>
                  <th className="px-4 py-3">Share</th>
                  <th className="px-4 py-3">Bonus XP</th>
                  <th className="px-4 py-3">Last synced</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {sortedRows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-4 py-6 text-center text-slate-500">Only teammates who have synced this repository are shown here.</td>
                  </tr>
                )}
                {sortedRows.map((row, index) => (
                  <tr key={row.username} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{row.username}</td>
                    <td className="px-4 py-3 text-slate-600">{row.contribution}</td>
                    <td className="px-4 py-3 text-slate-600">{Math.round((row.share ?? 0) * 100)}%</td>
                    <td className="px-4 py-3 text-slate-600">+{row.bonusXp}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDateTime(row.syncedAtMs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" variant="outline" disabled={!canEdit} className="rounded-2xl border-slate-200" onClick={() => canEdit && onEditRequest?.(goal.id)}>
              Edit
            </Button>
            <Button type="button" variant="outline" className="rounded-2xl border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteRequest?.(goal.id)}>
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

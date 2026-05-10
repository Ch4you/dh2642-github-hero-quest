import { Eye, Info, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Progress } from '../components/ui/progress.jsx';
import { cn } from '../components/ui/utils.js';

const STATUS_OPTIONS = [
  { key: 'scheduled', label: 'Scheduled' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Completed' },
  { key: 'expired', label: 'Expired' },
];

function GoalStatusInfo() {
  return (
    <div className="group relative inline-flex">
      <button type="button" className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900" aria-label="Goal status explanation">
        <Info className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-80 rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs leading-5 text-slate-600 shadow-xl group-hover:block">
        <div><strong>Scheduled:</strong> the goal has not reached its start date.</div>
        <div><strong>Active:</strong> today is inside the date range and the target is not reached yet.</div>
        <div><strong>Completed:</strong> the date-range team metric reached the target.</div>
        <div><strong>Expired:</strong> the end date passed before the target was reached.</div>
      </div>
    </div>
  );
}

function statusTone(status) {
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

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'expired') return 'Expired';
  if (status === 'scheduled') return 'Scheduled';
  return 'Active';
}

function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(value) {
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

function GoalFormModal({
  open,
  form,
  preview,
  metricTypes,
  formValid,
  onFieldChange,
  onSaveRequest,
  onSaveDraft,
  onClose,
}) {
  if (!open) return null;
  const editing = Boolean(form?.id);
  const dateInvalid = form?.startDate && form?.endDate && form.endDate < form.startDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{editing ? 'Edit team goal' : 'Create a team goal'}</h2>
           
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          <div className="grid gap-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Goal title *</label>
                <Input
                  value={form.title}
                  placeholder="e.g. Merge 10 PRs before demo week"
                  onChange={(event) => onFieldChange?.('title', event.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  placeholder="Optional notes for your team"
                  onChange={(event) => onFieldChange?.('description', event.target.value)}
                  className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Metric type *</label>
                  <select
                    value={form.metricType}
                    onChange={(event) => onFieldChange?.('metricType', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    {metricTypes.map((metric) => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Target value *</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={form.targetValue}
                    onChange={(event) => onFieldChange?.('targetValue', event.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Start date *</label>
                  <Input type="date" className="h-12 rounded-2xl" value={form.startDate} onChange={(event) => onFieldChange?.('startDate', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">End date *</label>
                  <Input type="date" className="h-12 rounded-2xl" value={form.endDate} onChange={(event) => onFieldChange?.('endDate', event.target.value)} />
                </div>
              </div>
              {dateInvalid && <p className="text-sm font-medium text-rose-600">End date must be after the start date.</p>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Team reward pool *</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={form.rewardXp}
                  onChange={(event) => onFieldChange?.('rewardXp', event.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>
            </div>

          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={onSaveDraft}>
              Save local draft
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSaveRequest} disabled={!formValid} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
              {editing ? 'Update goal' : 'Create goal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalDetailModal({ goal, memberContributionRows, onClose, onEditRequest, onDeleteRequest }) {
  if (!goal) return null;
  const sortedRows = [...memberContributionRows].sort((a, b) => Number(b.contribution ?? 0) - Number(a.contribution ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div className='displayBox'>
            
            <h2 className="text-2xl font-bold text-slate-900 pdr">{goal.title}</h2>
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
            <Button type="button" variant="outline" className="rounded-2xl border-slate-200" onClick={() => onEditRequest?.(goal.id)}>
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

export default function QuestConfiguratorView({
  form,
  formOpen,
  formValid,
  statusFilter,
  statusCounts = {},
  selectedGoal,
  memberContributionRows = [],
  repo,
  preview,
  requests = [],
  allRequests = [],
  metricTypes = [],
  onFieldChange,
  onNewRequest,
  onCloseForm,
  onStatusFilterChange,
  onViewRequest,
  onCloseDetail,
  onEditRequest,
  onDeleteRequest,
  onSaveRequest,
  onSaveDraft,
}) {
  const repoLabel = repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'No repository selected';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Goal manager</h1>
          
        </div>
        <div className="flex items-center gap-2">
          <GoalStatusInfo />
     
          <Button type="button" className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={onNewRequest}>
            <Plus className="h-4 w-4" /> Add new goal
          </Button>
        </div>
      </div>

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

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{STATUS_OPTIONS.find((item) => item.key === statusFilter)?.label ?? 'Active'} goals</CardTitle>
         
        </CardHeader>
        <CardContent>
          <div className="max-h-[520px] overflow-auto rounded-3xl border border-slate-200">
            <table className="min-w-[920px] w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
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
                {requests.map((goal, index) => (
                  <tr key={goal.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="max-w-[220px] truncate font-medium text-slate-900" title={goal.title}>{goal.title}</div>
                      {goal.description && <div className="max-w-[220px] truncate text-xs text-slate-500" title={goal.description}>{goal.description}</div>}
                    </td>
                    <td className="px-4 py-3"><Badge className={cn('rounded-full', statusTone(goal.status))}>{statusLabel(goal.status)}</Badge></td>
                    <td className="px-4 py-3 text-slate-600">{goal.metricLabel}</td>
                    <td className="px-4 py-3 text-slate-600">{goal.targetValue}</td>
                    <td className="px-4 py-3 text-slate-600">{goal.progress?.current ?? 0}/{goal.progress?.goal ?? 1}</td>
                    <td className="px-4 py-3 text-slate-600">{formatDate(goal.startDate)} – {formatDate(goal.endDate)}</td>
                    <td className="px-4 py-3 text-slate-600">+{goal.rewardXp ?? 0}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => onViewRequest?.(goal.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-slate-200" onClick={() => onEditRequest?.(goal.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button type="button" variant="outline" size="icon" className="h-9 w-9 rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteRequest?.(goal.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <GoalFormModal
        open={formOpen}
        form={form}
        preview={preview}
        metricTypes={metricTypes}
        formValid={formValid}
        onFieldChange={onFieldChange}
        onSaveRequest={onSaveRequest}
        onSaveDraft={onSaveDraft}
        onClose={onCloseForm}
      />

      <GoalDetailModal
        goal={selectedGoal}
        memberContributionRows={memberContributionRows}
        onClose={onCloseDetail}
        onEditRequest={onEditRequest}
        onDeleteRequest={onDeleteRequest}
      />
    </div>
  );
}

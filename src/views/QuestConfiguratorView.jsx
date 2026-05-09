import { Info, Plus, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Progress } from '../components/ui/progress.jsx';
import { cn } from '../components/ui/utils.js';


function RequestStatusInfo() {
  return (
    <div className="group relative inline-flex">
      <button type="button" className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900" aria-label="Request status explanation">
        <Info className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-80 rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs leading-5 text-slate-600 shadow-xl group-hover:block">
        <div><strong>Scheduled:</strong> the request has not reached its start date.</div>
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

export default function QuestConfiguratorView({
  form,
  repo,
  preview,
  requests = [],
  metricTypes = [],
  onFieldChange,
  onNewRequest,
  onEditRequest,
  onDeleteRequest,
  onSaveRequest,
  onSaveDraft,
  onBackDashboard,
}) {
  const repoLabel = repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'No repository selected';
  const editing = Boolean(form?.id);
  const dateInvalid = form?.startDate && form?.endDate && form.endDate < form.startDate;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle className="text-3xl">Request manager</CardTitle>
              <CardDescription>
                Create multiple measurable requests for the current repository. Each request has its own metric and date range.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <RequestStatusInfo />
              <Button type="button" variant="outline" className="rounded-2xl border-slate-200" onClick={onNewRequest}>
                <Plus className="mr-2 h-4 w-4" /> New request
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Request scope</label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Repository-specific: {repoLabel}
            </div>
            <p className="text-sm text-slate-500">
              Teammates who sync this repository will see the same requests when Firebase is configured.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Request title</label>
            <Input value={form.title} onChange={(event) => onFieldChange?.('title', event.target.value)} className="h-12 rounded-2xl" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={form.description}
              onChange={(event) => onFieldChange?.('description', event.target.value)}
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Metric type</label>
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
              <label className="text-sm font-medium text-slate-700">Target value</label>
              <Input
                type="number"
                min="1"
                value={form.targetValue}
                onChange={(event) => onFieldChange?.('targetValue', event.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Start date</label>
              <Input type="date" className="h-12 rounded-2xl" value={form.startDate} onChange={(event) => onFieldChange?.('startDate', event.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">End date</label>
              <Input type="date" className="h-12 rounded-2xl" value={form.endDate} onChange={(event) => onFieldChange?.('endDate', event.target.value)} />
            </div>
          </div>
          {dateInvalid && <p className="text-sm font-medium text-rose-600">End date must be after the start date.</p>}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Team reward pool</label>
              <Input
                type="number"
                min="0"
                value={form.rewardXp}
                onChange={(event) => onFieldChange?.('rewardXp', event.target.value)}
                className="h-12 rounded-2xl"
              />
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Reward is calculated after sync. If the team request is completed, your bonus is proportional to your contribution within the request date range.
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onSaveRequest} disabled={dateInvalid} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" /> {editing ? 'Update request' : 'Create request'}
            </Button>
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={onSaveDraft}>
              Save local draft
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={onBackDashboard}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Live preview</CardTitle>
            <CardDescription>How this request will appear on the dashboard after the next sync.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
              <Badge className={cn('rounded-full', statusTone(preview?.status))}>{statusLabel(preview?.status)}</Badge>
              <h3 className="mt-4 text-xl font-semibold text-slate-900">{form.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{form.description}</p>
              <div className="mt-5">
                <Progress value={preview?.pct ?? 0} className="h-3 rounded-full" />
              </div>
              <div className="mt-4 flex flex-col gap-2 text-sm text-slate-600">
                <span>
                  {preview?.current ?? 0} / {preview?.goal ?? 1} — {preview?.metricLabel}
                </span>
                <span>
                  Date range: {form.startDate || 'No start'} → {form.endDate || 'No end'}
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
                Team reward pool: +{form.rewardXp || 0} XP. Your actual bonus depends on your contribution after sync.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Existing requests</CardTitle>
            <CardDescription>Edit or delete repository-specific requests.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No saved requests for this repository yet.
              </div>
            )}
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('rounded-full', statusTone(request.status))}>{statusLabel(request.status)}</Badge>
                      <span className="text-xs text-slate-500">{request.metricLabel}</span>
                    </div>
                    <div className="mt-2 truncate font-semibold text-slate-900" title={request.title}>
                      {request.title}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      {request.startDate || 'No start'} → {request.endDate || 'No end'} · {request.progress?.current ?? 0}/{request.progress?.goal ?? 1}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" variant="outline" size="icon" className="rounded-xl border-slate-200" onClick={() => onEditRequest?.(request.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button type="button" variant="outline" size="icon" className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteRequest?.(request.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { GitPullRequest, Info, Star, Target, Users, X } from 'lucide-react';
import MetricCard from '../components/prototype/MetricCard.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Progress } from '../components/ui/progress.jsx';
import { cn } from '../components/ui/utils.js';

function statusTone(status) {
  switch (status) {
    case 'completed':
      return 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100';
    case 'expired':
      return 'bg-rose-100 text-rose-700 hover:bg-rose-100';
    case 'scheduled':
      return 'bg-amber-100 text-amber-700 hover:bg-amber-100';
    case 'archived':
      return 'bg-slate-100 text-slate-500 hover:bg-slate-100';
    case 'active':
    default:
      return 'bg-violet-100 text-violet-700 hover:bg-violet-100';
  }
}

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'expired') return 'Expired';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'archived') return 'Archived';
  return 'Active';
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

function formatDate(value) {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return 'Unknown date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function InfoTooltip({ label = 'More information', children }) {
  return (
    <div className="group relative inline-flex">
      <button type="button" className="rounded-full border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900" aria-label={label}>
        <Info className="h-4 w-4" />
      </button>
      <div className="pointer-events-none absolute right-0 top-8 z-20 hidden w-80 rounded-2xl border border-slate-200 bg-white p-4 text-left text-xs leading-5 text-slate-600 shadow-xl group-hover:block">
        {children}
      </div>
    </div>
  );
}

function RepositoryRequiredOverlay({ onOpenWorkspace }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team dashboard</h1>
        <p className="mt-2 text-slate-600">Choose a repository before viewing dashboard data.</p>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-900">
          <GitPullRequest className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Select a repository to start</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Dashboard metrics are repository-specific. Connect or select a public GitHub repository first.
        </p>
        <Button type="button" onClick={onOpenWorkspace} className="mt-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
          Go to Workspace
        </Button>
      </div>
    </div>
  );
}

function DetailModal({ type, onClose, children, title, eyebrow = 'Summary detail' }) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative max-h-[86vh] w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{eyebrow}</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(86vh-120px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

function XpSources({ xpBars }) {
  return (
    <div className="space-y-4">
      {xpBars.length === 0 && <p className="text-sm text-slate-600">Sync repository data to see your XP sources.</p>}
      {xpBars.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">{item.label}</span>
            <span className="font-medium text-slate-900">{item.value}</span>
          </div>
          <div className="h-3 rounded-full bg-slate-100">
            <div className="h-3 rounded-full bg-slate-900" style={{ width: item.width }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function TeammatesTable({ teammates, repoLabel, onSelectPlayer }) {
  if (!teammates.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No teammate has synced this repository yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Index</th>
            <th className="px-4 py-3">Repository</th>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">Joined at</th>
            <th className="px-4 py-3">Last synced</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {teammates.map((player, index) => (
            <tr key={player.id || player.username} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 text-slate-600">{repoLabel}</td>
              <td className="px-4 py-3 font-medium text-slate-900">{player.username}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(player.createdAtMs)}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(player.updatedAtMs || player.allTimeSyncedAtMs)}</td>
              <td className="px-4 py-3 text-right">
                <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => onSelectPlayer?.(player)}>
                  View contribution
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActiveGoalsList({ goals }) {
  const activeGoals = goals.filter((goal) => goal.status === 'active');

  if (!activeGoals.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No active goals right now.</div>;
  }

  return (
    <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
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
            <div className="text-sm text-slate-500">{formatDate(goal.startDate)} – {formatDate(goal.endDate)}</div>
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

function MergedPullRequestTable({ items }) {
  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No merged pull request details loaded yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Index</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item, index) => (
            <tr key={item.id || item.url || index} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(item.mergedAt)}</td>
              <td className="px-4 py-3 text-slate-600">{item.author}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {item.url ? (
                  <a className="hover:underline" href={item.url} target="_blank" rel="noreferrer">
                    {item.description || item.title}
                  </a>
                ) : (
                  item.description || item.title
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function QuestDashboardView({
  hero,
  repo,
  repoStats = {},
  requests = [],
  totalGoalsCount = 0,
  xpBars = [],
  onOpenQuest,
  onOpenWorkspace,
  activeMembersCount = 0,
  openRequestsCount = 0,
  xpSubtitle = '',
  teammates = [],
  onSelectPlayer,
  allGoals = [],
  mergedPullRequests = [],
  onLoadMergedPullRequests,
}) {
  const [summaryModal, setSummaryModal] = useState(null);
  const hasRepository = Boolean(repo?.owner && repo?.name);
  const repoLabel = hasRepository ? `${repo.owner}/${repo.name}` : '';

  useEffect(() => {
    if (hasRepository && summaryModal === 'merged') {
      void onLoadMergedPullRequests?.();
    }
  }, [hasRepository, summaryModal, onLoadMergedPullRequests]);

  if (!hasRepository) return <RepositoryRequiredOverlay onOpenWorkspace={onOpenWorkspace} />;

  const modalTitle = {
    xp: 'Your XP sources',
    teammates: 'Synced teammates',
    goals: 'Active goals',
    merged: 'Repository merged PRs',
  }[summaryModal];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
 
      <Card className="rounded-[32px] border-slate-200 shadow-sm">
        <CardHeader>

          <CardTitle className="mt-2 text-2xl">Team summary for {repoLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Your XP" value={hero.xp} subtitle={xpSubtitle} icon={Star} onClick={() => setSummaryModal('xp')} />
            <MetricCard title="Synced teammates" value={String(activeMembersCount)} subtitle="Users synced here" icon={Users} onClick={() => setSummaryModal('teammates')} />
            <MetricCard title="Active goals" value={String(openRequestsCount)} subtitle="In current date range" icon={Target} onClick={() => setSummaryModal('goals')} />
            <MetricCard title="Repository merged PRs" value={repoStats.mergedPRs ?? 0} subtitle="Current synced total" icon={GitPullRequest} onClick={() => setSummaryModal('merged')} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
            <div className="flex items-center gap-2">
              <Badge className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100">Team goals preview</Badge>
              <InfoTooltip label="Goal explanation">
                Goals are team targets created inside this app. They are measured from public GitHub activity and do not create or modify GitHub pull requests.
              </InfoTooltip>
            </div>
            <CardTitle className="mt-4 text-2xl">Nearest goal deadlines</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <InfoTooltip label="Goal status explanation">
              <div><strong>Scheduled:</strong> not started yet.</div>
              <div><strong>Active:</strong> inside the date range and not completed.</div>
              <div><strong>Completed:</strong> target reached.</div>
              <div><strong>Expired:</strong> end date passed before completion.</div>
            </InfoTooltip>
            <Button onClick={onOpenQuest} variant="outline" className="rounded-2xl border-slate-200">
              Manage goals
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {totalGoalsCount > requests.length && (
            <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Showing {requests.length} of {totalGoalsCount} goals by nearest end date.
            </div>
          )}

          {requests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No team goals yet. Create a goal with a metric, start date, and end date to track repository progress.
            </div>
          )}

          {requests.map((goal) => (
            <div key={goal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('rounded-full', statusTone(goal.status))}>{statusLabel(goal.status)}</Badge>
                    <span className="text-sm text-slate-500">{goal.metricLabel}</span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-slate-900">{goal.title}</h3>
                  {goal.description && <p className="mt-2 text-sm leading-6 text-slate-600">{goal.description}</p>}
                </div>
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  {formatDate(goal.startDate)} – {formatDate(goal.endDate)}
                </div>
              </div>
              <div className="mt-5">
                <Progress value={goal.progress?.percentage ?? 0} className="h-3 rounded-full" />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-600">
                  <span>{goal.progress?.current ?? 0} / {goal.progress?.goal ?? 1} — {goal.metricLabel}</span>
                  <span>{goal.progress?.percentage ?? 0}%</span>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <DetailModal type={summaryModal} title={modalTitle} onClose={() => setSummaryModal(null)}>
        {summaryModal === 'xp' && <XpSources xpBars={xpBars} />}
        {summaryModal === 'teammates' && <TeammatesTable teammates={teammates} repoLabel={repoLabel} onSelectPlayer={onSelectPlayer} />}
        {summaryModal === 'goals' && <ActiveGoalsList goals={allGoals} />}
        {summaryModal === 'merged' && <MergedPullRequestTable items={mergedPullRequests} />}
      </DetailModal>
    </div>
  );
}

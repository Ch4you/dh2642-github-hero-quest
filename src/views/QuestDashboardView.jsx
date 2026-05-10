import { useEffect, useState } from 'react';
import { Flame, GitPullRequest, Star, Target, Users } from 'lucide-react';
import MetricCard from '../components/common/MetricCard.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Progress } from '../components/ui/progress.jsx';
import { cn } from '../components/ui/utils.js';
import InfoTip from './shared/InfoTip.jsx';
import { formatDate } from './shared/formatters.js';
import { statusLabel, statusTone } from './shared/goalStatus.js';
import GoalStatusInfoView from './goals/GoalStatusInfoView.jsx';
import RepositoryRequiredOverlayView from './dashboard/RepositoryRequiredOverlayView.jsx';
import DetailModalView from './dashboard/DetailModalView.jsx';
import XpSourcesView from './dashboard/XpSourcesView.jsx';
import TeammatesTableView from './dashboard/TeammatesTableView.jsx';
import ActiveGoalsListView from './dashboard/ActiveGoalsListView.jsx';
import MergedPullRequestTableView from './dashboard/MergedPullRequestTableView.jsx';

export default function QuestDashboardView({
  hero,
  repo,
  repoStats = {},
  requests = [],
  xpBars = [],
  onOpenWorkspace,
  activeMembersCount = 0,
  openRequestsCount = 0,
  xpSubtitle = '',
  teammates = [],
  teammatesLoading = false,
  onSelectPlayer,
  allGoals = [],
  mergedPullRequests = [],
  onLoadMergedPullRequests,
  onLoadRepositoryContributors,
  onCopyInvite,
}) {
  const [summaryModal, setSummaryModal] = useState(null);
  const hasRepository = Boolean(repo?.owner && repo?.name);
  const repoLabel = hasRepository ? `${repo.owner}/${repo.name}` : '';

  useEffect(() => {
    if (hasRepository) {
      void onLoadRepositoryContributors?.();
    }
  }, [hasRepository, repoLabel]);

  useEffect(() => {
    if (hasRepository && summaryModal === 'merged') {
      void onLoadMergedPullRequests?.();
    }
    if (hasRepository && summaryModal === 'teammates') {
      void onLoadRepositoryContributors?.();
    }
  }, [hasRepository, summaryModal]);

  if (!hasRepository) return <RepositoryRequiredOverlayView onOpenWorkspace={onOpenWorkspace} />;

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
            <MetricCard title="Synced teammates" value={String(activeMembersCount)} subtitle="Synced users / contributors" icon={Users} onClick={() => setSummaryModal('teammates')} />
            <MetricCard title="Active goals" value={String(openRequestsCount)} subtitle="In current date range" icon={Target} onClick={() => setSummaryModal('goals')} />
            <MetricCard title="Repository merged PRs" value={repoStats.mergedPRs ?? 0} subtitle="Current synced total" icon={GitPullRequest} onClick={() => setSummaryModal('merged')} />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div>
           
            <CardTitle className="mt-4 text-2xl">Latest active goal</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <GoalStatusInfoView />
            <Button onClick={() => setSummaryModal('goals')} variant="outline" className="rounded-2xl border-slate-200">
              Active goals
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {requests.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
              No active goal right now.
            </div>
          )}

          {requests.map((goal) => (
            <div key={goal.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={cn('rounded-full', statusTone(goal.status))}>{statusLabel(goal.status)}</Badge>
                    <span className="text-sm text-slate-500">{goal.metricLabel}</span>
                    {goal.risk && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        <Flame className="h-3.5 w-3.5" /> At risk
                        <InfoTip label="At-risk goal information" tone="warning" className="ml-1">{goal.risk.message}</InfoTip>
                      </span>
                    )}
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

      <DetailModalView type={summaryModal} title={modalTitle} onClose={() => setSummaryModal(null)}>
        {summaryModal === 'xp' && <XpSourcesView xpBars={xpBars} />}
        {summaryModal === 'teammates' && <TeammatesTableView teammates={teammates} loading={teammatesLoading} repoLabel={repoLabel} onSelectPlayer={onSelectPlayer} onCopyInvite={onCopyInvite} />}
        {summaryModal === 'goals' && <ActiveGoalsListView goals={allGoals} />}
        {summaryModal === 'merged' && <MergedPullRequestTableView items={mergedPullRequests} />}
      </DetailModalView>
    </div>
  );
}

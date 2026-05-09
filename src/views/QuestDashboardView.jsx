import { GitPullRequest, Info, Medal, Star, Target, Trophy, Users } from 'lucide-react';
import MetricCard from '../components/prototype/MetricCard.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
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

function statusLabel(status) {
  if (status === 'completed') return 'Completed';
  if (status === 'expired') return 'Expired';
  if (status === 'scheduled') return 'Scheduled';
  if (status === 'archived') return 'Archived';
  return 'Active';
}

function ContributorRankBadge({ index }) {
  const rank = index + 1;
  if (rank === 1) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
        <Trophy className="h-5 w-5" />
      </div>
    );
  }
  if (rank === 2 || rank === 3) {
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-900">
        <Medal className="h-5 w-5" />
      </div>
    );
  }
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-sm font-semibold text-slate-700">
      #{rank}
    </div>
  );
}

export default function QuestDashboardView({
  hero,
  repo,
  repoStats = {},
  requests = [],
  xpBars = [],
  onSync,
  onSelectPlayer,
  isLoading,
  errorMessage,
  onOpenQuest,
  onOpenLeaderboard,
  contributors = [],
  achievements = [],
  activeMembersCount = 0,
  openRequestsCount = 0,
  lastSyncedLabel = '',
  xpSubtitle = '',
}) {
  const topPlayers = contributors.slice(0, 6);
  const repoLabel = repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'current repository';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team dashboard</h1>
          <p className="mt-2 text-slate-600">
            Monitor personal contribution XP, time-bound repository requests, and teammate ranking in one place.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          {isLoading ? 'Syncing…' : lastSyncedLabel}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Your XP" value={hero.xp} subtitle={xpSubtitle} icon={Star} />
        <MetricCard title="Synced teammates" value={String(activeMembersCount)} subtitle="Users who synced this repository" icon={Users} />
        <MetricCard title="Active requests" value={String(openRequestsCount)} subtitle="Current repository time windows" icon={Target} />
        <MetricCard title="Repository merged PRs" value={repoStats.mergedPRs ?? 0} subtitle="All-time repository metric" icon={GitPullRequest} />
      </div>

      {errorMessage && (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          <div className="font-semibold">Sync failed</div>
          <div className="mt-1">{errorMessage}</div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <Badge className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100">Repository requests</Badge>
              <CardTitle className="mt-4 text-2xl">Measurable requests for {repoLabel}</CardTitle>
              <CardDescription className="mt-2">
                Each request has a metric type, start date, end date, and target. Status updates automatically from the date window and synced GitHub data.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <RequestStatusInfo />
              <Button onClick={onOpenQuest} variant="outline" className="rounded-2xl border-slate-200">
                Manage requests
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {requests.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No requests yet. Create a request with a metric, start date, and end date to track repository progress.
              </div>
            )}

            {requests.map((request) => (
              <div key={request.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('rounded-full', statusTone(request.status))}>{statusLabel(request.status)}</Badge>
                      <span className="text-sm text-slate-500">{request.metricLabel}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-semibold text-slate-900">{request.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{request.description || 'No description provided.'}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    {request.startDate || 'No start'} → {request.endDate || 'No end'}
                  </div>
                </div>

                <div className="mt-5">
                  <Progress value={request.progress?.percentage ?? 0} className="h-3 rounded-full" />
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                  <span>
                    Current progress:{' '}
                    <span className="font-semibold text-slate-900">
                      {request.progress?.current ?? 0} / {request.progress?.goal ?? 1}
                    </span>
                  </span>
                  <span>
                    {request.contributionLabel || 'Your contribution'}: <span className="font-semibold text-slate-900">{request.contribution ?? 0}</span> · Bonus earned:{' '}
                    <span className="font-semibold text-slate-900">+{request.bonusXp ?? 0} XP</span>
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Recent achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  Sync repository data to generate progress feedback.
                </div>
              )}
              {achievements.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                  <div className="rounded-xl bg-white p-2 shadow-sm">
                    {item.type === 'badge' ? <Medal className="h-4 w-4" /> : item.type === 'quest' ? <Target className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{item.title}</div>
                    <div className="text-sm text-slate-500">{item.time}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top contributors</CardTitle>
              <CardDescription>Firebase leaderboard rows for this repository</CardDescription>
            </div>
            <Button onClick={onOpenLeaderboard} variant="ghost" className="rounded-2xl">
              Open leaderboard
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPlayers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No leaderboard rows yet. Sync with Firebase configured so your team can appear here.
              </div>
            )}
            {topPlayers.map((player, index) => (
              <button
                key={player.id}
                onClick={() => onSelectPlayer?.(player)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <ContributorRankBadge index={index} />
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{player.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-slate-900">{player.name}</div>
                    <div className="text-sm text-slate-500">Level {player.level}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-slate-900">{player.xp} XP</div>
                  <div className="text-sm text-emerald-600">{player.trend || '—'}</div>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>XP sources</CardTitle>
            <CardDescription>Your contribution counts multiplied by repository XP rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useMemo } from 'react';
import { GitPullRequest, Medal, Star, Target, Users } from 'lucide-react';
import MetricCard from '../components/prototype/MetricCard.jsx';
import StatusPill from '../components/prototype/StatusPill.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Progress } from '../components/ui/progress.jsx';

export default function QuestDashboardView({
  quest,
  hero,
  onSync,
  syncStatus,
  onSelectPlayer,
  isLoading,
  errorMessage,
  onOpenQuest,
  onOpenLeaderboard,
  contributors = [],
  achievements = [],
  activeMembersCount = 0,
  openQuestsCount = 1,
  lastSyncedLabel = '',
  teamXpSubtitle = '',
}) {
  const progress = useMemo(() => {
    const goal = Math.max(1, Number(quest.targetMergedPRs ?? 1));
    const merged = Number(hero.mergedPRs ?? 0);
    const pct = Math.min(100, Math.max(0, Math.round((merged / goal) * 100)));
    return { goal, merged, pct };
  }, [quest.targetMergedPRs, hero.mergedPRs]);

  const topPlayers = useMemo(() => contributors.slice(0, 4), [contributors]);

  const xpBars = useMemo(() => {
    const c = Number(hero.commits ?? 0);
    const m = Number(hero.mergedPRs ?? 0);
    const r = Number(hero.reviews ?? 0);
    const max = Math.max(1, c, m, r);
    return [
      { label: 'Commits', value: c, width: `${Math.round((c / max) * 100)}%` },
      { label: 'Merged PRs', value: m, width: `${Math.round((m / max) * 100)}%` },
      { label: 'Reviews', value: r, width: `${Math.round((r / max) * 100)}%` },
    ];
  }, [hero.commits, hero.mergedPRs, hero.reviews]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team dashboard</h1>
          <p className="mt-2 text-slate-600">
            Monitor contribution progress, quest status, and team momentum in one place.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          {isLoading ? 'Syncing…' : lastSyncedLabel}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Team XP" value={hero.xp} subtitle={teamXpSubtitle} icon={Star} />
        <MetricCard title="Active Members" value={String(activeMembersCount)} subtitle="From leaderboard + your sync" icon={Users} />
        <MetricCard title="Open Quests" value={String(openQuestsCount)} subtitle="Current team goal" icon={Target} />
        <MetricCard title="Merged PRs (repo)" value={hero.mergedPRs} subtitle="From GitHub search API" icon={GitPullRequest} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <Badge className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100">Active quest</Badge>
              <CardTitle className="mt-4 text-2xl">{quest.title}</CardTitle>
              <CardDescription className="mt-2">
                {quest.description}
              </CardDescription>
            </div>
            <Button
              onClick={onOpenQuest}
              variant="outline"
              className="rounded-2xl border-slate-200"
            >
              Edit quest
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <Progress value={progress.pct} className="h-3 rounded-full" />
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <span>
                Current progress: <span className="font-semibold text-slate-900">{progress.merged} / {progress.goal} merged PRs</span>
              </span>
              <span>Deadline: {quest.deadline || 'Not set'}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Reward</div>
                <div className="mt-1 font-semibold">+50 XP each</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Scope</div>
                <div className="mt-1 font-semibold">Whole team</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Status</div>
                <div className="mt-1 font-semibold">{progress.pct >= 100 ? 'Completed' : 'On track'}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Recent achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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

          <Card className="rounded-[28px] border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Sync status</CardTitle>
              <CardDescription>Waiting states and feedback should always be visible.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusPill status={syncStatus} />
              {errorMessage && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>}
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                Successful sync updates XP from GitHub and pushes your row to the Firebase leaderboard (when configured).
              </div>
              <Button
                onClick={onSync}
                variant="outline"
                className="w-full rounded-2xl border-slate-200"
                disabled={isLoading}
              >
                Retry sync
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Top contributors</CardTitle>
              <CardDescription>From Firebase leaderboard for this repo</CardDescription>
            </div>
            <Button onClick={onOpenLeaderboard} variant="ghost" className="rounded-2xl">
              Open leaderboard
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {topPlayers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                No leaderboard rows yet. Sync with Firebase env configured so your team can appear here.
              </div>
            )}
            {topPlayers.map((player, index) => (
              <button
                key={player.id}
                onClick={() => onSelectPlayer?.(player)}
                className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:bg-slate-50"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white">
                    #{index + 1}
                  </div>
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
            <CardDescription>How team activity turns into progress</CardDescription>
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

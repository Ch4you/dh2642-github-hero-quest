import { useMemo } from 'react';
import { Medal, Search, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';


function RankBadge({ index }) {
  const rank = index + 1;
  if (rank === 1) {
    return <Trophy className="h-5 w-5 text-amber-700" />;
  }
  if (rank === 2 || rank === 3) {
    return <Medal className="h-5 w-5 text-slate-800" />;
  }
  return <span className="font-semibold text-slate-900">#{rank}</span>;
}

export default function LeaderboardView({
  onSelectPlayer,
  rows = [],
  filter,
  onFilterChange,
  timeRangeLabel,
  searchQuery,
  onSearchQueryChange,
  scoreRules,
}) {
  const orderedPlayers = useMemo(() => rows, [rows]);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team ranking</h1>
          <p className="mt-2 text-slate-600">Track how activity translates into XP and level progression.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchQueryChange?.(e.target.value)}
              placeholder="Search player"
              className="h-11 w-56 rounded-2xl pl-9"
            />
          </div>
          <Tabs value={filter} onValueChange={onFilterChange}>
            <TabsList className="rounded-2xl bg-white p-1 shadow-sm">
              <TabsTrigger value="Last 7 days" className="rounded-xl">
                Last 7 days
              </TabsTrigger>
              <TabsTrigger value="All time" className="rounded-xl">
                All time
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>


      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Team ranking</CardTitle>
              <CardDescription>Synced team data for this repository.</CardDescription>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-right text-sm text-slate-600">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">Time range</div>
              <div className="font-semibold text-slate-900">{timeRangeLabel}</div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {orderedPlayers.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
                No entries yet. Connect a repo and sync; each teammate appears after syncing this repository.
              </div>
            )}
            {orderedPlayers.length > 0 && (
            <div className="hidden grid-cols-[72px_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 md:grid">
              <div>Rank</div>
              <div>Player</div>
              <div>XP</div>
              <div>Level</div>
              <div>Commits</div>
              <div>Merged PRs</div>
            </div>
            )}
            {orderedPlayers.map((player, index) => (
              <button
                key={player.id}
                onClick={() => onSelectPlayer?.(player)}
                className={`grid w-full gap-3 rounded-2xl border px-4 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[72px_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] ${
                  index === 0 ? 'border-violet-200 bg-violet-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex items-center"><RankBadge index={index} /></div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{player.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-slate-900">{player.name}</div>
                    <div className="text-sm text-slate-500">{player.badges?.[0] ?? 'No badge yet'}</div>
                  </div>
                </div>
                <div className="font-semibold text-slate-900">{player.rankXp ?? player.xp}</div>
                <div className="text-slate-700">{player.level}</div>
                <div className="text-slate-700">{player.commits}</div>
                <div className="text-slate-700">{player.mergedPRs}</div>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>How ranking works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            <div className="rounded-2xl bg-slate-50 p-4">Commit = {scoreRules?.commit ?? 5} XP</div>
            <div className="rounded-2xl bg-slate-50 p-4">Merged PR = {scoreRules?.mergedPR ?? 20} XP</div>
            <div className="rounded-2xl bg-slate-50 p-4">Review = {scoreRules?.review ?? 10} XP</div>
            <div className="rounded-2xl bg-slate-50 p-4">Open PR = {scoreRules?.openPR ?? 2} XP</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useGame } from '../models/GameContext.jsx';
import { players } from '../models/mockData.js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';

export default function LeaderboardView() {
  const { setSelectedPlayer, repo } = useGame();
  const [filter, setFilter] = useState('This week');

  // to do(graded): replace mock players with Firebase live leaderboard (real-time updates).
  const orderedPlayers = useMemo(() => players, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leaderboard</h1>
          <p className="mt-2 text-slate-600">Track how activity translates into XP and level progression.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input placeholder="Search player" className="h-11 w-56 rounded-2xl pl-9" />
          </div>
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList className="rounded-2xl bg-white p-1 shadow-sm">
              <TabsTrigger value="This week" className="rounded-xl">
                This week
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
          <CardHeader>
            <CardTitle>Team ranking</CardTitle>
            <CardDescription>Click any player to inspect their XP breakdown.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="hidden grid-cols-[72px_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500 md:grid">
              <div>Rank</div>
              <div>Player</div>
              <div>XP</div>
              <div>Level</div>
              <div>Commits</div>
              <div>Merged PRs</div>
            </div>
            {orderedPlayers.map((player, index) => (
              <button
                key={player.id}
                onClick={() => setSelectedPlayer(player)}
                className={`grid w-full gap-3 rounded-2xl border px-4 py-4 text-left transition hover:bg-slate-50 md:grid-cols-[72px_1.4fr_0.8fr_0.8fr_0.8fr_0.8fr] ${
                  index === 0 ? 'border-violet-200 bg-violet-50/50' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="font-semibold text-slate-900">#{index + 1}</div>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{player.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-slate-900">{player.name}</div>
                    <div className="text-sm text-slate-500">{player.badges[0]}</div>
                  </div>
                </div>
                <div className="font-semibold text-slate-900">{player.xp}</div>
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
            <div className="rounded-2xl bg-slate-50 p-4">Commit = 5 XP</div>
            <div className="rounded-2xl bg-slate-50 p-4">Merged PR = 20 XP</div>
            <div className="rounded-2xl bg-slate-50 p-4">Review = 10 XP</div>
            <div className="rounded-2xl bg-violet-50 p-4 text-violet-800">Streak bonus rewards consistent contribution</div>
          </CardContent>
        </Card>
      </div>

      <div className="text-sm text-slate-500">{repo.owner && repo.name ? `${repo.owner}/${repo.name}` : 'Not connected'}</div>
    </div>
  );
}


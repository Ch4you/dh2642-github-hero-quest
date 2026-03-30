import { useMemo } from 'react';
import { Flame, GitCommitHorizontal, GitPullRequest, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge.jsx';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.jsx';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet.jsx';
import { cn } from '../ui/utils.js';

export default function PlayerDrawer({ player, open, onOpenChange }) {
  const initials = player?.initials ?? '';

  const stats = useMemo(() => {
    if (!player) return null;
    return {
      commitsXp: player.commits * 5,
      mergedXp: player.mergedPRs * 20,
      reviewsXp: player.reviews * 10,
      streakXp: player.streak * 5,
    };
  }, [player]);

  if (!player) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-slate-900 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left text-xl">{player.name}</SheetTitle>
              <SheetDescription className="text-left">
                Level {player.level} · {player.xp} XP
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">This period summary</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <GitCommitHorizontal className="h-4 w-4" /> Commits
                </div>
                <div className="mt-2 text-2xl font-bold">{player.commits}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <GitPullRequest className="h-4 w-4" /> Merged PRs
                </div>
                <div className="mt-2 text-2xl font-bold">{player.mergedPRs}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="h-4 w-4" /> Reviews
                </div>
                <div className="mt-2 text-2xl font-bold">{player.reviews}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Flame className="h-4 w-4" /> Streak
                </div>
                <div className="mt-2 text-2xl font-bold">{player.streak} days</div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">XP breakdown</CardTitle>
              <CardDescription>Transparent scoring so users understand why they rank here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <span>Commits</span>
                <span className="font-semibold">+{stats?.commitsXp ?? 0} XP</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <span>Merged PRs</span>
                <span className="font-semibold">+{stats?.mergedXp ?? 0} XP</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <span>Reviews</span>
                <span className="font-semibold">+{stats?.reviewsXp ?? 0} XP</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-violet-50 p-3 text-violet-800">
                <span>Streak bonus</span>
                <span className="font-semibold">+{stats?.streakXp ?? 0} XP</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {player.badges.map((badge) => (
                <Badge
                  key={badge}
                  className={cn('rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900')}
                >
                  {badge}
                </Badge>
              ))}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}


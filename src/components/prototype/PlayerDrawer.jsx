import { useMemo } from 'react';
import { Award, Flame, GitCommitHorizontal, GitPullRequest, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge.jsx';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.jsx';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet.jsx';
import { getXpBreakdown } from '../../models/scoreRules.js';

const badgeDescriptions = {
  Contributor: 'Synced activity for this repository.',
  'Merge Hero': 'Strong merged pull request contribution.',
  'Review Guardian': 'Helped the team by reviewing pull requests.',
  'Commit Streak': 'Maintained consistent repository activity.',
  'Quest Finisher': 'Contributed to completed team requests.',
};

function badgeDescription(badge) {
  return badgeDescriptions[badge] ?? 'Achievement unlocked from synced repository activity.';
}

export default function PlayerDrawer({ player, open, onOpenChange }) {
  const initials = player?.initials ?? '';

  const xpBreakdown = useMemo(() => {
    if (!player) return [];
    return getXpBreakdown(player);
  }, [player]);

  if (!player) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] overflow-y-auto sm:max-w-[440px]">
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
              {xpBreakdown.map((item) => (
                <div key={item.key} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                  <span>{item.label}</span>
                  <span className="font-semibold text-slate-900">+{item.xp} XP</span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">Badges</CardTitle>
              <CardDescription>Badge names and meanings are shown directly, without relying on hover.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {player.badges.map((badge) => (
                <div key={badge} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm">
                      <Award className="h-4 w-4" />
                    </div>
                    <Badge className="border-slate-200 bg-white text-slate-800">{badge}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-5 text-slate-600">{badgeDescription(badge)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { Award, Flame, GitCommitHorizontal, GitPullRequest, ShieldCheck } from 'lucide-react';
import { Badge } from '../ui/badge.jsx';
import { Avatar, AvatarFallback } from '../ui/avatar.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet.jsx';
import InfoTip from '../../views/shared/InfoTip.jsx';

const badgeDescriptions = {
  'Merge Hero': 'At least 5 merged pull requests in this repository.',
  'Review Guardian': 'At least 5 reviewed pull requests in this repository.',
  'Commit Streak': 'At least 20 commits in this repository.',
  'Quest Finisher': 'Earned XP from completed team goals.',
};

const totalBadgeTypes = Object.keys(badgeDescriptions).length;

function badgeDescription(badge) {
  return badgeDescriptions[badge] ?? 'Repository achievement.';
}

export default function PlayerDrawer({ player, xpBreakdown = [], periodLabel = '', open, onOpenChange }) {
  const initials = player?.initials ?? '';
  if (!player) return null;
  const earnedBadges = Array.isArray(player.badges) ? player.badges.filter((badge) => badgeDescriptions[badge]) : [];
  const summaryTitle = periodLabel ? `${periodLabel} ` : 'summary';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[440px] overflow-y-auto sm:max-w-[440px]">
        <SheetHeader>
          <div className="flex items-center gap-3 pr-8">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-slate-900 text-white">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <SheetTitle className="text-left text-xl ">{player.name}</SheetTitle>
              <SheetDescription className="text-left pdtL">
                Level {player.level} · {player.xp} XP
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          <Card className="rounded-3xl">
            <CardHeader>
              <CardTitle className="text-base">{summaryTitle}</CardTitle>
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
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">XP breakdown</CardTitle>
              </div>
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

          {earnedBadges.length > 0 && (
            <Card className="rounded-3xl">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-base">Badges</CardTitle>
            
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {earnedBadges.map((badge) => (
                  <div key={badge} className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-slate-800 shadow-sm">
                        <Award className="h-4 w-4" />
                      </div>
                      <Badge className="border-slate-200 bg-white text-slate-800" title={badgeDescription(badge)}>{badge}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

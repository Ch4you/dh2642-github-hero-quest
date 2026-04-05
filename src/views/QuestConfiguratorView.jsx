import { useMemo } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Progress } from '../components/ui/progress.jsx';

export default function QuestConfiguratorView({
  title,
  target,
  deadline,
  hero,
  onTitleChange,
  onTargetChange,
  onDeadlineChange,
  targetMergedPRsBase,
  onSaveQuest,
  onBackDashboard,
}) {
  const normalized = useMemo(() => {
    const n = Number(target);
    return Number.isFinite(n) ? n : null;
  }, [target]);

  const preview = useMemo(() => {
    const goal = Math.max(1, Number(normalized ?? targetMergedPRsBase ?? 1));
    const merged = Number(hero.mergedPRs ?? 0);
    const pct = Math.min(100, Math.max(0, Math.round((merged / goal) * 100)));
    return { goal, merged, pct };
  }, [normalized, targetMergedPRsBase, hero.mergedPRs]);

  function onSave() {
    // to do(graded): persist quest settings to Firebase so all users see updates in real-time.
    onSaveQuest?.({
      title,
      targetMergedPRs: normalized ?? targetMergedPRsBase,
      deadline,
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Quest configurator</CardTitle>
          <CardDescription>Create or edit a team quest with a clear target and deadline.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Quest title</label>
            <Input value={title} onChange={(e) => onTitleChange?.(e.target.value)} className="h-12 rounded-2xl" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              defaultValue="Push the onboarding flow and improve leaderboard readability before review."
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Metric type</label>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm">Merged PRs</div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Target value</label>
              <Input value={target} onChange={(e) => onTargetChange?.(e.target.value)} className="h-12 rounded-2xl" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Deadline</label>
            <Input type="date" className="h-12 rounded-2xl" value={deadline} onChange={(e) => onDeadlineChange?.(e.target.value)} />
          </div>

          <div className="flex flex-wrap gap-3">
            <Button onClick={onSave} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
              <Plus className="mr-2 h-4 w-4" /> Save quest
            </Button>
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={onBackDashboard}>
              Save draft
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={onBackDashboard}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Live preview</CardTitle>
          <CardDescription>How this quest will appear on the dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
            <Badge className="rounded-full bg-violet-100 text-violet-700 hover:bg-violet-100">Active quest</Badge>
            <h3 className="mt-4 text-xl font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Push the onboarding flow and improve leaderboard readability before review.
            </p>
            <div className="mt-5">
              <Progress value={preview.pct} className="h-3 rounded-full" />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
              <span>
                {preview.merged} / {preview.goal} completed
              </span>
              <span>Deadline: {deadline || 'Not set'}</span>
            </div>
            <div className="mt-4 rounded-2xl bg-white p-4 text-sm text-slate-700">
              Reward: +50 XP for each team member on completion.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


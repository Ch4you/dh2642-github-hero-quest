import { GitBranch, Medal, RefreshCw, ShieldCheck, SlidersHorizontal, Sparkles, Target, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';

const featureCards = [
  {
    title: 'Workspace',
    text: 'Connect a public GitHub repository, switch between saved repositories, and keep each repository workspace separate.',
    Icon: GitBranch,
  },
  {
    title: 'Dashboard',
    text: 'Review your XP, synced teammates, active goals, and merged pull requests from one summary page.',
    Icon: Trophy,
  },
  {
    title: 'Goal manager',
    text: 'Create, draft, edit, complete, and inspect team goals based on commits, pull requests, reviews, and repository activity.',
    Icon: Target,
  },
  {
    title: 'Team ranking',
    text: 'Compare teammates by XP, search players, and switch between recent activity and all-time contribution views.',
    Icon: Medal,
  },
];

const workflow = [
  'Sign in with GitHub.',
  'Connect a public repository with owner/repo or a GitHub URL.',
  'Sync repository activity to calculate XP and refresh team data.',
  'Invite missing contributors so they can sync the same repository workspace.',
  'Create goals, follow progress on the Dashboard, and compare Team ranking.',
];

const dataCards = [
  {
    title: 'GitHub activity',
    text: 'The app reads public repository activity such as commits, pull requests, merged pull requests, reviews, and contributors.',
    Icon: RefreshCw,
  },
  {
    title: 'Saved progress',
    text: 'Firebase keeps workspaces, goals, XP rules, leaderboard rows, and progress data available when users return.',
    Icon: ShieldCheck,
  },
  {
    title: 'Repository XP rules',
    text: 'Each repository can use its own shared XP rules for commits, merged PRs, reviews, and open PRs.',
    Icon: SlidersHorizontal,
  },
];

const statusItems = [
  ['Scheduled', 'The goal starts in the future.'],
  ['Active', 'The goal is inside its date range and can still progress.'],
  ['Completed', 'The target has been reached or the team marks it complete.'],
  ['Expired', 'The end date has passed before the target was reached.'],
];

function FeatureCard({ Icon, title, text }) {
  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-2xl bg-slate-100 p-3 text-slate-800">
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="pl-1 text-base font-semibold text-slate-950">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
      </CardContent>
    </Card>
  );
}

function DataCard({ Icon, title, text }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white p-2 text-slate-800 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-sm font-semibold text-slate-950">{title}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  );
}

export default function AboutView({ onNavigate }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">About GitHub Hero Quest</div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">Make team GitHub progress visible</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              GitHub Hero Quest turns repository activity into an RPG-style team workspace. Teams can connect a repository, sync contribution data, set shared goals, tune XP rules, and follow progress through a dashboard and leaderboard.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" className="rounded-2xl" onClick={() => onNavigate?.('connect')}>
                Open Workspace
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl border-slate-200" onClick={() => onNavigate?.('quests')}>
                Manage goals
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-950">Designed for project teams</div>
                <div className="text-sm text-slate-500">Awareness, motivation, and shared accountability</div>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl bg-white p-4 shadow-sm">Dashboard cards summarize XP, synced teammates, active goals, and merged pull requests.</div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">Goal details show member contribution, contribution share, bonus XP, and last synced time.</div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">Help and status messages guide users without blocking unrelated actions.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureCards.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">Basic workflow</h2>
            <ol className="mt-5 space-y-3">
              {workflow.map((item, index) => (
                <li key={item} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{index + 1}</div>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">What the app keeps in sync</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {dataCards.map((item) => <DataCard key={item.title} {...item} />)}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">Current goal lifecycle</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {statusItems.map(([title, text]) => (
                <div key={title} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="text-sm font-semibold text-slate-950">{title}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-slate-950">Good to know</h2>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl bg-slate-50 p-4">A teammate appears in synced teammate lists after signing in and syncing the same repository.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Saved GitHub data is reused when API requests are limited or when recent cached data is still fresh.</div>
              <div className="rounded-2xl bg-slate-50 p-4">Repository workspaces stay separate, so switching repositories loads that repository's saved goals, rules, and ranking.</div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

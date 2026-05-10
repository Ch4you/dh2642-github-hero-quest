import { GitBranch, RefreshCw, Target, Users } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';

const featureCards = [
  {
    title: 'Repositories',
    text: 'Connect a GitHub repository and keep each repository workspace separate.',
    Icon: GitBranch,
  },
  {
    title: 'Sync',
    text: 'Refresh GitHub activity and show saved data when requests are limited.',
    Icon: RefreshCw,
  },
  {
    title: 'Team goals',
    text: 'Create shared goals and keep the latest active goal visible on the Dashboard.',
    Icon: Target,
  },
  {
    title: 'Teammates',
    text: 'See which repository contributors have synced and invite missing teammates.',
    Icon: Users,
  },
];

const workflow = [
  'Sign in with GitHub.',
  'Connect or switch to a repository.',
  'Sync repository activity.',
  'Invite missing teammates.',
  'Create goals and compare Team ranking.',
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

export default function AboutView({ onNavigate }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
          <div>
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">About GitHub Hero Quest</div>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">Turn team GitHub work into visible progress</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              GitHub Hero Quest helps project teams track repository activity, shared goals, synced teammates, and XP ranking in one workspace.
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
                <Users className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-950">For project teams</div>
                <div className="text-sm text-slate-500">Awareness, motivation, and shared goals</div>
              </div>
            </div>
            <div className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <div className="rounded-2xl bg-white p-4 shadow-sm">Synced teammates shows who has joined this repository workspace.</div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">Team ranking turns commits, PRs, reviews, and goals into XP.</div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">XP rules are saved separately for each repository.</div>
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
            <h2 className="text-xl font-semibold text-slate-950">Data refresh</h2>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">GitHub data</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">Activity sync uses saved data for 10 minutes before requesting GitHub again.</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-950">Saved workspace</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">Firebase keeps repositories, goals, XP rules, and ranking data separated per user and repository.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

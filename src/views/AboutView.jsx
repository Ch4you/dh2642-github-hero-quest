import { BookOpen, GitBranch, HelpCircle, Medal, RefreshCw, Settings, ShieldCheck, Target, Trophy, Users } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Card, CardContent } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';

const features = [
  {
    title: 'Connect team repositories',
    description: 'Add public GitHub repositories, switch between them from the workspace menu, and keep each repository workspace separate.',
    Icon: GitBranch,
  },
  {
    title: 'Sync contribution data',
    description: 'Fetch commits, merged pull requests, open pull requests, and review activity from GitHub with visible sync status and cooldown protection.',
    Icon: RefreshCw,
  },
  {
    title: 'Create measurable requests',
    description: 'Set team requests with a metric, target, start date, and end date. The app shows whether each request is scheduled, active, completed, or expired.',
    Icon: Target,
  },
  {
    title: 'Rank teammates fairly',
    description: 'Use shared repository-specific XP rules to compare synced teammates on the leaderboard for the last 7 days or all time.',
    Icon: Medal,
  },
];

const steps = [
  'Sign in with GitHub so the app knows which user is syncing contribution data.',
  'Open Workspace, add a repository, or switch to one that is already in your workspace.',
  'Click Sync to load GitHub activity. If the button asks you to wait, the app is protecting the GitHub API rate limit.',
  'Create requests with date ranges and team metrics, then watch their progress on the Dashboard.',
  'Open Team ranking to compare contribution XP and review the active time range used for ranking.',
];

const statusRows = [
  ['Scheduled', 'The request has not reached its start date yet.'],
  ['Active', 'Today is inside the request date range, and the target is not reached yet.'],
  ['Completed', 'The team metric reached the target for the selected date range.'],
  ['Expired', 'The end date passed before the target was reached.'],
];

function SectionHeader({ eyebrow, title, description }) {
  return (
    <div className="max-w-3xl">
      <div className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{eyebrow}</div>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 lg:text-4xl">{title}</h1>
      {description && <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>}
    </div>
  );
}

function FeatureCard({ Icon, title, description }) {
  return (
    <Card className="h-full border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3 text-slate-800">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function AboutView({ onNavigate }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-8 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
          <div>
            <SectionHeader
              eyebrow="About GitHub Hero Quest"
              title="A gamified workspace for tracking team repository progress"
              description="GitHub Hero Quest helps student project teams turn GitHub activity into visible progress. It combines repository syncing, measurable team requests, XP rules, and a leaderboard so teammates can understand what is happening in the project and how they are contributing."
            />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button type="button" className="rounded-2xl" onClick={() => onNavigate?.('connect')}>
                Open Workspace
              </Button>
              <Button type="button" variant="outline" className="rounded-2xl border-slate-200" onClick={() => onNavigate?.('quests')}>
                Manage requests
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-slate-900 p-3 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-950">What the app is for</div>
                <div className="text-sm text-slate-500">Team awareness, motivation, and progress visibility</div>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <span className="font-semibold text-slate-950">Target users:</span> students or small software teams working together in GitHub repositories.
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <span className="font-semibold text-slate-950">Main benefit:</span> make repository activity easier to discover, compare, and act on during group work.
              </div>
              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700 shadow-sm">
                <span className="font-semibold text-slate-950">Data source:</span> GitHub public repository activity plus Firebase persistence for workspace, requests, XP rules, and rankings.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pt-2 md:grid-cols-2 xl:grid-cols-4">
        {features.map((feature) => <FeatureCard key={feature.title} {...feature} />)}
      </section>

      <section className="grid gap-6 pt-2 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-800"><BookOpen className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">How to use it</h2>
                <p className="text-sm text-slate-500">A typical workflow from repository setup to ranking.</p>
              </div>
            </div>
            <ol className="space-y-3">
              {steps.map((step, index) => (
                <li key={step} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">{index + 1}</div>
                  <p className="text-sm leading-6 text-slate-700">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="rounded-2xl bg-slate-100 p-3 text-slate-800"><HelpCircle className="h-5 w-5" /></div>
              <div>
                <h2 className="text-xl font-semibold text-slate-950">Understanding request status</h2>
                <p className="text-sm text-slate-500">Requests use their metric, target, start date, and end date.</p>
              </div>
            </div>
            <div className="space-y-3">
              {statusRows.map(([label, description]) => (
                <div key={label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <Badge className="shrink-0 bg-white text-slate-700">{label}</Badge>
                  <p className="text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 pt-2 lg:grid-cols-3">
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 rounded-2xl bg-slate-100 p-3 text-slate-800"><Settings className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold text-slate-950">Workspace and XP rules</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Each repository has its own shared team XP rules. This keeps ranking fair inside a repository while allowing different projects to use different scoring priorities.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 rounded-2xl bg-slate-100 p-3 text-slate-800"><Users className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold text-slate-950">Dashboard vs Team ranking</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Dashboard shows the current repository status and request progress. Team ranking focuses on comparing synced teammates by XP for the selected time range.</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="mb-4 rounded-2xl bg-slate-100 p-3 text-slate-800"><ShieldCheck className="h-5 w-5" /></div>
            <h2 className="text-lg font-semibold text-slate-950">Privacy and control</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Removing a repository only removes it from your workspace. It does not delete the GitHub repository or shared team data, so the repository can be added again later.</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

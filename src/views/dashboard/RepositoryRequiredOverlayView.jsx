import { GitPullRequest } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';

export default function RepositoryRequiredOverlayView({ onOpenWorkspace }) {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Team dashboard</h1>
        <p className="mt-2 text-slate-600">Choose a repository before viewing dashboard data.</p>
      </div>
      <div className="rounded-[32px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-100 text-slate-900">
          <GitPullRequest className="h-6 w-6" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-slate-900">Select a repository to start</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Dashboard metrics are repository-specific. Connect or select a public GitHub repository first.
        </p>
        <Button type="button" onClick={onOpenWorkspace} className="mt-6 rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
          Go to Workspace
        </Button>
      </div>
    </div>
  );
}

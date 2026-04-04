import StatusPill from '../components/prototype/StatusPill.jsx';
import { Bell, Medal, RefreshCw, Settings, Target, Trophy } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { cn } from '../components/ui/utils.js';
import { LoadingSpinner } from '../components/ui/loading-spinner.jsx';

const nav = [
  { key: 'dashboard', label: 'Dashboard', Icon: Trophy, step: 'dashboard' },
  { key: 'leaderboard', label: 'Leaderboard', Icon: Medal, step: 'leaderboard' },
  { key: 'quests', label: 'Quests', Icon: Target, step: 'quests' },
  { key: 'settings', label: 'Repository Settings', Icon: Settings, step: 'connect' },
];

function NavItem({ active, Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition',
        active ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900',
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function AppShell({
  current = 'dashboard',
  children,
  repo,
  onNavigate,
  onSync,
  syncStatus,
  isLoading,
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 border-r border-slate-200 bg-slate-50 p-5 lg:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="rounded-2xl bg-slate-900 p-2 text-white">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-slate-900">GitHub Hero Quest</div>
              <div className="text-xs text-slate-500">Prototype</div>
            </div>
          </div>

          <div className="space-y-2">
            {nav.map((item) => (
              <NavItem
                key={item.key}
                active={current === item.key}
                Icon={item.Icon}
                label={item.label}
                onClick={() => onNavigate?.(item.step)}
              />
            ))}
          </div>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-medium text-slate-900">Current repository</p>
            <p className="mt-2 text-sm text-slate-600">{repo.owner && repo.name ? `${repo.owner}/${repo.name}` : 'Not connected'}</p>
          </div>
        </aside>

        <main className="min-h-screen flex-1">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
            <div className="flex items-center justify-between px-6 py-4 lg:px-8">
              <div>
                <div className="text-sm text-slate-500">Workspace</div>
                <div className="font-semibold text-slate-900">
                  {repo.owner && repo.name ? `${repo.owner}/${repo.name}` : 'GitHub Hero Quest'}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={syncStatus} />
                <Button
                  onClick={onSync}
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white"
                  disabled={isLoading}
                >
                  {isLoading ? <LoadingSpinner className="h-4 w-4" label="Syncing" /> : <><RefreshCw className="mr-2 h-4 w-4" /> Sync</>}
                </Button>
                <Button variant="outline" size="icon" className="rounded-2xl border-slate-200 bg-white" type="button">
                  <Bell className="h-4 w-4" />
                </Button>
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-900 text-white">AL</AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <div className="p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}


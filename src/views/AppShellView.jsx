import { useEffect, useMemo, useRef, useState } from 'react';
import StatusPill from '../components/common/StatusPill.jsx';
import { ChevronDown, HelpCircle, LogOut, Medal, RefreshCw, Settings, Target, Trophy, UserCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { cn } from '../components/ui/utils.js';
import { LoadingSpinner } from '../components/ui/loading-spinner.jsx';
import { useClickOutside } from '../hooks/useClickOutside.js';
import HeaderRepositoryMenuView from './shell/HeaderRepositoryMenuView.jsx';
import ConfirmationDialogView from './shell/ConfirmationDialogView.jsx';

const nav = [
  { key: 'dashboard', label: 'Dashboard', Icon: Trophy, step: 'dashboard' },
  { key: 'leaderboard', label: 'Team ranking', Icon: Medal, step: 'leaderboard' },
  { key: 'quests', label: 'Manage goals', Icon: Target, step: 'quests' },
  { key: 'settings', label: 'Workspace', Icon: Settings, step: 'connect' },
  { key: 'about', label: 'About', Icon: HelpCircle, step: 'about' },
];

function NavItem({ active, Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition',
        active ? 'bg-slate-100 text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:bg-white hover:text-slate-900',
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

export default function AppShellView({
  current = 'dashboard',
  children,
  repo,
  repositories = [],
  activeRepoKey = '',
  onSwitchRepository,
  onRemoveRepository,
  profile,
  profileInitials,
  onNavigate,
  onSync,
  canSync = true,
  onSignOut,
  syncStatus,
  isLoading,
  loadingPhase,
  flashMessage,
  onDismissFlashMessage,
  confirmation,
  onCancelConfirmation,
  onConfirmConfirmation,
  onCopyInvite,
}) {
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const repoMenuRef = useRef(null);
  const repoButtonRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [repoMenuOpen, setRepoMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const profileOutsideRefs = useMemo(() => [profileMenuRef, profileButtonRef], []);
  const repoOutsideRefs = useMemo(() => [repoMenuRef, repoButtonRef], []);
  useClickOutside({ open: profileMenuOpen, refs: profileOutsideRefs, onClose: () => setProfileMenuOpen(false) });
  useClickOutside({ open: repoMenuOpen, refs: repoOutsideRefs, onClose: () => setRepoMenuOpen(false) });

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timer = window.setTimeout(() => onDismissFlashMessage?.(), 3000);
    return () => window.clearTimeout(timer);
  }, [flashMessage, onDismissFlashMessage]);

  const displayName = profile?.displayName?.trim() || profile?.username?.trim() || 'Guest';
  const username = profile?.username?.trim() || '';
  const repoLabel = repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'No repository selected';

  return (
    <div className="min-h-screen bg-slate-100 pb-24 lg:pb-0">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-64 border-r border-slate-200 bg-slate-50 p-5 lg:block">
          <div className="mb-8 flex items-center gap-3 px-2">
            <div className="rounded-2xl bg-slate-900 p-2 text-white"><Trophy className="h-5 w-5" /></div>
            <div>
              <div className="font-semibold text-slate-900">GitHub Hero Quest</div>
            </div>
          </div>

          <div className="space-y-2">
            {nav.map((item) => (
              <NavItem key={item.key} active={current === item.key} Icon={item.Icon} label={item.label} onClick={() => onNavigate?.(item.step)} />
            ))}
          </div>
        </aside>

        <main className="min-h-screen flex-1">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-8">
              <div className="min-w-0">
                <HeaderRepositoryMenuView
                  repoLabel={repoLabel}
                  repositories={repositories}
                  activeRepoKey={activeRepoKey}
                  open={repoMenuOpen}
                  onToggle={() => setRepoMenuOpen((value) => !value)}
                  menuRef={repoMenuRef}
                  buttonRef={repoButtonRef}
                  onSwitchRepository={(repoKey) => {
                    setRepoMenuOpen(false);
                    onSwitchRepository?.(repoKey);
                  }}
                  onRemoveRepository={(repoKey) => {
                    setRepoMenuOpen(false);
                    onRemoveRepository?.(repoKey);
                  }}
                  onOpenWorkspace={() => {
                    setRepoMenuOpen(false);
                    onNavigate?.('connect');
                  }}
                  onCopyInvite={onCopyInvite}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={syncStatus} />
                <Button
                  onClick={onSync}
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white"
                  disabled={isLoading || !canSync}
                  title="Sync repository data"
                >
                  {isLoading ? (
                    <LoadingSpinner className="h-4 w-4" label="Syncing..." />
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Sync</>
                  )}
                </Button>
                <button
                  type="button"
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen((value) => !value)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
                >
                  <Avatar className="h-8 w-8"><AvatarFallback className="bg-slate-900 text-white">{profileInitials || 'HQ'}</AvatarFallback></Avatar>
                  <span className="max-w-[120px] truncate text-sm text-slate-700">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          </header>

          {profileMenuOpen && (
            <div ref={profileMenuRef} className="fixed right-6 top-20 z-50 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl lg:right-8">
              <div className="mb-3 flex items-start gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="bg-slate-900 text-white">{profileInitials || 'HQ'}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{displayName}</div>
                  <div className="truncate text-xs text-slate-500">{username || 'No GitHub username'}</div>
                </div>
              </div>
              <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="flex items-center gap-2"><UserCircle2 className="h-4 w-4" /> Signed in with GitHub</div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start rounded-xl border-slate-200"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true);
                  try { await onSignOut?.(); } finally { setIsSigningOut(false); setProfileMenuOpen(false); }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" /> {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          )}

          {flashMessage && (
            <div className="fixed left-1/2 top-6 z-50 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-medium text-slate-800 shadow-2xl">
              {flashMessage}
            </div>
          )}

          <ConfirmationDialogView confirmation={confirmation} onCancel={onCancelConfirmation} onConfirm={onConfirmConfirmation} />

          <div className="relative p-6 lg:p-8">
            {isLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-center bg-slate-100/55 pt-10 backdrop-blur-[1px]">
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
                  <LoadingSpinner className="h-5 w-5" label={loadingPhase || 'Loading latest repository data...'} />
                </div>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      <nav className="fixed bottom-4 left-4 right-4 z-30 grid grid-cols-5 gap-1 rounded-3xl border border-slate-200 bg-white p-2 shadow-lg lg:hidden">
        {nav.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => onNavigate?.(item.step)}
            className={cn('flex flex-col items-center rounded-2xl px-2 py-2 text-xs transition', current === item.key ? 'bg-slate-100 text-slate-900 ring-1 ring-slate-200' : 'text-slate-600 hover:bg-slate-100')}
          >
            <item.Icon className="mb-1 h-4 w-4" />
            {item.key === 'settings' ? 'Workspace' : item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import StatusPill from '../components/prototype/StatusPill.jsx';
import { ChevronDown, HelpCircle, LogOut, Medal, RefreshCw, Settings, Target, Trash2, Trophy, UserCircle2 } from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Avatar, AvatarFallback } from '../components/ui/avatar.jsx';
import { cn } from '../components/ui/utils.js';
import { LoadingSpinner } from '../components/ui/loading-spinner.jsx';
import { useClickOutside } from '../hooks/useClickOutside.js';

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

function HeaderRepositoryMenu({ repoLabel, repositories = [], activeRepoKey, open, onToggle, onClose, menuRef, buttonRef, onSwitchRepository, onRemoveRepository, onOpenWorkspace }) {
  const canRemoveRepositories = repositories.length > 1;

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        ref={buttonRef}
        onClick={onToggle}
        className="inline-flex max-w-[min(68vw,360px)] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-left text-sm shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        title={repoLabel}
      >
        <span className="min-w-0 truncate font-semibold text-slate-900">{repoLabel}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-500 transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full z-50 mt-2 w-[min(86vw,360px)] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-3 px-1">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Current repository</div>
              <div className="text-[11px] leading-4 text-slate-500">Switch or remove repositories from this workspace.</div>
            </div>
            <Button type="button" variant="outline" className="h-8 shrink-0 rounded-xl border-slate-200 px-3 text-xs" onClick={onOpenWorkspace}>
              Add repo
            </Button>
          </div>

          {repositories.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No repositories yet. Add one in Workspace.
            </div>
          )}

          {repositories.length > 0 && (
            <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
              {repositories.map((repo) => {
                const key = `${repo.owner}/${repo.name}`;
                const active = key === activeRepoKey;
                return (
                  <div
                    key={key}
                    className={cn(
                      'flex min-w-0 items-center gap-2 rounded-2xl border p-1.5 transition',
                      active ? 'border-slate-200 bg-slate-100' : 'border-slate-100 bg-slate-50 hover:bg-white',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSwitchRepository?.(key)}
                      title={key}
                      className="min-w-0 flex-1 rounded-xl px-2.5 py-2 text-left text-sm text-slate-700 transition hover:bg-white"
                    >
                      <span className={cn('block truncate', active ? 'font-semibold text-slate-900' : 'font-medium')}>{key}</span>
                    </button>
                    <button
                      type="button"
                      title={canRemoveRepositories ? `Remove ${key}` : 'Keep at least one repository connected'}
                      aria-label={canRemoveRepositories ? `Remove ${key}` : 'Keep at least one repository connected'}
                      disabled={!canRemoveRepositories}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (!canRemoveRepositories) return;
                        onRemoveRepository?.(key);
                      }}
                      className={cn(
                        'shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 transition',
                        canRemoveRepositories
                          ? 'hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
                          : 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationDrawer({ open, notifications, onClose, onClear }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40">
      <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />
      <aside className="absolute right-0 top-0 h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold text-slate-900">Notifications</div>
            <div className="text-sm text-slate-500">Repository actions and sync feedback</div>
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="text-sm text-slate-600 underline" onClick={onClear}>Clear</button>
            <button type="button" className="text-sm text-slate-600 underline" onClick={onClose}>Close</button>
          </div>
        </div>
        {notifications?.length ? (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'rounded-2xl border p-4 text-sm',
                  item.type === 'error'
                    ? 'border-rose-200 bg-rose-50 text-rose-800'
                    : item.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700',
                )}
              >
                <div className="font-semibold">{item.title || 'Update'}</div>
                <div className="mt-1">{item.text}</div>
                <div className="mt-2 text-xs opacity-70">{item.time}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">No notifications yet.</div>
        )}
      </aside>
    </div>
  );
}

function ConfirmationDialog({ confirmation, onCancel, onConfirm }) {
  if (!confirmation) return null;
  const danger = confirmation.tone === 'danger';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">{confirmation.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{confirmation.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-2xl border-slate-200" onClick={onCancel}>
            {confirmation.cancelLabel || 'Cancel'}
          </Button>
          <Button
            type="button"
            className={cn('rounded-2xl text-white', danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800')}
            onClick={onConfirm}
          >
            {confirmation.confirmLabel || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
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
  syncCooldownRemainingMs = 0,
  onSignOut,
  syncStatus,
  isLoading,
  loadingPhase,
  flashMessage,
  onDismissFlashMessage,
  notifications,
  notificationsOpen,
  onToggleNotifications,
  onCloseNotifications,
  onClearNotifications,
  confirmation,
  onCancelConfirmation,
  onConfirmConfirmation,
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
                <div className="mb-1 text-sm font-medium text-slate-500">Workspace</div>
                <HeaderRepositoryMenu
                  repoLabel={repoLabel}
                  repositories={repositories}
                  activeRepoKey={activeRepoKey}
                  open={repoMenuOpen}
                  onToggle={() => setRepoMenuOpen((value) => !value)}
                  onClose={() => setRepoMenuOpen(false)}
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
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <StatusPill status={syncStatus} />
                <Button
                  onClick={onSync}
                  variant="outline"
                  className="rounded-2xl border-slate-200 bg-white"
                  disabled={isLoading || !canSync}
                  title={!canSync && syncCooldownRemainingMs > 0 ? `Wait ${Math.ceil(syncCooldownRemainingMs / 1000)}s before syncing again` : 'Sync repository data'}
                >
                  {isLoading ? (
                    <LoadingSpinner className="h-4 w-4" label="Syncing..." />
                  ) : !canSync && syncCooldownRemainingMs > 0 ? (
                    `Wait ${Math.ceil(syncCooldownRemainingMs / 1000)}s`
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

          <ConfirmationDialog confirmation={confirmation} onCancel={onCancelConfirmation} onConfirm={onConfirmConfirmation} />

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

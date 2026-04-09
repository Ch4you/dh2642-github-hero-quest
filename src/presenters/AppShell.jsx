import { useEffect, useRef, useState } from 'react';
import StatusPill from '../components/prototype/StatusPill.jsx';
import { Bell, ChevronDown, LogOut, Medal, RefreshCw, Settings, Target, Trophy, UserCircle2 } from 'lucide-react';
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
  profile,
  profileInitials,
  onNavigate,
  onSync,
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
}) {
  const notificationsRef = useRef(null);
  const bellButtonRef = useRef(null);
  const profileMenuRef = useRef(null);
  const profileButtonRef = useRef(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!flashMessage) return undefined;
    const timer = window.setTimeout(() => {
      onDismissFlashMessage?.();
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [flashMessage, onDismissFlashMessage]);

  useEffect(() => {
    if (!notificationsOpen) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      const clickedPanel = notificationsRef.current?.contains(target);
      const clickedBell = bellButtonRef.current?.contains(target);
      if (!clickedPanel && !clickedBell) onCloseNotifications?.();
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') onCloseNotifications?.();
    }

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [notificationsOpen, onCloseNotifications]);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    function onPointerDown(event) {
      const target = event.target;
      const clickedMenu = profileMenuRef.current?.contains(target);
      const clickedButton = profileButtonRef.current?.contains(target);
      if (!clickedMenu && !clickedButton) {
        setProfileMenuOpen(false);
      }
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    }

    window.addEventListener('mousedown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [profileMenuOpen]);

  const displayName = profile?.displayName?.trim() || profile?.username?.trim() || 'Guest';
  const username = profile?.username?.trim() || '';

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
                  {isLoading ? <LoadingSpinner className="h-4 w-4" label="Syncing..." /> : <><RefreshCw className="mr-2 h-4 w-4" /> Sync</>}
                </Button>
                <span ref={bellButtonRef}>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-2xl border-slate-200 bg-white"
                    type="button"
                    onClick={onToggleNotifications}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                </span>
                <button
                  type="button"
                  ref={profileButtonRef}
                  onClick={() => setProfileMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-1.5 hover:bg-slate-50"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-slate-900 text-white">{profileInitials || 'HQ'}</AvatarFallback>
                  </Avatar>
                  <span className="max-w-[120px] truncate text-sm text-slate-700">{displayName}</span>
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
              </div>
            </div>
          </header>

          {profileMenuOpen && (
            <div
              ref={profileMenuRef}
              className="absolute right-6 top-20 z-30 w-72 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg lg:right-8"
            >
              <div className="mb-3 flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-slate-900 text-white">{profileInitials || 'HQ'}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-900">{displayName}</div>
                  <div className="truncate text-xs text-slate-500">{username || 'No GitHub username'}</div>
                </div>
              </div>
              <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <UserCircle2 className="h-4 w-4" />
                  Signed in with GitHub
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start rounded-xl border-slate-200"
                disabled={isSigningOut}
                onClick={async () => {
                  setIsSigningOut(true);
                  try {
                    await onSignOut?.();
                  } finally {
                    setIsSigningOut(false);
                    setProfileMenuOpen(false);
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            </div>
          )}

          {flashMessage && (
            <div className="mx-6 mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 lg:mx-8">
              <div className="flex items-center justify-between gap-3">
                <span>{flashMessage}</span>
                <button type="button" className="text-emerald-700 underline" onClick={onDismissFlashMessage}>
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {notificationsOpen && (
            <div className="mx-6 mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm lg:mx-8" ref={notificationsRef}>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-900">Notifications</div>
                <div className="flex items-center gap-3">
                  <button type="button" className="text-sm text-slate-600 underline" onClick={onClearNotifications}>
                    Clear all
                  </button>
                  <button type="button" className="text-sm text-slate-600 underline" onClick={onCloseNotifications}>
                    Close
                  </button>
                </div>
              </div>
              {notifications?.length ? (
                <div className="space-y-2">
                  {notifications.map((item) => (
                    <div key={item.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      <div>{item.text}</div>
                      <div className="text-xs text-slate-500">{item.time}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-500">No notifications yet.</div>
              )}
            </div>
          )}

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
    </div>
  );
}

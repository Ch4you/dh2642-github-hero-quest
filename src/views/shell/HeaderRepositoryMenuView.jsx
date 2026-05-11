import { ChevronDown, Copy, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../components/ui/utils.js';

export default function HeaderRepositoryMenuView({ repoLabel, repositories = [], activeRepoKey, open, onToggle, menuRef, buttonRef, onSwitchRepository, onRemoveRepository, onOpenWorkspace, onCopyInvite }) {
  const canRemoveRepositories = repositories.length > 1;

  return (
    <div className="relative min-w-0">
      <div className="inline-flex max-w-[min(68vw,410px)] items-center gap-2">
        <button
          type="button"
          ref={buttonRef}
          onClick={onToggle}
          className="inline-flex max-w-[min(68vw,360px)] min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-left text-sm shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          title={repoLabel}
        >
          <span className="min-w-0 truncate font-semibold text-slate-900">{repoLabel}</span>
          <ChevronDown className={cn('h-4 w-4 shrink-0 text-slate-500 transition', open && 'rotate-180')} />
        </button>
        <button
          type="button"
          className="displayVer shrink-0 rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          aria-label="Copy invite link"
          title="Copy invite link"
          onClick={onCopyInvite}
        >
          <Copy className="h-4 w-4 " />
          <div className="pdl" >Invite</div>
        </button>
      </div>

      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full z-50 mt-2 w-[min(86vw,360px)] rounded-3xl border border-slate-200 bg-white p-3 shadow-xl"
        >
          <div className="mb-2 flex items-start justify-between gap-3 px-1 displayVer">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900">Current repository</div>
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
                    role={active ? undefined : 'button'}
                    tabIndex={active ? -1 : 0}
                    onClick={() => !active && onSwitchRepository?.(key)}
                    onKeyDown={(event) => {
                      if (active || (event.key !== 'Enter' && event.key !== ' ')) return;
                      event.preventDefault();
                      onSwitchRepository?.(key);
                    }}
                    title={key}
                    className={cn(
                      'flex min-w-0 items-center gap-2 rounded-2xl border p-1.5 text-left transition',
                      active
                        ? 'cursor-default border-slate-300 bg-slate-200 shadow-sm'
                        : 'cursor-pointer border-slate-100 bg-slate-50 hover:border-slate-200 hover:bg-white',
                    )}
                  >
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate rounded-xl px-2.5 py-2 text-sm text-slate-700',
                        active ? 'font-semibold text-slate-900' : 'font-medium',
                      )}
                    >
                      {key}
                    </span>
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

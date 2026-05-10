import { useState } from 'react';
import { CheckCircle2, SlidersHorizontal, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';

function repoKey(repo) {
  return repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : '';
}

function XpRulesModal({ open, onClose, repositories = [], selectedRepoKey, onSelectedRepoKeyChange, scoreRules = {}, onScoreRuleChange, onSaveScoreRules }) {
  if (!open) return null;

  const hasRepositories = repositories.length > 0;
  const selectedLabel = selectedRepoKey || 'No repository selected';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Team scoring settings</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">Team XP rules</h2>
            <p className="mt-1 text-sm text-slate-600">Shared rules for <span className="font-semibold text-slate-900">{selectedLabel}</span>.</p>
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Repository</span>
            <select
              value={selectedRepoKey || ''}
              onChange={(event) => onSelectedRepoKeyChange?.(event.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              disabled={!hasRepositories}
            >
              {!hasRepositories && <option value="">Connect a repository first</option>}
              {repositories.map((repo) => {
                const key = repoKey(repo);
                return (
                  <option key={key} value={key}>
                    {key}
                  </option>
                );
              })}
            </select>
          </label>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            These rules are shared by the team for the selected repository and affect leaderboard scoring. Different repositories can use different XP standards. Selecting another repository loads its saved team rules into this form before you edit or save.
          </div>

          <div className="grid gap-3">
            {[
              ['commit', 'Commit'],
              ['mergedPR', 'Merged PR'],
              ['review', 'Review'],
              ['openPR', 'Open PR'],
            ].map(([key, label]) => (
              <label key={key} className="grid grid-cols-[1fr_110px] items-center gap-3 text-sm text-slate-600">
                <span>{label}</span>
                <Input
                  type="number"
                  min="0"
                  value={scoreRules?.[key] ?? ''}
                  onChange={(event) => onScoreRuleChange?.(key, event.target.value)}
                  className="h-10 rounded-2xl"
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={onClose}>Cancel</Button>
            <Button
              className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              onClick={async () => {
                await onSaveScoreRules?.();
                onClose?.();
              }}
              disabled={!selectedRepoKey}
            >
              Save team XP rules
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ConnectRepoView({
  repositoryInput,
  onRepositoryInputChange,
  onConnect,
  onUseSample,
  onOpenRecent,
  recentRepositories = [],
  recentLoading = false,
  connectError,
  repo,
  repositories = [],
  activeRepoKey = '',
  scoreRulesRepoKey = '',
  onScoreRulesRepoChange,
  scoreRules = {},
  onScoreRuleChange,
  onSaveScoreRules,
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const hasConnectedRepo = Boolean(repo?.owner && repo?.name);
  const connectedRepoLabel = hasConnectedRepo ? `${repo.owner}/${repo.name}` : 'Connect a repository first';
  const connectedRepositoryKeys = new Set(
    repositories.map((repository) => `${repository.owner}/${repository.name}`),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="grid items-start gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <CardTitle className="text-3xl">Connect a repository</CardTitle>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-800">
                  {repositories.length} saved
                </span>
              </div>
              <CardDescription className="mt-2">Connect a public GitHub repository with owner/repo or a GitHub URL.</CardDescription>
            </div>
            <Button variant="outline" className="shrink-0 rounded-2xl border-slate-200" onClick={() => setRulesOpen(true)} disabled={repositories.length === 0}>
              <SlidersHorizontal className="mr-2 h-4 w-4" /> XP rules
            </Button>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Repository URL</label>
              <Input value={repositoryInput} onChange={(event) => onRepositoryInputChange?.(event.target.value)} className="h-12 rounded-2xl" />
             
              {connectError && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{connectError}</p>}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={onConnect} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
                Validate and connect
              </Button>
              
            </div>

      
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {[
              'Validate repository access',
              'Open the dashboard',
              'Apply this repository’s XP rules',
              'Load saved goals and ranking',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent repositories</CardTitle>
           
          </CardHeader>
          <CardContent>
            {recentLoading && <div className="text-sm text-slate-500">Loading your GitHub repos…</div>}
            {!recentLoading && recentRepositories.length === 0 && (
              <div className="text-sm text-slate-500">No public repos loaded. Check username or API limits.</div>
            )}
            {!recentLoading && recentRepositories.length > 0 && (
              <div className="max-h-[320px] space-y-3 overflow-y-auto pr-1">
                {recentRepositories.map((recentRepo) => {
                  const alreadyConnected = connectedRepositoryKeys.has(recentRepo.name);
                  return (
                    <div key={recentRepo.name} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900" title={recentRepo.name}>{recentRepo.name}</div>
                        <div className="text-sm text-slate-500 pdt">{recentRepo.date}</div>
                      </div>
                      {alreadyConnected ? (
                        <Badge className="shrink-0 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-100">
                          Connected
                        </Badge>
                      ) : (
                        <Button variant="ghost" className="shrink-0 rounded-xl" onClick={() => onOpenRecent?.(recentRepo.name)}>
                          Connect
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <XpRulesModal
        open={rulesOpen}
        onClose={() => setRulesOpen(false)}
        repositories={repositories}
        selectedRepoKey={scoreRulesRepoKey || activeRepoKey}
        onSelectedRepoKeyChange={onScoreRulesRepoChange}
        scoreRules={scoreRules}
        onScoreRuleChange={onScoreRuleChange}
        onSaveScoreRules={onSaveScoreRules}
      />
    </div>
  );
}

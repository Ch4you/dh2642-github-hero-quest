import { useEffect, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';
import { getXpBreakdown } from '../models/scoreRules.js';
import { getMetricDefinition, getMetricLabel } from '../models/QuestModel.js';

function latestActiveTime(goal) {
  const start = Date.parse(goal?.startDate || '');
  const end = Date.parse(goal?.endDate || '');
  return Math.max(Number.isFinite(start) ? start : 0, Number.isFinite(end) ? end : 0);
}

function buildInviteMessage(repoKey, username = '') {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const mention = username ? `Hi @${username}, ` : '';
  return `${mention}join our GitHub Hero Quest workspace for ${repoKey}. Open ${appUrl} and sign in with GitHub, then connect ${repoKey} to sync your contribution data.`;
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value || 0))));
}

function goalElapsedPercentage(goal, now = new Date()) {
  const start = Date.parse(goal?.startDate || '');
  const end = Date.parse(goal?.endDate || '');
  const current = now.getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return clampPercent(((current - start) / (end - start)) * 100);
}

function buildGoalRisk(goal) {
  if (goal.status !== 'active') return null;
  const progressPercentage = clampPercent(goal.progress?.percentage ?? 0);
  const elapsedPercentage = goalElapsedPercentage(goal);
  const gap = elapsedPercentage - progressPercentage;
  if (gap <= 15) return null;
  return {
    gap,
    message: `${goal.metricLabel} is ${gap} percentage points behind the date progress.`,
  };
}

const DashboardPresenter = observer(function DashboardPresenter() {
  const store = useStore();
  const { repository } = useControllers();

  const allGoalCards = useMemo(
    () =>
      store.requestSummaries.map((goal) => {
        const card = {
          ...goal,
          metricLabel: getMetricLabel(goal.metricType),
          contributionLabel: getMetricDefinition(goal.metricType).contributionLabel,
        };
        return { ...card, risk: buildGoalRisk(card) };
      }),
    [store.requestSummaries],
  );

  const activeGoalCards = useMemo(
    () => allGoalCards.filter((goal) => goal.status === 'active').sort((a, b) => latestActiveTime(b) - latestActiveTime(a)),
    [allGoalCards],
  );

  const goalPreviewCards = useMemo(
    () => activeGoalCards.slice(0, 1),
    [activeGoalCards],
  );

  const xpBars = useMemo(() => {
    const breakdown = getXpBreakdown(store.hero, store.scoreRules);
    const max = Math.max(1, ...breakdown.map((item) => item.count));
    return breakdown.map((item) => ({
      label: item.label,
      value: `${item.count} × ${item.rule} XP = ${item.xp}`,
      width: `${Math.round((item.count / max) * 100)}%`,
    }));
  }, [store.hero, store.scoreRules]);

  const hasContributorData = store.repositoryContributors.length > 0 && Number(store.repositoryContributorsSyncedAtMs) > 0;

  const teammateRows = useMemo(() => {
    if (!hasContributorData) return [];

    const syncedByUsername = new Map(store.leaderboard.map((player) => [player.username, player]));
    return store.repositoryContributors
      .map((contributor) => {
        const player = syncedByUsername.get(contributor.username);
        return {
          username: contributor.username,
          contributions: contributor.contributions ?? player?.commits ?? 0,
          synced: Boolean(player),
          player,
          updatedAtMs: player?.updatedAtMs ?? 0,
          allTimeSyncedAtMs: player?.allTimeSyncedAtMs ?? 0,
        };
      })
      .sort((a, b) => Number(b.synced) - Number(a.synced) || Number(b.contributions ?? 0) - Number(a.contributions ?? 0) || a.username.localeCompare(b.username));
  }, [hasContributorData, store.repositoryContributors, store.leaderboard]);

  const syncedContributorCount = hasContributorData ? teammateRows.filter((row) => row.synced).length : 0;
  const totalContributorCount = hasContributorData ? teammateRows.length : 0;
  const syncedContributorLabel = hasContributorData ? `${syncedContributorCount}/${totalContributorCount}` : store.repositoryContributorsLoading ? 'Loading…' : '—';

  const repoLabel = store.repoKeyString;

  useEffect(() => {
    if (repoLabel) {
      void repository.loadRepositoryContributors({ source: 'background' });
    }
  }, [repoLabel, repository]);

  function handleModalOpen(type) {
    if (!repoLabel) return;
    if (type === 'merged') void repository.loadMergedPullRequestDetails();
    if (type === 'teammates') void repository.loadRepositoryContributors({ source: 'manual' });
  }

  async function copyInvite(username = '') {
    const message = buildInviteMessage(store.repoKeyString || 'this repository', username);
    try {
      await navigator.clipboard.writeText(message);
      store.setFlashMessage(username ? `Invite for @${username} copied.` : 'Invite copied.');
    } catch {
      store.setFlashMessage(message);
    }
  }

  return (
    <QuestDashboardView
      hero={store.hero}
      repo={store.repo}
      repoStats={store.repoStats}
      requests={goalPreviewCards}
      xpBars={xpBars}
      onOpenWorkspace={() => store.setStep('connect')}
      activeMembersCount={syncedContributorLabel}
      openRequestsCount={store.activeRequestCount}
      xpSubtitle="Your GitHub contribution XP"
      teammates={teammateRows}
      teammatesLoading={store.repositoryContributorsLoading && !hasContributorData}
      teammatesError={store.repositoryContributorsError}
      onSelectPlayer={store.selectPlayer}
      activeGoals={activeGoalCards}
      allUserContributionsById={store.allUserRequestContributionsById}
      mergedPullRequests={store.mergedPullRequests}
      onModalOpen={handleModalOpen}
      onCopyInvite={copyInvite}
    />
  );
});

export default DashboardPresenter;

import { useMemo } from 'react';
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

  const goalPreviewCards = useMemo(
    () => allGoalCards.filter((goal) => goal.status === 'active').sort((a, b) => latestActiveTime(b) - latestActiveTime(a)).slice(0, 1),
    [allGoalCards],
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

  const contributorsLoaded = Number(store.repositoryContributorsSyncedAtMs) > 0;

  const teammateRows = useMemo(() => {
    if (!contributorsLoaded) return [];

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
  }, [contributorsLoaded, store.repositoryContributors, store.leaderboard]);

  const syncedContributorCount = contributorsLoaded ? teammateRows.filter((row) => row.synced).length : 0;
  const totalContributorCount = contributorsLoaded ? teammateRows.length : 0;
  const syncedContributorLabel = contributorsLoaded ? `${syncedContributorCount}/${totalContributorCount}` : 'Loading…';

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
      onOpenQuest={() => store.setStep('quests')}
      onOpenWorkspace={() => store.setStep('connect')}
      activeMembersCount={syncedContributorLabel}
      openRequestsCount={store.activeRequestCount}
      xpSubtitle="Your GitHub contribution XP"
      teammates={teammateRows}
      teammatesLoading={store.repositoryContributorsLoading || !contributorsLoaded}
      onSelectPlayer={store.selectPlayer}
      allGoals={allGoalCards}
      allUserContributionsById={store.allUserRequestContributionsById}
      mergedPullRequests={store.mergedPullRequests}
      onLoadMergedPullRequests={() => repository.loadMergedPullRequestDetails()}
      onLoadRepositoryContributors={() => repository.loadRepositoryContributors()}
      onCopyInvite={copyInvite}
    />
  );
});

export default DashboardPresenter;

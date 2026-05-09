import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreProvider.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';
import { getXpBreakdown } from '../models/scoreRules.js';
import { getMetricDefinition, getMetricLabel } from '../models/QuestModel.js';

const DashboardPresenter = observer(function DashboardPresenter() {
  const store = useStore();

  const requestCards = useMemo(
    () =>
      store.requestSummaries.map((request) => ({
        ...request,
        metricLabel: getMetricLabel(request.metricType),
        contributionLabel: getMetricDefinition(request.metricType).contributionLabel,
      })),
    [store.requestSummaries],
  );

  const achievements = useMemo(() => {
    const items = [];
    if (store.hero.xp > 0 || store.hero.commits > 0 || store.hero.mergedPRs > 0) {
      items.push({
        title: `${store.profile.username} — ${store.hero.xp} XP (level ${store.hero.level})`,
        type: 'level',
        time: store.hero.questBonusXp > 0 ? `Includes +${store.hero.questBonusXp} request bonus XP` : store.lastSyncedAt ? `Last sync: ${store.lastSyncedAt}` : 'After sync',
      });
    }

    const completedRequests = requestCards.filter((request) => request.status === 'completed');
    const activeRequests = requestCards.filter((request) => request.status === 'active');

    if (completedRequests.length > 0) {
      items.push({
        title: `${completedRequests.length} request${completedRequests.length === 1 ? '' : 's'} completed`,
        type: 'quest',
        time: `Repository requests for ${store.repoKeyString || 'current repo'}`,
      });
    } else if (activeRequests.length > 0) {
      items.push({
        title: `${activeRequests.length} active request${activeRequests.length === 1 ? '' : 's'} in progress`,
        type: 'quest',
        time: `Repository requests for ${store.repoKeyString || 'current repo'}`,
      });
    }

    if (store.leaderboard.length > 0) {
      items.push({
        title: `${store.leaderboard.length} synced teammates on the leaderboard`,
        type: 'badge',
        time: 'Firebase leaderboard',
      });
    }

    return items.slice(0, 6);
  }, [store.hero, store.profile.username, store.lastSyncedAt, store.leaderboard.length, store.repoKeyString, requestCards]);

  const xpBars = useMemo(() => {
    const breakdown = getXpBreakdown(store.hero, store.scoreRules);
    const max = Math.max(1, ...breakdown.map((item) => item.count));
    return breakdown.map((item) => ({
      label: item.label,
      value: `${item.count} × ${item.rule} XP = ${item.xp}`,
      width: `${Math.round((item.count / max) * 100)}%`,
    }));
  }, [store.hero, store.scoreRules]);

  return (
    <QuestDashboardView
      hero={store.hero}
      repo={store.repo}
      repoStats={store.repoStats}
      requests={requestCards}
      xpBars={xpBars}
      onSelectPlayer={store.selectPlayer}
      onOpenQuest={() => store.setStep('quests')}
      onOpenLeaderboard={() => store.setStep('leaderboard')}
      contributors={store.topContributors}
      achievements={achievements}
      activeMembersCount={store.activeMembersCount}
      openRequestsCount={store.activeRequestCount}
      xpSubtitle="Your GitHub contribution XP"
    />
  );
});

export default DashboardPresenter;

import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';
import { getXpBreakdown } from '../models/scoreRules.js';
import { getMetricDefinition, getMetricLabel } from '../models/QuestModel.js';

function deadlineTime(goal) {
  const time = Date.parse(goal?.endDate || '');
  return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
}

const DashboardPresenter = observer(function DashboardPresenter() {
  const store = useStore();
  const { repository } = useControllers();

  const allGoalCards = useMemo(
    () =>
      store.requestSummaries.map((goal) => ({
        ...goal,
        metricLabel: getMetricLabel(goal.metricType),
        contributionLabel: getMetricDefinition(goal.metricType).contributionLabel,
      })),
    [store.requestSummaries],
  );

  const goalPreviewCards = useMemo(
    () => [...allGoalCards].sort((a, b) => deadlineTime(a) - deadlineTime(b)).slice(0, 2),
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

  return (
    <QuestDashboardView
      hero={store.hero}
      repo={store.repo}
      repoStats={store.repoStats}
      requests={goalPreviewCards}
      totalGoalsCount={allGoalCards.length}
      xpBars={xpBars}
      onOpenQuest={() => store.setStep('quests')}
      onOpenWorkspace={() => store.setStep('connect')}
      activeMembersCount={store.activeMembersCount}
      openRequestsCount={store.activeRequestCount}
      xpSubtitle="Your GitHub contribution XP"
      teammates={store.leaderboard}
      onSelectPlayer={store.selectPlayer}
      allGoals={allGoalCards}
      allUserContributionsById={store.allUserRequestContributionsById}
      mergedPullRequests={store.mergedPullRequests}
      onLoadMergedPullRequests={() => repository.loadMergedPullRequestDetails()}

    />
  );
});

export default DashboardPresenter;

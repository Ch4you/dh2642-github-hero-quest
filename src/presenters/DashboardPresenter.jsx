import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';

const DashboardPresenter = observer(function DashboardPresenter() {
  const store = useStore();

  return (
    <ShellPresenter current="dashboard">
      <QuestDashboardView
        quest={store.quest}
        hero={store.hero}
        onSync={store.syncRepositoryData}
        syncStatus={store.syncStatus}
        onSelectPlayer={store.selectPlayer}
        isLoading={store.isLoading}
        errorMessage={store.errorMessage}
        onOpenQuest={() => store.setStep('quests')}
        onOpenLeaderboard={() => store.setStep('leaderboard')}
        contributors={store.topContributors}
        achievements={store.dashboardAchievements}
        activeMembersCount={store.activeMembersCount}
        openQuestsCount={1}
        lastSyncedLabel={store.lastSyncedAt ? `Last synced: ${store.lastSyncedAt}` : 'Sync to load GitHub data'}
        teamXpSubtitle="Repo-level stats from GitHub API"
      />
    </ShellPresenter>
  );
});

export default DashboardPresenter;

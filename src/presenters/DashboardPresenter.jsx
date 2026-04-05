import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';
import { players, recentAchievements } from '../models/mockData.js';

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
        contributors={players}
        achievements={recentAchievements}
      />
    </ShellPresenter>
  );
});

export default DashboardPresenter;


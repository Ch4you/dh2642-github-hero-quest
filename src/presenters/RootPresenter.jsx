import { AnimatePresence, motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import AppShell from './AppShell.jsx';
import PlayerDrawer from '../components/prototype/PlayerDrawer.jsx';
import LoginView from '../views/LandingView.jsx';
import SetupView from '../views/SetupView.jsx';
import ConnectRepoView from '../views/ConnectRepoView.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';
import LeaderboardView from '../views/LeaderboardView.jsx';
import QuestConfiguratorView from '../views/QuestConfiguratorView.jsx';

const RootPresenter = observer(function RootPresenter() {
  const store = useStore();

  const shellProps = {
    repo: store.repo,
    onNavigate: store.setStep,
    onSync: store.syncRepositoryData,
    syncStatus: store.syncStatus,
    isLoading: store.isLoading,
  };

  const screen = (() => {
    switch (store.step) {
      case 'login':
        return <LoginView onContinue={() => store.setStep('setup')} />;
      case 'setup':
        return (
          <SetupView
            username={store.profile.username}
            onUsernameChange={store.setProfileUsername}
            onContinue={() => store.setStep('connect')}
          />
        );
      case 'connect':
        return (
          <AppShell current="settings" {...shellProps}>
            <ConnectRepoView onConnectRepository={store.connectRepository} />
          </AppShell>
        );
      case 'dashboard':
        return (
          <AppShell current="dashboard" {...shellProps}>
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
            />
          </AppShell>
        );
      case 'leaderboard':
        return (
          <AppShell current="leaderboard" {...shellProps}>
            <LeaderboardView repo={store.repo} rows={store.leaderboard} onSelectPlayer={store.selectPlayer} />
          </AppShell>
        );
      case 'quests':
        return (
          <AppShell current="quests" {...shellProps}>
            <QuestConfiguratorView
              quest={store.quest}
              hero={store.hero}
              onSaveQuest={(payload) => {
                store.updateQuest(payload);
                store.setStep('dashboard');
              }}
              onBackDashboard={() => store.setStep('dashboard')}
            />
          </AppShell>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={store.step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {screen}
        </motion.div>
      </AnimatePresence>
      <PlayerDrawer
        player={store.selectedPlayer}
        open={!!store.selectedPlayer}
        onOpenChange={(open) => !open && store.closePlayerDrawer()}
      />
    </>
  );
});

export default RootPresenter;


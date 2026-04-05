import { AnimatePresence, motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import PlayerDrawer from '../components/prototype/PlayerDrawer.jsx';
import LoginPresenter from './LoginPresenter.jsx';
import SetupPresenter from './SetupPresenter.jsx';
import ConnectRepoPresenter from './ConnectRepoPresenter.jsx';
import DashboardPresenter from './DashboardPresenter.jsx';
import LeaderboardPresenter from './LeaderboardPresenter.jsx';
import QuestPresenter from './QuestPresenter.jsx';

const RootPresenter = observer(function RootPresenter() {
  const store = useStore();

  const screen = (() => {
    switch (store.step) {
      case 'login':
        return <LoginPresenter />;
      case 'setup':
        return <SetupPresenter />;
      case 'connect':
        return <ConnectRepoPresenter />;
      case 'dashboard':
        return <DashboardPresenter />;
      case 'leaderboard':
        return <LeaderboardPresenter />;
      case 'quests':
        return <QuestPresenter />;
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


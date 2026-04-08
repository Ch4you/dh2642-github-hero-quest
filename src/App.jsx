import GameProvider from './models/GameContext.jsx';
import AppShell from './presenters/AppShell.jsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useGame } from './models/GameContext.jsx';
import PlayerDrawer from './components/prototype/PlayerDrawer.jsx';
import LoginView from './views/LandingView.jsx';
import SetupView from './views/SetupView.jsx';
import ConnectRepoView from './views/ConnectRepoView.jsx';
import QuestDashboardView from './views/QuestDashboardView.jsx';
import LeaderboardView from './views/LeaderboardView.jsx';
import QuestConfiguratorView from './views/QuestConfiguratorView.jsx';

export default function App() {
  return (
    <GameProvider>
      <InnerApp />
    </GameProvider>
  );
}

function InnerApp() {
  const { step, selectedPlayer, closeDrawer } = useGame();

  if (step === 'login') {
    return <LoginView />;
  }

  if (step === 'setup') {
    return <SetupView />;
  }

  const current =
    step === 'connect' ? 'settings' : step;

  const content = (() => {
    switch (step) {
      case 'connect':
        return <ConnectRepoView />;
      case 'dashboard':
        return <QuestDashboardView />;
      case 'leaderboard':
        return <LeaderboardView />;
      case 'quests':
        return <QuestConfiguratorView />;
      default:
        return null;
    }
  })();

  return (
    <>
      <AppShell current={current}>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </AppShell>

      <PlayerDrawer
        player={selectedPlayer}
        open={!!selectedPlayer}
        onOpenChange={(open) => !open && closeDrawer()}
      />
    </>
  );
}
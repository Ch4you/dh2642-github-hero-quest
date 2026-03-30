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
  return <GameProvider><InnerApp /></GameProvider>;
}

function InnerApp() {
  const { step, selectedPlayer, closeDrawer } = useGame();

  const screen = (() => {
    switch (step) {
      case 'login':
        return <LoginView />;
      case 'setup':
        return <SetupView />;
      case 'connect':
        return (
          <AppShell current="settings">
            <ConnectRepoView />
          </AppShell>
        );
      case 'dashboard':
        return (
          <AppShell current="dashboard">
            <QuestDashboardView />
          </AppShell>
        );
      case 'leaderboard':
        return (
          <AppShell current="leaderboard">
            <LeaderboardView />
          </AppShell>
        );
      case 'quests':
        return (
          <AppShell current="quests">
            <QuestConfiguratorView />
          </AppShell>
        );
      default:
        return null;
    }
  })();

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {screen}
        </motion.div>
      </AnimatePresence>
      <PlayerDrawer player={selectedPlayer} open={!!selectedPlayer} onOpenChange={(open) => !open && closeDrawer()} />
    </>
  );
}


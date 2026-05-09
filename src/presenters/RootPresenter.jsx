import { AnimatePresence, motion } from 'framer-motion';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreProvider.jsx';
import PlayerDrawer from '../components/prototype/PlayerDrawer.jsx';
import LoginPresenter from './LoginPresenter.jsx';
import SetupPresenter from './SetupPresenter.jsx';
import ConnectRepoPresenter from './ConnectRepoPresenter.jsx';
import DashboardPresenter from './DashboardPresenter.jsx';
import LeaderboardPresenter from './LeaderboardPresenter.jsx';
import QuestPresenter from './QuestPresenter.jsx';
import AboutPresenter from './AboutPresenter.jsx';
import ShellPresenter from './ShellPresenter.jsx';

const shellStepFade = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

function shellNavFromStep(step) {
  if (step === 'connect') return 'settings';
  return step;
}

const RootPresenter = observer(function RootPresenter() {
  const store = useStore();
  const step = store.step;
  const isAuthFlow = step === 'login' || step === 'setup';
  const isShellStep = step === 'connect' || step === 'dashboard' || step === 'leaderboard' || step === 'quests' || step === 'about';

  let shellBody = null;
  if (isShellStep) {
    switch (step) {
      case 'connect':
        shellBody = <ConnectRepoPresenter />;
        break;
      case 'dashboard':
        shellBody = <DashboardPresenter />;
        break;
      case 'leaderboard':
        shellBody = <LeaderboardPresenter />;
        break;
      case 'quests':
        shellBody = <QuestPresenter />;
        break;
      case 'about':
        shellBody = <AboutPresenter />;
        break;
      default:
        shellBody = null;
    }
  }

  return (
    <>
      {isAuthFlow ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            className="min-h-dvh"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={shellStepFade}
          >
            {step === 'login' ? <LoginPresenter /> : <SetupPresenter />}
          </motion.div>
        </AnimatePresence>
      ) : isShellStep ? (
        <ShellPresenter current={shellNavFromStep(step)}>
          <div className="relative min-h-[12rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step}
                className="w-full"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={shellStepFade}
              >
                {shellBody}
              </motion.div>
            </AnimatePresence>
          </div>
        </ShellPresenter>
      ) : null}
      <PlayerDrawer
        player={store.selectedPlayer}
        open={!!store.selectedPlayer}
        onOpenChange={(open) => !open && store.closePlayerDrawer()}
      />
    </>
  );
});

export default RootPresenter;


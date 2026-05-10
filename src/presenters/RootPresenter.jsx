import { AnimatePresence, motion } from 'framer-motion';
import { useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../stores/StoreProvider.jsx';
import PlayerDrawer from '../components/common/PlayerDrawer.jsx';
import { getXpBreakdown } from '../models/scoreRules.js';
import LoginPresenter from './LoginPresenter.jsx';
import SetupPresenter from './SetupPresenter.jsx';
import ConnectRepoPresenter from './ConnectRepoPresenter.jsx';
import DashboardPresenter from './DashboardPresenter.jsx';
import LeaderboardPresenter from './LeaderboardPresenter.jsx';
import QuestPresenter from './QuestPresenter.jsx';
import AboutPresenter from './AboutPresenter.jsx';
import ShellPresenter from './ShellPresenter.jsx';

const shellStepFade = { duration: 0.22, ease: [0.22, 1, 0.36, 1] };

function formatRangeDate(date) {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getLastSevenDaysLabel(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return `${formatRangeDate(start)} – ${formatRangeDate(end)}`;
}

function getAllTimeLabel(repo, now = new Date()) {
  const createdAtMs = Date.parse(repo?.createdAt || '');
  if (!Number.isFinite(createdAtMs)) return `All time through ${formatRangeDate(now)}`;
  return `${formatRangeDate(new Date(createdAtMs))} – ${formatRangeDate(now)}`;
}

function shellNavFromStep(step) {
  if (step === 'connect') return 'settings';
  return step;
}

const RootPresenter = observer(function RootPresenter() {
  const store = useStore();
  const step = store.step;
  const isAuthFlow = step === 'login' || step === 'setup';
  const isShellStep = step === 'connect' || step === 'dashboard' || step === 'leaderboard' || step === 'quests' || step === 'about';
  const selectedPlayerXpBreakdown = useMemo(
    () => (store.selectedPlayer ? getXpBreakdown(store.selectedPlayer, store.scoreRules) : []),
    [store.selectedPlayer, store.scoreRules],
  );
  const selectedPlayerPeriodLabel = store.leaderboardFilter === 'Last 7 days'
    ? getLastSevenDaysLabel()
    : getAllTimeLabel(store.repo);

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
        xpBreakdown={selectedPlayerXpBreakdown}
        periodLabel={selectedPlayerPeriodLabel}
        open={!!store.selectedPlayer}
        onOpenChange={(open) => !open && store.closePlayerDrawer()}
      />
    </>
  );
});

export default RootPresenter;


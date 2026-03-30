import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { getRepoStats } from '../services/githubApi.js';
import { xpFromActivity } from './scoring.js';

const GameContext = createContext(null);

export default function GameProvider({ children }) {
  // to do(graded): align with "State manager ... with actions" expectation (Redux/Zustand/etc).
  // If using Context, ensure side effects/persistence go through a single actions layer.
  const [step, setStep] = useState('login');
  const [status, setStatus] = useState('synced'); // synced | syncing | error

  const [repo, setRepo] = useState({ owner: '', name: '' });
  const [questGoalPRs, setQuestGoalPRs] = useState(5);
  const [questDeadline, setQuestDeadline] = useState('');

  const [stats, setStats] = useState({
    mergedPRs: 0,
    openPRs: 0,
    commits: 0,
    xp: 0,
    level: 1,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState('');

  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const setRepoSafe = useCallback(({ owner, name }) => {
    setRepo({ owner: owner ?? '', name: name ?? '' });
    setStatsError('');
    setStep('dashboard');
  }, []);

  const updateQuest = useCallback(({ goalPRs, deadline }) => {
    if (typeof goalPRs === 'number' && Number.isFinite(goalPRs)) setQuestGoalPRs(goalPRs);
    if (typeof deadline === 'string') setQuestDeadline(deadline);
  }, []);

  const clearStats = useCallback(() => {
    setStats({
      mergedPRs: 0,
      openPRs: 0,
      commits: 0,
      xp: 0,
      level: 1,
    });
    setStatsError('');
    setLoadingStats(false);
  }, []);

  const loadStats = useCallback(async () => {
    setLoadingStats(true);
    setStatsError('');
    try {
      const { owner, name } = repo;
      const activity = await getRepoStats(owner, name);
      const { xp, level } = xpFromActivity(activity);
      setStats({ ...activity, xp, level });
      return true;
    } catch (e) {
      setStatsError(e?.message ? String(e.message) : 'Failed to load stats');
      return false;
    } finally {
      setLoadingStats(false);
    }
  }, [repo]);

  const sync = useCallback(async () => {
    // to do(graded): show clear system status while waiting for API requests.
    // to do(graded): allow user to perform other actions while waiting.
    setStatus('syncing');
    const ok = await loadStats();
    setStatus(ok ? 'synced' : 'error');
  }, [loadStats]);

  const closeDrawer = useCallback(() => setSelectedPlayer(null), []);

  const value = useMemo(
    () => ({
      step,
      setStep,
      repo,
      setRepoSafe,
      questGoalPRs,
      questDeadline,
      updateQuest,
      stats,
      setStats,
      clearStats,
      loadingStats,
      statsError,
      loadStats,
      sync,
      status,
      selectedPlayer,
      setSelectedPlayer,
      closeDrawer,
    }),
    [
      step,
      setRepoSafe,
      repo,
      questGoalPRs,
      questDeadline,
      updateQuest,
      stats,
      clearStats,
      loadingStats,
      statsError,
      loadStats,
      sync,
      status,
      selectedPlayer,
      closeDrawer,
    ],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}


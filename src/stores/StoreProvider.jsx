import { createContext, useContext, useEffect, useMemo } from 'react';
import { AppStore } from '../models/AppStore.js';
import { AuthController } from '../controllers/AuthController.js';
import { RepositoryController } from '../controllers/RepositoryController.js';
import { LeaderboardController } from '../controllers/LeaderboardController.js';
import { QuestController } from '../controllers/QuestController.js';

const StoreContext = createContext(null);
const ControllerContext = createContext(null);

export function StoreProvider({ children }) {
  const store = useMemo(() => new AppStore(), []);

  const controllers = useMemo(() => {
    const leaderboardController = new LeaderboardController(store);
    const questController = new QuestController(store);
    const repositoryController = new RepositoryController(store, { leaderboardController, questController });
    const authController = new AuthController(store, { repositoryController });

    return {
      auth: authController,
      repository: repositoryController,
      leaderboard: leaderboardController,
      quest: questController,
    };
  }, [store]);

  useEffect(() => {
    const unsubscribe = controllers.auth.startAuthSubscription();
    return () => {
      unsubscribe?.();
      store.dispose();
    };
  }, [controllers, store]);

  return (
    <StoreContext.Provider value={store}>
      <ControllerContext.Provider value={controllers}>{children}</ControllerContext.Provider>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

export function useControllers() {
  const controllers = useContext(ControllerContext);
  if (!controllers) throw new Error('useControllers must be used inside StoreProvider');
  return controllers;
}

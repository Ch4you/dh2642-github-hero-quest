import { createContext, useContext, useEffect, useMemo } from 'react';
import { AppStore } from './AppStore.js';
import { isFirebaseConfigured, subscribeAuthState, saveAuthProfile } from '../services/firebaseService.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const store = useMemo(() => new AppStore(), []);

  useEffect(() => {
    return () => store.dispose();
  }, [store]);

  useEffect(() => {
    if (!isFirebaseConfigured()) return undefined;

    const unsub = subscribeAuthState((payload) => {
      if (!payload) {
        store.applySignedOut();
        return;
      }

      let { uid, username, displayName, avatarUrl } = payload;
      if (!username?.trim()) {
        try {
          const stored = localStorage.getItem('heroquest_github_login');
          if (stored) {
            username = stored;
            void saveAuthProfile({
              uid,
              username: stored,
              displayName: displayName || stored,
              avatarUrl,
            });
          }
        } catch {
          /* ignore */
        }
      }

      if (username?.trim()) {
        store.hydrateFromFirebaseSession({
          uid,
          username: username.trim(),
          displayName: displayName || username,
          avatarUrl,
        });
        if (!store.repo.owner || !store.repo.name) {
          void store.autoConnectForUsername(username.trim()).catch(() => {});
        }
      }
    });

    return unsub;
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

import { createContext, useContext, useEffect, useMemo } from 'react';
import { AppStore } from './AppStore.js';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const store = useMemo(() => new AppStore(), []);

  useEffect(() => {
    return () => store.dispose();
  }, [store]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}

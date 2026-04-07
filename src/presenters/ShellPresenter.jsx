import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import AppShell from './AppShell.jsx';

const ShellPresenter = observer(function ShellPresenter({ current, children }) {
  const store = useStore();

  return (
    <AppShell
      current={current}
      repo={store.repo}
      onNavigate={store.setStep}
      onSync={store.syncRepositoryData}
      syncStatus={store.syncStatus}
      isLoading={store.isLoading}
      flashMessage={store.flashMessage}
      onDismissFlashMessage={store.clearFlashMessage}
      notifications={store.notifications}
      notificationsOpen={store.notificationsOpen}
      onToggleNotifications={store.toggleNotifications}
      onCloseNotifications={store.closeNotifications}
      onClearNotifications={store.clearNotifications}
    >
      {children}
    </AppShell>
  );
});

export default ShellPresenter;


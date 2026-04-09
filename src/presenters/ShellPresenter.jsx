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
      profile={store.profile}
      profileInitials={store.profileInitials}
      onSignOut={store.signOut}
      syncStatus={store.syncStatus}
      isLoading={store.isLoading}
      loadingPhase={store.loadingPhase}
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


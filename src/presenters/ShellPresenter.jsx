import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import AppShellView from '../views/AppShellView.jsx';

const ShellPresenter = observer(function ShellPresenter({ current, children }) {
  const store = useStore();
  const { auth, repository } = useControllers();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const cooldownRemainingMs = store.repoKeyString
    ? Math.max(0, store.syncCooldownMs - (now - store.activeRepoLastSyncStartedAt))
    : 0;
  const canSync = Boolean(store.repoKeyString) && !store.isLoading && cooldownRemainingMs <= 0;

  function requestRemoveRepository(repoKey) {
    store.requestConfirmation({
      title: `Remove ${repoKey}?`,
      message: 'This only removes the repository from your workspace. It will not delete the GitHub repository or shared Firebase data, so you can add it back later.',
      confirmLabel: 'Remove repository',
      tone: 'danger',
      onConfirm: () => repository.removeRepository(repoKey),
    });
  }

  return (
    <AppShellView
      current={current}
      repo={store.repo}
      repositories={store.repositories}
      activeRepoKey={store.activeRepoKey}
      onSwitchRepository={(repoKey) => repository.switchActiveRepository(repoKey)}
      onRemoveRepository={requestRemoveRepository}
      onNavigate={store.setStep}
      onSync={() => repository.syncCurrentPage()}
      canSync={canSync}
      syncCooldownRemainingMs={cooldownRemainingMs}
      profile={store.profile}
      profileInitials={store.profileInitials}
      onSignOut={() => auth.signOut()}
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
      confirmation={store.confirmation}
      onCancelConfirmation={store.closeConfirmation}
      onConfirmConfirmation={store.confirmCurrentAction}
    >
      {children}
    </AppShellView>
  );
});

export default ShellPresenter;

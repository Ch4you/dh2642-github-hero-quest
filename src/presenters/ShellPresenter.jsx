import { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import AppShellView from '../views/AppShellView.jsx';

function buildInviteMessage(repoKey) {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  return `Join our GitHub Hero Quest workspace for ${repoKey}. Open ${appUrl} and sign in with GitHub, then connect ${repoKey} to sync your contribution data.`;
}

const ShellPresenter = observer(function ShellPresenter({ current, children }) {
  const store = useStore();
  const { auth, repository } = useControllers();
  const canSync = Boolean(store.repoKeyString) && !store.isLoading;

  useEffect(() => {
    if (!store.flashMessage) return undefined;
    const timer = window.setTimeout(() => store.clearFlashMessage(), 3000);
    return () => window.clearTimeout(timer);
  }, [store, store.flashMessage]);

  function requestRemoveRepository(repoKey) {
    if (store.repositories.length <= 1) {
      store.setFlashMessage('Keep at least one repository connected. Add another repository before removing this one.');
      return;
    }

    store.requestConfirmation({
      title: `Remove ${repoKey}?`,
      message: 'This only removes the repository from your workspace. It will not delete the GitHub repository or shared team data, so you can add it back later.',
      confirmLabel: 'Remove repository',
      tone: 'danger',
      onConfirm: () => repository.removeRepository(repoKey),
    });
  }

  async function copyInvite() {
    const repoKey = store.repoKeyString || 'this repository';
    const message = buildInviteMessage(repoKey);
    try {
      await navigator.clipboard.writeText(message);
      store.setFlashMessage('Invite copied. Send it to teammates who have not synced yet.');
    } catch {
      store.setFlashMessage(message);
    }
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
      profile={store.profile}
      profileInitials={store.profileInitials}
      onSignOut={() => auth.signOut()}
      syncStatus={store.syncStatus}
      isLoading={store.isLoading}
      loadingPhase={store.loadingPhase}
      flashMessage={store.flashMessage}
      confirmation={store.confirmation}
      onCancelConfirmation={store.closeConfirmation}
      onConfirmConfirmation={store.confirmCurrentAction}
      onCopyInvite={copyInvite}
    >
      {children}
    </AppShellView>
  );
});

export default ShellPresenter;

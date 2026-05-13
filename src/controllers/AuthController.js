import {
  isFirebaseConfigured,
  signInWithGitHubPopup,
  signOutCurrentUser,
  subscribeAuthState,
} from '../services/firebaseService.js';

export class AuthController {
  constructor(store, { repositoryController } = {}) {
    this.store = store;
    this.repositoryController = repositoryController;
  }

  startAuthSubscription() {
    if (!isFirebaseConfigured()) return () => {};

    return subscribeAuthState((payload) => {
      if (!payload) {
        this.store.clearCachedUsername();
        this.store.applySignedOut();
        return;
      }

      let { uid, username, displayName, avatarUrl } = payload;
      if (!username?.trim()) {
        const stored = this.store.readCachedUsername();
        if (stored) {
          username = stored;
          void this.store.persistMissingUsernameProfile({ uid, username: stored, displayName: displayName || stored, avatarUrl });
        }
      }

      if (username?.trim()) {
        this.store.hydrateFromSession({
          uid,
          username: username.trim(),
          displayName: displayName || username,
          avatarUrl,
        });
        void this.repositoryController?.restoreWorkspace({ silent: true });
      }
    });
  }

  async signInWithGitHub(onPhase) {
    onPhase?.('Opening GitHub authorization...');
    const authData = await signInWithGitHubPopup();
    onPhase?.('Verifying GitHub identity...');
    const username = authData.username?.trim();
    if (!username) {
      throw new Error('GitHub account login succeeded but username was missing.');
    }

    if (!this.store.cacheUsername(username)) {
      this.store.addNotification('Local sign-in cache could not be written.', 'Sign-in warning');
    }

    this.store.hydrateFromSession({
      uid: authData.uid,
      username,
      displayName: authData.displayName || username,
      avatarUrl: authData.avatarUrl || '',
    });
    this.store.setFlashMessage(`Signed in as ${username}. Choose a repository to start.`);
    this.store.setStep('connect');

    if (!isFirebaseConfigured()) return;

    onPhase?.('Saving your profile...');
    try {
      await this.store.persistAuthProfile({
        uid: authData.uid,
        username,
        displayName: authData.displayName || username,
        avatarUrl: authData.avatarUrl || '',
        email: authData.email || '',
      });
      await this.repositoryController?.restoreWorkspace({ silent: true });
    } catch (error) {
      this.store.addNotification(
        `Login succeeded, but profile/workspace save failed: ${error?.message ?? 'unknown'}`,
        'Profile save warning',
        'error',
      );
    }
  }

  async signOut() {
    this.store.setLoading({ isLoading: true, phase: 'Signing out...' });
    try {
      await signOutCurrentUser();
    } catch (error) {
      this.store.addNotification(`Sign-out warning: ${error?.message ?? 'unknown'}`, 'Sign-out warning', 'error');
    } finally {
      if (!this.store.clearCachedUsername()) {
        this.store.addNotification('Local sign-in cache could not be cleared.', 'Sign-out warning');
      }
      this.store.applySignedOut();
    }
  }
}

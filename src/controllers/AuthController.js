import {
  isFirebaseConfigured,
  saveAuthProfile,
  saveUserData,
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
        try {
          localStorage.removeItem('heroquest_github_login');
        } catch {
          return undefined;
        } finally {
          this.store.applySignedOut();
        }
        return;
      }

      let { uid, username, displayName, avatarUrl } = payload;
      if (!username?.trim()) {
        try {
          const stored = localStorage.getItem('heroquest_github_login');
          if (stored) {
            username = stored;
            void saveAuthProfile({ uid, username: stored, displayName: displayName || stored, avatarUrl });
          }
        } catch {
          username = '';
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

    try {
      localStorage.setItem('heroquest_github_login', username);
    } catch {
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
      await saveAuthProfile({
        uid: authData.uid,
        username,
        displayName: authData.displayName || username,
        avatarUrl: authData.avatarUrl || '',
      });
      await saveUserData({
        username,
        displayName: authData.displayName || username,
        avatarUrl: authData.avatarUrl || '',
        uid: authData.uid || '',
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
      try {
        localStorage.removeItem('heroquest_github_login');
      } catch {
        this.store.addNotification('Local sign-in cache could not be cleared.', 'Sign-out warning');
      }
      this.store.applySignedOut();
    }
  }
}

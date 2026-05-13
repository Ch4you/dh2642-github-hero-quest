import { makeAutoObservable } from 'mobx';
import { isFirebaseConfigured, saveAuthProfile, saveUserData } from '../services/firebaseService.js';

export class SessionStore {
  root;
  profile = { username: 'octo.team.member', displayName: '', avatarUrl: '', uid: '' };

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false }, { autoBind: true });
  }

  setProfileUsername(username) {
    this.profile = { ...this.profile, username };
  }

  hydrateFromSession({ uid, username, displayName, avatarUrl }) {
    const cleanUsername = username?.trim();
    if (!cleanUsername) return;
    this.profile = {
      username: cleanUsername,
      displayName: displayName?.trim() || cleanUsername,
      avatarUrl: avatarUrl || '',
      uid: uid || '',
    };
    if (this.root.ui.step === 'login') this.root.ui.step = 'connect';
  }



  readCachedUsername() {
    try {
      return localStorage.getItem('heroquest_github_login') || '';
    } catch {
      return '';
    }
  }

  cacheUsername(username) {
    try {
      localStorage.setItem('heroquest_github_login', username || '');
      return true;
    } catch {
      return false;
    }
  }

  clearCachedUsername() {
    try {
      localStorage.removeItem('heroquest_github_login');
      return true;
    } catch {
      return false;
    }
  }

  async persistAuthProfile({ uid, username, displayName, avatarUrl, email } = {}) {
    const cleanUsername = username?.trim();
    if (!isFirebaseConfigured() || !cleanUsername) return;

    await saveAuthProfile({
      uid: uid || '',
      username: cleanUsername,
      displayName: displayName || cleanUsername,
      avatarUrl: avatarUrl || '',
    });

    await saveUserData({
      username: cleanUsername,
      displayName: displayName || cleanUsername,
      avatarUrl: avatarUrl || '',
      uid: uid || '',
      email: email || '',
    });
  }

  async persistMissingUsernameProfile({ uid, username, displayName, avatarUrl } = {}) {
    const cleanUsername = username?.trim();
    if (!isFirebaseConfigured() || !cleanUsername) return;
    await saveAuthProfile({ uid: uid || '', username: cleanUsername, displayName: displayName || cleanUsername, avatarUrl: avatarUrl || '' });
  }

  get profileInitials() {
    const source = this.profile.displayName || this.profile.username || '';
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return source.slice(0, 2).toUpperCase() || 'HQ';
  }

  reset() {
    this.profile = { username: 'octo.team.member', displayName: '', avatarUrl: '', uid: '' };
  }
}

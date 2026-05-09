import { makeAutoObservable } from 'mobx';

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

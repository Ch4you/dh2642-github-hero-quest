import { makeAutoObservable } from 'mobx';

export class LeaderboardStore {
  root;
  leaderboard = [];
  leaderboardFilter = 'All time';
  searchQuery = '';
  leaderboardUnsubscribe = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false, leaderboardUnsubscribe: false }, { autoBind: true });
  }

  get topContributors() {
    return this.leaderboard.slice(0, 4);
  }

  get activeMembersCount() {
    const hero = this.root.workspace.hero;
    return Math.max(
      this.leaderboard.length,
      hero.xp > 0 || hero.mergedPRs > 0 || hero.commits > 0 ? 1 : 0,
    );
  }

  setLeaderboardRows(rows) {
    this.leaderboard = Array.isArray(rows) ? rows : [];
  }

  setLeaderboardFilter(filter) {
    this.leaderboardFilter = filter === 'Last 7 days' ? 'Last 7 days' : 'All time';
  }

  setSearchQuery(value) {
    this.searchQuery = String(value || '');
  }

  resetRows() {
    this.leaderboard = [];
    this.root.ui.closePlayerDrawer();
  }

  setLeaderboardUnsubscribe(unsubscribe) {
    this.leaderboardUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
  }

  stopLeaderboardSubscription() {
    if (this.leaderboardUnsubscribe) {
      this.leaderboardUnsubscribe();
      this.leaderboardUnsubscribe = null;
    }
  }

  reset() {
    this.stopLeaderboardSubscription();
    this.leaderboard = [];
    this.leaderboardFilter = 'All time';
    this.searchQuery = '';
  }
}

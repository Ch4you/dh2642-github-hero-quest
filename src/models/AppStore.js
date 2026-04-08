import { makeAutoObservable, runInAction } from 'mobx';
import { HeroModel } from './HeroModel.js';
import { QuestModel } from './QuestModel.js';
import { getRepoStats, getUserProfile } from '../services/githubApi.js';
import {
  isFirebaseConfigured,
  saveUserProgress,
  saveUserData,
  subscribeLeaderboard,
  signInWithGitHubPopup,
} from '../services/firebaseService.js';

function mapFirebaseRecordToPlayer(row) {
  const username = String(row.username ?? '').trim() || 'unknown';
  const displayName = typeof row.displayName === 'string' && row.displayName.trim()
    ? row.displayName.trim()
    : username;
  const parts = displayName.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  return {
    id: row.id || `${username}__${row.repoKey ?? ''}`,
    name: displayName,
    initials,
    xp: Number(row.xp ?? 0),
    level: Number(row.level ?? 1),
    commits: Number(row.commits ?? 0),
    mergedPRs: Number(row.mergedPRs ?? 0),
    reviews: Number(row.reviews ?? 0),
    weeklyXp: Number(row.weeklyXp ?? row.xp ?? 0),
    trend: row.trend ?? '',
    streak: Number(row.streak ?? 0),
    badges: Array.isArray(row.badges) && row.badges.length ? row.badges : ['Contributor'],
  };
}

export class AppStore {
  step = 'login';
  syncStatus = 'synced';
  isLoading = false;
  errorMessage = '';
  flashMessage = '';

  repo = { owner: '', name: '' };
  profile = { username: 'octo.team.member', displayName: '', avatarUrl: '', uid: '' };
  hero = new HeroModel();
  quest = new QuestModel({
    title: 'Reach 12 merged PRs before Friday',
    description: 'Push the onboarding flow and polish leaderboard interactions before the weekly review.',
    targetMergedPRs: 12,
    deadline: '',
  });
  questDraft = null;

  selectedPlayer = null;
  leaderboard = [];
  notificationsOpen = false;
  notifications = [];
  nextNotificationId = 1;

  lastSyncedAt = '';

  leaderboardUnsubscribe = null;

  constructor() {
    makeAutoObservable(this, { leaderboardUnsubscribe: false }, { autoBind: true });
  }

  get repoKeyString() {
    if (!this.repo?.owner?.trim() || !this.repo?.name?.trim()) return '';
    return `${this.repo.owner.trim()}/${this.repo.name.trim()}`;
  }

  get topContributors() {
    return this.leaderboard.slice(0, 4);
  }

  get dashboardAchievements() {
    const items = [];
    const qp = this.quest.progress(this.hero.mergedPRs);

    if (this.hero.xp > 0 || this.hero.commits > 0 || this.hero.mergedPRs > 0) {
      items.push({
        title: `${this.profile.username} — ${this.hero.xp} XP (level ${this.hero.level})`,
        type: 'level',
        time: this.lastSyncedAt ? `Last sync: ${this.lastSyncedAt}` : 'After sync',
      });
    }

    items.push({
      title: `${this.quest.title}: ${qp.percentage}% (${qp.merged}/${qp.goal} merged PRs)`,
      type: 'quest',
      time: 'Active quest',
    });

    if (isFirebaseConfigured() && this.leaderboard.length > 0) {
      items.push({
        title: `${this.leaderboard.length} on live leaderboard (Firebase)`,
        type: 'badge',
        time: 'Team',
      });
    }

    if (items.length === 0) {
      items.push({
        title: 'Connect a repository and sync to load GitHub stats',
        type: 'quest',
        time: 'Getting started',
      });
    }

    return items.slice(0, 6);
  }

  get activeMembersCount() {
    return Math.max(
      this.leaderboard.length,
      this.hero.xp > 0 || this.hero.mergedPRs > 0 || this.hero.commits > 0 ? 1 : 0,
    );
  }

  dispose() {
    this.stopLeaderboardSubscription();
  }

  stopLeaderboardSubscription() {
    if (this.leaderboardUnsubscribe) {
      this.leaderboardUnsubscribe();
      this.leaderboardUnsubscribe = null;
    }
  }

  startLeaderboardSubscription() {
    this.stopLeaderboardSubscription();
    if (!isFirebaseConfigured()) return;
    const key = this.repoKeyString;
    if (!key) return;
    try {
      this.leaderboardUnsubscribe = subscribeLeaderboard({
        repoKey: key,
        maxRows: 50,
        onUpdate: (records) => {
          const rows = records.map(mapFirebaseRecordToPlayer);
          runInAction(() => {
            this.leaderboard = rows;
          });
        },
        onError: (err) => {
          runInAction(() => {
            this.addNotification(
              `Leaderboard: ${err?.message ?? 'error'} (Firestore rules / VITE_FIREBASE_* / index)`,
            );
          });
        },
      });
    } catch (e) {
      runInAction(() => {
        this.addNotification(`Firebase: ${e?.message ?? 'configure VITE_FIREBASE_*'}`);
      });
    }
  }

  setStep(step) {
    const protectedSteps = new Set(['dashboard', 'leaderboard', 'quests']);
    if (protectedSteps.has(step) && (!this.repo.owner || !this.repo.name)) {
      this.flashMessage = 'Connect a repository before opening this page.';
      this.addNotification('Navigation blocked: connect a repository first');
      this.step = 'connect';
      return;
    }
    this.step = step;
  }

  setProfileUsername(username) {
    this.profile.username = username;
  }

  async signInWithGitHub() {
    const authData = await signInWithGitHubPopup();
    const username = authData.username?.trim();
    if (!username) {
      throw new Error('GitHub account login succeeded but username was missing.');
    }

    runInAction(() => {
      this.profile = {
        username,
        displayName: authData.displayName || username,
        avatarUrl: authData.avatarUrl || '',
        uid: authData.uid || '',
      };
      this.errorMessage = '';
      this.flashMessage = `Signed in as ${username}`;
      this.step = 'connect';
    });

    if (isFirebaseConfigured()) {
      try {
        await saveUserData({
          username,
          displayName: authData.displayName || username,
          avatarUrl: authData.avatarUrl || '',
          uid: authData.uid || '',
          email: authData.email || '',
        });
      } catch {
        runInAction(() => {
          this.addNotification('Login succeeded, but failed to persist profile in Firebase.');
        });
      }
    }
  }

  async validateProfileAndContinue() {
    const u = this.profile.username?.trim();
    if (!u) throw new Error('Enter a GitHub username.');
    await getUserProfile(u);
    runInAction(() => {
      this.profile.username = u;
      this.step = 'connect';
    });
  }

  connectRepository({ owner, name }) {
    this.stopLeaderboardSubscription();
    this.repo = { owner: owner ?? '', name: name ?? '' };
    this.hero = new HeroModel();
    this.leaderboard = [];
    this.questDraft = null;
    this.selectedPlayer = null;
    this.errorMessage = '';
    this.syncStatus = 'synced';
    this.isLoading = false;
    this.lastSyncedAt = '';
    this.step = 'dashboard';
    this.addNotification(`Connected ${owner}/${name}`);
    this.flashMessage = `Connected ${owner}/${name}`;
    this.startLeaderboardSubscription();
    queueMicrotask(() => {
      void this.syncRepositoryData();
    });
  }

  updateQuest({ title, description, targetMergedPRs, deadline }) {
    this.quest = new QuestModel({
      title: title ?? this.quest.title,
      description: description ?? this.quest.description,
      targetMergedPRs: Number.isFinite(targetMergedPRs) ? targetMergedPRs : this.quest.targetMergedPRs,
      deadline: deadline ?? this.quest.deadline,
    });
    this.questDraft = null;
  }

  saveQuestDraft({ title, description, targetMergedPRs, deadline }) {
    this.questDraft = {
      title: title ?? this.quest.title,
      description: description ?? this.quest.description,
      targetMergedPRs: Number.isFinite(targetMergedPRs) ? targetMergedPRs : this.quest.targetMergedPRs,
      deadline: deadline ?? this.quest.deadline,
    };
    this.addNotification('Quest draft saved');
    this.flashMessage = 'Quest draft saved';
  }

  selectPlayer(player) {
    this.selectedPlayer = player;
  }

  closePlayerDrawer() {
    this.selectedPlayer = null;
  }

  toggleNotifications() {
    this.notificationsOpen = !this.notificationsOpen;
  }

  closeNotifications() {
    this.notificationsOpen = false;
  }

  clearNotifications() {
    this.notifications = [];
    this.notificationsOpen = false;
  }

  clearFlashMessage() {
    this.flashMessage = '';
  }

  addNotification(text) {
    const item = {
      id: this.nextNotificationId,
      text,
      time: new Date().toLocaleTimeString(),
    };
    this.nextNotificationId += 1;
    this.notifications = [item, ...this.notifications].slice(0, 8);
  }

  get questProgress() {
    return this.quest.progress(this.hero.mergedPRs);
  }

  async persistProgressToFirebase() {
    if (!isFirebaseConfigured()) return;
    const username = this.profile.username?.trim();
    const key = this.repoKeyString;
    if (!username || !key) return;
    try {
      await saveUserProgress({
        username,
        repoKey: key,
        xp: this.hero.xp,
        level: this.hero.level,
        commits: this.hero.commits,
        mergedPRs: this.hero.mergedPRs,
        reviews: this.hero.reviews,
      });
      let ghProfile = null;
      try {
        ghProfile = await getUserProfile(username);
      } catch {
        ghProfile = null;
      }
      await saveUserData({
        username,
        displayName: ghProfile?.name || username,
        avatarUrl: ghProfile?.avatar_url,
        lastRepoKey: key,
      });
    } catch (e) {
      runInAction(() => {
        this.addNotification(`Cloud save failed: ${e?.message ?? 'unknown'}`);
      });
    }
  }

  async syncRepositoryData() {
    if (!this.repo.owner || !this.repo.name) {
      this.syncStatus = 'error';
      this.errorMessage = 'Please connect a repository before syncing.';
      this.addNotification('Sync failed: connect a repository first');
      this.flashMessage = 'Please connect a repository before syncing.';
      return;
    }

    this.isLoading = true;
    this.syncStatus = 'syncing';
    this.errorMessage = '';

    try {
      const activity = await getRepoStats(this.repo.owner, this.repo.name);
      runInAction(() => {
        this.hero = HeroModel.fromActivity(activity);
        this.syncStatus = 'synced';
        this.errorMessage = '';
        this.lastSyncedAt = new Date().toLocaleString();
        this.addNotification('Repository synced successfully');
      });
      void this.persistProgressToFirebase();
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error?.message ?? 'Failed to sync repository activity.';
        this.syncStatus = 'error';
        this.addNotification('Sync failed');
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}

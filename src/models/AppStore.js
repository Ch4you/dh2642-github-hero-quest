import { makeAutoObservable, runInAction } from 'mobx';
import { HeroModel } from './HeroModel.js';
import { QuestModel } from './QuestModel.js';
import { getRepoStats } from '../services/githubApi.js';

export class AppStore {
  step = 'login';
  syncStatus = 'synced';
  isLoading = false;
  errorMessage = '';
  flashMessage = '';

  repo = { owner: '', name: '' };
  profile = { username: 'octo.team.member' };
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

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
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

  connectRepository({ owner, name }) {
    this.repo = { owner: owner ?? '', name: name ?? '' };
    this.hero = new HeroModel();
    this.leaderboard = [];
    this.questDraft = null;
    this.selectedPlayer = null;
    this.errorMessage = '';
    this.syncStatus = 'synced';
    this.isLoading = false;
    this.step = 'dashboard';
    this.addNotification(`Connected ${owner}/${name}`);
    this.flashMessage = `Connected ${owner}/${name}`;
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
        this.addNotification('Repository synced successfully');
      });
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


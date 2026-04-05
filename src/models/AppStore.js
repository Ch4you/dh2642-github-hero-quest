import { makeAutoObservable, runInAction } from 'mobx';
import { HeroModel } from './HeroModel.js';
import { QuestModel } from './QuestModel.js';
import { getRepoStats } from '../services/githubApi.js';

export class AppStore {
  step = 'login';
  syncStatus = 'synced';
  isLoading = false;
  errorMessage = '';

  repo = { owner: '', name: '' };
  profile = { username: 'octo.team.member' };
  hero = new HeroModel();
  quest = new QuestModel({
    title: 'Reach 12 merged PRs before Friday',
    targetMergedPRs: 12,
    deadline: '',
  });

  selectedPlayer = null;
  leaderboard = [];

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
  }

  setStep(step) {
    this.step = step;
  }

  setProfileUsername(username) {
    this.profile.username = username;
  }

  connectRepository({ owner, name }) {
    this.repo = { owner: owner ?? '', name: name ?? '' };
    this.errorMessage = '';
    this.step = 'dashboard';
  }

  updateQuest({ title, targetMergedPRs, deadline }) {
    this.quest = new QuestModel({
      title: title ?? this.quest.title,
      targetMergedPRs: Number.isFinite(targetMergedPRs) ? targetMergedPRs : this.quest.targetMergedPRs,
      deadline: deadline ?? this.quest.deadline,
    });
  }

  selectPlayer(player) {
    this.selectedPlayer = player;
  }

  closePlayerDrawer() {
    this.selectedPlayer = null;
  }

  get questProgress() {
    return this.quest.progress(this.hero.mergedPRs);
  }

  async syncRepositoryData() {
    if (!this.repo.owner || !this.repo.name) return;

    this.isLoading = true;
    this.syncStatus = 'syncing';
    this.errorMessage = '';

    try {
      const activity = await getRepoStats(this.repo.owner, this.repo.name);
      runInAction(() => {
        this.hero = HeroModel.fromActivity(activity);
        this.syncStatus = 'synced';
      });
    } catch (error) {
      runInAction(() => {
        this.errorMessage = error?.message ?? 'Failed to sync repository activity.';
        this.syncStatus = 'error';
      });
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }
}


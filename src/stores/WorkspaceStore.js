import { makeAutoObservable } from 'mobx';
import { HeroModel } from '../models/HeroModel.js';
import { DEFAULT_SCORE_RULES, normalizeScoreRules } from '../models/scoreRules.js';

export function makeRepositoryKey({ owner, name } = {}) {
  if (!owner?.trim() || !name?.trim()) return '';
  return `${owner.trim()}/${name.trim()}`;
}

function uniqueRepositories(repositories) {
  const seen = new Set();
  return (Array.isArray(repositories) ? repositories : []).filter((repo) => {
    const key = makeRepositoryKey(repo);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export class WorkspaceStore {
  root;
  repo = { owner: '', name: '' };
  repoStats = { mergedPRs: 0 };
  repositories = [];
  repositoryInput = '';
  recentRepositories = [];
  recentLoading = false;
  connectError = '';
  syncStatus = 'idle';
  lastSyncedAt = '';
  syncCooldownMs = 30000;
  switchCooldownMs = 10000;
  lastSyncStartedAtByRepo = {};
  lastRepositoryActionAt = 0;
  manualSyncError = '';
  backgroundSyncError = '';
  scoreRules = DEFAULT_SCORE_RULES;
  hero = new HeroModel({ scoreRules: DEFAULT_SCORE_RULES });

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false }, { autoBind: true });
  }

  get repoKeyString() {
    return makeRepositoryKey(this.repo);
  }

  get activeRepoKey() {
    return this.repoKeyString;
  }

  get activeRepoLastSyncStartedAt() {
    return this.lastSyncStartedAtByRepo[this.repoKeyString] ?? 0;
  }

  get syncCooldownRemainingMs() {
    if (!this.repoKeyString) return 0;
    const elapsed = Date.now() - this.activeRepoLastSyncStartedAt;
    return Math.max(0, this.syncCooldownMs - elapsed);
  }

  get canSyncActiveRepository() {
    return Boolean(this.repoKeyString) && !this.root.ui.isLoading && this.syncCooldownRemainingMs <= 0;
  }

  get repositoryActionCooldownRemainingMs() {
    const elapsed = Date.now() - this.lastRepositoryActionAt;
    return Math.max(0, this.switchCooldownMs - elapsed);
  }

  get canChangeRepository() {
    return this.repositoryActionCooldownRemainingMs <= 0;
  }

  setRepositoryInput(value) {
    this.repositoryInput = value;
    this.connectError = '';
  }

  setRecentRepositories(repositories) {
    this.recentRepositories = repositories;
  }

  setRecentLoading(value) {
    this.recentLoading = Boolean(value);
  }

  setConnectError(message) {
    this.connectError = message || '';
  }

  setRepositories(repositories) {
    this.repositories = uniqueRepositories(repositories);
  }

  addRepository(repository) {
    this.repositories = uniqueRepositories([...this.repositories, repository]);
  }

  removeRepository(repoKey) {
    const keyToRemove = String(repoKey ?? '');
    if (!keyToRemove) return false;

    const wasActive = this.activeRepoKey === keyToRemove;
    const removedRepo = this.repositories.find((repo) => makeRepositoryKey(repo) === keyToRemove);
    this.repositories = this.repositories.filter((repo) => makeRepositoryKey(repo) !== keyToRemove);

    const nextSyncMap = { ...this.lastSyncStartedAtByRepo };
    delete nextSyncMap[keyToRemove];
    this.lastSyncStartedAtByRepo = nextSyncMap;

    if (!removedRepo) return false;

    if (!wasActive) {
      this.root.ui.addNotification(`Removed ${keyToRemove} from this workspace.`, 'Repository removed', 'success');
      return false;
    }

    this.root.stopLeaderboardSubscription();
    this.root.stopQuestSubscription();
    const nextRepo = this.repositories[0] ?? { owner: '', name: '' };
    this.repo = nextRepo;
    this.resetRepositoryData();

    if (this.repoKeyString) {
      this.root.ui.setStep('dashboard');
      this.root.ui.setFlashMessage(`Removed ${keyToRemove}. Switched to ${this.repoKeyString}. Press Sync to load data.`);
      this.root.ui.addNotification(`Removed ${keyToRemove}. Switched to ${this.repoKeyString}.`, 'Repository removed', 'success');
    } else {
      this.root.ui.setStep('connect');
      this.root.ui.setFlashMessage(`Removed ${keyToRemove}. Connect another repository to continue.`);
      this.root.ui.addNotification(`Removed ${keyToRemove}. Connect another repository to continue.`, 'Repository removed', 'success');
    }

    return wasActive;
  }

  setActiveRepository(repository, { notify = true, verb = 'Connected' } = {}) {
    const nextRepo = { owner: repository?.owner ?? '', name: repository?.name ?? '' };
    this.root.stopLeaderboardSubscription();
    this.root.stopQuestSubscription();
    this.repo = nextRepo;
    this.addRepository(nextRepo);
    this.resetRepositoryData();
    this.root.ui.setStep('dashboard');

    if (notify && this.repoKeyString) {
      this.root.ui.setFlashMessage(`${verb} ${this.repoKeyString}`);
      this.root.ui.addNotification(`${verb} ${this.repoKeyString}`, `Repository ${verb.toLowerCase()}`);
    }
  }

  hydrateWorkspace({ repositories = [], activeRepoKey = '' } = {}) {
    const cleanRepositories = uniqueRepositories(repositories);
    const activeRepository =
      cleanRepositories.find((repository) => makeRepositoryKey(repository) === activeRepoKey) ?? cleanRepositories[0] ?? {
        owner: '',
        name: '',
      };

    this.root.stopLeaderboardSubscription();
    this.root.stopQuestSubscription();
    this.repositories = cleanRepositories;
    this.repo = { owner: activeRepository.owner || '', name: activeRepository.name || '' };
    this.resetRepositoryData();

    if (this.repoKeyString) {
      this.root.ui.setStep('dashboard');
      this.root.ui.setFlashMessage(`Restored workspace for ${this.repoKeyString}. Press Sync to refresh GitHub data.`);
    } else if (this.root.ui.step !== 'login') {
      this.root.ui.setStep('connect');
      this.root.ui.setFlashMessage('No saved repositories yet. Connect a repository to start.');
    }
  }

  resetRepositoryData() {
    this.hero = new HeroModel({ scoreRules: this.scoreRules });
    this.repoStats = { mergedPRs: 0 };
    this.connectError = '';
    this.syncStatus = 'idle';
    this.lastSyncedAt = '';
    this.clearSyncErrors();
    this.root.leaderboardStore.resetRows();
    this.root.requestsStore.resetForRepository();
  }

  setSyncStatus(status) {
    this.syncStatus = status;
  }

  setSyncError(message = '', { source = 'manual' } = {}) {
    const nextMessage = message || '';

    if (source === 'background') {
      this.backgroundSyncError = nextMessage;
      return;
    }

    this.manualSyncError = nextMessage;
    if (nextMessage) {
      this.syncStatus = 'error';
    }
  }

  clearSyncErrors() {
    this.manualSyncError = '';
    this.backgroundSyncError = '';
    this.root.ui.clearSyncError();
  }

  setHeroActivity(activity) {
    this.hero = HeroModel.fromActivity(activity, this.scoreRules);
  }

  setRepoStats(stats) {
    this.repoStats = {
      mergedPRs: Number(stats?.mergedPRs ?? 0),
      commits: Number(stats?.commits ?? 0),
      reviews: Number(stats?.reviews ?? 0),
    };
  }

  setScoreRules(rules) {
    this.scoreRules = normalizeScoreRules(rules);
    this.hero = HeroModel.fromActivity(this.hero, this.scoreRules);
  }

  setLastSyncedAt(value) {
    this.lastSyncedAt = value || '';
  }

  markSyncStarted(repoKey = this.repoKeyString) {
    if (!repoKey) return;
    this.lastSyncStartedAtByRepo = {
      ...this.lastSyncStartedAtByRepo,
      [repoKey]: Date.now(),
    };
  }

  markRepositoryActionStarted() {
    this.lastRepositoryActionAt = Date.now();
  }

  reset() {
    this.repo = { owner: '', name: '' };
    this.repoStats = { mergedPRs: 0 };
    this.repositories = [];
    this.repositoryInput = '';
    this.recentRepositories = [];
    this.recentLoading = false;
    this.connectError = '';
    this.syncStatus = 'idle';
    this.lastSyncedAt = '';
    this.lastSyncStartedAtByRepo = {};
    this.lastRepositoryActionAt = 0;
    this.manualSyncError = '';
    this.backgroundSyncError = '';
    this.scoreRules = DEFAULT_SCORE_RULES;
    this.hero = new HeroModel({ scoreRules: DEFAULT_SCORE_RULES });
  }
}

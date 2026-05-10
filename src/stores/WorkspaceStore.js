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
  mergedPullRequests = [];
  mergedPullRequestsSyncedAtMs = 0;
  repositoryContributors = [];
  repositoryContributorsSyncedAtMs = 0;
  repositoryContributorsLoading = false;
  repositories = [];
  repositoryInput = '';
  recentRepositories = [];
  recentLoading = false;
  connectError = '';
  syncStatus = 'idle';
  lastSyncedAt = '';
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


  get canSyncActiveRepository() {
    return Boolean(this.repoKeyString) && !this.root.ui.isLoading;
  }


  get canChangeRepository() {
    return !this.root.ui.isLoading;
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

    if (this.repositories.length <= 1) {
      this.root.ui.setFlashMessage('Keep at least one repository connected. Add another repository before removing this one.');
      return false;
    }

    const wasActive = this.activeRepoKey === keyToRemove;
    const removedRepo = this.repositories.find((repo) => makeRepositoryKey(repo) === keyToRemove);
    this.repositories = this.repositories.filter((repo) => makeRepositoryKey(repo) !== keyToRemove);


    if (!removedRepo) return false;

    if (!wasActive) {
      this.root.ui.addNotification('Repository removed successfully.', 'Repository removed', 'success');
      return false;
    }

    this.root.stopLeaderboardSubscription();
    this.root.stopRequestSubscription();
    const nextRepo = this.repositories[0] ?? { owner: '', name: '' };
    this.repo = nextRepo;
    this.resetRepositoryData();

    if (this.repoKeyString) {
      this.root.ui.addNotification('Repository removed successfully.', 'Repository removed', 'success');
    } else {
      this.root.ui.setStep('connect');
      this.root.ui.addNotification('Connect another repository to continue.', 'Repository removed', 'success');
    }

    return wasActive;
  }


  updateActiveRepositoryMetadata(metadata = {}) {
    if (!this.repoKeyString) return;
    const nextRepo = {
      ...this.repo,
      ...(metadata.createdAt ? { createdAt: metadata.createdAt } : {}),
    };
    this.repo = nextRepo;
    this.repositories = uniqueRepositories(this.repositories.map((repository) => (
      makeRepositoryKey(repository) === this.repoKeyString ? { ...repository, ...nextRepo } : repository
    )));
  }

  setActiveRepository(repository, { notify = true, verb = 'Connected', navigate = true } = {}) {
    const nextRepo = {
      owner: repository?.owner ?? '',
      name: repository?.name ?? '',
      ...(repository?.createdAt ? { createdAt: repository.createdAt } : {}),
    };
    this.root.stopLeaderboardSubscription();
    this.root.stopRequestSubscription();
    this.repo = nextRepo;
    this.addRepository(nextRepo);
    this.resetRepositoryData();
    if (navigate) this.root.ui.setStep('dashboard');

    if (notify && this.repoKeyString) {
      this.root.ui.addNotification(`${verb} successfully.`, `Repository ${verb.toLowerCase()}`, 'success');
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
    this.root.stopRequestSubscription();
    this.repositories = cleanRepositories;
    this.repo = {
      owner: activeRepository.owner || '',
      name: activeRepository.name || '',
      ...(activeRepository.createdAt ? { createdAt: activeRepository.createdAt } : {}),
    };
    this.resetRepositoryData();

    if (this.repoKeyString) {
      this.root.ui.setStep('dashboard');
      this.root.ui.setFlashMessage('Workspace restored.');
    } else if (this.root.ui.step !== 'login') {
      this.root.ui.setStep('connect');
      this.root.ui.setFlashMessage('No saved repositories yet. Connect a repository to start.');
    }
  }

  resetRepositoryData() {
    this.hero = new HeroModel({ scoreRules: this.scoreRules });
    this.repoStats = { mergedPRs: 0 };
    this.mergedPullRequests = [];
    this.mergedPullRequestsSyncedAtMs = 0;
    this.repositoryContributors = [];
    this.repositoryContributorsSyncedAtMs = 0;
    this.repositoryContributorsLoading = false;
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

  setMergedPullRequests(items = [], syncedAtMs = Date.now()) {
    this.mergedPullRequests = Array.isArray(items) ? items : [];
    this.mergedPullRequestsSyncedAtMs = Number(syncedAtMs ?? 0);
  }

  setRepositoryContributors(items = [], syncedAtMs = Date.now()) {
    this.repositoryContributors = Array.isArray(items) ? items : [];
    this.repositoryContributorsSyncedAtMs = Number(syncedAtMs ?? 0);
  }

  setRepositoryContributorsLoading(value) {
    this.repositoryContributorsLoading = Boolean(value);
  }

  setScoreRules(rules) {
    this.scoreRules = normalizeScoreRules(rules);
    this.hero = HeroModel.fromActivity(this.hero, this.scoreRules);
  }

  setLastSyncedAt(value) {
    this.lastSyncedAt = value || '';
  }


  reset() {
    this.repo = { owner: '', name: '' };
    this.repoStats = { mergedPRs: 0 };
    this.mergedPullRequests = [];
    this.mergedPullRequestsSyncedAtMs = 0;
    this.repositoryContributors = [];
    this.repositoryContributorsSyncedAtMs = 0;
    this.repositoryContributorsLoading = false;
    this.repositories = [];
    this.repositoryInput = '';
    this.recentRepositories = [];
    this.recentLoading = false;
    this.connectError = '';
    this.syncStatus = 'idle';
    this.lastSyncedAt = '';
    this.manualSyncError = '';
    this.backgroundSyncError = '';
    this.scoreRules = DEFAULT_SCORE_RULES;
    this.hero = new HeroModel({ scoreRules: DEFAULT_SCORE_RULES });
  }
}

import { getRepositories, getRepository, getRepoStats, getRequestMetricValues, getUserProfile, explainGitHubError } from '../services/githubApi.js';
import {
  getScoreRulesForRepo,
  getWorkspace,
  isFirebaseConfigured,
  saveScoreRulesForRepo,
  saveUserData,
  saveWorkspace,
  saveUserProgress,
} from '../services/firebaseService.js';
import { DEFAULT_SCORE_RULES, calculateXp, normalizeScoreRules } from '../models/scoreRules.js';

function parseRepository(input) {
  const raw = String(input ?? '').trim().replace(/\.git$/i, '');
  if (!raw) return { owner: '', name: '' };

  const urlMatch = raw.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (urlMatch) return { owner: urlMatch[1], name: urlMatch[2] };

  const parts = raw.split('/');
  if (parts.length >= 2) return { owner: parts[0], name: parts[1] };
  return { owner: '', name: raw };
}



function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function lastSevenDayRange(now = new Date()) {
  const end = new Date(now);
  const start = new Date(now);
  start.setDate(start.getDate() - 6);
  return {
    since: start.toISOString().slice(0, 10),
    until: end.toISOString().slice(0, 10),
  };
}

function formatRepositoryRows(repos) {
  return (Array.isArray(repos) ? repos : []).slice(0, 8).map((repo) => ({
    name: repo.full_name || `${repo.owner?.login ?? ''}/${repo.name}`,
    date: repo.updated_at ? `Updated ${new Date(repo.updated_at).toLocaleDateString()}` : '',
  }));
}

export class RepositoryController {
  constructor(store, { leaderboardController, questController } = {}) {
    this.store = store;
    this.leaderboardController = leaderboardController;
    this.questController = questController;
  }

  getWorkspaceOwner() {
    const username = this.store.profile.username?.trim();
    return {
      uid: this.store.profile.uid || '',
      username: username && username !== 'octo.team.member' ? username : '',
    };
  }

  canPersistWorkspace() {
    if (!isFirebaseConfigured()) return false;
    const owner = this.getWorkspaceOwner();
    return Boolean(owner.uid || owner.username);
  }

  async persistWorkspace() {
    if (!this.canPersistWorkspace()) return;

    try {
      await saveWorkspace({
        ...this.getWorkspaceOwner(),
        repositories: this.store.repositories,
        activeRepoKey: this.store.activeRepoKey,
      });
    } catch (error) {
      this.store.addNotification(
        `Workspace could not be saved: ${error?.message ?? 'unknown'}`,
        'Workspace save failed',
        'error',
      );
    }
  }

  async restoreWorkspace({ silent = false } = {}) {
    if (!this.canPersistWorkspace()) return false;

    try {
      const workspace = await getWorkspace(this.getWorkspaceOwner());
      if (!workspace.repositories?.length) return false;

      this.store.hydrateWorkspace(workspace);
      await this.loadRepositoryScopedSettings();
      this.leaderboardController?.startForActiveRepository();
      this.questController?.startForActiveRepository();

      if (!silent) {
        this.store.addNotification(
          `Restored ${workspace.repositories.length} saved repositories.`,
          'Workspace restored',
          'success',
        );
      }
      return true;
    } catch (error) {
      this.store.addNotification(
        `Saved workspace could not be loaded: ${error?.message ?? 'unknown'}`,
        'Workspace restore failed',
        'error',
      );
      return false;
    }
  }

  async validateProfileAndContinue() {
    const username = this.store.profile.username?.trim();
    if (!username) throw new Error('Enter a GitHub username.');
    await getUserProfile(username);
    this.store.setProfileUsername(username);
    this.store.setStep('connect');
  }

  async loadRecentRepositories() {
    const username = this.store.profile.username?.trim();
    if (!username || username === 'octo.team.member') {
      this.store.setRecentRepositories([]);
      return;
    }

    this.store.setRecentLoading(true);
    try {
      const repos = await getRepositories(username);
      this.store.setRecentRepositories(formatRepositoryRows(repos));
    } catch (error) {
      this.store.setRecentRepositories([]);
      this.store.setConnectError(explainGitHubError(error));
    } finally {
      this.store.setRecentLoading(false);
    }
  }

  fillSampleRepository() {
    this.store.setRepositoryInput('https://github.com/kth-media-lab/github-hero-quest');
    this.store.setFlashMessage('Sample repository filled. Click Validate and connect to sync it.');
  }

  async connectSampleRepository() {
    this.store.setRepositoryInput('https://github.com/kth-media-lab/github-hero-quest');
    await this.connectRepositoryFromInput();
  }

  selectRecentRepository(repoName) {
    this.store.setRepositoryInput(repoName);
    this.store.setFlashMessage(`Selected ${repoName}. Click Validate and connect to sync it.`);
  }

  async connectRecentRepository(repoName) {
    this.store.setRepositoryInput(repoName);
    await this.connectRepositoryFromInput();
  }

  async removeRepository(repoKey) {
    const wasActive = this.store.removeRepository(repoKey);
    await this.persistWorkspace();

    if (wasActive && this.store.repoKeyString) {
      await this.loadRepositoryScopedSettings();
      this.leaderboardController?.startForActiveRepository();
      this.questController?.startForActiveRepository();
    }
  }

  async connectRepositoryFromInput() {
    if (!this.store.canChangeRepository) {
      const seconds = Math.ceil(this.store.repositoryActionCooldownRemainingMs / 1000);
      const message = `Please wait ${seconds}s before connecting or switching repositories again.`;
      this.store.setFlashMessage(message);
      this.store.addNotification(message, 'Repository cooldown', 'info');
      return;
    }

    const parsed = parseRepository(this.store.repositoryInput);
    if (!parsed.owner || !parsed.name) {
      this.store.setConnectError('Use owner/repo or a full GitHub repository URL.');
      return;
    }

    this.store.setLoading({ isLoading: true, phase: 'Checking repository access...' });
    this.store.setSyncStatus('checking');
    this.store.setConnectError('');

    try {
      await getRepository(parsed.owner, parsed.name);

      this.store.setActiveRepository(parsed, { notify: false });
      this.store.markRepositoryActionStarted();
      await this.persistWorkspace();
      await this.loadRepositoryScopedSettings();

      this.leaderboardController?.startForActiveRepository();
      this.questController?.startForActiveRepository();

      this.store.clearSyncErrors();
      this.store.setSyncStatus('idle');
      this.store.setLoading({ isLoading: false, phase: '' });

      this.store.setFlashMessage(`Connected ${this.store.repoKeyString}. Loading saved team data.`);
      this.store.addNotification(
        `Connected ${this.store.repoKeyString}. Loading saved team data.`,
        'Repository connected',
        'success',
      );

      await delay(1200);
      await this.backgroundSyncActiveRepository();
    } catch (error) {
      const message = explainGitHubError(error);
      this.store.setConnectError(message);
      this.store.setSyncError(message, { source: 'manual' });
      this.store.addNotification(message, 'Repository connection failed', 'error');
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }

  async switchActiveRepository(repoKey) {
    if (!this.store.canChangeRepository) {
      const seconds = Math.ceil(this.store.repositoryActionCooldownRemainingMs / 1000);
      const message = `Please wait ${seconds}s before switching repositories again.`;
      this.store.setFlashMessage(message);
      this.store.addNotification(message, 'Repository switch cooldown', 'info');
      return;
    }

    const selected = this.store.repositories.find((repo) => `${repo.owner}/${repo.name}` === repoKey);
    if (!selected) return;
    if (this.store.activeRepoKey === repoKey) {
      this.store.addNotification('This repository is already active.', 'Repository unchanged');
      return;
    }

    this.store.setActiveRepository(selected, { notify: false });
    this.store.markRepositoryActionStarted();
    await this.persistWorkspace();
    await this.loadRepositoryScopedSettings();

    this.leaderboardController?.startForActiveRepository();
    this.questController?.startForActiveRepository();

    this.store.clearSyncErrors();
    this.store.setSyncStatus('idle');
    this.store.setFlashMessage(`Switched to ${this.store.repoKeyString}. Loading saved team data.`);
    this.store.addNotification(
      `Switched to ${this.store.repoKeyString}. Loading saved team data.`,
      'Repository switched',
      'info',
    );

    await delay(1200);
    await this.backgroundSyncActiveRepository();
  }

  async loadRepositoryScopedSettings() {
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return;
    try {
      const rules = await getScoreRulesForRepo(this.store.repoKeyString);
      this.store.setScoreRules(normalizeScoreRules(rules || DEFAULT_SCORE_RULES));
    } catch (error) {
      this.store.addNotification(`XP rules could not load: ${error?.message ?? 'unknown'}`, 'XP rules warning', 'error');
    }
  }

  async loadScoreRulesForRepo(repoKey) {
    if (!repoKey) return normalizeScoreRules(this.store.scoreRules);
    if (!isFirebaseConfigured()) return normalizeScoreRules(this.store.activeRepoKey === repoKey ? this.store.scoreRules : DEFAULT_SCORE_RULES);

    try {
      const rules = await getScoreRulesForRepo(repoKey);
      return normalizeScoreRules(rules || DEFAULT_SCORE_RULES);
    } catch (error) {
      this.store.addNotification(`XP rules could not load: ${error?.message ?? 'unknown'}`, 'XP rules warning', 'error');
      return normalizeScoreRules(DEFAULT_SCORE_RULES);
    }
  }

  async saveScoreRules(rules, repoKey = this.store.activeRepoKey) {
    const nextRules = normalizeScoreRules(rules);
    const targetRepoKey = repoKey || this.store.activeRepoKey;
    if (targetRepoKey === this.store.activeRepoKey) {
      this.store.setScoreRules(nextRules);
    }
    if (isFirebaseConfigured() && targetRepoKey) {
      await saveScoreRulesForRepo({ repoKey: targetRepoKey, scoreRules: nextRules });
    }
    this.store.addNotification(`XP rules updated for ${targetRepoKey || 'this repository'}.`, 'XP rules saved', 'success');
    this.store.setFlashMessage(`XP rules updated for ${targetRepoKey || 'this repository'}.`);
  }

  async backgroundSyncActiveRepository() {
    if (!this.store.repo?.owner || !this.store.repo?.name) return;

    if (!this.store.canSyncActiveRepository) {
      const seconds = Math.ceil(this.store.syncCooldownRemainingMs / 1000);
      this.store.addNotification(
        `Using saved team data. GitHub sync will be available in ${seconds}s.`,
        'Repository updated',
        'info',
      );
      return;
    }

    try {
      await this.syncActiveRepository({ source: 'background' });
    } catch {
      // Background sync failures are handled inside syncActiveRepository.
    }
  }

  async syncActiveRepository({ force = false, source = 'manual' } = {}) {
    if (!this.store.repo.owner || !this.store.repo.name) {
      const message = 'Please connect a repository before syncing.';
      this.store.setSyncError(message, { source });
      this.store.addNotification(message, 'Sync failed', 'error');
      if (source === 'manual') this.store.setStep('connect');
      return;
    }

    if (!force && !this.store.canSyncActiveRepository) {
      const seconds = Math.ceil(this.store.syncCooldownRemainingMs / 1000);
      const message = `Please wait ${seconds}s before syncing this repository again.`;
      if (source === 'manual') {
        this.store.setFlashMessage(message);
        this.store.openNotifications();
      }
      this.store.addNotification(message, 'Sync cooldown', 'info');
      return;
    }

    this.store.markSyncStarted();
    this.store.setLoading({ isLoading: true, phase: 'Syncing GitHub contribution data...' });
    this.store.setSyncStatus('syncing');
    this.store.setSyncError('', { source });

    try {
      const stats = await getRepoStats(this.store.repo.owner, this.store.repo.name, this.store.profile.username);
      const weeklyStats = await getRepoStats(
        this.store.repo.owner,
        this.store.repo.name,
        this.store.profile.username,
        lastSevenDayRange(),
      );
      this.store.setRepoStats(stats.repo);

      if (this.store.requests.length > 0) {
        const requestMetricProgress = await getRequestMetricValues(
          this.store.repo.owner,
          this.store.repo.name,
          this.store.profile.username,
          this.store.requests,
        );
        this.store.setRequestMetricValues(requestMetricProgress.valuesById, requestMetricProgress.contributionsById);
      } else {
        this.store.setRequestMetricValues({}, {});
      }

      this.store.setHeroActivity({ ...stats.user, questBonusXp: this.store.completedRequestBonusXp });
      this.store.setLastSyncedAt(new Date().toLocaleString());
      this.store.setSyncStatus('saving');
      this.store.setLoading({ isLoading: true, phase: 'Saving leaderboard progress...' });

      if (isFirebaseConfigured()) {
        await saveUserProgress({
          username: this.store.profile.username,
          repoKey: this.store.repoKeyString,
          xp: this.store.hero.xp,
          weeklyXp: calculateXp(weeklyStats.user, this.store.scoreRules),
          level: this.store.hero.level,
          commits: this.store.hero.commits,
          mergedPRs: this.store.hero.mergedPRs,
          openPRs: this.store.hero.openPRs,
          reviews: this.store.hero.reviews,
          requestBonusXp: this.store.hero.questBonusXp,
          displayName: this.store.profile.displayName || this.store.profile.username,
        });
        await saveUserData({
          username: this.store.profile.username,
          displayName: this.store.profile.displayName || this.store.profile.username,
          avatarUrl: this.store.profile.avatarUrl,
          lastRepoKey: this.store.repoKeyString,
        });
      }

      this.store.setSyncStatus('synced');
      this.store.setFlashMessage('Synced GitHub contribution data and updated the leaderboard.');
      this.store.addNotification('GitHub contribution data synced successfully.', 'Sync complete', 'success');
    } catch (error) {
      const message = explainGitHubError(error);
      this.store.setSyncError(message, { source });

      if (source === 'manual') {
        this.store.openNotifications();
        this.store.addNotification(message, 'Sync failed', 'error');
      } else {
        this.store.setSyncStatus('idle');
        this.store.addNotification(
          `${message} Showing saved team data instead.`,
          'Background sync skipped',
          'info',
        );
      }
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }
}

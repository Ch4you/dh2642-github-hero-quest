import { getRepositories, getRepository, getRepoStats, getUserProfile, explainGitHubError, getMergedPullRequestDetails } from '../services/githubApi.js';
import {
  getScoreRulesForRepo,
  getWorkspace,
  isFirebaseConfigured,
  saveScoreRulesForRepo,
  getMergedPullRequestDetailsForRepo,
  saveMergedPullRequestDetailsForRepo,
  saveUserData,
  saveWorkspace,
  saveUserProgress,
} from '../services/firebaseService.js';
import { DEFAULT_SCORE_RULES, calculateXp, normalizeScoreRules } from '../models/scoreRules.js';

const CACHE_TTL_MS = 60_000;

function isFresh(timestampMs, ttlMs = CACHE_TTL_MS) {
  return Number.isFinite(Number(timestampMs)) && Date.now() - Number(timestampMs) < ttlMs;
}

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
  return (Array.isArray(repos) ? repos : []).map((repo) => ({
    name: repo.full_name || `${repo.owner?.login ?? ''}/${repo.name}`,
    date: repo.updated_at ? `Updated ${new Date(repo.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : '',
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
      await this.backgroundSyncActiveRepository();
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

  getCurrentUserLeaderboardRow() {
    const username = this.store.profile.username;
    return this.store.leaderboard.find((row) => row.username === username) ?? null;
  }

  applyAllTimeRowToStore(row) {
    if (!row) return;
    this.store.setHeroActivity({
      commits: row.commits,
      mergedPRs: row.mergedPRs,
      openPRs: row.openPRs,
      reviews: row.reviews,
      questBonusXp: this.store.completedRequestBonusXp || row.requestBonusXp || 0,
    });
  }

  async showSilentSpinner(phase = 'Refreshing saved data...') {
    this.store.setLoading({ isLoading: true, phase });
    await delay(250);
    this.store.setLoading({ isLoading: false, phase: '' });
  }

  async saveAllTimeProgressFromActivity(activity, syncedAtMs = Date.now()) {
    this.store.setHeroActivity({ ...activity, questBonusXp: this.store.completedRequestBonusXp });
    this.store.setLastSyncedAt(new Date(syncedAtMs).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }));

    if (!isFirebaseConfigured()) return;

    await saveUserProgress({
      username: this.store.profile.username,
      repoKey: this.store.repoKeyString,
      xp: this.store.hero.xp,
      level: this.store.hero.level,
      commits: this.store.hero.commits,
      mergedPRs: this.store.hero.mergedPRs,
      openPRs: this.store.hero.openPRs,
      reviews: this.store.hero.reviews,
      requestBonusXp: this.store.hero.questBonusXp,
      allTimeSyncedAtMs: syncedAtMs,
      displayName: this.store.profile.displayName || this.store.profile.username,
    });

    await saveUserData({
      username: this.store.profile.username,
      displayName: this.store.profile.displayName || this.store.profile.username,
      avatarUrl: this.store.profile.avatarUrl,
      lastRepoKey: this.store.repoKeyString,
    });
  }

  canStartGitHubSync({ force = false, source = 'manual' } = {}) {
    if (force) return true;
    if (this.store.canSyncActiveRepository) return true;

    if (source === 'manual') {
      const seconds = Math.ceil(this.store.syncCooldownRemainingMs / 1000);
      const message = `Please wait ${seconds}s before syncing this repository again.`;
      this.store.setFlashMessage(message);
      this.store.openNotifications();
      this.store.addNotification(message, 'Sync cooldown', 'info');
    }
    return false;
  }

  handleSyncError(error, { source = 'manual' } = {}) {
    const message = explainGitHubError(error);
    this.store.setSyncError(message, { source });
    this.store.setSyncStatus('idle');

    if (source === 'manual') {
      this.store.openNotifications();
      this.store.addNotification(message, 'Sync failed', 'error');
    }
  }

  async syncCurrentPage(options = {}) {
    if (this.store.step === 'leaderboard') {
      if (this.store.leaderboardFilter === 'Last 7 days') {
        return this.syncWeeklyLeaderboardForActiveRepository(options);
      }
      return this.syncAllTimeLeaderboard(options);
    }

    if (this.store.step === 'quests') {
      return this.syncRequestMetrics(options);
    }

    return this.syncDashboardData(options);
  }

  async backgroundSyncActiveRepository() {
    if (!this.store.repo?.owner || !this.store.repo?.name) return;
    if (!this.store.canSyncActiveRepository) return;
    try {
      await this.syncDashboardData({ source: 'background', onlyIfMissing: true });
    } catch {
      // Background sync failures are handled inside syncDashboardData.
    }
  }

  async syncDashboardData({ force = false, source = 'manual', onlyIfMissing = false } = {}) {
    if (!this.store.repo.owner || !this.store.repo.name) {
      const message = 'Please connect a repository before syncing.';
      this.store.setSyncError(message, { source });
      if (source === 'manual') {
        this.store.addNotification(message, 'Sync failed', 'error');
        this.store.setStep('connect');
      }
      return false;
    }

    const currentRow = this.getCurrentUserLeaderboardRow();
    const hasAllTimeCache = Boolean(currentRow) && Number.isFinite(Number(currentRow?.xp));
    const allTimeFresh = isFresh(currentRow?.allTimeSyncedAtMs);
    const requestCacheLoaded = await this.questController?.loadCachedRequestMetrics?.();
    const hasActiveRequests = this.store.requests.some((request) => !request.archived);
    const hasRequestCache = !hasActiveRequests || (requestCacheLoaded && Number(this.store.requestMetricsSyncedAtMs) > 0);
    const requestsFresh = !hasActiveRequests || (requestCacheLoaded && isFresh(this.store.requestMetricsSyncedAtMs));

    if (!force && allTimeFresh && requestsFresh) {
      this.applyAllTimeRowToStore(currentRow);
      await this.showSilentSpinner('Refreshing saved dashboard data...');
      return true;
    }

    // Background refresh after connect/switch should only request GitHub when no cached data exists.
    // If cached data exists but is older than the one-minute freshness window, keep showing it
    // until the user explicitly clicks Sync.
    if (!force && onlyIfMissing && hasAllTimeCache && hasRequestCache) {
      this.applyAllTimeRowToStore(currentRow);
      await this.showSilentSpinner('Loading saved dashboard data...');
      return true;
    }

    if (!this.canStartGitHubSync({ force, source })) return false;

    const syncRepoKey = this.store.repoKeyString;
    this.store.markSyncStarted();
    this.store.setLoading({ isLoading: true, phase: 'Syncing dashboard data...' });
    this.store.setSyncStatus('syncing');
    this.store.setSyncError('', { source });

    try {
      if (!requestsFresh && (!onlyIfMissing || !hasRequestCache)) {
        await this.questController?.refreshRequestMetrics?.({ force: true });
      }

      if (!allTimeFresh && (!onlyIfMissing || !hasAllTimeCache)) {
        const stats = await getRepoStats(
          this.store.repo.owner,
          this.store.repo.name,
          this.store.profile.username,
        );
        if (this.store.repoKeyString !== syncRepoKey) return false;
        this.store.setRepoStats(stats.repo);
        await this.saveAllTimeProgressFromActivity(stats.user, Date.now());
      } else {
        this.applyAllTimeRowToStore(currentRow);
        await this.saveAllTimeProgressFromActivity(
          {
            commits: currentRow.commits,
            mergedPRs: currentRow.mergedPRs,
            openPRs: currentRow.openPRs,
            reviews: currentRow.reviews,
          },
          currentRow.allTimeSyncedAtMs,
        );
      }

      this.store.setSyncStatus('synced');
      if (source === 'manual') {
        this.store.setFlashMessage('Dashboard data synced.');
        this.store.addNotification('Dashboard data synced successfully.', 'Sync complete', 'success');
      }
      return true;
    } catch (error) {
      this.handleSyncError(error, { source });
      return false;
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }

  async syncAllTimeLeaderboard({ force = false, source = 'manual', onlyIfMissing = false } = {}) {
    const currentRow = this.getCurrentUserLeaderboardRow();
    const hasAllTimeCache = Boolean(currentRow) && Number.isFinite(Number(currentRow?.xp));

    if (!force && isFresh(currentRow?.allTimeSyncedAtMs)) {
      this.applyAllTimeRowToStore(currentRow);
      await this.showSilentSpinner('Refreshing saved all-time ranking...');
      return true;
    }

    if (!force && onlyIfMissing && hasAllTimeCache) {
      this.applyAllTimeRowToStore(currentRow);
      await this.showSilentSpinner('Loading saved all-time ranking...');
      return true;
    }

    if (!this.canStartGitHubSync({ force, source })) return false;

    const syncRepoKey = this.store.repoKeyString;
    this.store.markSyncStarted();
    this.store.setLoading({ isLoading: true, phase: 'Syncing all-time ranking...' });
    this.store.setSyncStatus('syncing');
    this.store.setSyncError('', { source });

    try {
      const stats = await getRepoStats(
        this.store.repo.owner,
        this.store.repo.name,
        this.store.profile.username,
      );
      if (this.store.repoKeyString !== syncRepoKey) return false;
      this.store.setRepoStats(stats.repo);
      await this.saveAllTimeProgressFromActivity(stats.user, Date.now());
      this.store.setSyncStatus('synced');
      if (source === 'manual') {
        this.store.setFlashMessage('All-time ranking synced.');
        this.store.addNotification('All-time ranking synced successfully.', 'Sync complete', 'success');
      }
      return true;
    } catch (error) {
      this.handleSyncError(error, { source });
      return false;
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }

  async syncWeeklyLeaderboardForActiveRepository({ force = false, source = 'manual', onlyIfMissing = false } = {}) {
    const range = lastSevenDayRange();
    const currentRow = this.getCurrentUserLeaderboardRow();
    const weeklyRangeMatches = currentRow?.weeklyRangeStart === range.since && currentRow?.weeklyRangeEnd === range.until;
    const hasWeeklyCache = weeklyRangeMatches && Number.isFinite(Number(currentRow?.weeklyXp));
    const weeklyFresh = weeklyRangeMatches && isFresh(currentRow?.weeklySyncedAtMs);

    if (!force && weeklyFresh) {
      await this.showSilentSpinner('Refreshing saved weekly ranking...');
      return true;
    }

    if (!force && onlyIfMissing && hasWeeklyCache) {
      await this.showSilentSpinner('Loading saved weekly ranking...');
      return true;
    }

    if (!this.canStartGitHubSync({ force, source })) return false;

    const syncRepoKey = this.store.repoKeyString;
    this.store.markSyncStarted();
    this.store.setLoading({ isLoading: true, phase: 'Loading Last 7 days ranking...' });
    this.store.setSyncStatus('syncing');
    this.store.setSyncError('', { source });

    try {
      const weeklyStats = await getRepoStats(
        this.store.repo.owner,
        this.store.repo.name,
        this.store.profile.username,
        range,
      );
      if (this.store.repoKeyString !== syncRepoKey) return false;

      if (isFirebaseConfigured()) {
        await saveUserProgress({
          username: this.store.profile.username,
          repoKey: this.store.repoKeyString,
          displayName: this.store.profile.displayName || this.store.profile.username,
          weeklyXp: calculateXp(weeklyStats.user, this.store.scoreRules),
          weeklyCommits: weeklyStats.user.commits,
          weeklyMergedPRs: weeklyStats.user.mergedPRs,
          weeklyOpenPRs: weeklyStats.user.openPRs,
          weeklyReviews: weeklyStats.user.reviews,
          weeklyRangeStart: range.since,
          weeklyRangeEnd: range.until,
          weeklySyncedAtMs: Date.now(),
        });
      }

      this.store.setSyncStatus('synced');
      if (source === 'manual') {
        this.store.setFlashMessage('Last 7 days ranking synced.');
        this.store.addNotification('Last 7 days ranking synced successfully.', 'Sync complete', 'success');
      }
      return true;
    } catch (error) {
      this.handleSyncError(error, { source });
      return false;
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }

  async syncRequestMetrics({ force = false, source = 'manual' } = {}) {
    if (!force && isFresh(this.store.requestMetricsSyncedAtMs)) {
      await this.showSilentSpinner('Refreshing saved goal progress...');
      return true;
    }

    const loadedCached = await this.questController?.loadCachedRequestMetrics?.();
    if (!force && loadedCached && isFresh(this.store.requestMetricsSyncedAtMs)) {
      await this.showSilentSpinner('Refreshing saved goal progress...');
      return true;
    }

    if (!this.canStartGitHubSync({ force, source })) return false;

    this.store.markSyncStarted();
    this.store.setLoading({ isLoading: true, phase: 'Syncing goal progress...' });
    this.store.setSyncStatus('syncing');
    this.store.setSyncError('', { source });

    try {
      const ok = await this.questController?.refreshRequestMetrics?.({ force: true });
      if (!ok) return false;
      this.store.setSyncStatus('synced');
      if (source === 'manual') {
        this.store.setFlashMessage('Goal progress synced.');
        this.store.addNotification('Goal progress synced successfully.', 'Sync complete', 'success');
      }
      return true;
    } catch (error) {
      this.handleSyncError(error, { source });
      return false;
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }


  async loadMergedPullRequestDetails({ force = false } = {}) {
    if (!this.store.repo?.owner || !this.store.repo?.name) return false;

    if (!force && isFresh(this.store.mergedPullRequestsSyncedAtMs)) {
      await this.showSilentSpinner('Loading saved merged pull requests...');
      return true;
    }

    if (!force && isFirebaseConfigured()) {
      try {
        const cached = await getMergedPullRequestDetailsForRepo(this.store.repoKeyString);
        if (cached?.items?.length) {
          this.store.setMergedPullRequests(cached.items, cached.syncedAtMs);
          if (isFresh(cached.syncedAtMs)) {
            await this.showSilentSpinner('Loading saved merged pull requests...');
            return true;
          }
        }
      } catch (error) {
        this.store.addNotification(
          `Saved merged PR details could not load: ${error?.message ?? 'unknown'}`,
          'Merged PR details warning',
          'error',
        );
      }
    }

    if (!this.canStartGitHubSync({ force, source: 'manual' })) return false;

    const syncRepoKey = this.store.repoKeyString;
    this.store.markSyncStarted();
    this.store.setLoading({ isLoading: true, phase: 'Loading merged pull requests...' });

    try {
      const items = await getMergedPullRequestDetails(this.store.repo.owner, this.store.repo.name, { limit: 10 });
      if (this.store.repoKeyString !== syncRepoKey) return false;
      const syncedAtMs = Date.now();
      this.store.setMergedPullRequests(items, syncedAtMs);

      if (isFirebaseConfigured()) {
        await saveMergedPullRequestDetailsForRepo({
          repoKey: this.store.repoKeyString,
          items,
          syncedAtMs,
        });
      }
      return true;
    } catch (error) {
      this.store.addNotification(explainGitHubError(error), 'Merged PR details failed', 'error');
      return false;
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }

  // Backwards-compatible method name used by older presenters.
  async syncActiveRepository(options = {}) {
    return this.syncCurrentPage(options);
  }
}

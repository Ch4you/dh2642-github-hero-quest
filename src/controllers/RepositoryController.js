import { getRepositories, getRepository, getRepoStats, getUserProfile, explainGitHubError, getMergedPullRequestDetails, getRepositoryContributors, isGitHubRateLimitError } from '../services/githubApi.js';
import {
  getScoreRulesForRepo,
  getWorkspace,
  isFirebaseConfigured,
  getMergedPullRequestDetailsForRepo,
  getRepositoryContributorsForRepo,
} from '../services/firebaseService.js';
import { DEFAULT_SCORE_RULES, calculateXp, normalizeScoreRules } from '../models/scoreRules.js';

const CACHE_TTL_MS = 10 * 60_000;
const RATE_LIMIT_FALLBACK_MS = 10 * 60_000;

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
    this.githubBlockedUntilMs = 0;
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
      await this.store.persistWorkspace(this.getWorkspaceOwner());
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
      const message = explainGitHubError(error);
      this.store.addNotification(
        `${message} You can still paste a public GitHub repository URL.`,
        'Recent repositories unavailable',
        'error',
      );
    } finally {
      this.store.setRecentLoading(false);
    }
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
    const parsed = parseRepository(this.store.repositoryInput);
    if (!parsed.owner || !parsed.name) {
      this.store.setConnectError('');
      this.store.addNotification('Use owner/repo or a full GitHub repository URL.', 'Repository required', 'error');
      return;
    }

    this.store.setLoading({ isLoading: true, phase: 'Checking repository access...' });
    this.store.setSyncStatus('checking');
    this.store.setConnectError('');

    try {
      const repositoryDetails = await getRepository(parsed.owner, parsed.name);

      this.store.setActiveRepository(
        { ...parsed, createdAt: repositoryDetails?.created_at || repositoryDetails?.createdAt || '' },
        { notify: false, navigate: true },
      );
      await this.persistWorkspace();
      await this.loadRepositoryScopedSettings();

      this.leaderboardController?.startForActiveRepository();
      this.questController?.startForActiveRepository();

      this.store.clearSyncErrors();
      this.store.setSyncStatus('idle');
      this.store.setLoading({ isLoading: false, phase: '' });

      this.store.addNotification('Connected successfully.', 'Repository connected', 'success');

      await this.backgroundSyncActiveRepository();
    } catch (error) {
      const message = explainGitHubError(error);
      this.store.setConnectError('');
      this.store.setSyncError(message, { source: 'manual' });
      this.store.addNotification(message, 'Repository connection failed', 'error');
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }

  async switchActiveRepository(repoKey) {
    const selected = this.store.repositories.find((repo) => `${repo.owner}/${repo.name}` === repoKey);
    if (!selected) return;
    if (this.store.activeRepoKey === repoKey) {
      this.store.addNotification('This repository is already active.', 'Repository unchanged');
      return;
    }

    this.store.setActiveRepository(selected, { notify: false, navigate: false });
    await this.persistWorkspace();
    await this.loadRepositoryScopedSettings();

    this.leaderboardController?.startForActiveRepository();
    this.questController?.startForActiveRepository();

    this.store.clearSyncErrors();
    this.store.setSyncStatus('idle');
    this.store.addNotification('Repository switched.', 'Repository switched', 'success');

    await this.backgroundSyncActiveRepository();
  }

  async loadRepositoryScopedSettings() {
    if (!this.store.repoKeyString) return;

    if (!this.store.repo.createdAt && this.store.repo.owner && this.store.repo.name) {
      try {
        const details = await getRepository(this.store.repo.owner, this.store.repo.name);
        this.store.updateActiveRepositoryMetadata({ createdAt: details?.created_at || details?.createdAt || '' });
        await this.persistWorkspace();
      } catch (error) {
        void error;
      }
    }

    if (!isFirebaseConfigured()) return;

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
    await this.store.persistScoreRules(targetRepoKey);
    this.store.addNotification('XP rules saved.', 'XP rules saved', 'success');
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

    await this.store.persistUserProgress({
      username: this.store.profile.username,
      displayName: this.store.profile.displayName || this.store.profile.username,
      syncedAtMs,
    });
  }


  canStartGitHubSync({ force = false, source = 'manual' } = {}) {
    const blocked = this.githubBlockedUntilMs > Date.now();

    if (blocked) {
      const message = 'GitHub rate limit reached. Showing saved data until GitHub allows more requests.';
      this.store.setSyncError(message, { source });
      if (source === 'manual') this.store.addNotification(message, 'Sync paused', 'error');
      return false;
    }

    if (force) return true;
    if (this.store.canSyncActiveRepository) return true;

    return false;
  }

  applyGitHubRateLimitBackoff(error) {
    if (!isGitHubRateLimitError(error)) return;
    const resetMs = Number(error?.rateLimitResetMs || 0);
    const fallbackMs = Date.now() + RATE_LIMIT_FALLBACK_MS;
    this.githubBlockedUntilMs = Math.max(this.githubBlockedUntilMs, resetMs || fallbackMs);
  }

  handleSyncError(error, { source = 'manual' } = {}) {
    this.applyGitHubRateLimitBackoff(error);
    const message = explainGitHubError(error);
    this.store.setSyncError(message, { source });
    this.store.setSyncStatus('idle');

    if (source === 'manual') {
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
      await this.loadRepositoryContributors();
      await this.syncDashboardData({ source: 'background', onlyIfMissing: true });
    } catch (error) {
      void error;
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

    if (!force && onlyIfMissing && hasAllTimeCache && hasRequestCache) {
      this.applyAllTimeRowToStore(currentRow);
      await this.showSilentSpinner('Loading saved dashboard data...');
      return true;
    }

    if (!this.canStartGitHubSync({ force, source })) return false;

    const syncRepoKey = this.store.repoKeyString;
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
        this.store.addNotification('Synced successfully.', 'Sync complete', 'success');
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
        this.store.addNotification('Synced successfully.', 'Sync complete', 'success');
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

      await this.store.persistWeeklyUserProgress({
        username: this.store.profile.username,
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

      this.store.setSyncStatus('synced');
      if (source === 'manual') {
        this.store.addNotification('Synced successfully.', 'Sync complete', 'success');
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

    this.store.setLoading({ isLoading: true, phase: 'Syncing goal progress...' });
    this.store.setSyncStatus('syncing');
    this.store.setSyncError('', { source });

    try {
      const ok = await this.questController?.refreshRequestMetrics?.({ force: true });
      if (!ok) return false;
      this.store.setSyncStatus('synced');
      if (source === 'manual') {
        this.store.addNotification('Synced successfully.', 'Sync complete', 'success');
      }
      return true;
    } catch (error) {
      this.handleSyncError(error, { source });
      return false;
    } finally {
      this.store.setLoading({ isLoading: false, phase: '' });
    }
  }



  async loadCachedRepositoryContributors(repoKey = this.store.repoKeyString) {
    if (!repoKey || !isFirebaseConfigured()) return null;

    try {
      const cached = await getRepositoryContributorsForRepo(repoKey);
      if (cached?.items?.length && this.store.repoKeyString === repoKey) {
        this.store.setRepositoryContributors(cached.items, cached.syncedAtMs);
      }
      return cached;
    } catch (error) {
      this.store.setRepositoryContributorsError(`Saved contributors could not load: ${error?.message ?? 'unknown'}`);
      return null;
    }
  }

  async loadRepositoryContributors({ force = false, source = 'background' } = {}) {
    if (!this.store.repo?.owner || !this.store.repo?.name) return false;

    const syncRepoKey = this.store.repoKeyString;
    const hasLocalCache = this.store.repositoryContributors.length > 0 && this.store.repositoryContributorsSyncedAtMs > 0;

    if (!force && hasLocalCache && isFresh(this.store.repositoryContributorsSyncedAtMs)) {
      this.store.setRepositoryContributorsError('');
      return true;
    }

    const cached = !force ? await this.loadCachedRepositoryContributors(syncRepoKey) : null;
    const hasFirebaseCache = Boolean(cached?.items?.length);

    if (!force && hasFirebaseCache && isFresh(cached.syncedAtMs)) {
      this.store.setRepositoryContributorsError('');
      return true;
    }

    if (this.store.repositoryContributorsLoading) return hasLocalCache || hasFirebaseCache;

    if (!this.canStartGitHubSync({ force, source })) {
      return hasLocalCache || hasFirebaseCache;
    }

    this.store.setRepositoryContributorsLoading(true);
    this.store.setRepositoryContributorsError('');

    try {
      const contributors = await getRepositoryContributors(this.store.repo.owner, this.store.repo.name, { limit: 100 });
      if (this.store.repoKeyString !== syncRepoKey) return false;

      const syncedAtMs = Date.now();
      this.store.setRepositoryContributors(contributors, syncedAtMs);

      await this.store.persistRepositoryContributors({
        repoKey: syncRepoKey,
        items: contributors,
        syncedAtMs,
      });

      return true;
    } catch (error) {
      this.applyGitHubRateLimitBackoff(error);
      const message = explainGitHubError(error);
      this.store.setRepositoryContributorsError(message);
      if (source === 'manual' || !hasLocalCache && !hasFirebaseCache) {
        this.store.addNotification(message, 'Contributor sync failed', 'error');
      }
      return hasLocalCache || hasFirebaseCache;
    } finally {
      if (this.store.repoKeyString === syncRepoKey) {
        this.store.setRepositoryContributorsLoading(false);
      }
    }
  }

  applyMergedPullRequestDetails({ items = [], totalCount, syncedAtMs } = {}) {
    const safeItems = Array.isArray(items) ? items : [];
    const safeTotalCount = Number(totalCount ?? safeItems.length);
    this.store.setMergedPullRequests(safeItems, syncedAtMs);
    this.store.setRepoStats({
      ...this.store.repoStats,
      mergedPRs: Number.isFinite(safeTotalCount) ? safeTotalCount : safeItems.length,
    });
  }

  async loadCachedMergedPullRequestDetails(repoKey = this.store.repoKeyString) {
    if (!repoKey || !isFirebaseConfigured()) return null;

    try {
      const cached = await getMergedPullRequestDetailsForRepo(repoKey);
      if ((cached?.items?.length || Number(cached?.totalCount) > 0) && this.store.repoKeyString === repoKey) {
        this.applyMergedPullRequestDetails(cached);
      }
      return cached;
    } catch (error) {
      this.store.addNotification(
        `Saved merged PR details could not load: ${error?.message ?? 'unknown'}`,
        'Merged PR details warning',
        'error',
      );
      return null;
    }
  }

  async loadMergedPullRequestDetails({ force = false, source = 'manual', onlyIfCached = false } = {}) {
    if (!this.store.repo?.owner || !this.store.repo?.name) return false;

    if (!force && isFresh(this.store.mergedPullRequestsSyncedAtMs)) {
      if (source === 'manual') await this.showSilentSpinner('Loading saved merged pull requests...');
      return true;
    }

    const syncRepoKey = this.store.repoKeyString;
    const cached = !force ? await this.loadCachedMergedPullRequestDetails(syncRepoKey) : null;
    const hasCachedDetails = Boolean(cached?.items?.length || Number(cached?.totalCount) > 0);

    if (!force && hasCachedDetails && (isFresh(cached.syncedAtMs) || onlyIfCached)) {
      if (source === 'manual') await this.showSilentSpinner('Loading saved merged pull requests...');
      return true;
    }

    if (onlyIfCached) return hasCachedDetails;

    if (!this.canStartGitHubSync({ force, source })) return hasCachedDetails;

    if (source === 'manual') {
      this.store.setLoading({ isLoading: true, phase: 'Loading merged pull requests...' });
    }

    try {
      const result = await getMergedPullRequestDetails(this.store.repo.owner, this.store.repo.name, { limit: 10 });
      if (this.store.repoKeyString !== syncRepoKey) return false;
      const items = Array.isArray(result) ? result : result.items;
      const totalCount = Array.isArray(result) ? result.length : result.totalCount;
      const syncedAtMs = Date.now();
      this.applyMergedPullRequestDetails({ items, totalCount, syncedAtMs });

      await this.store.persistMergedPRDetails({
        repoKey: this.store.repoKeyString,
        items,
        totalCount,
        syncedAtMs,
      });
      return true;
    } catch (error) {
      this.applyGitHubRateLimitBackoff(error);
      if (source === 'manual' || !hasCachedDetails) {
        this.store.addNotification(explainGitHubError(error), 'Merged PR details failed', 'error');
      }
      return hasCachedDetails;
    } finally {
      if (source === 'manual') {
        this.store.setLoading({ isLoading: false, phase: '' });
      }
    }
  }

}
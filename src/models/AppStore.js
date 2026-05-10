import { UiStore } from '../stores/UiStore.js';
import { SessionStore } from '../stores/SessionStore.js';
import { WorkspaceStore } from '../stores/WorkspaceStore.js';
import { RequestStore } from '../stores/RequestStore.js';
import { LeaderboardStore } from '../stores/LeaderboardStore.js';

export class AppStore {
  constructor() {
    this.ui = new UiStore(this);
    this.session = new SessionStore(this);
    this.workspace = new WorkspaceStore(this);
    this.requestsStore = new RequestStore(this);
    this.leaderboardStore = new LeaderboardStore(this);
  }

  get step() { return this.ui.step; }
  get isLoading() { return this.ui.isLoading; }
  get errorMessage() { return this.workspace.manualSyncError; }
  get flashMessage() { return this.ui.flashMessage; }
  get loadingPhase() { return this.ui.loadingPhase; }
  get notificationsOpen() { return this.ui.notificationsOpen; }
  get notifications() { return this.ui.notifications; }
  get selectedPlayer() { return this.ui.selectedPlayer; }
  get confirmation() { return this.ui.confirmation; }

  get profile() { return this.session.profile; }
  get profileInitials() { return this.session.profileInitials; }

  get repo() { return this.workspace.repo; }
  get repoStats() { return this.workspace.repoStats; }
  get mergedPullRequests() { return this.workspace.mergedPullRequests; }
  get mergedPullRequestsSyncedAtMs() { return this.workspace.mergedPullRequestsSyncedAtMs; }
  get repositories() { return this.workspace.repositories; }
  get repositoryInput() { return this.workspace.repositoryInput; }
  get recentRepositories() { return this.workspace.recentRepositories; }
  get recentLoading() { return this.workspace.recentLoading; }
  get connectError() { return this.workspace.connectError; }
  get syncStatus() { return this.workspace.syncStatus; }
  get lastSyncedAt() { return this.workspace.lastSyncedAt; }
  get syncCooldownMs() { return this.workspace.syncCooldownMs; }
  get activeRepoLastSyncStartedAt() { return this.workspace.activeRepoLastSyncStartedAt; }
  get syncCooldownRemainingMs() { return this.workspace.syncCooldownRemainingMs; }
  get canSyncActiveRepository() { return this.workspace.canSyncActiveRepository; }
  get repositoryActionCooldownRemainingMs() { return this.workspace.repositoryActionCooldownRemainingMs; }
  get canChangeRepository() { return this.workspace.canChangeRepository; }
  get manualSyncError() { return this.workspace.manualSyncError; }
  get backgroundSyncError() { return this.workspace.backgroundSyncError; }
  get scoreRules() { return this.workspace.scoreRules; }
  get hero() { return this.workspace.hero; }
  get repoKeyString() { return this.workspace.repoKeyString; }
  get activeRepoKey() { return this.workspace.activeRepoKey; }

  get requests() { return this.requestsStore.requests; }
  get requestMetricsById() { return this.requestsStore.requestMetricsById; }
  get requestContributionsById() { return this.requestsStore.requestContributionsById; }
  get allUserRequestContributionsById() { return this.requestsStore.allUserRequestContributionsById; }
  get requestMetricsSyncedAtMs() { return this.requestsStore.requestMetricsSyncedAtMs; }
  get requestDraft() { return this.requestsStore.requestDraft; }
  get activeRequests() { return this.requestsStore.activeRequests; }
  get activeRequestCount() { return this.requestsStore.activeRequestCount; }
  get requestSummaries() { return this.requestsStore.requestSummaries; }
  get completedRequestBonusXp() { return this.requestsStore.completedRequestBonusXp; }
  get quest() { return this.requestsStore.quest; }
  get questProgress() { return this.requestsStore.questProgress; }

  get leaderboard() { return this.leaderboardStore.leaderboard; }
  get leaderboardFilter() { return this.leaderboardStore.leaderboardFilter; }
  get topContributors() { return this.leaderboardStore.topContributors; }
  get activeMembersCount() { return this.leaderboardStore.activeMembersCount; }

  setStep = (step) => this.ui.setStep(step);
  setLoading = (payload) => this.ui.setLoading(payload);
  setSyncError = (message, options) => this.workspace.setSyncError(message, options);
  setFlashMessage = (message) => this.ui.setFlashMessage(message);
  clearFlashMessage = () => this.ui.clearFlashMessage();
  addNotification = (text, title, type) => this.ui.addNotification(text, title, type);
  toggleNotifications = () => this.ui.toggleNotifications();
  openNotifications = () => this.ui.openNotifications();
  closeNotifications = () => this.ui.closeNotifications();
  clearNotifications = () => this.ui.clearNotifications();
  selectPlayer = (player) => this.ui.selectPlayer(player);
  closePlayerDrawer = () => this.ui.closePlayerDrawer();
  requestConfirmation = (payload) => this.ui.requestConfirmation(payload);
  closeConfirmation = () => this.ui.closeConfirmation();
  confirmCurrentAction = () => this.ui.confirmCurrentAction();

  setProfileUsername = (username) => this.session.setProfileUsername(username);
  hydrateFromSession = (payload) => this.session.hydrateFromSession(payload);

  hydrateWorkspace = (payload) => this.workspace.hydrateWorkspace(payload);
  setRepositoryInput = (value) => this.workspace.setRepositoryInput(value);
  setRecentRepositories = (repositories) => this.workspace.setRecentRepositories(repositories);
  setRecentLoading = (value) => this.workspace.setRecentLoading(value);
  setConnectError = (message) => this.workspace.setConnectError(message);
  setRepositories = (repositories) => this.workspace.setRepositories(repositories);
  addRepository = (repository) => this.workspace.addRepository(repository);
  removeRepository = (repoKey) => this.workspace.removeRepository(repoKey);
  setActiveRepository = (repository, options) => this.workspace.setActiveRepository(repository, options);
  resetRepositoryState = () => this.workspace.resetRepositoryData();
  setSyncStatus = (status) => this.workspace.setSyncStatus(status);
  setHeroActivity = (activity) => this.workspace.setHeroActivity(activity);
  setRepoStats = (stats) => this.workspace.setRepoStats(stats);
  setMergedPullRequests = (items, syncedAtMs) => this.workspace.setMergedPullRequests(items, syncedAtMs);
  setScoreRules = (rules) => this.workspace.setScoreRules(rules);
  setLastSyncedAt = (value) => this.workspace.setLastSyncedAt(value);
  markSyncStarted = (repoKey) => this.workspace.markSyncStarted(repoKey);
  markRepositoryActionStarted = () => this.workspace.markRepositoryActionStarted();
  clearSyncErrors = () => this.workspace.clearSyncErrors();

  setRequests = (requests) => this.requestsStore.setRequests(requests);
  upsertRequest = (request) => this.requestsStore.upsertRequest(request);
  removeRequest = (requestId) => this.requestsStore.removeRequest(requestId);
  setRequestMetricValues = (valuesById, contributionsById, syncedAtMs, allUserContributionsById) =>
    this.requestsStore.setRequestMetricValues(valuesById, contributionsById, syncedAtMs, allUserContributionsById);
  saveRequestDraft = (payload) => this.requestsStore.saveRequestDraft(payload);
  setQuest = (quest) => this.requestsStore.setQuest(quest);
  saveQuestDraft = (payload) => this.requestsStore.saveQuestDraft(payload);
  setQuestUnsubscribe = (unsubscribe) => this.requestsStore.setQuestUnsubscribe(unsubscribe);
  stopQuestSubscription = () => this.requestsStore.stopQuestSubscription();

  setLeaderboardRows = (rows) => this.leaderboardStore.setLeaderboardRows(rows);
  setLeaderboardFilter = (filter) => this.leaderboardStore.setLeaderboardFilter(filter);
  setLeaderboardUnsubscribe = (unsubscribe) => this.leaderboardStore.setLeaderboardUnsubscribe(unsubscribe);
  stopLeaderboardSubscription = () => this.leaderboardStore.stopLeaderboardSubscription();

  dispose() {
    this.stopLeaderboardSubscription();
    this.stopQuestSubscription();
  }

  applySignedOut() {
    this.dispose();
    this.ui.reset();
    this.session.reset();
    this.workspace.reset();
    this.requestsStore.reset();
    this.leaderboardStore.reset();
  }
}

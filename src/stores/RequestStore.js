import { makeAutoObservable } from 'mobx';
import { RequestModel } from '../models/QuestModel.js';
import { isFirebaseConfigured, saveRequestsForRepo, saveRequestMetricsForRepo } from '../services/firebaseService.js';

export class RequestStore {
  root;
  requests = [];
  requestMetricsById = {};
  requestContributionsById = {};
  allUserRequestContributionsById = {};
  requestMetricsSyncedAtMs = 0;
  requestDraft = null;
  requestUnsubscribe = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false, requestUnsubscribe: false }, { autoBind: true });
  }

  get activeRequests() {
    return this.requests.filter((request) => !request.archived);
  }

  get requestSummaries() {
    return this.activeRequests.map((request) => {
      const value = Number(this.requestMetricsById[request.id] ?? 0);
      const contribution = Number(this.requestContributionsById[request.id] ?? 0);
      const progress = request.progress(value);
      return {
        ...request.toJSON(),
        value,
        contribution,
        progress,
        status: request.status(value),
        bonusXp: request.completedBonusForContribution(value, contribution),
      };
    });
  }

  get activeRequestCount() {
    return this.requestSummaries.filter((request) => request.status === 'active').length;
  }

  get completedRequestBonusXp() {
    return this.requestSummaries.reduce((sum, request) => sum + Number(request.bonusXp ?? 0), 0);
  }

  get defaultRequest() {
    return this.activeRequests[0] ?? this.requests[0] ?? new RequestModel();
  }

  setRequests(requests) {
    this.requests = (Array.isArray(requests) ? requests : []).map((request) =>
      request instanceof RequestModel ? request : new RequestModel({ ...request, repoKey: this.root.repoKeyString }),
    );
    this.requestDraft = null;
  }

  upsertRequest(request) {
    const nextRequest = request instanceof RequestModel ? request : new RequestModel({ ...request, repoKey: this.root.repoKeyString });
    const exists = this.requests.some((item) => item.id === nextRequest.id);
    this.requests = exists
      ? this.requests.map((item) => (item.id === nextRequest.id ? nextRequest : item))
      : [nextRequest, ...this.requests];
    this.requestDraft = null;
  }

  removeRequest(requestId) {
    const id = String(requestId || '');
    if (!id) return;
    this.requests = this.requests.filter((request) => request.id !== id);
    const nextMetrics = { ...this.requestMetricsById };
    const nextContributions = { ...this.requestContributionsById };
    delete nextMetrics[id];
    delete nextContributions[id];
    const nextAllUserContributions = Object.fromEntries(
      Object.entries(this.allUserRequestContributionsById || {}).map(([username, record]) => {
        const nextRecord = { ...(record || {}) };
        const values = { ...(nextRecord.contributionsById || {}) };
        delete values[id];
        nextRecord.contributionsById = values;
        return [username, nextRecord];
      }),
    );
    this.requestMetricsById = nextMetrics;
    this.requestContributionsById = nextContributions;
    this.allUserRequestContributionsById = nextAllUserContributions;
  }

  setRequestMetricValues(valuesById = {}, contributionsById = {}, syncedAtMs = Date.now(), allUserContributionsById = null) {
    this.requestMetricsById = { ...valuesById };
    this.requestContributionsById = { ...contributionsById };
    if (allUserContributionsById) {
      this.allUserRequestContributionsById = { ...allUserContributionsById };
    }
    this.requestMetricsSyncedAtMs = Number(syncedAtMs ?? 0);
  }

  saveRequestDraft(payload) {
    this.requestDraft = {
      id: payload?.id ?? '',
      title: payload?.title ?? this.defaultRequest.title,
      description: payload?.description ?? this.defaultRequest.description,
      metricType: payload?.metricType ?? this.defaultRequest.metricType,
      targetValue: Number.isFinite(Number(payload?.targetValue)) ? Number(payload.targetValue) : this.defaultRequest.targetValue,
      startDate: payload?.startDate ?? this.defaultRequest.startDate,
      endDate: payload?.endDate ?? this.defaultRequest.endDate,
      rewardXp: Number.isFinite(Number(payload?.rewardXp)) ? Number(payload.rewardXp) : this.defaultRequest.rewardXp,
    };
    this.root.ui.addNotification('Draft saved.', 'Draft saved', 'success');
  }

  setRequestUnsubscribe(unsubscribe) {
    this.requestUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
  }

  async persistRequests({ updatedBy } = {}) {
    if (!isFirebaseConfigured() || !this.root.repoKeyString) return;
    await saveRequestsForRepo({
      repoKey: this.root.repoKeyString,
      requests: this.requests.map((request) => request.toJSON()),
      updatedBy,
    });
  }

  async persistRequestMetrics({ username } = {}) {
    if (!isFirebaseConfigured() || !this.root.repoKeyString || !username) return;
    await saveRequestMetricsForRepo({
      repoKey: this.root.repoKeyString,
      username,
      valuesById: this.requestMetricsById,
      contributionsById: this.requestContributionsById,
      syncedAtMs: this.requestMetricsSyncedAtMs,
    });
  }

  stopRequestSubscription() {
    if (this.requestUnsubscribe) {
      this.requestUnsubscribe();
      this.requestUnsubscribe = null;
    }
  }

  resetForRepository() {
    this.requests = [];
    this.requestMetricsById = {};
    this.requestContributionsById = {};
    this.allUserRequestContributionsById = {};
    this.requestMetricsSyncedAtMs = 0;
    this.requestDraft = null;
  }

  reset() {
    this.stopRequestSubscription();
    this.requests = [];
    this.requestMetricsById = {};
    this.requestContributionsById = {};
    this.allUserRequestContributionsById = {};
    this.requestMetricsSyncedAtMs = 0;
    this.requestDraft = null;
  }
}

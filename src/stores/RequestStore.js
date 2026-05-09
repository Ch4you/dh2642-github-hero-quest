import { makeAutoObservable } from 'mobx';
import { RequestModel, QuestModel } from '../models/QuestModel.js';

export class RequestStore {
  root;
  requests = [
    new RequestModel({
      title: 'Reach 12 merged PRs before Friday',
      description: 'Push the onboarding flow and polish leaderboard interactions before the weekly review.',
      metricType: 'repoMergedPRs',
      targetValue: 12,
      rewardXp: 50,
    }),
  ];
  requestMetricsById = {};
  requestContributionsById = {};
  requestDraft = null;
  questUnsubscribe = null;

  constructor(root) {
    this.root = root;
    makeAutoObservable(this, { root: false, questUnsubscribe: false }, { autoBind: true });
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

  get quest() {
    return this.activeRequests[0] ?? this.requests[0] ?? new RequestModel();
  }

  get questProgress() {
    const metricValue = this.requestMetricsById[this.quest.id] ?? this.root.workspace.repoStats.mergedPRs ?? this.root.workspace.hero.mergedPRs ?? 0;
    return this.quest.progress(metricValue);
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
    this.requestMetricsById = nextMetrics;
    this.requestContributionsById = nextContributions;
  }

  setRequestMetricValues(valuesById = {}, contributionsById = {}) {
    this.requestMetricsById = { ...valuesById };
    this.requestContributionsById = { ...contributionsById };
  }

  saveRequestDraft(payload) {
    this.requestDraft = {
      id: payload?.id ?? '',
      title: payload?.title ?? this.quest.title,
      description: payload?.description ?? this.quest.description,
      metricType: payload?.metricType ?? this.quest.metricType,
      targetValue: Number.isFinite(Number(payload?.targetValue)) ? Number(payload.targetValue) : this.quest.targetValue,
      startDate: payload?.startDate ?? this.quest.startDate,
      endDate: payload?.endDate ?? this.quest.endDate,
      rewardXp: Number.isFinite(Number(payload?.rewardXp)) ? Number(payload.rewardXp) : this.quest.rewardXp,
    };
    this.root.ui.addNotification('Request draft saved locally', 'Draft saved');
  }

  setQuest(quest) {
    this.setRequests([quest instanceof QuestModel ? quest : new QuestModel(quest)]);
  }

  saveQuestDraft(payload) {
    this.saveRequestDraft(payload);
  }

  setQuestUnsubscribe(unsubscribe) {
    this.questUnsubscribe = typeof unsubscribe === 'function' ? unsubscribe : null;
  }

  stopQuestSubscription() {
    if (this.questUnsubscribe) {
      this.questUnsubscribe();
      this.questUnsubscribe = null;
    }
  }

  resetForRepository() {
    this.requests = [];
    this.requestMetricsById = {};
    this.requestContributionsById = {};
    this.requestDraft = null;
  }

  reset() {
    this.stopQuestSubscription();
    this.requests = [];
    this.requestMetricsById = {};
    this.requestContributionsById = {};
    this.requestDraft = null;
  }
}

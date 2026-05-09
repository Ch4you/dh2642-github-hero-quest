import { RequestModel } from '../models/QuestModel.js';
import { getRequestMetricValues } from '../services/githubApi.js';
import { isFirebaseConfigured, saveRequestsForRepo, subscribeRequestsForRepo } from '../services/firebaseService.js';

export class QuestController {
  constructor(store) {
    this.store = store;
  }

  startForActiveRepository() {
    this.store.stopQuestSubscription();
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return;

    try {
      const unsubscribe = subscribeRequestsForRepo({
        repoKey: this.store.repoKeyString,
        onUpdate: (records = []) => {
          const requests = records.map((request) => new RequestModel({ ...request, repoKey: this.store.repoKeyString }));
          this.store.setRequests(requests);
          void this.refreshRequestMetrics();
        },
        onError: (error) => {
          this.store.addNotification(`Request sync failed: ${error?.message ?? 'unknown'}`, 'Request error', 'error');
        },
      });
      this.store.setQuestUnsubscribe(unsubscribe);
    } catch (error) {
      this.store.addNotification(`Request subscription failed: ${error?.message ?? 'unknown'}`, 'Request error', 'error');
    }
  }

  async persistRequests() {
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return;
    await saveRequestsForRepo({
      repoKey: this.store.repoKeyString,
      requests: this.store.requests.map((request) => request.toJSON()),
      updatedBy: this.store.profile.username,
    });
  }

  async saveRequest(payload) {
    if (!this.store.repoKeyString) {
      this.store.setStep('connect');
      this.store.addNotification('Connect a repository before saving requests.', 'Repository required', 'error');
      return;
    }

    const target = Number(payload?.targetValue);
    const nextRequest = new RequestModel({
      id: payload?.id,
      title: payload?.title?.trim() || 'Untitled request',
      description: payload?.description?.trim() || '',
      metricType: payload?.metricType,
      targetValue: Number.isFinite(target) && target > 0 ? target : 1,
      startDate: payload?.startDate,
      endDate: payload?.endDate,
      rewardXp: payload?.rewardXp ?? 50,
      repoKey: this.store.repoKeyString,
    });

    if (nextRequest.endDate && nextRequest.startDate && nextRequest.endDate < nextRequest.startDate) {
      this.store.addNotification('End date must be after the start date.', 'Request not saved', 'error');
      return;
    }

    this.store.upsertRequest(nextRequest);
    await this.persistRequests();
    await this.refreshRequestMetrics();
    this.store.addNotification(`Request saved for ${this.store.repoKeyString}`, 'Request saved', 'success');
    this.store.setStep('dashboard');
  }

  async deleteRequest(requestId) {
    const request = this.store.requests.find((item) => item.id === requestId);
    if (!request) return;
    this.store.removeRequest(requestId);
    await this.persistRequests();
    await this.refreshRequestMetrics();
    this.store.addNotification(`Deleted request “${request.title}”.`, 'Request deleted', 'success');
  }

  async refreshRequestMetrics() {
    if (!this.store.repoKeyString || this.store.requests.length === 0) {
      this.store.setRequestMetricValues({}, {});
      return;
    }

    try {
      const progress = await getRequestMetricValues(
        this.store.repo.owner,
        this.store.repo.name,
        this.store.profile.username,
        this.store.requests,
      );
      this.store.setRequestMetricValues(progress.valuesById, progress.contributionsById);
    } catch (error) {
      this.store.addNotification(
        `Request metrics could not refresh: ${error?.message ?? 'unknown'}`,
        'Request metrics warning',
        'error',
      );
    }
  }

  saveDraft(payload) {
    this.store.saveRequestDraft(payload);
    this.store.setStep('dashboard');
  }

  // Backwards-compatible method name used by older presenters.
  saveQuest(payload) {
    return this.saveRequest({
      ...payload,
      targetValue: payload?.targetValue ?? payload?.targetMergedPRs,
      metricType: payload?.metricType ?? 'repoMergedPRs',
    });
  }
}

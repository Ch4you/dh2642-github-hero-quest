import { RequestModel, todayDateString } from '../models/QuestModel.js';
import { getRequestMetricValues } from '../services/githubApi.js';
import {
  getRequestMetricsForRepo,
  isFirebaseConfigured,
  saveRequestMetricsForRepo,
  saveRequestsForRepo,
  subscribeRequestsForRepo,
} from '../services/firebaseService.js';

const CACHE_TTL_MS = 10 * 60_000;

function isFresh(timestampMs, ttlMs = CACHE_TTL_MS) {
  return Number.isFinite(Number(timestampMs)) && Date.now() - Number(timestampMs) < ttlMs;
}

export class QuestController {
  constructor(store) {
    this.store = store;
  }

  startForActiveRepository() {
    this.store.stopRequestSubscription();
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return;

    try {
      const unsubscribe = subscribeRequestsForRepo({
        repoKey: this.store.repoKeyString,
        onUpdate: (records = []) => {
          const requests = records.map((request) => new RequestModel({ ...request, repoKey: this.store.repoKeyString }));
          this.store.setRequests(requests);
          void this.loadCachedRequestMetrics();
        },
        onError: (error) => {
          this.store.addNotification(`Goal sync failed: ${error?.message ?? 'unknown'}`, 'Goal error', 'error');
        },
      });
      this.store.setRequestUnsubscribe(unsubscribe);
    } catch (error) {
      this.store.addNotification(`Goal subscription failed: ${error?.message ?? 'unknown'}`, 'Goal error', 'error');
    }
  }

  async loadCachedRequestMetrics() {
    if (!isFirebaseConfigured() || !this.store.repoKeyString) return false;

    try {
      const cached = await getRequestMetricsForRepo({
        repoKey: this.store.repoKeyString,
        username: this.store.profile.username,
      });

      if (!cached) return false;

      this.store.setRequestMetricValues(
        cached.valuesById,
        cached.contributionsById,
        cached.syncedAtMs,
        cached.allUserContributionsById,
      );
      return true;
    } catch (error) {
      this.store.addNotification(
        `Saved goal metrics could not load: ${error?.message ?? 'unknown'}`,
        'Goal metrics warning',
        'error',
      );
      return false;
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
      this.store.addNotification('Connect a repository before saving goals.', 'Repository required', 'error');
      return;
    }

    const target = Number(payload?.targetValue);
    const nextRequest = new RequestModel({
      id: payload?.id,
      title: payload?.title?.trim() || 'Untitled goal',
      description: payload?.description?.trim() || '',
      metricType: payload?.metricType,
      targetValue: Number.isFinite(target) && target > 0 ? target : 1,
      startDate: payload?.startDate,
      endDate: payload?.endDate,
      rewardXp: payload?.rewardXp ?? 50,
      repoKey: this.store.repoKeyString,
    });

    if (nextRequest.endDate && nextRequest.startDate && nextRequest.endDate < nextRequest.startDate) {
      this.store.addNotification('End date must be after the start date.', 'Goal not saved', 'error');
      return;
    }

    this.store.upsertRequest(nextRequest);
    await this.persistRequests();

    const today = todayDateString();
    const isActive = !nextRequest.archived && !nextRequest.manuallyCompleted
      && today >= nextRequest.startDate && today <= nextRequest.endDate;
    if (isActive) {
      await this.refreshRequestMetrics({ force: true });
    } else {
      await this.loadCachedRequestMetrics();
    }
    this.store.addNotification('Goal saved.', 'Goal saved', 'success');
  }

  async deleteRequest(requestId) {
    const request = this.store.requests.find((item) => item.id === requestId);
    if (!request) return;
    this.store.removeRequest(requestId);
    await this.persistRequests();
    await this.loadCachedRequestMetrics();
    this.store.addNotification('Goal deleted.', 'Goal deleted', 'success');
  }

  async completeRequest(requestId) {
    const request = this.store.requests.find((item) => item.id === requestId);
    if (!request) return;
    const updated = new RequestModel({ ...request.toJSON(), manuallyCompleted: true });
    this.store.upsertRequest(updated);
    await this.persistRequests();
    this.store.addNotification('Goal marked as complete.', 'Goal completed', 'success');
  }

  async refreshRequestMetrics({ force = false } = {}) {
    if (!this.store.repoKeyString || this.store.requests.length === 0) {
      this.store.setRequestMetricValues({}, {}, 0);
      return false;
    }

    if (!force && isFresh(this.store.requestMetricsSyncedAtMs)) {
      return true;
    }

    if (!force) {
      const loadedCached = await this.loadCachedRequestMetrics();
      if (loadedCached && isFresh(this.store.requestMetricsSyncedAtMs)) {
        return true;
      }
    }

    try {
      const activeRequests = this.store.requests.filter((request) => !request.archived).slice(0, 3);
      const progress = await getRequestMetricValues(
        this.store.repo.owner,
        this.store.repo.name,
        this.store.profile.username,
        activeRequests,
      );
      const syncedAtMs = Date.now();

      this.store.setRequestMetricValues(
        progress.valuesById,
        progress.contributionsById,
        syncedAtMs,
        {
          ...(this.store.allUserRequestContributionsById || {}),
          [this.store.profile.username || 'unknown']: {
            contributionsById: progress.contributionsById,
            syncedAtMs,
          },
        },
      );

      if (isFirebaseConfigured()) {
        await saveRequestMetricsForRepo({
          repoKey: this.store.repoKeyString,
          username: this.store.profile.username,
          valuesById: progress.valuesById,
          contributionsById: progress.contributionsById,
          syncedAtMs,
        });
      }
      return true;
    } catch (error) {
      this.store.addNotification(
        `Goal metrics could not refresh: ${error?.message ?? 'unknown'}`,
        'Goal metrics warning',
        'error',
      );
      return false;
    }
  }

  saveDraft(payload) {
    this.store.saveRequestDraft(payload);
  }

}
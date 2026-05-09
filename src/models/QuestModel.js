export const REQUEST_METRIC_TYPES = [
  {
    value: 'repoMergedPRs',
    label: 'Team merged PRs',
    description: 'Merged pull requests in this repository during the request date range. Bonus XP is shared by contribution.',
    contributionLabel: 'Your merged PRs',
  },
  {
    value: 'repoCommits',
    label: 'Team commits',
    description: 'Commits in this repository during the request date range. Bonus XP is shared by authored commits.',
    contributionLabel: 'Your commits',
  },
  {
    value: 'repoOpenPRs',
    label: 'Team open PRs',
    description: 'Open pull requests created in this repository during the request date range. Bonus XP is shared by authored PRs.',
    contributionLabel: 'Your open PRs',
  },
  {
    value: 'repoReviews',
    label: 'Team reviewed PRs',
    description: 'Pull requests with review activity during the request date range. Bonus XP is shared by review contribution.',
    contributionLabel: 'Your reviewed PRs',
  },
];

export const DEFAULT_REQUEST_METRIC = 'repoMergedPRs';

export function getMetricDefinition(metricType) {
  return REQUEST_METRIC_TYPES.find((item) => item.value === metricType) ?? REQUEST_METRIC_TYPES[0];
}

export function getMetricLabel(metricType) {
  return getMetricDefinition(metricType).label;
}

export function todayDateString(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function addDaysDateString(days, from = new Date()) {
  const next = new Date(from);
  next.setDate(next.getDate() + Number(days || 0));
  return todayDateString(next);
}

function compareDateString(value, fallback) {
  const raw = String(value || '').trim();
  return raw || fallback;
}

function makeRequestId() {
  return `request-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export class RequestModel {
  constructor({
    id = makeRequestId(),
    title = 'Reach repository goal',
    description = 'Track a measurable repository activity goal within a chosen date range.',
    metricType = DEFAULT_REQUEST_METRIC,
    targetValue = 12,
    startDate = todayDateString(),
    endDate = addDaysDateString(7),
    rewardXp = 50,
    repoKey = '',
    archived = false,
  } = {}) {
    this.id = String(id || makeRequestId());
    this.title = title || 'Untitled request';
    this.description = description || '';
    this.metricType = REQUEST_METRIC_TYPES.some((item) => item.value === metricType) ? metricType : DEFAULT_REQUEST_METRIC;
    this.targetValue = Math.max(1, Number(targetValue || 1));
    this.startDate = String(startDate || todayDateString());
    this.endDate = String(endDate || addDaysDateString(7));
    this.rewardXp = Number(rewardXp || 50);
    this.repoKey = repoKey || '';
    this.archived = Boolean(archived);
  }

  progress(value = 0) {
    const goal = Math.max(1, Number(this.targetValue || 1));
    const current = Math.max(0, Number(value || 0));
    const percentage = Math.min(100, Math.round((current / goal) * 100));
    return { goal, current, percentage };
  }

  status(value = 0, now = new Date()) {
    if (this.archived) return 'archived';
    const progress = this.progress(value);
    if (progress.percentage >= 100) return 'completed';

    const today = todayDateString(now);
    const start = compareDateString(this.startDate, today);
    const end = compareDateString(this.endDate, today);

    if (today < start) return 'scheduled';
    if (today > end) return 'expired';
    return 'active';
  }

  completedBonusForContribution(teamValue = 0, userContribution = 0) {
    const progress = this.progress(teamValue);
    if (progress.percentage < 100) return 0;
    const total = Math.max(1, Number(teamValue || 0));
    const contribution = Math.max(0, Number(userContribution || 0));
    if (contribution <= 0) return 0;
    return Math.round(Math.max(0, Number(this.rewardXp || 0)) * Math.min(1, contribution / total));
  }

  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      metricType: this.metricType,
      targetValue: this.targetValue,
      startDate: this.startDate,
      endDate: this.endDate,
      rewardXp: this.rewardXp,
      repoKey: this.repoKey,
      archived: this.archived,
    };
  }
}

// Backwards-compatible alias: older files still import QuestModel during the refactor.
export class QuestModel extends RequestModel {}

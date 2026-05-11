import { DEFAULT_SCORE_RULES, normalizeScoreRules } from './scoreRules.js';

export function normalizeRepoKey(repoKey = 'default') {
  return String(repoKey).trim().replaceAll('/', '__') || 'default';
}

export function getWorkspaceDocId({ uid, username } = {}) {
  const preferred = String(uid || username || '').trim();
  if (!preferred) throw new Error('Workspace persistence requires a signed-in user.');
  return preferred;
}

export function normalizeRepository(repository) {
  const owner = String(repository?.owner ?? '').trim();
  const name = String(repository?.name ?? '').trim();
  if (!owner || !name) return null;
  const createdAt = String(repository?.createdAt ?? repository?.created_at ?? '').trim();
  return createdAt ? { owner, name, createdAt } : { owner, name };
}

export function normalizeRepositoryList(repositories = []) {
  const seen = new Set();
  return (Array.isArray(repositories) ? repositories : [])
    .map(normalizeRepository)
    .filter(Boolean)
    .filter((repository) => {
      const key = `${repository.owner}/${repository.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function toUserDoc(data = {}) {
  const username = String(data.username || '').trim();
  if (!username) throw new Error('toUserDoc: username is required');
  return {
    username,
    displayName: String(data.displayName || username).trim(),
    avatarUrl: String(data.avatarUrl || ''),
    uid: String(data.uid || ''),
    email: String(data.email || ''),
    lastRepoKey: String(data.lastRepoKey || ''),
  };
}

export function fromUserDoc(data = {}) {
  if (!data) return null;
  const username = String(data.username || '').trim();
  if (!username) return null;
  return {
    username,
    displayName: String(data.displayName || username).trim(),
    avatarUrl: String(data.avatarUrl || ''),
    uid: String(data.uid || ''),
    email: String(data.email || ''),
    lastRepoKey: String(data.lastRepoKey || ''),
  };
}

export function toAuthProfileDoc(profile = {}) {
  const username = String(profile.username || '').trim();
  if (!username) throw new Error('toAuthProfileDoc: username is required');
  return {
    username,
    displayName: String(profile.displayName || username).trim(),
    avatarUrl: String(profile.avatarUrl || ''),
  };
}

export function fromAuthProfileDoc(data = {}, fallback = {}) {
  const username = String(data?.username || fallback.username || '').trim();
  return {
    uid: String(fallback.uid || data?.uid || ''),
    username,
    displayName: String(data?.displayName || fallback.displayName || username || '').trim(),
    avatarUrl: String(data?.avatarUrl || fallback.avatarUrl || ''),
  };
}

export function toWorkspaceDoc({ uid, username, repositories, activeRepoKey } = {}) {
  const cleanRepositories = normalizeRepositoryList(repositories);
  const cleanActiveRepoKey = String(activeRepoKey || '').trim();
  const activeRepoStillExists = cleanRepositories.some((repo) => `${repo.owner}/${repo.name}` === cleanActiveRepoKey);

  return {
    uid: uid || '',
    username: username || '',
    repositories: cleanRepositories,
    activeRepoKey: activeRepoStillExists
      ? cleanActiveRepoKey
      : cleanRepositories[0]
        ? `${cleanRepositories[0].owner}/${cleanRepositories[0].name}`
        : '',
  };
}

export function fromWorkspaceDoc(data = {}) {
  const repositories = normalizeRepositoryList(data.repositories);
  const activeRepoKey = String(data.activeRepoKey || '').trim();
  const activeRepoStillExists = repositories.some((repo) => `${repo.owner}/${repo.name}` === activeRepoKey);

  return {
    repositories,
    activeRepoKey: activeRepoStillExists
      ? activeRepoKey
      : repositories[0]
        ? `${repositories[0].owner}/${repositories[0].name}`
        : '',
  };
}

function setNumber(target, key, value) {
  if (value !== undefined && value !== null) target[key] = Number(value ?? 0);
}

function setString(target, key, value) {
  if (value !== undefined && value !== null) target[key] = String(value ?? '');
}

export function toUserProgressDoc(progress = {}, { hasExisting = true } = {}) {
  if (!progress?.username) throw new Error('toUserProgressDoc: progress.username is required');
  const repoKey = normalizeRepoKey(progress.repoKey);
  const id = `${progress.username}__${repoKey}`;
  const displayName = typeof progress.displayName === 'string' && progress.displayName.trim() ? progress.displayName.trim() : progress.username;
  const payload = {
    id,
    username: progress.username,
    displayName,
    repoKey,
  };

  if (!hasExisting) payload.createdAtMs = Date.now();

  setNumber(payload, 'xp', progress.xp);
  setNumber(payload, 'level', progress.level);
  setNumber(payload, 'commits', progress.commits);
  setNumber(payload, 'mergedPRs', progress.mergedPRs);
  setNumber(payload, 'openPRs', progress.openPRs);
  setNumber(payload, 'reviews', progress.reviews);
  setNumber(payload, 'requestBonusXp', progress.requestBonusXp);
  setNumber(payload, 'allTimeSyncedAtMs', progress.allTimeSyncedAtMs);
  setNumber(payload, 'weeklyXp', progress.weeklyXp);
  setNumber(payload, 'weeklyCommits', progress.weeklyCommits);
  setNumber(payload, 'weeklyMergedPRs', progress.weeklyMergedPRs);
  setNumber(payload, 'weeklyOpenPRs', progress.weeklyOpenPRs);
  setNumber(payload, 'weeklyReviews', progress.weeklyReviews);
  setString(payload, 'weeklyRangeStart', progress.weeklyRangeStart);
  setString(payload, 'weeklyRangeEnd', progress.weeklyRangeEnd);
  setNumber(payload, 'weeklySyncedAtMs', progress.weeklySyncedAtMs);
  return payload;
}

function firestoreTimestampToMs(value) {
  if (!value) return 0;
  if (typeof value.toMillis === 'function') return value.toMillis();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'number') return value;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function fromUserProgressDoc(data = {}) {
  const updatedAtMs = firestoreTimestampToMs(data.updatedAt);
  const createdAtMs = Number(data.createdAtMs ?? 0) || firestoreTimestampToMs(data.createdAt) || updatedAtMs;
  return {
    id: String(data.id || ''),
    username: String(data.username || '').trim(),
    displayName: String(data.displayName || data.username || '').trim(),
    repoKey: String(data.repoKey || ''),
    xp: Number(data.xp ?? 0),
    level: Number(data.level ?? 1),
    commits: Number(data.commits ?? 0),
    mergedPRs: Number(data.mergedPRs ?? 0),
    openPRs: Number(data.openPRs ?? 0),
    reviews: Number(data.reviews ?? 0),
    requestBonusXp: Number(data.requestBonusXp ?? 0),
    allTimeSyncedAtMs: Number(data.allTimeSyncedAtMs ?? 0),
    weeklyXp: Number(data.weeklyXp ?? 0),
    weeklyCommits: Number(data.weeklyCommits ?? 0),
    weeklyMergedPRs: Number(data.weeklyMergedPRs ?? 0),
    weeklyOpenPRs: Number(data.weeklyOpenPRs ?? 0),
    weeklyReviews: Number(data.weeklyReviews ?? 0),
    weeklyRangeStart: String(data.weeklyRangeStart ?? ''),
    weeklyRangeEnd: String(data.weeklyRangeEnd ?? ''),
    weeklySyncedAtMs: Number(data.weeklySyncedAtMs ?? 0),
    updatedAtMs,
    createdAtMs,
  };
}

export function toScoreRulesDoc(scoreRules = {}) {
  return normalizeScoreRules(scoreRules || DEFAULT_SCORE_RULES);
}

export function fromScoreRulesDoc(data = {}) {
  return normalizeScoreRules(data || DEFAULT_SCORE_RULES);
}

export function normalizeRequestList(requests = []) {
  return (Array.isArray(requests) ? requests : [])
    .map((request) => ({
      id: String(request?.id || '').trim(),
      title: String(request?.title || 'Untitled goal').trim(),
      description: String(request?.description || '').trim(),
      metricType: String(request?.metricType || 'repoMergedPRs').trim(),
      targetValue: Math.max(1, Number(request?.targetValue || 1)),
      startDate: String(request?.startDate || '').trim(),
      endDate: String(request?.endDate || '').trim(),
      rewardXp: Number(request?.rewardXp ?? 50),
      repoKey: String(request?.repoKey || '').trim(),
      archived: Boolean(request?.archived),
      manuallyCompleted: Boolean(request?.manuallyCompleted),
    }))
    .filter((request) => request.id && request.title);
}

export function toRequestsDoc({ repoKey, requests, updatedBy } = {}) {
  const cleanRepoKey = normalizeRepoKey(repoKey);
  return {
    repoKey: cleanRepoKey,
    requests: normalizeRequestList(requests).map((request) => ({ ...request, repoKey: cleanRepoKey })),
    updatedBy: updatedBy || '',
  };
}

export function fromRequestsDoc(data = {}) {
  return normalizeRequestList(data.requests);
}

export function normalizeMetricMap(map = {}) {
  return Object.fromEntries(
    Object.entries(map || {}).map(([key, value]) => [String(key), Number(value ?? 0)]),
  );
}

export function toRequestMetricsDoc({ repoKey, username, valuesById, contributionsById, previousUsers = {}, syncedAtMs } = {}) {
  const cleanUsername = String(username || '').trim() || 'unknown';
  const currentSyncedAtMs = Number(syncedAtMs ?? Date.now());

  return {
    repoKey: normalizeRepoKey(repoKey),
    valuesById: normalizeMetricMap(valuesById),
    syncedAtMs: currentSyncedAtMs,
    userContributionsById: {
      ...previousUsers,
      [cleanUsername]: {
        contributionsById: normalizeMetricMap(contributionsById),
        syncedAtMs: currentSyncedAtMs,
      },
    },
  };
}

export function fromRequestMetricsDoc(data = {}, username = '') {
  const cleanUsername = String(username || '').trim() || 'unknown';
  const userContribution = data.userContributionsById?.[cleanUsername] || {};
  const teamSyncedAtMs = Number(data.syncedAtMs ?? 0);
  const userSyncedAtMs = Number(userContribution.syncedAtMs ?? 0);
  const allUserContributionsById = Object.fromEntries(
    Object.entries(data.userContributionsById || {}).map(([name, record]) => [
      name,
      {
        contributionsById: normalizeMetricMap(record?.contributionsById),
        syncedAtMs: Number(record?.syncedAtMs ?? 0),
      },
    ]),
  );

  return {
    valuesById: normalizeMetricMap(data.valuesById),
    contributionsById: normalizeMetricMap(userContribution.contributionsById),
    allUserContributionsById,
    syncedAtMs: Math.min(teamSyncedAtMs || userSyncedAtMs, userSyncedAtMs || teamSyncedAtMs),
  };
}

export function normalizePullRequestDetails(items = []) {
  return (Array.isArray(items) ? items : []).slice(0, 20).map((item, index) => ({
    id: String(item?.id ?? item?.url ?? `merged-pr-${index}`),
    index: index + 1,
    number: Number(item?.number ?? 0),
    title: String(item?.title ?? 'Untitled pull request'),
    author: String(item?.author ?? 'unknown'),
    mergedAt: String(item?.mergedAt ?? ''),
    url: String(item?.url ?? ''),
    description: String(item?.description ?? item?.title ?? 'Merged pull request'),
  }));
}

export function toMergedPullRequestDetailsDoc({ repoKey, items, totalCount, syncedAtMs } = {}) {
  const cleanItems = normalizePullRequestDetails(items);
  return {
    repoKey: normalizeRepoKey(repoKey),
    items: cleanItems,
    totalCount: Number(totalCount ?? cleanItems.length),
    syncedAtMs: Number(syncedAtMs ?? Date.now()),
  };
}

export function fromMergedPullRequestDetailsDoc(data = {}) {
  const items = normalizePullRequestDetails(data.items);
  return {
    items,
    totalCount: Number(data.totalCount ?? items.length),
    syncedAtMs: Number(data.syncedAtMs ?? 0),
  };
}

export function normalizeRepositoryContributorList(items = []) {
  const seen = new Set();
  return (Array.isArray(items) ? items : [])
    .map((item) => ({
      username: String(item?.username || item?.login || '').trim(),
      avatarUrl: String(item?.avatarUrl || item?.avatar_url || ''),
      profileUrl: String(item?.profileUrl || item?.html_url || ''),
      contributions: Number(item?.contributions ?? 0),
    }))
    .filter((item) => item.username)
    .filter((item) => {
      const key = item.username.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((a, b) => Number(b.contributions ?? 0) - Number(a.contributions ?? 0) || a.username.localeCompare(b.username));
}

export function toRepositoryContributorsDoc({ repoKey, items, syncedAtMs } = {}) {
  return {
    repoKey: normalizeRepoKey(repoKey),
    items: normalizeRepositoryContributorList(items),
    syncedAtMs: Number(syncedAtMs ?? Date.now()),
  };
}

export function fromRepositoryContributorsDoc(data = {}) {
  return {
    items: normalizeRepositoryContributorList(data.items),
    syncedAtMs: Number(data.syncedAtMs ?? 0),
  };
}

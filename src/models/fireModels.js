// Firestore DTO helpers.
// These functions are the only place that shapes data for Firebase documents.
// Presenters and views should never import this file; controllers work with store/domain data,
// while firebaseService converts that data to and from Firestore documents here.

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
  return { owner, name };
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
  const displayName =
    typeof progress.displayName === 'string' && progress.displayName.trim()
      ? progress.displayName.trim()
      : progress.username;

  const payload = {
    id,
    username: progress.username,
    displayName,
    repoKey,
  };

  if (!hasExisting) {
    payload.createdAtMs = Date.now();
  }

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

export function toMergedPullRequestDetailsDoc({ repoKey, items, syncedAtMs } = {}) {
  return {
    repoKey: normalizeRepoKey(repoKey),
    items: normalizePullRequestDetails(items),
    syncedAtMs: Number(syncedAtMs ?? Date.now()),
  };
}

export function fromMergedPullRequestDetailsDoc(data = {}) {
  return {
    items: normalizePullRequestDetails(data.items),
    syncedAtMs: Number(data.syncedAtMs ?? 0),
  };
}

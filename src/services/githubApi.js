function getHeaders() {
  return {
    Accept: 'application/vnd.github+json',
  };
}

export function explainGitHubError(error) {
  const message = String(error?.message ?? error ?? '');

  if (message.includes('(404)')) {
    return 'Repository not found or not public. Check the owner/name or use a public repository.';
  }
  if (message.includes('(403)')) {
    return 'GitHub refused this sync because too many GitHub API requests were made in a short time. Please wait a few minutes before syncing again.';
  }
  if (message.includes('(422)')) {
    return 'GitHub rejected the query. Check that the repository name is valid and public.';
  }
  return message || 'GitHub request failed. Check the repository and try again.';
}

async function fetchJsonOrThrow(url) {
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`GitHub API failed (${response.status})`);
  }
  return response.json();
}

function parseLastPageFromLink(linkHeader) {
  if (!linkHeader) return null;
  const lastMatch = linkHeader.match(/<[^>]*[?&]page=(\d+)[^>]*>; rel="last"/);
  if (!lastMatch) return null;
  const page = Number(lastMatch[1]);
  return Number.isFinite(page) ? page : null;
}

async function fetchCommitCount(owner, repo, username, { since = '', until = '' } = {}) {
  const authorQuery = username ? `&author=${encodeURIComponent(username)}` : '';
  const sinceQuery = since ? `&since=${encodeURIComponent(`${since}T00:00:00Z`)}` : '';
  const untilQuery = until ? `&until=${encodeURIComponent(`${until}T23:59:59Z`)}` : '';
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1${authorQuery}${sinceQuery}${untilQuery}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`GitHub commits API failed (${response.status})`);
  }

  const linkHeader = response.headers.get('link');
  const lastPage = parseLastPageFromLink(linkHeader);
  if (lastPage) return lastPage;

  const body = await response.json();
  return Array.isArray(body) ? body.length : 0;
}

async function searchCount(queryText) {
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(queryText)}&per_page=1`;
  const json = await fetchJsonOrThrow(url);
  return Number(json?.total_count ?? 0);
}

export async function getUserProfile(username) {
  if (!username?.trim()) {
    throw new Error('GitHub username is required.');
  }
  const cleanUsername = username.trim();
  return fetchJsonOrThrow(`https://api.github.com/users/${encodeURIComponent(cleanUsername)}`);
}

export async function getRepositories(username) {
  if (!username?.trim()) {
    throw new Error('GitHub username is required.');
  }
  const cleanUsername = username.trim();
  const url = `https://api.github.com/users/${encodeURIComponent(cleanUsername)}/repos?per_page=100&sort=updated`;
  return fetchJsonOrThrow(url);
}

export async function getRepository(owner, repo) {
  if (!owner?.trim() || !repo?.trim()) {
    throw new Error('Repository owner/name is required.');
  }
  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const url = `https://api.github.com/repos/${encodeURIComponent(cleanOwner)}/${encodeURIComponent(cleanRepo)}`;
  return fetchJsonOrThrow(url);
}

function dateRangeQuery(field, startDate, endDate) {
  const start = String(startDate || '').trim();
  const end = String(endDate || '').trim();
  if (start && end) return ` ${field}:${start}..${end}`;
  if (start) return ` ${field}:>=${start}`;
  if (end) return ` ${field}:<=${end}`;
  return '';
}

async function delay(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function getRequestMetricProgress(owner, repo, username, request) {
  if (!owner?.trim() || !repo?.trim()) {
    throw new Error('Repository owner/name is required before calculating request metrics.');
  }

  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanUsername = username?.trim();
  const repoQuery = `repo:${cleanOwner}/${cleanRepo}`;
  const startDate = request?.startDate || '';
  const endDate = request?.endDate || '';

  switch (request?.metricType) {
    case 'repoCommits': {
      const value = await fetchCommitCount(cleanOwner, cleanRepo, '', { since: startDate, until: endDate });
      const contribution = cleanUsername ? await fetchCommitCount(cleanOwner, cleanRepo, cleanUsername, { since: startDate, until: endDate }) : 0;
      return { value, contribution };
    }
    case 'repoOpenPRs': {
      const range = dateRangeQuery('created', startDate, endDate);
      const value = await searchCount(`${repoQuery} is:pr is:open${range}`);
      const contribution = cleanUsername ? await searchCount(`${repoQuery} is:pr is:open author:${cleanUsername}${range}`) : 0;
      return { value, contribution };
    }
    case 'repoReviews': {
      const range = dateRangeQuery('updated', startDate, endDate);
      const value = await searchCount(`${repoQuery} is:pr review:approved${range}`);
      const contribution = cleanUsername ? await searchCount(`${repoQuery} is:pr reviewed-by:${cleanUsername}${range}`) : 0;
      return { value, contribution };
    }
    case 'repoMergedPRs':
    default: {
      const range = dateRangeQuery('merged', startDate, endDate);
      const value = await searchCount(`${repoQuery} is:pr is:merged${range}`);
      const contribution = cleanUsername ? await searchCount(`${repoQuery} is:pr is:merged author:${cleanUsername}${range}`) : 0;
      return { value, contribution };
    }
  }
}

export async function getRequestMetricValue(owner, repo, username, request) {
  const progress = await getRequestMetricProgress(owner, repo, username, request);
  return progress.value;
}

export async function getRequestMetricValues(owner, repo, username, requests = []) {
  const valuesById = {};
  const contributionsById = {};
  for (const request of Array.isArray(requests) ? requests : []) {
    if (!request?.id) continue;
    const progress = await getRequestMetricProgress(owner, repo, username, request);
    valuesById[request.id] = progress.value;
    contributionsById[request.id] = progress.contribution;
    await delay(150);
  }
  return { valuesById, contributionsById };
}


export async function getMergedPullRequestDetails(owner, repo, { limit = 10 } = {}) {
  if (!owner?.trim() || !repo?.trim()) {
    throw new Error('Repository owner/name is required before loading merged pull requests.');
  }

  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const perPage = Math.min(20, Math.max(1, Number(limit) || 10));
  const queryText = `repo:${cleanOwner}/${cleanRepo} is:pr is:merged`;
  const url = `https://api.github.com/search/issues?q=${encodeURIComponent(queryText)}&sort=updated&order=desc&per_page=${perPage}`;
  const json = await fetchJsonOrThrow(url);

  return (Array.isArray(json?.items) ? json.items : []).map((item, index) => ({
    id: String(item.id ?? `${cleanOwner}/${cleanRepo}/${item.number ?? index}`),
    index: index + 1,
    number: Number(item.number ?? 0),
    title: String(item.title ?? 'Untitled pull request'),
    author: String(item.user?.login ?? 'unknown'),
    mergedAt: item.closed_at || item.updated_at || '',
    url: item.html_url || '',
    description: `#${item.number ?? ''} ${item.title ?? 'Merged pull request'}`.trim(),
  }));
}

export async function getRepoStats(owner, repo, username, { since = '', until = '' } = {}) {
  if (!owner?.trim() || !repo?.trim()) {
    throw new Error('Repository owner/name is required before syncing.');
  }

  const cleanOwner = owner.trim();
  const cleanRepo = repo.trim();
  const cleanUsername = username?.trim();
  const repoQuery = `repo:${cleanOwner}/${cleanRepo}`;
  const userPrefix = cleanUsername ? ` author:${cleanUsername}` : '';
  const reviewPrefix = cleanUsername ? ` reviewed-by:${cleanUsername}` : '';
  const mergedRange = dateRangeQuery('merged', since, until);
  const createdRange = dateRangeQuery('created', since, until);
  const updatedRange = dateRangeQuery('updated', since, until);

  const mergedPRs = await searchCount(`${repoQuery} is:pr is:merged${userPrefix}${mergedRange}`);
  await delay(300);
  const openPRs = await searchCount(`${repoQuery} is:pr is:open${userPrefix}${createdRange}`);
  await delay(300);
  const reviews = cleanUsername ? await searchCount(`${repoQuery} is:pr${reviewPrefix}${updatedRange}`) : 0;
  await delay(300);
  const commits = await fetchCommitCount(cleanOwner, cleanRepo, cleanUsername, { since, until });
  await delay(300);
  const repoMergedPRs = await searchCount(`${repoQuery} is:pr is:merged${mergedRange}`);

  return {
    user: {
      commits,
      mergedPRs,
      openPRs,
      reviews,
    },
    repo: {
      commits: 0,
      mergedPRs: repoMergedPRs,
      openPRs: 0,
    },
  };
}

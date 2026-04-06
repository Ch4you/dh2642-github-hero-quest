const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

function getHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
  };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  return headers;
}

async function fetchJsonOrThrow(url) {
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    const rateHint = response.status === 403 ? ' (possible rate limit)' : '';
    throw new Error(`GitHub API failed (${response.status})${rateHint}`);
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

async function fetchCommitCount(owner, repo) {
  const url = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    const rateHint = response.status === 403 ? ' (possible rate limit)' : '';
    throw new Error(`GitHub commits API failed (${response.status})${rateHint}`);
  }
  const linkHeader = response.headers.get('link');
  const lastPage = parseLastPageFromLink(linkHeader);
  if (lastPage) return lastPage;
  const body = await response.json();
  return Array.isArray(body) ? body.length : 0;
}

export async function getRepoStats(owner, repo) {
  if (!owner || !repo) {
    throw new Error('Repository owner/name is required before syncing.');
  }

  const repoQuery = `${owner}/${repo}`;
  const mergedUrl = `https://api.github.com/search/issues?q=repo:${encodeURIComponent(repoQuery)}+is:pr+is:merged&per_page=1`;
  const openUrl = `https://api.github.com/search/issues?q=repo:${encodeURIComponent(repoQuery)}+is:pr+is:open&per_page=1`;

  const [mergedJson, openJson, commits] = await Promise.all([
    fetchJsonOrThrow(mergedUrl),
    fetchJsonOrThrow(openUrl),
    fetchCommitCount(owner, repo),
  ]);

  return {
    commits: Number(commits || 0),
    mergedPRs: Number(mergedJson?.total_count ?? 0),
    openPRs: Number(openJson?.total_count ?? 0),
  };
}


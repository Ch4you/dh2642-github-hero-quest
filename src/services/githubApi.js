// to do(graded): implement robust GitHub API strategy (pagination/rate limits) and correct merged PR counting.
// If you need stable counts without heavy requests, consider using dedicated endpoints or GraphQL.
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;

// ---------------------------------------------------------------------------
// Mock helpers — replace each function body with real fetch calls when ready.
// Real endpoint reference is included as a comment above each function.
// ---------------------------------------------------------------------------

/**
 * GET /users/{username}
 * Real: fetch(`https://api.github.com/users/${username}`, { headers })
 */
export async function getUserProfile(username) {
  // -- Real API (uncomment to use) --
  // const headers = { Accept: 'application/vnd.github+json' };
  // if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  // const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
  // if (!res.ok) throw new Error(`GitHub user request failed: ${res.status}`);
  // return res.json();

  return {
    login: username,
    id: 1000001,
    avatar_url: `https://avatars.githubusercontent.com/u/1000001?v=4`,
    html_url: `https://github.com/${username}`,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    company: 'KTH Royal Institute of Technology',
    blog: '',
    location: 'Stockholm, Sweden',
    email: null,
    bio: 'Mock GitHub user for HeroQuest',
    public_repos: 12,
    public_gists: 3,
    followers: 42,
    following: 17,
    created_at: '2020-01-15T10:00:00Z',
    updated_at: '2024-03-01T08:30:00Z',
  };
}

/**
 * GET /users/{username}/repos?per_page=100&sort=updated
 * Real: fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, { headers })
 */
export async function getRepositories(username) {
  // -- Real API (uncomment to use) --
  // const headers = { Accept: 'application/vnd.github+json' };
  // if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  // const res = await fetch(
  //   `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`,
  //   { headers }
  // );
  // if (!res.ok) throw new Error(`GitHub repos request failed: ${res.status}`);
  // return res.json();

  const base = {
    owner: { login: username, avatar_url: `https://avatars.githubusercontent.com/u/1000001?v=4` },
    private: false,
    fork: false,
    forks_count: 0,
    open_issues_count: 0,
    watchers_count: 0,
    language: 'JavaScript',
    license: null,
    topics: [],
    visibility: 'public',
    default_branch: 'main',
  };

  return [
    {
      ...base,
      id: 2000001,
      name: 'hero-quest',
      full_name: `${username}/hero-quest`,
      html_url: `https://github.com/${username}/hero-quest`,
      description: 'GitHub Hero Quest — interactive stats game',
      stargazers_count: 8,
      language: 'JavaScript',
      updated_at: '2024-04-01T12:00:00Z',
      created_at: '2024-01-10T09:00:00Z',
      pushed_at: '2024-04-01T11:50:00Z',
      topics: ['react', 'firebase', 'github-api'],
    },
    {
      ...base,
      id: 2000002,
      name: 'dinner-planner',
      full_name: `${username}/dinner-planner`,
      html_url: `https://github.com/${username}/dinner-planner`,
      description: 'DH2642 Dinner Planner project',
      stargazers_count: 3,
      language: 'JavaScript',
      updated_at: '2024-03-20T16:00:00Z',
      created_at: '2023-09-05T08:00:00Z',
      pushed_at: '2024-03-20T15:45:00Z',
      topics: ['react', 'iprog'],
    },
    {
      ...base,
      id: 2000003,
      name: 'algorithms-course',
      full_name: `${username}/algorithms-course`,
      html_url: `https://github.com/${username}/algorithms-course`,
      description: 'Solutions and notes for algorithms course',
      stargazers_count: 1,
      language: 'Python',
      updated_at: '2024-02-10T10:30:00Z',
      created_at: '2023-08-20T07:00:00Z',
      pushed_at: '2024-02-10T10:20:00Z',
      topics: [],
    },
  ];
}

/**
 * GET /repos/{owner}/{repo}/commits?per_page=30
 * Real: fetch(`https://api.github.com/repos/${username}/${repo}/commits?per_page=30`, { headers })
 */
export async function getCommits(username, repo) {
  // -- Real API (uncomment to use) --
  // const headers = { Accept: 'application/vnd.github+json' };
  // if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  // const res = await fetch(
  //   `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo)}/commits?per_page=30`,
  //   { headers }
  // );
  // if (!res.ok) throw new Error(`GitHub commits request failed: ${res.status}`);
  // return res.json();

  const authorStub = {
    login: username,
    id: 1000001,
    avatar_url: `https://avatars.githubusercontent.com/u/1000001?v=4`,
    html_url: `https://github.com/${username}`,
  };

  const messages = [
    'feat: add leaderboard real-time sync',
    'fix: correct commit count pagination',
    'refactor: extract Firebase service layer',
    'feat: implement user profile card',
    'chore: update dependencies',
    'docs: add README setup instructions',
    'test: add unit tests for githubApi',
    'fix: handle rate limit errors gracefully',
    'feat: add repository stats chart',
    'style: apply consistent token colors',
  ];

  const now = new Date('2024-04-01T12:00:00Z');
  return messages.map((message, i) => {
    const date = new Date(now - i * 24 * 60 * 60 * 1000).toISOString();
    const sha = Math.random().toString(16).slice(2, 42).padEnd(40, '0');
    return {
      sha,
      html_url: `https://github.com/${username}/${repo}/commit/${sha}`,
      commit: {
        message,
        author: { name: username, email: `${username}@example.com`, date },
        committer: { name: username, email: `${username}@example.com`, date },
        tree: { sha: sha.split('').reverse().join('') },
        comment_count: 0,
      },
      author: authorStub,
      committer: authorStub,
      parents: i < messages.length - 1 ? [{ sha: 'parent-placeholder' }] : [],
    };
  });
}

export async function getRepoStats(owner, repo) {
  if (!owner || !repo) return { commits: 0, mergedPRs: 0, openPRs: 0 };

  const headers = { Accept: 'application/vnd.github+json' };
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`;

  try {
    const pullsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/pulls?state=open&per_page=100`;
    const commitsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits?per_page=1`;

    const [pullsRes, commitsRes] = await Promise.all([fetch(pullsUrl, { headers }), fetch(commitsUrl, { headers })]);
    if (!pullsRes.ok) throw new Error(`GitHub pulls request failed: ${pullsRes.status}`);
    if (!commitsRes.ok) throw new Error(`GitHub commits request failed: ${commitsRes.status}`);

    const pulls = await pullsRes.json();
    const openPRs = Array.isArray(pulls) ? pulls.length : 0;

    const commitsJson = await commitsRes.json();
    const commits = Array.isArray(commitsJson) ? commitsJson.length : 0;

    return { commits, mergedPRs: 0, openPRs };
  } catch {
    return { commits: 0, mergedPRs: 0, openPRs: 0 };
  }
}


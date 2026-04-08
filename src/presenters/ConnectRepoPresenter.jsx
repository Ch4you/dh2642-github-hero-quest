import { useEffect, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '../models/StoreProvider.jsx';
import ShellPresenter from './ShellPresenter.jsx';
import ConnectRepoView from '../views/ConnectRepoView.jsx';
import { getRepositories } from '../services/githubApi.js';

function parseRepository(input) {
  const raw = input.trim();
  if (!raw) return { owner: '', name: '' };

  const urlMatch = raw.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (urlMatch) return { owner: urlMatch[1], name: urlMatch[2] };

  const parts = raw.split('/');
  if (parts.length >= 2) return { owner: parts[0], name: parts[1] };
  return { owner: '', name: '' };
}

const ConnectRepoPresenter = observer(function ConnectRepoPresenter() {
  const store = useStore();
  const [repositoryInput, setRepositoryInput] = useState('https://github.com/kth-media-lab/github-hero-quest');
  const [connectError, setConnectError] = useState('');
  const [recentRepositories, setRecentRepositories] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const username = store.profile.username?.trim();
    if (!username) {
      setRecentRepositories([]);
      return undefined;
    }
    setRecentLoading(true);
    getRepositories(username)
      .then((repos) => {
        if (cancelled) return;
        const list = (Array.isArray(repos) ? repos : [])
          .slice(0, 8)
          .map((r) => ({
            name: r.full_name,
            date: r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '',
          }));
        setRecentRepositories(list);
      })
      .catch(() => {
        if (!cancelled) setRecentRepositories([]);
      })
      .finally(() => {
        if (!cancelled) setRecentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [store.profile.username]);

  function connect() {
    const parsed = parseRepository(repositoryInput);
    if (!parsed.owner || !parsed.name) {
      setConnectError('Invalid repository format. Use owner/repo or a GitHub URL.');
      return;
    }
    setConnectError('');
    store.connectRepository(parsed);
  }

  return (
    <ShellPresenter current="settings">
      <ConnectRepoView
        repositoryInput={repositoryInput}
        onRepositoryInputChange={(value) => {
          setRepositoryInput(value);
          if (connectError) setConnectError('');
        }}
        onConnect={connect}
        onUseSample={() => {
          setRepositoryInput('https://github.com/kth-media-lab/github-hero-quest');
          setConnectError('');
        }}
        onOpenRecent={(repoName) => {
          setRepositoryInput(`https://github.com/${repoName}`);
          setConnectError('');
        }}
        recentRepositories={recentRepositories}
        recentLoading={recentLoading}
        connectError={connectError}
      />
    </ShellPresenter>
  );
});

export default ConnectRepoPresenter;

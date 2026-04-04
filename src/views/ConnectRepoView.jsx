import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { repoHistory } from '../models/mockData.js';
import { Input } from '../components/ui/input.jsx';

function parseRepo(input) {
  const raw = input.trim();
  if (!raw) return { owner: '', name: '' };

  // Accept `owner/name` or full GitHub URL.
  const urlMatch = raw.match(/github\.com\/([^/]+)\/([^/]+)/i);
  if (urlMatch) return { owner: urlMatch[1], name: urlMatch[2] };

  const parts = raw.split('/');
  if (parts.length >= 2) return { owner: parts[0], name: parts[1] };
  return { owner: '', name: '' };
}

export default function ConnectRepoView({ onConnectRepository }) {
  const [value, setValue] = useState('https://github.com/kth-media-lab/github-hero-quest');

  function onConnect() {
    const { owner, name } = parseRepo(value);
    if (!owner || !name) return;
    onConnectRepository?.({ owner, name });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-3xl">Connect a repository</CardTitle>
          <CardDescription>Paste a GitHub repository URL or enter owner/name.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Repository URL</label>
            <Input value={value} onChange={(e) => setValue(e.target.value)} className="h-12 rounded-2xl" />
            <p className="text-sm text-slate-500">We validate the repository before adding it.</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onConnect}
              className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
            >
              Connect repository
            </Button>
            <Button
              variant="outline"
              className="rounded-2xl border-slate-200"
              onClick={() => setValue('https://github.com/kth-media-lab/github-hero-quest')}
            >
              Use sample repository
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Supported data: repository metadata, commits, pull requests, and reviews.
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-600">
            {[
              'Validate the repository',
              'Sync contributor activity',
              'Calculate XP and levels',
              'Show quest progress and leaderboard',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {item}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[28px] border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Recent repositories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {repoHistory.map((repo) => (
              <div key={repo.name} className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">
                <div>
                  <div className="font-medium text-slate-900">{repo.name}</div>
                  <div className="text-sm text-slate-500">{repo.date}</div>
                </div>
                <Button
                  variant="ghost"
                  className="rounded-xl"
                  onClick={() => setValue(`https://github.com/${repo.name}`)}
                >
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


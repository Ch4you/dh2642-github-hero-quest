import { ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

export default function SetupView({ username, onUsernameChange, onContinue }) {
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center justify-center">
        <Card className="w-full rounded-[28px] border-slate-200 shadow-lg shadow-slate-200/60">
          <CardHeader>
            <CardTitle className="text-2xl">Complete your profile</CardTitle>
            <CardDescription>We use your GitHub username to map repository activity to your progress.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">GitHub username</label>
              <Input
                value={username}
                onChange={(e) => onUsernameChange?.(e.target.value)}
                className="h-12 rounded-2xl"
              />
              <p className="text-sm text-slate-500">Example: octocat</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              This lets the system explain your XP using real commits, PRs, and reviews.
            </div>

            <div className="flex justify-end">
              <Button
                onClick={onContinue}
                className="h-11 rounded-2xl bg-slate-900 px-6 text-white hover:bg-slate-800"
              >
                Save and continue <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


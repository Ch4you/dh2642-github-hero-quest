import { motion } from 'framer-motion';
import { CheckCircle2, Trophy } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { LoadingSpinner } from '../components/ui/loading-spinner.jsx';

export default function LandingView({
  onContinue,
  isAuthenticating = false,
  authPhase = 'Signing in with GitHub...',
  errorMessage = '',
}) {

  return (
    <div className="relative min-h-screen bg-slate-50 p-8">
      {isAuthenticating && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-50/80 backdrop-blur-sm">
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-sm">
            <LoadingSpinner className="h-5 w-5" label={authPhase} />
          </div>
        </div>
      )}
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-center px-4 lg:px-12">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <Trophy className="h-4 w-4 text-violet-600" /> GitHub Hero Quest
          </div>
          <h1 className="max-w-xl text-5xl font-bold tracking-tight text-slate-900">
            Level up your team’s GitHub collaboration.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Turn commits and pull requests into XP, requests, progress insight, and a transparent leaderboard your team can actually use.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Track contribution progress in one place',
              'Create shared coding requests with deadlines',
              'Explain rankings with clear XP breakdowns',
            ].map((item) => (
              <div key={item} className="flex items-center gap-3 text-slate-700">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" /> {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center">
          <Card className="w-full max-w-md rounded-[28px] border-slate-200 shadow-lg shadow-slate-200/60">
            <CardHeader>
              <CardTitle className="text-2xl">Sign in to continue</CardTitle>
              <CardDescription>Sign in first, then explicitly choose the repository you want to track.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={onContinue}
                disabled={isAuthenticating}
                className="h-12 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              >
                <Trophy className="mr-2 h-4 w-4" />
                {isAuthenticating ? 'Signing in...' : 'Sign in with GitHub'}
              </Button>
              {errorMessage && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {errorMessage}
                </div>
              )}
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
              </div>
              <Input disabled placeholder="Email sign-in unavailable in prototype" className="h-12 rounded-2xl" />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Only GitHub identity is requested. Repository activity is read from public GitHub APIs.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


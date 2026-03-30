import { motion } from 'framer-motion';
import { CheckCircle2, Trophy } from 'lucide-react';
import { useGame } from '../models/GameContext.jsx';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

export default function LandingView() {
  const { setStep } = useGame();

  // to do(graded): document target group, use case, and usability feedback sessions.

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl grid-cols-1 gap-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col justify-center px-4 lg:px-12">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            <Trophy className="h-4 w-4 text-violet-600" /> GitHub Hero Quest
          </div>
          <h1 className="max-w-xl text-5xl font-bold tracking-tight text-slate-900">
            Level up your team’s GitHub collaboration.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
            Turn commits and pull requests into XP, quests, progress insight, and a transparent leaderboard your team can actually use.
          </p>

          <div className="mt-8 space-y-3">
            {[
              'Track contribution progress in one place',
              'Create shared coding quests with deadlines',
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
              <CardDescription>Set up your workspace and connect GitHub activity to team progress.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={() => setStep('setup')}
                className="h-12 w-full rounded-2xl bg-slate-900 text-white hover:bg-slate-800"
              >
                <Trophy className="mr-2 h-4 w-4" /> Sign in with Google
              </Button>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="h-px flex-1 bg-slate-200" /> OR <div className="h-px flex-1 bg-slate-200" />
              </div>
              <Input disabled placeholder="Email sign-in unavailable in prototype" className="h-12 rounded-2xl" />
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                Your repository data stays organized by workspace and user identity.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}


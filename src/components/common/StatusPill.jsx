import { AlertTriangle, CheckCircle2, Clock3 } from 'lucide-react';

export default function StatusPill({ status = 'idle' }) {
  const map = {
    idle: { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: Clock3, text: 'Not synced yet' },
    checking: { cls: 'bg-slate-100 text-slate-900 border-slate-200', icon: Clock3, text: 'Checking repository' },
    synced: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2, text: 'Synced successfully' },
    syncing: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock3, text: 'Syncing GitHub activity' },
    saving: { cls: 'bg-violet-50 text-violet-700 border-violet-200', icon: Clock3, text: 'Saving progress' },
    error: { cls: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangle, text: 'Sync failed' },
  }[status] ?? { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: Clock3, text: 'Unknown status' };

  const Icon = map.icon;
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${map.cls}`}>
      <Icon className="h-4 w-4" />
      {map.text}
    </div>
  );
}

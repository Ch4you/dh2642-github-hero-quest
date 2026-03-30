import { cn } from '../ui/utils.js';

export default function MetricCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className={cn('rounded-3xl border-slate-200 shadow-sm bg-white border')}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-3">
            <Icon className="h-5 w-5 text-slate-700" />
          </div>
        </div>
      </div>
    </div>
  );
}


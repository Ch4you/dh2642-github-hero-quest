import { Copy } from 'lucide-react';
import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../components/ui/utils.js';
import { formatDateTime } from '../shared/formatters.js';

export default function TeammatesTableView({ teammates, loading = false, repoLabel, onSelectPlayer, onCopyInvite }) {
  if (loading && !teammates.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">Loading repository contributors...</div>;
  }

  if (!teammates.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No contributors were loaded for this repository yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Index</th>
            <th className="px-4 py-3">Repository</th>
            <th className="px-4 py-3">Username</th>
            <th className="px-4 py-3">GitHub commits</th>
            <th className="px-4 py-3">Last synced</th>
            <th className="px-4 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {teammates.map((row, index) => (
            <tr key={row.username} className={cn('hover:bg-slate-50', !row.synced && 'bg-slate-50 text-slate-400')}>
              <td className="px-4 py-3 text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 text-slate-600">{repoLabel}</td>
              <td className={cn('px-4 py-3 font-medium', row.synced ? 'text-slate-900' : 'text-slate-400')}>{row.username}</td>
              <td className="px-4 py-3 text-slate-600">{row.contributions ?? 0}</td>
              <td className="px-4 py-3 text-slate-600">{row.synced ? formatDateTime(row.updatedAtMs || row.allTimeSyncedAtMs) : 'Not synced yet'}</td>
              <td className="px-4 py-3 text-right">
                {row.synced ? (
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => onSelectPlayer?.(row.player)}>
                    View
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => onCopyInvite?.(row.username)}>
                    <Copy className="h-3.5 w-3.5" /> Copy invite
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

import { formatDateTime } from '../shared/formatters.js';

export default function MergedPullRequestTableView({ items }) {
  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">No merged pull request details loaded yet.</div>;
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-4 py-3">Index</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Author</th>
            <th className="px-4 py-3">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item, index) => (
            <tr key={item.id || item.url || index} className="hover:bg-slate-50">
              <td className="px-4 py-3 text-slate-500">{index + 1}</td>
              <td className="px-4 py-3 text-slate-600">{formatDateTime(item.mergedAt)}</td>
              <td className="px-4 py-3 text-slate-600">{item.author}</td>
              <td className="px-4 py-3 font-medium text-slate-900">
                {item.url ? (
                  <a className="hover:underline" href={item.url} target="_blank" rel="noreferrer">
                    {item.description || item.title}
                  </a>
                ) : (
                  item.description || item.title
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

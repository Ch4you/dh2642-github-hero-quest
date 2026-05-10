import { X } from 'lucide-react';

export default function DetailModalView({ type, onClose, children, title, eyebrow = 'Details' }) {
  if (!type) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative max-h-[86vh] w-full max-w-4xl overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{eyebrow}</div>
            <h2 className="mt-3 text-2xl font-bold text-slate-900">{title}</h2>
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[calc(86vh-120px)] overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

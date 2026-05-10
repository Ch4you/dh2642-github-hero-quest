import { Button } from '../../components/ui/button.jsx';
import { cn } from '../../components/ui/utils.js';

export default function ConfirmationDialogView({ confirmation, onCancel, onConfirm }) {
  if (!confirmation) return null;
  const danger = confirmation.tone === 'danger';
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">{confirmation.title}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{confirmation.message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="outline" className="rounded-2xl border-slate-200" onClick={onCancel}>
            {confirmation.cancelLabel || 'Cancel'}
          </Button>
          <Button
            type="button"
            className={cn('rounded-2xl text-white', danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800')}
            onClick={onConfirm}
          >
            {confirmation.confirmLabel || 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}

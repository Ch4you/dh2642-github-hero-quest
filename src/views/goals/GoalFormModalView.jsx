import { RotateCcw, X } from 'lucide-react';
import { Badge } from '../../components/ui/badge.jsx';
import { Button } from '../../components/ui/button.jsx';
import { Input } from '../../components/ui/input.jsx';
import { Progress } from '../../components/ui/progress.jsx';
import { cn } from '../../components/ui/utils.js';
import InfoTip from '../shared/InfoTip.jsx';
import { statusLabel, statusTone } from '../shared/goalStatus.js';

export default function GoalFormModalView({
  open,
  form,
  preview,
  metricTypes,
  formValid,
  onFieldChange,
  onSaveRequest,
  onSaveDraft,
  onClearForm,
  onClose,
}) {
  if (!open) return null;
  const editing = Boolean(form?.id);
  const dateInvalid = form?.startDate && form?.endDate && form.endDate < form.startDate;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6">
      <div className="absolute inset-0 bg-slate-900/35" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-3xl overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-6">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-slate-900">{editing ? 'Edit team goal' : 'Create a team goal'}</h2>
            
            </div>
           
          </div>
          <button type="button" className="rounded-2xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto p-6">
          <div className="grid gap-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Goal title *</label>
                <Input
                  value={form.title}
                  placeholder="e.g. Merge 10 PRs before demo week"
                  onChange={(event) => onFieldChange?.('title', event.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Description</label>
                <textarea
                  value={form.description}
                  placeholder="Optional notes for your team"
                  onChange={(event) => onFieldChange?.('description', event.target.value)}
                  className="min-h-[96px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Metric type *</label>
                  <select
                    value={form.metricType}
                    onChange={(event) => onFieldChange?.('metricType', event.target.value)}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <option value="">Choose a metric</option>
                    {metricTypes.map((metric) => (
                      <option key={metric.value} value={metric.value}>
                        {metric.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Target value *</label>
                  <Input
                    type="number"
                    min="1"
                    placeholder="e.g. 10"
                    value={form.targetValue}
                    onChange={(event) => onFieldChange?.('targetValue', event.target.value)}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Start date *</label>
                  <Input type="date" className="h-12 rounded-2xl" value={form.startDate} onChange={(event) => onFieldChange?.('startDate', event.target.value)} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">End date *</label>
                  <Input type="date" className="h-12 rounded-2xl" value={form.endDate} onChange={(event) => onFieldChange?.('endDate', event.target.value)} />
                </div>
              </div>
              {dateInvalid && <p className="text-sm font-medium text-rose-600">End date must be after the start date.</p>}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Team reward pool *</label>
                <Input
                  type="number"
                  min="0"
                  placeholder="e.g. 100"
                  value={form.rewardXp}
                  onChange={(event) => onFieldChange?.('rewardXp', event.target.value)}
                  className="h-12 rounded-2xl"
                />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-slate-600">{preview?.metricLabel}</span>
                  <span className="font-medium text-slate-900">{preview?.current ?? 0} / {preview?.goal ?? 1}</span>
                </div>
                <Progress value={preview?.pct ?? 0} className="h-3 rounded-full" />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={onClearForm}>
              <RotateCcw className="h-4 w-4" /> Reset
            </Button>
            <Button variant="outline" className="rounded-2xl border-slate-200" onClick={onSaveDraft}>
              Save
            </Button>
            <Button variant="ghost" className="rounded-2xl" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onSaveRequest} disabled={!formValid} className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800">
              {editing ? 'Update goal' : 'Create goal'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

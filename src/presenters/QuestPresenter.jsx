import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import QuestConfiguratorView from '../views/QuestConfiguratorView.jsx';
import { REQUEST_METRIC_TYPES, addDaysDateString, getMetricLabel, todayDateString } from '../models/QuestModel.js';

function makeEmptyForm(repoKey) {
  return {
    id: '',
    title: 'New measurable request',
    description: 'Describe what the team should accomplish in this repository.',
    metricType: 'repoMergedPRs',
    targetValue: '5',
    startDate: todayDateString(),
    endDate: addDaysDateString(7),
    rewardXp: '50',
    repoKey,
  };
}

function formFromRequest(request, repoKey) {
  if (!request) return makeEmptyForm(repoKey);
  return {
    id: request.id,
    title: request.title,
    description: request.description ?? '',
    metricType: request.metricType ?? 'repoMergedPRs',
    targetValue: String(request.targetValue ?? 1),
    startDate: request.startDate || todayDateString(),
    endDate: request.endDate || addDaysDateString(7),
    rewardXp: String(request.rewardXp ?? 50),
    repoKey,
  };
}

const QuestPresenter = observer(function QuestPresenter() {
  const store = useStore();
  const { quest } = useControllers();
  const [form, setForm] = useState(() => store.requestDraft ?? makeEmptyForm(store.repoKeyString));

  const requestRows = useMemo(
    () =>
      store.requestSummaries.map((request) => ({
        ...request,
        metricLabel: getMetricLabel(request.metricType),
      })),
    [store.requestSummaries],
  );

  const preview = useMemo(() => {
    const target = Math.max(1, Number(form.targetValue || 1));
    const existingValue = form.id ? Number(store.requestMetricsById[form.id] ?? 0) : 0;
    const pct = Math.min(100, Math.max(0, Math.round((existingValue / target) * 100)));
    const today = todayDateString();
    const status = pct >= 100 ? 'completed' : today < form.startDate ? 'scheduled' : today > form.endDate ? 'expired' : 'active';
    return {
      goal: target,
      current: existingValue,
      pct,
      status,
      metricLabel: getMetricLabel(form.metricType),
    };
  }, [form, store.requestMetricsById]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildPayload() {
    return {
      id: form.id || undefined,
      title: form.title,
      description: form.description,
      metricType: form.metricType,
      targetValue: Number(form.targetValue),
      startDate: form.startDate,
      endDate: form.endDate,
      rewardXp: Number(form.rewardXp),
    };
  }

  function startNewRequest() {
    setForm(makeEmptyForm(store.repoKeyString));
  }

  function editRequest(requestId) {
    const request = store.requests.find((item) => item.id === requestId);
    setForm(formFromRequest(request, store.repoKeyString));
  }

  function requestDeleteRequest(requestId) {
    const request = store.requests.find((item) => item.id === requestId);
    if (!request) return;
    store.requestConfirmation({
      title: `Delete “${request.title}”?`,
      message: 'This removes the request from the current repository workspace. It does not delete the GitHub repository or other repository data.',
      confirmLabel: 'Delete request',
      tone: 'danger',
      onConfirm: () => quest.deleteRequest(requestId),
    });
  }

  return (
    <QuestConfiguratorView
      form={form}
      repo={store.repo}
      preview={preview}
      requests={requestRows}
      metricTypes={REQUEST_METRIC_TYPES}
      onFieldChange={updateField}
      onNewRequest={startNewRequest}
      onEditRequest={editRequest}
      onDeleteRequest={requestDeleteRequest}
      onSaveRequest={() => quest.saveRequest(buildPayload())}
      onSaveDraft={() => quest.saveDraft(buildPayload())}
      onBackDashboard={() => store.setStep('dashboard')}
    />
  );
});

export default QuestPresenter;

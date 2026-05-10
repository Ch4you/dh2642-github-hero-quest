import { useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import QuestConfiguratorView from '../views/QuestConfiguratorView.jsx';
import { REQUEST_METRIC_TYPES, addDaysDateString, getMetricDefinition, getMetricLabel, todayDateString } from '../models/QuestModel.js';

function makeEmptyForm(repoKey) {
  return {
    id: '',
    title: '',
    description: '',
    metricType: 'repoMergedPRs',
    targetValue: '',
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
    targetValue: String(request.targetValue ?? ''),
    startDate: request.startDate || todayDateString(),
    endDate: request.endDate || addDaysDateString(7),
    rewardXp: String(request.rewardXp ?? 50),
    repoKey,
  };
}

function buildMemberRows(goal, leaderboard, allUserContributionsById) {
  const teamValue = Number(goal?.value ?? goal?.progress?.current ?? 0);
  const completed = goal?.status === 'completed';
  return leaderboard.map((player) => {
    const record = allUserContributionsById?.[player.username] || {};
    const contribution = Number(record?.contributionsById?.[goal.id] ?? 0);
    const share = teamValue > 0 ? contribution / teamValue : 0;
    const bonusXp = completed ? Math.round(Number(goal.rewardXp ?? 0) * Math.min(1, Math.max(0, share))) : 0;
    return {
      username: player.username,
      name: player.name,
      contribution,
      share,
      bonusXp,
      syncedAtMs: Number(record?.syncedAtMs ?? player.updatedAtMs ?? 0),
    };
  });
}

const QuestPresenter = observer(function QuestPresenter() {
  const store = useStore();
  const { quest } = useControllers();
  const [form, setForm] = useState(() => store.requestDraft ?? makeEmptyForm(store.repoKeyString));
  const [statusFilter, setStatusFilter] = useState('active');
  const [formOpen, setFormOpen] = useState(false);
  const [detailGoalId, setDetailGoalId] = useState('');

  const requestRows = useMemo(
    () =>
      store.requestSummaries.map((request) => ({
        ...request,
        metricLabel: getMetricLabel(request.metricType),
        contributionLabel: getMetricDefinition(request.metricType).contributionLabel,
      })),
    [store.requestSummaries],
  );

  const statusCounts = useMemo(() => {
    const counts = { scheduled: 0, active: 0, completed: 0, expired: 0 };
    for (const request of requestRows) {
      if (counts[request.status] !== undefined) counts[request.status] += 1;
    }
    return counts;
  }, [requestRows]);

  const visibleRequests = useMemo(
    () => requestRows.filter((request) => request.status === statusFilter),
    [requestRows, statusFilter],
  );

  const selectedGoal = useMemo(
    () => requestRows.find((request) => request.id === detailGoalId) ?? null,
    [requestRows, detailGoalId],
  );

  const memberContributionRows = useMemo(
    () => (selectedGoal ? buildMemberRows(selectedGoal, store.leaderboard, store.allUserRequestContributionsById) : []),
    [selectedGoal, store.leaderboard, store.allUserRequestContributionsById],
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

  const formValid = Boolean(
    form.title?.trim() &&
      form.metricType &&
      Number(form.targetValue) > 0 &&
      form.startDate &&
      form.endDate &&
      form.endDate >= form.startDate &&
      Number(form.rewardXp) >= 0,
  );

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
    setFormOpen(true);
  }

  function editRequest(requestId) {
    const request = store.requests.find((item) => item.id === requestId);
    setForm(formFromRequest(request, store.repoKeyString));
    setDetailGoalId('');
    setFormOpen(true);
  }

  async function saveRequestAndClose() {
    if (!formValid) return;
    await quest.saveRequest(buildPayload());
    setFormOpen(false);
  }

  function saveDraftAndClose() {
    quest.saveDraft(buildPayload());
    setFormOpen(false);
  }

  function requestDeleteRequest(requestId) {
    const request = store.requests.find((item) => item.id === requestId);
    if (!request) return;
    store.requestConfirmation({
      title: `Delete goal “${request.title}”?`,
      message: 'This removes the goal from the current repository workspace. It does not delete the GitHub repository or other repository data.',
      confirmLabel: 'Delete goal',
      tone: 'danger',
      onConfirm: () => {
        setDetailGoalId('');
        quest.deleteRequest(requestId);
      },
    });
  }

  return (
    <QuestConfiguratorView
      form={form}
      formOpen={formOpen}
      formValid={formValid}
      statusFilter={statusFilter}
      statusCounts={statusCounts}
      selectedGoal={selectedGoal}
      memberContributionRows={memberContributionRows}
      repo={store.repo}
      preview={preview}
      requests={visibleRequests}
      allRequests={requestRows}
      metricTypes={REQUEST_METRIC_TYPES}
      onFieldChange={updateField}
      onNewRequest={startNewRequest}
      onCloseForm={() => setFormOpen(false)}
      onStatusFilterChange={setStatusFilter}
      onViewRequest={setDetailGoalId}
      onCloseDetail={() => setDetailGoalId('')}
      onEditRequest={editRequest}
      onDeleteRequest={requestDeleteRequest}
      onSaveRequest={saveRequestAndClose}
      onSaveDraft={saveDraftAndClose}
    />
  );
});

export default QuestPresenter;

import { useEffect, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useControllers, useStore } from '../stores/StoreProvider.jsx';
import QuestDashboardView from '../views/QuestDashboardView.jsx';
import { getXpBreakdown } from '../models/scoreRules.js';
import { REQUEST_METRIC_TYPES, addDaysDateString, getMetricDefinition, getMetricLabel, todayDateString } from '../models/QuestModel.js';


function makeEmptyForm(repoKey) {
  return {
    id: '',
    title: '',
    description: '',
    metricType: '',
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
    id: request.id || '',
    title: request.title || '',
    description: request.description ?? '',
    metricType: request.metricType ?? '',
    targetValue: String(request.targetValue ?? ''),
    startDate: request.startDate || todayDateString(),
    endDate: request.endDate || addDaysDateString(7),
    rewardXp: String(request.rewardXp ?? 50),
    repoKey,
  };
}

function isEditableStatus(status) {
  return status === 'scheduled' || status === 'active';
}

function latestActiveTime(goal) {
  const start = Date.parse(goal?.startDate || '');
  const end = Date.parse(goal?.endDate || '');
  return Math.max(Number.isFinite(start) ? start : 0, Number.isFinite(end) ? end : 0);
}

function buildInviteMessage(repoKey, username = '') {
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const mention = username ? `Hi @${username}, ` : '';
  return `${mention}join our GitHub Hero Quest workspace for ${repoKey}. Open ${appUrl} and sign in with GitHub, then connect ${repoKey} to sync your contribution data.`;
}

function clampPercent(value) {
  return Math.min(100, Math.max(0, Math.round(Number(value || 0))));
}

function goalElapsedPercentage(goal, now = new Date()) {
  const start = Date.parse(goal?.startDate || '');
  const end = Date.parse(goal?.endDate || '');
  const current = now.getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return clampPercent(((current - start) / (end - start)) * 100);
}

function buildGoalRisk(goal) {
  if (goal.status !== 'active') return null;
  const progressPercentage = clampPercent(goal.progress?.percentage ?? 0);
  const elapsedPercentage = goalElapsedPercentage(goal);
  const gap = elapsedPercentage - progressPercentage;
  if (gap <= 15) return null;
  return {
    gap,
    message: `${goal.metricLabel} is ${gap} percentage points behind the date progress.`,
  };
}

const DashboardPresenter = observer(function DashboardPresenter() {
  const store = useStore();
  const { repository, quest } = useControllers();
  const [form, setForm] = useState(() => formFromRequest(store.requestDraft, store.repoKeyString));
  const [formOpen, setFormOpen] = useState(false);

  const allGoalCards = useMemo(
    () =>
      store.requestSummaries.map((goal) => {
        const card = {
          ...goal,
          metricLabel: getMetricLabel(goal.metricType),
          contributionLabel: getMetricDefinition(goal.metricType).contributionLabel,
        };
        return { ...card, risk: buildGoalRisk(card) };
      }),
    [store.requestSummaries],
  );

  const activeGoalCards = useMemo(
    () => allGoalCards.filter((goal) => goal.status === 'active').sort((a, b) => latestActiveTime(b) - latestActiveTime(a)),
    [allGoalCards],
  );

  const goalPreviewCards = useMemo(
    () => activeGoalCards.slice(0, 1),
    [activeGoalCards],
  );


  const goalPreview = useMemo(() => {
    const target = Math.max(1, Number(form.targetValue || 1));
    const existingValue = form.id ? Number(store.requestMetricsById[form.id] ?? 0) : 0;
    const pct = Math.min(100, Math.max(0, Math.round((existingValue / target) * 100)));
    const today = todayDateString();
    let status;
    if (!form.startDate || !form.endDate) status = '';
    else if (today < form.startDate) status = 'scheduled';
    else if (today <= form.endDate) status = 'active';
    else status = pct >= 100 ? 'completed' : 'expired';
    return {
      goal: target,
      current: existingValue,
      pct,
      status,
      metricLabel: form.metricType ? getMetricLabel(form.metricType) : 'Choose a metric',
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

  const xpBars = useMemo(() => {
    const breakdown = getXpBreakdown(store.hero, store.scoreRules);
    const max = Math.max(1, ...breakdown.map((item) => item.count));
    return breakdown.map((item) => ({
      label: item.label,
      value: `${item.count} × ${item.rule} XP = ${item.xp}`,
      width: `${Math.round((item.count / max) * 100)}%`,
    }));
  }, [store.hero, store.scoreRules]);

  const hasContributorData = store.repositoryContributors.length > 0 && Number(store.repositoryContributorsSyncedAtMs) > 0;

  const teammateRows = useMemo(() => {
    if (!hasContributorData) return [];

    const syncedByUsername = new Map(store.leaderboard.map((player) => [player.username, player]));
    return store.repositoryContributors
      .map((contributor) => {
        const player = syncedByUsername.get(contributor.username);
        return {
          username: contributor.username,
          contributions: contributor.contributions ?? player?.commits ?? 0,
          synced: Boolean(player),
          player,
          updatedAtMs: player?.updatedAtMs ?? 0,
          allTimeSyncedAtMs: player?.allTimeSyncedAtMs ?? 0,
        };
      })
      .sort((a, b) => Number(b.synced) - Number(a.synced) || Number(b.contributions ?? 0) - Number(a.contributions ?? 0) || a.username.localeCompare(b.username));
  }, [hasContributorData, store.repositoryContributors, store.leaderboard]);

  const syncedContributorCount = hasContributorData ? teammateRows.filter((row) => row.synced).length : 0;
  const totalContributorCount = hasContributorData ? teammateRows.length : 0;
  const syncedContributorLabel = hasContributorData ? `${syncedContributorCount}/${totalContributorCount}` : store.repositoryContributorsLoading ? 'Loading…' : '—';

  const repoLabel = store.repoKeyString;

  useEffect(() => {
    if (repoLabel) {
      void repository.loadRepositoryContributors({ source: 'background' });
      void repository.loadMergedPullRequestDetails({ source: 'background', onlyIfCached: true });
    }
  }, [repoLabel, repository]);

  function handleModalOpen(type) {
    if (!repoLabel) return;
    if (type === 'merged') void repository.loadMergedPullRequestDetails();
    if (type === 'teammates') void repository.loadRepositoryContributors({ source: 'manual' });
  }


  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function buildPayload({ draft = false } = {}) {
    return {
      id: draft ? '' : form.id || undefined,
      title: form.title,
      description: form.description,
      metricType: form.metricType,
      targetValue: Number(form.targetValue),
      startDate: form.startDate,
      endDate: form.endDate,
      rewardXp: Number(form.rewardXp),
    };
  }

  function startNewGoal() {
    setForm(formFromRequest(store.requestDraft, store.repoKeyString));
    setFormOpen(true);
  }

  function clearForm() {
    setForm(makeEmptyForm(store.repoKeyString));
  }

  async function persistCurrentForm() {
    setFormOpen(false);
    await quest.saveRequest(buildPayload());
  }

  async function saveGoalAndClose() {
    if (!formValid) return;
    const editing = Boolean(form.id);
    if (!isEditableStatus(goalPreview.status)) {
      store.requestConfirmation({
        title: `Save as ${goalPreview.status} goal?`,
        message: editing
          ? `This update changes the goal status to ${goalPreview.status}. After saving it, the goal can still be deleted but can no longer be edited.`
          : `This goal will be created with status "${goalPreview.status}". It can still be deleted but cannot be edited after saving.`,
        confirmLabel: editing ? 'Save goal' : 'Create goal',
        onConfirm: () => {
          void persistCurrentForm();
        },
      });
      return;
    }
    await persistCurrentForm();
  }

  function saveDraftAndClose() {
    quest.saveDraft(buildPayload({ draft: true }));
    setFormOpen(false);
  }

  function handleCompleteGoal(goalId) {
    void quest.completeRequest(goalId);
  }

  async function copyInvite(username = '') {
    const message = buildInviteMessage(store.repoKeyString || 'this repository', username);
    try {
      await navigator.clipboard.writeText(message);
      store.setFlashMessage(username ? `Invite for @${username} copied.` : 'Invite copied.');
    } catch {
      store.setFlashMessage(message);
    }
  }

  return (
    <QuestDashboardView
      hero={store.hero}
      repo={store.repo}
      repoStats={store.repoStats}
      requests={goalPreviewCards}
      xpBars={xpBars}
      onOpenWorkspace={() => store.setStep('connect')}
      activeMembersCount={syncedContributorLabel}
      openRequestsCount={store.activeRequestCount}
      xpSubtitle="Your GitHub contribution XP"
      teammates={teammateRows}
      teammatesLoading={store.repositoryContributorsLoading && !hasContributorData}
      teammatesError={store.repositoryContributorsError}
      onSelectPlayer={store.selectPlayer}
      activeGoals={activeGoalCards}
      allUserContributionsById={store.allUserRequestContributionsById}
      mergedPullRequests={store.mergedPullRequests}
      onModalOpen={handleModalOpen}
      onCopyInvite={copyInvite}
      onCompleteGoal={handleCompleteGoal}
      goalForm={form}
      goalFormOpen={formOpen}
      goalFormValid={formValid}
      goalPreview={goalPreview}
      goalMetricTypes={REQUEST_METRIC_TYPES}
      onAddGoal={startNewGoal}
      onGoalFieldChange={updateField}
      onClearGoalForm={clearForm}
      onCloseGoalForm={() => setFormOpen(false)}
      onSaveGoal={saveGoalAndClose}
      onSaveGoalDraft={saveDraftAndClose}
    />
  );
});

export default DashboardPresenter;

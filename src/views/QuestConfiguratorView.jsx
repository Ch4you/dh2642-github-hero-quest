import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { STATUS_OPTIONS } from './shared/goalStatus.js';
import GoalStatusInfoView from './goals/GoalStatusInfoView.jsx';
import GoalStatusCardsView from './goals/GoalStatusCardsView.jsx';
import GoalTableView from './goals/GoalTableView.jsx';
import GoalFormModalView from './goals/GoalFormModalView.jsx';
import GoalDetailModalView from './goals/GoalDetailModalView.jsx';

export default function QuestConfiguratorView({
  form,
  formOpen,
  formValid,
  statusFilter,
  statusCounts = {},
  selectedGoal,
  memberContributionRows = [],
  preview,
  requests = [],
  metricTypes = [],
  onFieldChange,
  onNewRequest,
  onClearForm,
  onCloseForm,
  onStatusFilterChange,
  onViewRequest,
  onCloseDetail,
  onEditRequest,
  onDeleteRequest,
  onSaveRequest,
  onSaveDraft,
}) {
  const currentStatusLabel = STATUS_OPTIONS.find((item) => item.key === statusFilter)?.label ?? 'Active';

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Goal manager</h1>
        </div>
        <div className="flex items-center gap-2">
          <GoalStatusInfoView />
          <Button type="button" className="rounded-2xl bg-slate-900 text-white hover:bg-slate-800" onClick={onNewRequest}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>
      </div>

      <GoalStatusCardsView statusFilter={statusFilter} statusCounts={statusCounts} onStatusFilterChange={onStatusFilterChange} />

      <Card className="rounded-[28px] border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>{currentStatusLabel} goals</CardTitle>
        </CardHeader>
        <CardContent>
          <GoalTableView
            requests={requests}
            onViewRequest={onViewRequest}
            onEditRequest={onEditRequest}
            onDeleteRequest={onDeleteRequest}
          />
        </CardContent>
      </Card>

      <GoalFormModalView
        open={formOpen}
        form={form}
        preview={preview}
        metricTypes={metricTypes}
        formValid={formValid}
        onFieldChange={onFieldChange}
        onSaveRequest={onSaveRequest}
        onSaveDraft={onSaveDraft}
        onClearForm={onClearForm}
        onClose={onCloseForm}
      />

      <GoalDetailModalView
        goal={selectedGoal}
        memberContributionRows={memberContributionRows}
        onClose={onCloseDetail}
        onEditRequest={onEditRequest}
        onDeleteRequest={onDeleteRequest}
      />
    </div>
  );
}

import { Badge } from '../../components/ui/badge.jsx';
import { cn } from '../../components/ui/utils.js';
import InfoTip from '../shared/InfoTip.jsx';
import { STATUS_OPTIONS, statusTone } from '../shared/goalStatus.js';

export default function GoalStatusInfoView() {
  return (
    <InfoTip label="Goal status information">
      <div className="space-y-2">
        {STATUS_OPTIONS.map((status) => (
          <div key={status.key} className="flex items-center gap-2">
            <Badge className={cn('rounded-full', statusTone(status.key))}>{status.label}</Badge>
            <span>{status.key === 'scheduled' ? 'The goal has not reached its start date.' : status.key === 'active' ? 'Today is inside the date range and the target is not reached.' : status.key === 'completed' ? 'The measured metric reached the target.' : 'The end date passed before the target was reached.'}</span>
          </div>
        ))}
      </div>
    </InfoTip>
  );
}

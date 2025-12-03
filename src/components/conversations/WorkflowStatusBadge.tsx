import { useTranslation } from 'react-i18next';
import type { WorkflowStatus } from '../../types/conversation';

interface WorkflowStatusBadgeProps {
  workflowStatus: WorkflowStatus;
  className?: string;
}

const colorClasses: Record<WorkflowStatus, string> = {
  new: 'bg-blue-50 text-blue-700 border-blue-200',
  in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
  no_answer: 'bg-amber-50 text-amber-700 border-amber-200',
  won: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  lost: 'bg-rose-50 text-rose-700 border-rose-200',
};

const translationKeys: Record<WorkflowStatus, string> = {
  new: 'workflowStatus.new',
  in_progress: 'workflowStatus.inProgress',
  no_answer: 'workflowStatus.noAnswer',
  won: 'workflowStatus.won',
  lost: 'workflowStatus.lost',
};

export const WorkflowStatusBadge = ({
  workflowStatus,
  className = '',
}: WorkflowStatusBadgeProps) => {
  const { t } = useTranslation();

  if (!workflowStatus) return null;

  const colorClass = colorClasses[workflowStatus] || colorClasses.new;
  const label = t(translationKeys[workflowStatus]);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${colorClass} ${className}`}
    >
      {label}
    </span>
  );
};


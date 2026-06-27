import { Badge } from '@/components/ui/Badge';
import {
  PRIORITY_LABELS,
  STATUS_LABELS,
  type Priority,
  type Status,
} from '@/types/task';

type Tone = 'neutral' | 'green' | 'red' | 'amber' | 'blue' | 'violet';

const PRIORITY_TONE: Record<Priority, Tone> = {
  low: 'neutral',
  medium: 'blue',
  high: 'amber',
  critical: 'red',
};

const STATUS_TONE: Record<Status, Tone> = {
  new: 'neutral',
  in_progress: 'blue',
  review: 'violet',
  done: 'green',
  closed: 'neutral',
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  return <Badge tone={PRIORITY_TONE[priority]}>{PRIORITY_LABELS[priority]}</Badge>;
}

export function StatusBadge({ status }: { status: Status }) {
  return <Badge tone={STATUS_TONE[status]}>{STATUS_LABELS[status]}</Badge>;
}

/** Small avatar-ish chip with initials + name for a member. */
export function MemberBadge({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
        {initials || '?'}
      </span>
      <span className="text-sm text-slate-700 dark:text-slate-300">{name}</span>
    </span>
  );
}

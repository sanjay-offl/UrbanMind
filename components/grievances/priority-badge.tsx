import type { PriorityLevel } from '@/types/grievance';

interface PriorityBadgeProps {
  priority: PriorityLevel | string;
  className?: string;
}

const BADGE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; dot: string; label: string }
> = {
  critical: {
    bg: 'var(--badge-critical-bg, #FCE8E6)',
    text: 'var(--badge-critical-text, #C5221F)',
    border: 'var(--badge-critical-border, #FAD2CF)',
    dot: 'var(--badge-critical-dot, #EA4335)',
    label: 'Critical',
  },
  high: {
    bg: 'var(--badge-high-bg, #FEF7E0)',
    text: 'var(--badge-high-text, #B07200)',
    border: 'var(--badge-high-border, #FEEFC3)',
    dot: 'var(--badge-high-dot, #FBBC05)',
    label: 'High',
  },
  moderate: {
    bg: 'var(--badge-moderate-bg, #E8F0FE)',
    text: 'var(--badge-moderate-text, #1967D2)',
    border: 'var(--badge-moderate-border, #D2E3FC)',
    dot: 'var(--badge-moderate-dot, #4285F4)',
    label: 'Moderate',
  },
  medium: {
    bg: 'var(--badge-moderate-bg, #E8F0FE)',
    text: 'var(--badge-moderate-text, #1967D2)',
    border: 'var(--badge-moderate-border, #D2E3FC)',
    dot: 'var(--badge-moderate-dot, #4285F4)',
    label: 'Moderate',
  },
  low: {
    bg: 'var(--badge-low-bg, #E6F4EA)',
    text: 'var(--badge-low-text, #137333)',
    border: 'var(--badge-low-border, #CEEAD6)',
    dot: 'var(--badge-low-dot, #34A853)',
    label: 'Low',
  },
  resolved: {
    bg: 'var(--badge-low-bg, #E6F4EA)',
    text: 'var(--badge-low-text, #137333)',
    border: 'var(--badge-low-border, #CEEAD6)',
    dot: 'var(--badge-low-dot, #34A853)',
    label: 'Resolved',
  },
  'not scored': {
    bg: '#F8FAFC',
    text: '#5F6368',
    border: '#E8EAED',
    dot: '#9AA0A6',
    label: 'Not scored',
  },
};

export default function PriorityBadge({ priority, className = '' }: PriorityBadgeProps) {
  const key = String(priority || '').toLowerCase().trim();
  const cfg = BADGE_CONFIG[key] ?? BADGE_CONFIG['not scored'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold leading-normal ${className}`}
      style={{
        background: cfg.bg,
        color: cfg.text,
        border: `1px solid ${cfg.border}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: cfg.dot }}
      />
      {cfg.label}
    </span>
  );
}

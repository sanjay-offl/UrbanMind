import type { Priority } from '@/types/grievance';

const PRIORITY_STYLES: Record<
  Priority,
  { bg: string; color: string; border: string }
> = {
  critical: {
    bg: 'rgba(154,23,80,0.18)',
    color: '#EE4C7C',
    border: 'rgba(154,23,80,0.40)',
  },
  high: {
    bg: 'rgba(238,76,124,0.15)',
    color: '#EE4C7C',
    border: 'rgba(238,76,124,0.30)',
  },
  medium: {
    bg: 'rgba(227,175,188,0.15)',
    color: '#E3AFBC',
    border: 'rgba(227,175,188,0.30)',
  },
  low: {
    bg: 'rgba(227,226,223,0.10)',
    color: '#E3E2DF',
    border: 'rgba(227,226,223,0.20)',
  },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const style = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.low;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 9px',
        borderRadius: '99px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'capitalize',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {priority}
    </span>
  );
}

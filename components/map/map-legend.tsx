const PRIORITIES = [
  { key: 'critical', label: 'Critical', color: 'var(--status-critical)' },
  { key: 'high', label: 'High', color: 'var(--status-high)' },
  { key: 'medium', label: 'Medium', color: 'var(--status-medium)' },
  { key: 'low', label: 'Low', color: 'var(--status-low)' },
];

export default function MapLegend({ className }: { className?: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(16px)',
        borderRadius: 12,
        padding: '12px 16px',
        color: 'var(--text-primary)',
        boxShadow: 'var(--shadow-md)',
      }}
      className={className}
    >
      <div
        style={{
          color: 'var(--text-muted)',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Priority
      </div>
      <div className="space-y-1.5">
        {PRIORITIES.map((p) => (
          <div key={p.key} className="flex items-center gap-2 text-xs">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span style={{ color: 'var(--text-primary)' }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

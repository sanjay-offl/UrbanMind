const PRIORITIES = [
  { key: 'critical', label: 'Critical Priority (≥72)', color: '#EA4335' },
  { key: 'high', label: 'High Urgency (63–71)', color: '#FBBC05' },
  { key: 'normal', label: 'Normal / Moderate (52–62)', color: '#34A853' },
  { key: 'low', label: 'Informational / Low (<52)', color: '#4285F4' },
];

export default function MapLegend({ className = '' }: { className?: string }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E8EAED',
        borderRadius: 8,
        padding: '12px 14px',
        color: '#202124',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      }}
      className={className}
    >
      <div
        style={{
          color: '#5F6368',
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: 8,
        }}
      >
        Spatial Priority Tiers
      </div>
      <div className="space-y-1.5">
        {PRIORITIES.map((p) => (
          <div key={p.key} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: p.color }}
            />
            <span style={{ color: '#202124', fontSize: '11px', fontWeight: 500 }}>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

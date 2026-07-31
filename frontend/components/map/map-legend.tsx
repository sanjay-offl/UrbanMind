const PRIORITIES = [
  { key: 'critical', label: 'Critical', color: '#dc2626' },
  { key: 'high', label: 'High', color: '#f97316' },
  { key: 'medium', label: 'Medium', color: '#eab308' },
  { key: 'low', label: 'Low', color: '#16a34a' },
];

export default function MapLegend({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Priority
      </div>
      <div className="space-y-1.5">
        {PRIORITIES.map((p) => (
          <div key={p.key} className="flex items-center gap-2 text-sm">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            <span>{p.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

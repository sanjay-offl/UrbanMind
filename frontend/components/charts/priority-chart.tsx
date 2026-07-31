'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface PriorityDatum {
  name: string;
  value: number;
}

const COLORS: Record<string, string> = {
  critical: 'var(--status-critical)',
  high: 'var(--status-high)',
  medium: 'var(--status-medium)',
  low: 'var(--status-low)',
};

export default function PriorityChart({ data }: { data: PriorityDatum[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name] ?? 'var(--text-muted)'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                boxShadow: 'var(--shadow-md)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
              }}
              labelStyle={{ color: 'var(--text-secondary)', fontWeight: 500 }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2 text-sm font-sans">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: COLORS[entry.name] ?? 'var(--text-muted)' }}
            />
            <span className="capitalize" style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
            <span className="font-mono text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
              {total > 0 ? Math.round((entry.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

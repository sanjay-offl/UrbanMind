'use client';

import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export interface CategoryDatum {
  category: string;
  count: number;
}

const BAR_COLORS = ['#9A1750', '#EE4C7C', '#E3AFBC', '#E3E2DF', '#9A1750', '#EE4C7C'];

export default function CategoryChart({ data }: { data: CategoryDatum[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--text-muted)', fontFamily: 'var(--font-sans)' }}
          />
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
            cursor={{ fill: 'var(--glass)', stroke: 'var(--glass-border)', strokeWidth: 1 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

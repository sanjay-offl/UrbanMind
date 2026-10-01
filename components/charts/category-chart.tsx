'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

export interface CategoryDatum {
  category: string;
  count: number;
}

export const CATEGORY_COLORS: Record<string, string> = {
  Water: 'var(--blue, #4285F4)',
  Roads: 'var(--yellow, #FBBC04)',
  Sanitation: 'var(--green, #34A853)',
  Electricity: 'var(--red, #EA4335)',
  Health: 'var(--blue, #4285F4)',
  Transport: 'var(--green, #34A853)',
  'Public Infrastructure': 'var(--yellow, #FBBC04)',
  Education: 'var(--blue, #4285F4)',
  'Public Safety': 'var(--red, #EA4335)',
  Other: '#00897B',
};

export function getCategoryColor(category: string): string {
  const norm = category?.trim() || '';
  for (const [key, color] of Object.entries(CATEGORY_COLORS)) {
    if (norm.toLowerCase().includes(key.toLowerCase())) {
      return color;
    }
  }
  return '#00897B';
}

const CustomYAxisTick = (props: any) => {
  const { x, y, payload } = props;
  const label = String(payload?.value || '');
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{label}</title>
      <text
        x={-8}
        y={4}
        textAnchor="end"
        fill="var(--text-muted, #5F6368)"
        fontSize={13}
        fontFamily="var(--font-ui, Inter, sans-serif)"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {label.length > 22 ? `${label.slice(0, 20)}…` : label}
      </text>
    </g>
  );
};

export default function CategoryChart({ data }: { data: CategoryDatum[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[360px] w-full animate-pulse rounded-lg bg-[var(--border)]/20" />;
  }

  const chartHeight = Math.max(320, data.length * 40);

  return (
    <div style={{ height: `${chartHeight}px` }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 8, right: 36, bottom: 8, left: 16 }}
          barSize={20}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="4 4"
            horizontal={false}
          />
          <XAxis
            type="number"
            allowDecimals={false}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}
          />
          <YAxis
            type="category"
            dataKey="category"
            width={180}
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={<CustomYAxisTick />}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              color: 'var(--text)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontSize: '13px',
              fontFamily: 'var(--font-ui)',
              padding: '8px 12px',
            }}
            labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
            itemStyle={{ color: 'var(--text-muted)' }}
            cursor={{ fill: 'var(--primary-soft)', opacity: 0.4 }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              fill="var(--text)"
              fontSize={12}
              fontFamily="var(--font-ui)"
              formatter={(val: number) => val.toLocaleString('en-IN')}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

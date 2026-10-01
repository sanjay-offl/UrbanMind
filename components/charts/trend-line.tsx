'use client';

import { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

export interface TrendPoint {
  date: string;
  count: number;
}

function formatDateTick(str: string): string {
  try {
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(d);
  } catch {
    return str;
  }
}

export default function TrendLine({ data }: { data: TrendPoint[] }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[320px] w-full animate-pulse rounded-lg bg-[var(--border)]/20" />;
  }

  // Calculate interval so at most 6 ticks appear
  const interval = data.length > 6 ? Math.ceil(data.length / 6) : 0;

  return (
    <div style={{ height: '320px' }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 16, bottom: 8, left: -16 }}>
          <defs>
            <linearGradient id="primaryAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            stroke="var(--border)"
            strokeDasharray="4 4"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            interval={interval}
            tickFormatter={formatDateTick}
            tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={40}
            tick={{ fontSize: 12, fill: 'var(--text-muted)', fontFamily: 'var(--font-ui)' }}
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
            labelFormatter={(label) => formatDateTick(String(label))}
            labelStyle={{ color: 'var(--text)', fontWeight: 600 }}
            itemStyle={{ color: 'var(--primary)' }}
            cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#primaryAreaGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

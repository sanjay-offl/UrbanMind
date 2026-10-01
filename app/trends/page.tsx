'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';
import PageHeader from '@/components/layout/page-header';
import TrendLine from '@/components/charts/trend-line';
import CategoryChart from '@/components/charts/category-chart';
import WardChart from '@/components/charts/ward-chart';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatScore } from '@/lib/format';
import { TrendingUp, BarChart3, AlertCircle, RefreshCw } from 'lucide-react';

interface AnalyticsPayload {
  kpis: {
    total: number;
    open: number;
    critical: number;
    avg_score: number;
  };
  trends: { date: string; count: number }[];
  categories: { category: string; count: number }[];
  wards: { ward_name: string; count: number }[];
  geo?: { name: string; level: string };
}

export default function TrendsPage() {
  const { selectedState, selectedDistrict, selectedCity, selectedWard, geoBreadcrumb } = useGeography();
  const { t, locale } = useI18n();

  const [data, setData] = useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrends = useCallback(() => {
    setLoading(true);
    setError(null);

    const q = new URLSearchParams();
    if (selectedState !== 'all') q.set('state', selectedState);
    if (selectedDistrict !== 'all') q.set('district', selectedDistrict);
    if (selectedCity !== 'all') q.set('city', selectedCity);
    if (selectedWard !== 'all') q.set('ward', selectedWard);

    const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/analytics?${q.toString()}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(t('error') || 'Unable to load analytics');
        return res.json();
      })
      .then((res) => {
        if (res.ok && res.data) {
          setData(res.data);
        } else if (res.kpis) {
          setData(res);
        } else {
          throw new Error('Malformed analytics payload');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Error loading trends');
      })
      .finally(() => setLoading(false));
  }, [selectedState, selectedDistrict, selectedCity, selectedWard, t]);

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const scopeLabel = geoBreadcrumb.map((b) => b.name).join(' / ');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('trends')}
        description={`Longitudinal trends and cross-category insights for ${scopeLabel}`}
      />

      {error && (
        <div className="civic-panel flex flex-col items-center justify-center p-8 text-center">
          <AlertCircle className="h-10 w-10 text-[#EA4335]" />
          <h3 className="mt-3 text-base font-semibold text-[#202124]">{t('error')}</h3>
          <p className="mt-1 text-xs text-[#5F6368]">{error}</p>
          <button type="button" onClick={fetchTrends} className="btn-primary mt-4">
            <RefreshCw size={14} /> {t('retry')}
          </button>
        </div>
      )}

      {/* 1. Key Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="civic-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
            Analyzed Volume
          </span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#202124]">
            {loading ? <Skeleton className="h-8 w-20" /> : formatNumber(data?.kpis?.total ?? 0, locale)}
          </div>
          <p className="mt-1 text-[11px] text-[#5F6368]">Historical intake corpus</p>
        </div>

        <div className="civic-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
            Critical Incidents
          </span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#C5221F]">
            {loading ? <Skeleton className="h-8 w-16" /> : formatNumber(data?.kpis?.critical ?? 0, locale)}
          </div>
          <p className="mt-1 text-[11px] text-[#5F6368]">Top urgency band (score &ge; 72)</p>
        </div>

        <div className="civic-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
            Active Pipeline
          </span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#B07200]">
            {loading ? <Skeleton className="h-8 w-16" /> : formatNumber(data?.kpis?.open ?? 0, locale)}
          </div>
          <p className="mt-1 text-[11px] text-[#5F6368]">Open or In-Progress items</p>
        </div>

        <div className="civic-panel">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
            Mean Priority Score
          </span>
          <div className="mt-2 font-mono text-2xl font-bold text-[#1A73E8]">
            {loading ? <Skeleton className="h-8 w-16" /> : `${formatScore(data?.kpis?.avg_score ?? 0)} / 100`}
          </div>
          <p className="mt-1 text-[11px] text-[#5F6368]">Deterministic scale</p>
        </div>
      </div>

      {/* 2. Grievances Over Time Chart */}
      <div className="civic-panel">
        <div className="mb-4 flex items-center justify-between border-b border-[#E8EAED] pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-[#1A73E8]" />
            <div>
              <h2 className="text-base font-semibold text-[#202124]">
                Intake Volume Over Time
              </h2>
              <p className="text-xs text-[#5F6368]">
                Daily and weekly complaint trends across the past 180 days
              </p>
            </div>
          </div>
          <span className="rounded bg-[#E8F0FE] px-2 py-0.5 text-[11px] font-semibold text-[#1967D2]">
            180-Day Window
          </span>
        </div>

        {loading ? (
          <Skeleton className="h-72 w-full" />
        ) : data && data.trends && data.trends.length > 0 ? (
          <TrendLine data={data.trends} />
        ) : (
          <div className="py-12 text-center text-xs text-[#5F6368]">
            Insufficient historical data for trend analysis.
          </div>
        )}
      </div>

      {/* 3. Category & Geographic Distribution Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* By Category */}
        <div className="civic-panel">
          <div className="mb-4 flex items-center justify-between border-b border-[#E8EAED] pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-[#1A73E8]" />
              <div>
                <h2 className="text-base font-semibold text-[#202124]">
                  Distribution by Category
                </h2>
                <p className="text-xs text-[#5F6368]">Concentration across municipal service sectors</p>
              </div>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : data && data.categories && data.categories.length > 0 ? (
            <CategoryChart data={data.categories} />
          ) : (
            <div className="py-12 text-center text-xs text-[#5F6368]">
              {t('empty')}
            </div>
          )}
        </div>

        {/* By Ward */}
        <div className="civic-panel">
          <div className="mb-4 flex items-center justify-between border-b border-[#E8EAED] pb-3">
            <div>
              <h2 className="text-base font-semibold text-[#202124]">
                Distribution by Ward
              </h2>
              <p className="text-xs text-[#5F6368]">Geographic spread across jurisdiction wards</p>
            </div>
          </div>

          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : data && data.wards && data.wards.length > 0 ? (
            <WardChart
              data={data.wards.map((w) => ({ ward: w.ward_name, count: w.count }))}
            />
          ) : (
            <div className="py-12 text-center text-xs text-[#5F6368]">
              No ward data available for this selection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

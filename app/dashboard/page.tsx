'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  FileText,
  AlertTriangle,
  Clock,
  TrendingUp,
  MapPin,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';
import { useAuth } from '@/lib/auth';
import type { DashboardPayload } from '@/lib/services/dashboardService';
import CategoryChart from '@/components/charts/category-chart';
import TrendLine from '@/components/charts/trend-line';
import GrievanceCard from '@/components/grievances/grievance-card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumber, formatScore } from '@/lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedState, selectedDistrict, selectedCity, selectedWard } = useGeography();
  const { t, locale } = useI18n();

  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (selectedState !== 'all') params.set('state', selectedState);
    if (selectedDistrict !== 'all') params.set('district', selectedDistrict);
    if (selectedCity !== 'all') params.set('city', selectedCity);
    if (selectedWard !== 'all') params.set('ward', selectedWard);

    const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/dashboard?${params.toString()}`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error(t('error') || 'Unable to load civic intelligence');
        return res.json();
      })
      .then((payload) => {
        if (payload.ok && payload.data) {
          setData(payload.data);
        } else {
          throw new Error('Malformed payload');
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('error') || 'Unable to load civic intelligence');
      })
      .finally(() => setLoading(false));
  }, [selectedState, selectedDistrict, selectedCity, selectedWard, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Ward Officer Banner (if locked to specific ward)
  const isWardOfficer = (user?.role as string) === 'ward_officer' && user?.ward;

  return (
    <div className="space-y-6">
      {/* Ward Officer Jurisdiction Scope Banner */}
      {isWardOfficer && (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--primary-soft)] bg-[var(--primary-soft)] px-4 py-2.5 text-xs font-medium text-[var(--primary)]">
          <MapPin size={15} />
          <span>Active Jurisdiction: Showing data for {user.ward} only</span>
        </div>
      )}

      {/* Top Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold tracking-tight text-[var(--text)]">
            {t('overviewTitle')}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-muted)]">
            {t('overviewSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/grievances" className="btn-secondary">
            <span>View All Grievances</span>
          </Link>
          <Link href="/submit" className="btn-primary">
            <span>{t('submitButton')}</span>
          </Link>
        </div>
      </div>

      {/* Error State with Working Retry */}
      {error && (
        <div className="civic-card flex flex-col items-center justify-center p-8 text-center">
          <ShieldAlert className="h-10 w-10 text-[var(--critical)]" />
          <h3 className="mt-3 text-[16px] font-semibold text-[var(--text)]">{t('error')}</h3>
          <p className="mt-1 text-xs text-[var(--text-muted)]">{error}</p>
          <button
            type="button"
            onClick={fetchDashboard}
            className="btn-primary mt-4"
          >
            <RefreshCw size={14} /> {t('retry')}
          </button>
        </div>
      )}

      {/* 4 KPI Row (Cards with surface background, 1px border, radius 16px, padding 24px, shadow) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* KPI 1: Total Complaints */}
        <div className="civic-card flex items-start justify-between p-6">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('totalComplaints')}
            </span>
            <div className="mt-2 font-mono text-[28px] font-bold tracking-tight text-[var(--text)] tabular-numbers">
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                formatNumber(data?.totalComplaints ?? 0, locale)
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <span>{t('currentDataset')}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--green)]">Public data</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            <FileText size={20} />
          </div>
        </div>

        {/* KPI 2: Critical Issues */}
        <div className="civic-card flex items-start justify-between p-6">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('criticalIssues')}
            </span>
            <div className="mt-2 font-mono text-[28px] font-bold tracking-tight text-[var(--critical)] tabular-numbers">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatNumber(data?.criticalIssues ?? 0, locale)
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <span>{t('currentDataset')}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--critical)]">Score &ge; 72</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--critical-soft)] text-[var(--critical)]">
            <AlertTriangle size={20} />
          </div>
        </div>

        {/* KPI 3: High Urgency / Pending */}
        <div className="civic-card flex items-start justify-between p-6">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('highUrgency')}
            </span>
            <div className="mt-2 font-mono text-[28px] font-bold tracking-tight text-[var(--high)] tabular-numbers">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                formatNumber(data?.openGrievances ?? 0, locale)
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <span>{t('currentDataset')}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--high)]">In pipeline</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FEF7E0] text-[var(--high)]">
            <Clock size={20} />
          </div>
        </div>

        {/* KPI 4: Average Priority Score */}
        <div className="civic-card flex items-start justify-between p-6">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t('avgPriorityScore')}
            </span>
            <div className="mt-2 font-mono text-[28px] font-bold tracking-tight text-[var(--primary)] tabular-numbers">
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                `${formatScore(data?.averagePriorityScore ?? 0)} / 100`
              )}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--text-muted)]">
              <span>{t('currentDataset')}</span>
              <span>·</span>
              <span className="font-semibold text-[var(--primary)]">Derived UrbanMind</span>
            </div>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
            <TrendingUp size={20} />
          </div>
        </div>
      </div>

      {/* 12-Column Grid: Charts (8 cols) beside Top Critical Grievances (4 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left Column (8 cols): Bar Chart & Priority Distribution Trend */}
        <div className="space-y-6 lg:col-span-8">
          {/* Card 1: Grievances by Category */}
          <div className="civic-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-[20px] font-semibold text-[var(--text)]">
                  {t('categoryChartTitle')}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Volume and severity weighted by sector across current geography
                </p>
              </div>
              <span className="rounded-md bg-[var(--primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                10 Canonical Sectors
              </span>
            </div>

            {loading ? (
              <Skeleton className="h-[360px] w-full" />
            ) : data && data.complaintsByCategory.length > 0 ? (
              <CategoryChart data={data.complaintsByCategory} />
            ) : (
              <p className="py-12 text-center text-xs text-[var(--text-muted)]">{t('empty')}</p>
            )}
          </div>

          {/* Card 2: Priority Distribution Trend */}
          <div className="civic-card p-6">
            <div className="mb-4 flex items-start justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-[20px] font-semibold text-[var(--text)]">
                  {t('priorityTrendTitle')}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Intake volume over the 180-day baseline window
                </p>
              </div>
              <span className="rounded-md bg-[var(--bg)] border border-[var(--border)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-muted)] shrink-0">
                180-Day Window
              </span>
            </div>

            {loading ? (
              <Skeleton className="h-[320px] w-full" />
            ) : data && data.priorityTrend.length > 0 ? (
              <TrendLine
                data={data.priorityTrend.map((t) => ({ date: t.date, count: t.count }))}
              />
            ) : (
              <p className="py-12 text-center text-xs text-[var(--text-muted)]">
                Sample data unavailable for this window.
              </p>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Critical Grievances List (scrolls inside max-height container) */}
        <div className="space-y-6 lg:col-span-4">
          <div className="civic-card p-6">
            <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
              <div>
                <h2 className="text-[18px] lg:text-[20px] font-semibold text-[var(--text)]">
                  {t('topCriticalTitle')}
                </h2>
                <p className="mt-1 text-xs text-[var(--text-muted)]">Requires immediate administrative action</p>
              </div>
              <Link
                href="/grievances?priority=Critical"
                className="text-xs font-semibold text-[var(--primary)] hover:underline shrink-0"
              >
                View all
              </Link>
            </div>

            {/* List scrolls inside container without scrolling entire page */}
            <div className="max-h-[580px] overflow-y-auto pr-1 space-y-3">
              {loading && (
                <>
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                  <Skeleton className="h-28 w-full rounded-xl" />
                </>
              )}

              {!loading && data && data.topCriticalGrievances.length > 0 && (
                data.topCriticalGrievances.map((g) => (
                  <GrievanceCard key={g.id} grievance={g} />
                ))
              )}

              {!loading && (!data || data.topCriticalGrievances.length === 0) && (
                <div className="rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/10 p-4 text-center">
                  <p className="text-xs font-semibold text-[var(--green)]">
                    All clear — No critical complaints pending in this jurisdiction.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Geographic Infrastructure Summary Card */}
          {data?.geographicSummary && (
            <div className="civic-card p-6">
              <div className="border-b border-[var(--border)] pb-3">
                <h2 className="text-[18px] lg:text-[20px] font-semibold whitespace-nowrap text-[var(--text)]">
                  {t('geographicSummaryTitle')}
                </h2>
                <p className="mt-2 text-xs font-medium text-[var(--text-muted)]">
                  {data.geographicSummary.name}
                </p>
              </div>

              {/* Tile grid: repeat(auto-fit, minmax(160px, 1fr)), gap 16px, equal heights */}
              <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-4 text-xs">
                <div className="flex flex-col justify-between rounded-xl bg-[var(--bg)] p-3 border border-[var(--border)] min-h-[72px]">
                  <span className="text-[var(--text-muted)]">Population</span>
                  <p className="font-mono text-[16px] font-bold text-[var(--text)] tabular-numbers">
                    {data.geographicSummary.population.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-[var(--bg)] p-3 border border-[var(--border)] min-h-[72px]">
                  <span className="text-[var(--text-muted)]">Infra Index</span>
                  <p className="font-mono text-[16px] font-bold text-[var(--primary)] tabular-numbers">
                    {Math.round(data.geographicSummary.infraIndex)}/100
                  </p>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-[var(--bg)] p-3 border border-[var(--border)] min-h-[72px]">
                  <span className="text-[var(--text-muted)]">Gap Index</span>
                  <p className="font-mono text-[16px] font-bold text-[var(--critical)] tabular-numbers">
                    {Math.round(data.geographicSummary.gapIndex)}/100
                  </p>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-[var(--bg)] p-3 border border-[var(--border)] min-h-[72px]">
                  <span className="text-[var(--text-muted)]">Scope Level</span>
                  <p className="font-mono text-[15px] font-bold capitalize text-[var(--text)]">
                    {data.geographicSummary.level}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Card */}
      <div className="civic-card p-6">
        <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div>
            <h2 className="text-[20px] font-semibold text-[var(--text)]">
              {t('recentActivityTitle')}
            </h2>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Latest citizen requests captured across channels</p>
          </div>
          <Link
            href="/grievances"
            className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--primary)] hover:underline"
          >
            <span>Explore full registry</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)] text-[11px] font-semibold uppercase text-[var(--text-muted)]">
                <th className="px-3 py-2.5">ID</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Description</th>
                <th className="px-3 py-2.5">Ward</th>
                <th className="px-3 py-2.5 text-center">Score</th>
                <th className="px-3 py-2.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {loading && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                    {t('loading')}
                  </td>
                </tr>
              )}
              {!loading && (!data?.recentActivity || data.recentActivity.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-[var(--text-muted)]">
                    {t('empty')}
                  </td>
                </tr>
              )}
              {!loading &&
                data?.recentActivity?.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--bg)] transition-colors">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-[13px] font-bold text-[var(--primary)]">
                      <Link href={`/grievances/${row.id}`} className="hover:underline">
                        GRV-{row.id.toString().padStart(6, '0')}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-medium text-[var(--text)]">
                      {row.category}
                    </td>
                    <td className="max-w-[320px] truncate px-3 py-2 text-[var(--text-muted)]">
                      {row.title}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-[var(--text)]">
                      {row.ward || 'Not available'}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center font-mono font-bold text-[var(--primary)] tabular-numbers">
                      {formatScore(row.score)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-center">
                      <span className="inline-block rounded-md border border-[var(--border)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--text)]">
                        {row.status}
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { getAnalytics, getGrievances } from '@/lib/api';
import type { AnalyticsSummary } from '@/types/analytics';
import type { Grievance } from '@/types/grievance';
import CategoryChart from '@/components/charts/category-chart';
import GrievanceCard from '@/components/grievances/grievance-card';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWard, wardIdFromSelection } from '@/lib/ward-context';
import { useAuth } from '@/lib/auth';

function KPICard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
  trend,
  badgeBg,
  badgeColor,
  badgeBorder,
}: {
  icon: string;
  iconColor: string;
  iconBg: string;
  value: React.ReactNode;
  label: string;
  trend: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
}) {
  return (
    <div className="glass" style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <i className={`ti ${icon}`} style={{ fontSize: 20, color: iconColor }} />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: '3px 8px',
            borderRadius: 99,
            background: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeBorder}`,
            whiteSpace: 'nowrap',
          }}
        >
          {trend}
        </span>
      </div>
      <div
        className="font-data"
        style={{
          fontSize: 36,
          fontWeight: 500,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginTop: 16,
        }}
      >
        {value ?? '—'}
      </div>
      <div className="data-label" style={{ marginTop: 4 }}>
        {label}
      </div>
    </div>
  );
}

function GrievancesByCategoryChart({ data }: { data: AnalyticsSummary['categories'] }) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle style={{ fontSize: 15, fontWeight: 500 }}>
          Grievances by Category
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data ? (
          <CategoryChart data={data} />
        ) : (
          <Skeleton className="h-72 w-full" />
        )}
      </CardContent>
    </Card>
  );
}

function TopCriticalGrievances({
  data,
  loading,
  wardLabel,
}: {
  data: Grievance[];
  loading: boolean;
  wardLabel: string;
}) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle style={{ fontSize: 15, fontWeight: 500 }}>
          Top Critical Grievances {wardLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))
        ) : (
          <>
            {data.map((g) => (
              <GrievanceCard key={g.id} grievance={g} />
            ))}
            {data.length === 0 && (
              <EmptyState
                title="No critical grievances"
                description="All clear — no critical complaints right now"
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { selectedWard } = useWard();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [criticalGrievances, setCriticalGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  const activeWard =
    user?.role === 'ward_officer' && user?.ward ? user.ward : selectedWard;

  useEffect(() => {
    setLoading(true);
    const wardId = wardIdFromSelection(activeWard);

    Promise.all([
      getAnalytics({ ward_id: wardId }),
      getGrievances({ priority: 'critical', ward_id: wardId }),
    ])
      .then(([analytics, critical]) => {
        setData(analytics);
        setCriticalGrievances(critical);
      })
      .finally(() => setLoading(false));
  }, [activeWard]);

  const stats = {
    total: data?.kpis?.total ?? 0,
    open: data?.kpis?.open ?? 0,
    critical: data?.kpis?.critical ?? 0,
    avgScore: data?.kpis?.avg_score ?? 0,
  };

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: 'calc(100vh - 64px)' }}>
      {/* Ward Officer Banner */}
      {user?.role === 'ward_officer' && user?.ward && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgba(227,175,188,0.10)',
            border: '1px solid rgba(227,175,188,0.25)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <i className="ti ti-map-pin" style={{ color: '#E3AFBC', fontSize: '16px' }} />
          <span style={{ color: '#E3AFBC', fontWeight: 500 }}>
            Showing data for {user.ward} only
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
            (Ward Officer view)
          </span>
        </div>
      )}

      {/* Analyst Banner */}
      {user?.role === 'analyst' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: 'rgba(227,226,223,0.08)',
            border: '1px solid rgba(227,226,223,0.20)',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '13px',
          }}
        >
          <i className="ti ti-eye" style={{ color: '#E3E2DF', fontSize: '16px' }} />
          <span style={{ color: '#E3E2DF', fontWeight: 500 }}>
            Read-only view
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '4px' }}>
            (Analyst access — no upload or edit)
          </span>
        </div>
      )}

      {/* Section label */}
      <div className="data-label" style={{ marginBottom: 16 }}>
        Overview
      </div>
      <div style={{ height: 1, background: 'var(--glass-border)', marginBottom: 24 }} />

      {/* KPI Cards row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <KPICard
          icon="ti-message-report"
          iconColor="#EE4C7C"
          iconBg="rgba(154,23,80,0.12)"
          value={loading ? '…' : stats.total}
          label="TOTAL COMPLAINTS"
          trend="+12% this week"
          badgeBg="rgba(154,23,80,0.10)"
          badgeColor="#EE4C7C"
          badgeBorder="rgba(154,23,80,0.25)"
        />
        <KPICard
          icon="ti-circle-check"
          iconColor="#E3AFBC"
          iconBg="rgba(227,175,188,0.15)"
          value={loading ? '…' : stats.open}
          label="OPEN GRIEVANCES"
          trend="+8% vs last week"
          badgeBg="rgba(227,175,188,0.10)"
          badgeColor="#E3AFBC"
          badgeBorder="rgba(227,175,188,0.30)"
        />
        <KPICard
          icon="ti-alert-triangle"
          iconColor="#9A1750"
          iconBg="rgba(154,23,80,0.18)"
          value={loading ? '…' : stats.critical}
          label="CRITICAL ISSUES"
          trend="+3 today"
          badgeBg="rgba(154,23,80,0.12)"
          badgeColor="#EE4C7C"
          badgeBorder="rgba(154,23,80,0.30)"
        />
        <KPICard
          icon="ti-star"
          iconColor="#E3E2DF"
          iconBg="rgba(227,226,223,0.10)"
          value={loading ? '…' : stats.avgScore?.toFixed(1)}
          label="AVG PRIORITY SCORE"
          trend="Updated now"
          badgeBg="rgba(227,226,223,0.08)"
          badgeColor="#E3E2DF"
          badgeBorder="rgba(227,226,223,0.20)"
        />
      </div>

      {/* Main 2-col grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60% 40%',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <GrievancesByCategoryChart data={data?.categories ?? []} />
        <TopCriticalGrievances
          data={criticalGrievances}
          loading={loading}
          wardLabel={activeWard !== 'all' ? `(${activeWard})` : ''}
        />
      </div>
    </div>
  );
}

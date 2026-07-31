'use client';

import { useEffect, useState } from 'react';
import { Inbox, AlertTriangle, Star, Activity } from 'lucide-react';
import { getAnalytics, getGrievances } from '@/lib/api';
import type { AnalyticsSummary } from '@/types/analytics';
import type { Grievance } from '@/types/grievance';
import PageHeader from '@/components/layout/page-header';
import CategoryChart from '@/components/charts/category-chart';
import GrievanceCard from '@/components/grievances/grievance-card';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWard } from '@/lib/ward-context';

export default function DashboardPage() {
  const { selectedWard } = useWard();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [criticalGrievances, setCriticalGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const wardParam = selectedWard === 'all' ? undefined : selectedWard;

    Promise.all([
      getAnalytics(),
      getGrievances({ priority: 'critical', ward_id: wardParam }),
    ])
      .then(([analytics, critical]) => {
        setData(analytics);
        const filteredCritical = wardParam
          ? critical.filter((g) => g.ward === wardParam || g.ward_name === wardParam || String(g.ward_id) === wardParam)
          : critical;
        setCriticalGrievances(filteredCritical);
      })
      .finally(() => setLoading(false));
  }, [selectedWard]);

  const kpis = [
    { label: 'Total Grievances', value: data?.kpis?.total ?? 0, icon: Inbox },
    { label: 'Open', value: data?.kpis?.open ?? 0, icon: Activity },
    { label: 'Critical', value: data?.kpis?.critical ?? 0, icon: AlertTriangle },
    { label: 'Avg Score', value: data?.kpis?.avg_score ?? 0, icon: Star },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={
          selectedWard === 'all'
            ? 'Overview of citizen grievances across the city'
            : `Overview for ${selectedWard}`
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? <Skeleton className="h-8 w-20" /> : kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Grievances by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <CategoryChart data={data.categories} />
            ) : (
              <Skeleton className="h-72 w-full" />
            )}
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>
              Top Critical Grievances {selectedWard !== 'all' ? `(${selectedWard})` : ''}
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
                {criticalGrievances.map((g) => (
                  <GrievanceCard key={g.id} grievance={g} />
                ))}
                {criticalGrievances.length === 0 && (
                  <EmptyState
                    title="No critical grievances"
                    description="All clear — no critical complaints right now"
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

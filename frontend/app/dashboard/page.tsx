'use client';

import { useEffect, useState } from 'react';
import { Inbox, AlertTriangle, Star, Activity } from 'lucide-react';
import { getAnalytics } from '@/lib/api';
import type { AnalyticsSummary } from '@/types/analytics';
import PageHeader from '@/components/layout/page-header';
import PriorityChart from '@/components/charts/priority-chart';
import GrievanceCard from '@/components/grievances/grievance-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: 'Total Grievances', value: data?.kpiCards.total ?? 0, icon: Inbox },
    { label: 'Open', value: data?.kpiCards.open ?? 0, icon: Activity },
    { label: 'Critical', value: data?.kpiCards.critical ?? 0, icon: AlertTriangle },
    { label: 'Avg Score', value: data?.kpiCards.avgScore ?? 0, icon: Star },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of citizen grievances across the city"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
              <kpi.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '—' : kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Grievances by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <PriorityChart
                data={Object.entries(data.priorityBreakdown ?? {}).map(([name, value]) => ({
                  name,
                  value,
                }))}
              />
            ) : (
              <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
                Loading…
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Critical Grievances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(data?.topCritical ?? []).map((g) => (
              <GrievanceCard key={g.id} grievance={g} />
            ))}
            {!loading && (data?.topCritical?.length ?? 0) === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">No critical grievances</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

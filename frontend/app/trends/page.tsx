'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '@/lib/api';
import type { AnalyticsSummary } from '@/types/analytics';
import PageHeader from '@/components/layout/page-header';
import TrendLine from '@/components/charts/trend-line';
import CategoryChart from '@/components/charts/category-chart';
import WardChart from '@/components/charts/ward-chart';
import EmptyState from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWard, wardIdFromSelection } from '@/lib/ward-context';

export default function TrendsPage() {
  const { selectedWard } = useWard();
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getAnalytics({ ward_id: wardIdFromSelection(selectedWard) })
      .then(setData)
      .finally(() => setLoading(false));
  }, [selectedWard]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trends"
        description={
          selectedWard === 'all'
            ? 'Analytics across categories, wards and time'
            : `Analytics overview for ${selectedWard}`
        }
      />
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Grievances Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-72 w-full" />
          ) : data && data.trends.length > 0 ? (
            <TrendLine data={data.trends} />
          ) : (
            <EmptyState title="No trend data yet" description="Upload grievances to see trends over time" />
          )}
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : data && data.categories.length > 0 ? (
              <CategoryChart data={data.categories} />
            ) : (
              <EmptyState title="No category data yet" />
            )}
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>By Ward</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : data && data.wards.length > 0 ? (
              <WardChart
                data={(data.wards ?? []).map((w) => ({ ward: w.ward_name, count: w.count }))}
              />
            ) : (
              <EmptyState title="No ward data yet" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

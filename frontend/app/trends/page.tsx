'use client';

import { useEffect, useState } from 'react';
import { getAnalytics } from '@/lib/api';
import type { AnalyticsSummary } from '@/types/analytics';
import PageHeader from '@/components/layout/page-header';
import TrendLine from '@/components/charts/trend-line';
import CategoryChart from '@/components/charts/category-chart';
import WardChart from '@/components/charts/ward-chart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrendsPage() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    getAnalytics().then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trends"
        description="Analytics across categories, wards and time"
      />
      <Card>
        <CardHeader>
          <CardTitle>Grievances Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendLine data={data?.trends ?? []} />
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By Category</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryChart data={data?.categories ?? []} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>By Ward</CardTitle>
          </CardHeader>
          <CardContent>
            <WardChart
              data={(data?.wards ?? []).map((w) => ({ ward: w.ward_name, count: w.count }))}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

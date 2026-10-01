'use client';

import { useEffect, useState } from 'react';
import type { GrievanceRecord } from '@/types/grievance';
import PageHeader from '@/components/layout/page-header';
import ComplaintMap from '@/components/map/complaint-map';
import MapLegend from '@/components/map/map-legend';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';

export default function MapPage() {
  const { selectedState, selectedDistrict, selectedCity, selectedWard, geoBreadcrumb } = useGeography();
  const { t } = useI18n();
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams();
    if (selectedState !== 'all') q.set('state', selectedState);
    if (selectedDistrict !== 'all') q.set('district', selectedDistrict);
    if (selectedCity !== 'all') q.set('city', selectedCity);
    if (selectedWard !== 'all') q.set('ward', selectedWard);
    q.set('per_page', '100');

    const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/grievances?${q.toString()}`, { headers })
      .then((res) => res.json())
      .then((payload) => {
        if (payload.ok && payload.data && payload.data.items) {
          setGrievances(payload.data.items);
        } else if (Array.isArray(payload)) {
          setGrievances(payload);
        }
      })
      .catch(() => setGrievances([]))
      .finally(() => setLoading(false));
  }, [selectedState, selectedDistrict, selectedCity, selectedWard]);

  const scopeLabel = geoBreadcrumb.map((b) => b.name).join(' / ');

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('map')}
        description={`Spatial clustering of verified complaints across ${scopeLabel}`}
      />

      <div className="civic-panel relative h-[calc(100vh-14rem)] min-h-[500px] overflow-hidden p-0">
        <ComplaintMap grievances={grievances} className="h-full w-full" />
        <MapLegend className="absolute bottom-4 left-4 z-[1000]" />
      </div>
    </div>
  );
}

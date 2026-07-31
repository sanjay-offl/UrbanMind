'use client';

import { useEffect, useState } from 'react';
import { getGrievances } from '@/lib/api';
import type { Grievance } from '@/types/grievance';
import PageHeader from '@/components/layout/page-header';
import ComplaintMap from '@/components/map/complaint-map';
import MapLegend from '@/components/map/map-legend';
import { Card, CardContent } from '@/components/ui/card';
import { useWard, wardIdFromSelection } from '@/lib/ward-context';

export default function MapPage() {
  const { selectedWard } = useWard();
  const [grievances, setGrievances] = useState<Grievance[]>([]);

  useEffect(() => {
    getGrievances({ ward_id: wardIdFromSelection(selectedWard) }).then((data) => {
      setGrievances(data);
    });
  }, [selectedWard]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grievance Map"
        description={
          selectedWard === 'all'
            ? 'Spatial view of citizen complaints across the city'
            : `Spatial view for ${selectedWard}`
        }
      />
      <Card className="glass-card h-[calc(100vh-8rem)]">
        <CardContent className="relative h-full p-0">
          <ComplaintMap grievances={grievances} className="h-full w-full" />
          <MapLegend className="absolute bottom-4 left-4 z-[1000]" />
        </CardContent>
      </Card>
    </div>
  );
}

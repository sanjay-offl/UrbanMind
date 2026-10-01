'use client';

import { useCallback, useEffect, useState } from 'react';
import { getGrievances } from '@/lib/api';
import type { Grievance } from '@/types/grievance';
import PageHeader from '@/components/layout/page-header';
import GrievanceFilters from '@/components/grievances/grievance-filters';
import GrievanceTable from '@/components/grievances/grievance-table';
import type { GrievanceFilters as Filters } from '@/components/grievances/grievance-filters';
import { useWard, wardIdFromSelection } from '@/lib/ward-context';

export default function GrievancesPage() {
  const { selectedWard } = useWard();
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});

  const fetchGrievances = useCallback(async (f: Filters, ward: string) => {
    setLoading(true);
    try {
      const data = await getGrievances({ ...f, ward_id: wardIdFromSelection(ward) });
      setGrievances(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrievances(filters, selectedWard);
  }, [filters, selectedWard, fetchGrievances]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grievances"
        description={
          selectedWard === 'all'
            ? 'Browse, filter and inspect citizen grievances'
            : `Showing grievances for ${selectedWard}`
        }
      />
      <GrievanceFilters onFilterChange={setFilters} />
      <GrievanceTable grievances={grievances} loading={loading} />
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { getGrievances } from '@/lib/api';
import type { Grievance } from '@/types/grievance';
import PageHeader from '@/components/layout/page-header';
import GrievanceFilters from '@/components/grievances/grievance-filters';
import GrievanceTable from '@/components/grievances/grievance-table';
import type { GrievanceFilters as Filters } from '@/components/grievances/grievance-filters';

export default function GrievancesPage() {
  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({});

  const fetchGrievances = useCallback(async (f: Filters) => {
    setLoading(true);
    try {
      const data = await getGrievances(f);
      setGrievances(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGrievances(filters);
  }, [filters, fetchGrievances]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grievances"
        description="Browse, filter and inspect citizen grievances"
      />
      <GrievanceFilters onFilterChange={setFilters} />
      <GrievanceTable grievances={grievances} loading={loading} />
    </div>
  );
}

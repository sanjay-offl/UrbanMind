'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import type { GrievanceRecord } from '@/types/grievance';
import PageHeader from '@/components/layout/page-header';
import GrievanceFilters, { type GrievanceFiltersState } from '@/components/grievances/grievance-filters';
import GrievanceTable from '@/components/grievances/grievance-table';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';
import { Plus } from 'lucide-react';

export default function GrievancesPage() {
  const { selectedState, selectedDistrict, selectedCity, selectedWard, geoBreadcrumb } = useGeography();
  const { t } = useI18n();
  const [grievances, setGrievances] = useState<GrievanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<GrievanceFiltersState>({});
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [total, setTotal] = useState(0);

  const fetchGrievances = useCallback(async (f: GrievanceFiltersState, p: number, size: number) => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      q.set('page', String(p));
      q.set('per_page', String(size));
      if (selectedState !== 'all') q.set('state', selectedState);
      if (selectedDistrict !== 'all') q.set('district', selectedDistrict);
      if (selectedCity !== 'all') q.set('city', selectedCity);
      if (selectedWard !== 'all') q.set('ward', selectedWard);

      if (f.search) q.set('search', f.search);
      if (f.category) q.set('category', f.category);
      if (f.status) q.set('status', f.status);
      if (f.priority) q.set('priority', f.priority);
      if (f.severity) q.set('severity', f.severity);
      if (f.urgency) q.set('urgency', f.urgency);
      if (f.language) q.set('language', f.language);
      if (f.sort) q.set('sort', f.sort);

      const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/grievances?${q.toString()}`, { headers });
      const payload = await res.json();
      if (payload.ok && payload.data) {
        setGrievances(payload.data.items ?? []);
        setTotal(payload.data.total ?? 0);
      } else if (Array.isArray(payload)) {
        setGrievances(payload);
        setTotal(payload.length);
      }
    } catch {
      setGrievances([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedState, selectedDistrict, selectedCity, selectedWard]);

  useEffect(() => {
    setPage(1);
  }, [filters, selectedState, selectedDistrict, selectedCity, selectedWard]);

  useEffect(() => {
    fetchGrievances(filters, page, perPage);
  }, [filters, page, perPage, fetchGrievances]);

  const scopeLabel = geoBreadcrumb.map((b) => b.name).join(' / ');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={t('grievances')}
          description={`Showing verified complaints for ${scopeLabel}`}
        />

        <Link href="/submit" className="btn-primary">
          <Plus size={15} />
          <span>{t('submitButton')}</span>
        </Link>
      </div>

      {/* Unboxed Filter Toolbar */}
      <GrievanceFilters onFilterChange={setFilters} />

      {/* Single Bordered Panel Table */}
      <GrievanceTable
        grievances={grievances}
        loading={loading}
        page={page}
        total={total}
        perPage={perPage}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
      />
    </div>
  );
}

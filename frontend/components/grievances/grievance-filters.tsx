'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectValue } from '@/components/ui/select';
import { CATEGORIES, STATUS_OPTIONS } from '@/lib/constants';
import type { Priority } from '@/types/grievance';

export interface GrievanceFilters {
  search?: string;
  category?: string;
  ward_id?: string;
  status?: string;
  priority?: string;
}

const PRIORITY_OPTIONS: Priority[] = ['critical', 'high', 'medium', 'low'];

export default function GrievanceFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: GrievanceFilters) => void;
}) {
  const update = (patch: Partial<GrievanceFilters>) => {
    onFilterChange(patch);
  };

  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg border bg-card p-4 sm:grid-cols-2 lg:grid-cols-5">
      <div className="relative lg:col-span-2">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title or description…"
          className="pl-9"
          onChange={(e) => update({ search: e.target.value || undefined })}
        />
      </div>
      <Select value="all" onValueChange={(v) => update({ category: v === 'all' ? undefined : v })}>
        <SelectValue>All Categories</SelectValue>
        <SelectItem value="all">All Categories</SelectItem>
        {CATEGORIES.map((category) => (
          <SelectItem key={category} value={category}>
            {category}
          </SelectItem>
        ))}
      </Select>
      <Select value="all" onValueChange={(v) => update({ status: v === 'all' ? undefined : v })}>
        <SelectValue>All Statuses</SelectValue>
        <SelectItem value="all">All Statuses</SelectItem>
        {STATUS_OPTIONS.map((status) => (
          <SelectItem key={status} value={status}>
            {status}
          </SelectItem>
        ))}
      </Select>
      <Select value="all" onValueChange={(v) => update({ priority: v === 'all' ? undefined : v })}>
        <SelectValue>All Priorities</SelectValue>
        <SelectItem value="all">All Priorities</SelectItem>
        {PRIORITY_OPTIONS.map((priority) => (
          <SelectItem key={priority} value={priority}>
            {priority}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}

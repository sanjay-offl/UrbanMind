/**
 * Typed grievance service.
 * Manages queries, filters, detail retrieval, and mutation overlay for grievances.
 */

import { filterRequests, type GeoFilter } from '@/lib/analytics';
import { findRequest, patchRequest, listRequests, type Patch } from '@/lib/grievance-store';
import type { CivicRequest, PriorityTier, Sector } from '@/lib/civic-data';

export interface GrievanceFilterOptions {
  sector?: Sector | 'all';
  priority?: PriorityTier | 'all';
  status?: string;
  language?: string;
  search?: string;
  page?: number;
  perPage?: number;
  sort?: 'priority' | 'newest' | 'oldest' | 'severity';
}

export interface PaginatedGrievances {
  items: CivicRequest[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export function getGrievanceList(
  geo: GeoFilter,
  options: GrievanceFilterOptions = {}
): PaginatedGrievances {
  const {
    sector = 'all',
    priority = 'all',
    status = 'all',
    language = 'all',
    search = '',
    page = 1,
    perPage = 25,
    sort = 'priority',
  } = options;

  const rows = filterRequests(geo, { sector, priority, status, language, search });

  const sorted = [...rows].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return b.day - a.day || b.id - a.id;
      case 'oldest':
        return a.day - b.day || a.id - b.id;
      case 'severity':
        return b.severity - a.severity;
      default:
        return b.priority_score - a.priority_score || b.id - a.id;
    }
  });

  const validPage = Math.max(1, page);
  const validPerPage = Math.min(100, Math.max(1, perPage));
  const start = (validPage - 1) * validPerPage;
  const items = sorted.slice(start, start + validPerPage);

  return {
    items,
    total: sorted.length,
    page: validPage,
    perPage: validPerPage,
    totalPages: Math.max(1, Math.ceil(sorted.length / validPerPage)),
  };
}

export function getGrievanceById(id: number): CivicRequest | null {
  return findRequest(id) ?? null;
}

export function updateGrievanceStatus(
  id: number,
  status: CivicRequest['status'],
  note?: string,
  actor = 'Authorized Officer'
): CivicRequest | null {
  return patchRequest(id, { status, note }, actor);
}

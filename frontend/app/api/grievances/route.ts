import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { filterRequests } from '@/lib/analytics';
import { resolveGeo } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/grievances — paginated, filtered, searchable request list. */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_grievances');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const perPage = Math.min(100, Math.max(1, Number(params.get('per_page')) || 25));
  const sort = params.get('sort') ?? 'priority';

  const rows = filterRequests(geo, {
    sector: filters.sector,
    priority: filters.priority,
    status: filters.status,
    language: filters.language,
    search: filters.search,
  });

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

  const start = (page - 1) * perPage;
  const items = sorted.slice(start, start + perPage);

  return handle((): ApiResult<{
    items: typeof items;
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    geo: ReturnType<typeof resolveGeo>;
  }> => ({
    ok: true,
    data: {
      items,
      total: sorted.length,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil(sorted.length / perPage)),
      geo: resolveGeo(geo),
    },
  }));
}

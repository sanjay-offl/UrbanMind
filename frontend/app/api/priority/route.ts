import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { filterRequests, priorityProjects } from '@/lib/analytics';
import { resolveGeo } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/priority — the recommended development shortlist.
 *
 * Every score here is produced by the deterministic priority engine in
 * `lib/civic-data.ts`; the model never sets the number.
 */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_priority');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);
  const limit = Math.min(60, Math.max(3, Number(params.get('limit')) || 20));

  return handle((): ApiResult<unknown> => {
    const rows = filterRequests(geo, {
      sector: filters.sector,
      priority: filters.priority,
      language: filters.language,
    });
    const projects = priorityProjects(rows, limit);
    const totalCost = projects.reduce((s, p) => s + p.estimated_cost_crore, 0);

    return {
      ok: true,
      data: {
        geo: resolveGeo(geo),
        count: projects.length,
        projects,
        portfolio: {
          total_estimated_cost_crore: Math.round(totalCost * 10) / 10,
          people_benefiting: projects.reduce((s, p) => s + p.affected_population, 0),
          by_tier: projects.reduce<Record<string, number>>((acc, p) => {
            acc[p.priority] = (acc[p.priority] ?? 0) + 1;
            return acc;
          }, {}),
        },
      },
    };
  });
}

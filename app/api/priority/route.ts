import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { filterRequests, priorityProjects, type PriorityProject } from '@/lib/analytics';
import { resolveGeo, type PriorityTier } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/priority — the recommended development shortlist.
 *
 * Every score comes from the deterministic priority engine in
 * `lib/civic-data.ts`; the model never sets the number.
 *
 * `?diversify=1` (the default) caps how many projects one sector may take, so
 * the shortlist spans the civic agenda instead of collapsing onto whichever
 * sector carries the highest severity. `?diversify=0` returns the raw ranking.
 */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_priority');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);
  const limit = Math.min(60, Math.max(3, Number(params.get('limit')) || 20));
  const perSector = Math.min(12, Math.max(1, Number(params.get('per_sector')) || 3));
  const diversify = params.get('diversify') !== '0';

  return handle((): ApiResult<unknown> => {
    const rows = filterRequests(geo, {
      sector: filters.sector,
      priority: filters.priority,
      language: filters.language,
    });

    // Rank every candidate, not just the page, so the tier mix is honest.
    const all = priorityProjects(rows, 400);
    const projects = diversify
      ? capPerSector(all, perSector, limit)
      : all.slice(0, limit);

    const tierMix = all.reduce<Record<string, number>>((acc, p) => {
      acc[p.priority] = (acc[p.priority] ?? 0) + 1;
      return acc;
    }, {});

    const sectorMix = all.reduce<Record<string, number>>((acc, p) => {
      acc[p.sector] = (acc[p.sector] ?? 0) + 1;
      return acc;
    }, {});

    const totalCost = projects.reduce((s, p) => s + p.estimated_cost_crore, 0);

    return {
      ok: true,
      data: {
        geo: resolveGeo(geo),
        view: {
          mode: diversify ? 'balanced_portfolio' : 'raw_ranking',
          per_sector_cap: diversify ? perSector : null,
          candidates_considered: all.length,
        },
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
        candidate_mix: {
          by_tier: tierMix as Record<PriorityTier, number>,
          by_sector: Object.entries(sectorMix)
            .map(([sector, count]) => ({ sector, count }))
            .sort((a, b) => b.count - a.count),
        },
      },
    };
  });
}

/** Take the best `cap` from each sector by rank, then return the top `limit`. */
function capPerSector(all: PriorityProject[], cap: number, limit: number): PriorityProject[] {
  const counts = new Map<string, number>();
  const picked: PriorityProject[] = [];
  for (const p of all) {
    const used = counts.get(p.sector) ?? 0;
    if (used >= cap) continue;
    counts.set(p.sector, used + 1);
    picked.push(p);
    if (picked.length >= limit) return picked;
  }
  // If every sector is exhausted, fall back to the remaining raw ranking.
  if (picked.length < limit) {
    const chosen = new Set(picked.map((p) => p.id));
    for (const p of all) {
      if (chosen.has(p.id)) continue;
      picked.push(p);
      if (picked.length >= limit) break;
    }
  }
  return picked;
}

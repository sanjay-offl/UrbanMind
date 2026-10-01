import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { filterRequests, hotspots } from '@/lib/analytics';
import { SECTOR_ACTIONS, resolveGeo } from '@/lib/civic-data';
import { datasetMeta } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/hotspots — district × sector clusters ranked by a transparent
 * hotspot score (volume × population × infrastructure gap × severity).
 */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_hotspots');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);
  const limit = Math.min(120, Math.max(5, Number(params.get('limit')) || 40));
  const sector = params.get('sector');

  return handle((): ApiResult<unknown> => {
    const rows = filterRequests(geo, {
      sector: sector && sector !== 'all' ? filters.sector : 'all',
      priority: filters.priority,
      language: filters.language,
    });
    const list = hotspots(rows, limit);

    return {
      ok: true,
      data: {
        geo: resolveGeo(geo),
        count: list.length,
        hotspots: list,
        actions: list.slice(0, 8).map((h) => ({
          district: h.district,
          state: h.state,
          sector: h.sector,
          action: SECTOR_ACTIONS[h.sector],
          score: h.hotspot_score,
        })),
        meta: datasetMeta(),
      },
    };
  });
}

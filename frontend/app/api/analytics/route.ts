import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { summarize } from '@/lib/analytics';
import { districts, languageBreakdown, languages } from '@/lib/analytics-extensions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/analytics — full dashboard payload for one geography.
 *
 * Query: level, state, district, city, ward, sector, priority, status,
 * language, search.
 */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_dashboard');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);

  return handle((): ApiResult<unknown> => {
    const summary = summarize(geo, {
      sector: filters.sector,
      priority: filters.priority,
      status: filters.status,
      language: filters.language,
      search: filters.search,
    });

    return {
      ok: true,
      data: {
        ...summary,
        districts: districts(geo),
        languages: languages(geo),
        language_mix: languageBreakdown(geo),
      },
    };
  });
}

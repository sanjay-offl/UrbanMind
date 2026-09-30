import { handle, type ApiResult } from '@/lib/api-helpers';
import {
  INTAKE_CHANNELS,
  datasetMeta,
  districtsOfState,
  resolveGeo,
  states,
  wardsOfDistrict,
  type DistrictRecord,
} from '@/lib/civic-data';
import { stateOptions } from '@/lib/analytics-extensions';
import { languageBreakdown } from '@/lib/analytics-extensions';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/geography — the India → State → District → City → Ward hierarchy.
 *
 * Pass `?state=` to get that state's districts, `?district=` to get its wards.
 * No permission gate: the public intake form needs the same hierarchy.
 */
export function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const state = params.get('state');
  const district = params.get('district');

  return handle((): ApiResult<unknown> => {
    if (state && district) {
      const wards = wardsOfDistrict(district);
      const city =
        districtsOfState(state).find((d) => d.name === district)?.city ?? null;
      return {
        ok: true,
        data: {
          level: 'ward' as const,
          state,
          district,
          city,
          wards,
        },
      };
    }

    if (state) {
      const list = districtsOfState(state);
      const geo = resolveGeo({ level: 'state', state });
      return {
        ok: true,
        data: {
          level: 'district' as const,
          state,
          centre: [geo.lat, geo.lng],
          population: geo.population,
          cities: [...new Set(list.map((d) => d.city))].sort(),
          districts: list.map((d: DistrictRecord) => ({
            code: d.code,
            name: d.name,
            city: d.city,
            lat: d.lat,
            lng: d.lng,
            population: d.population,
            wards: d.wards.length,
          })),
        },
      };
    }

    const list = states();
    const india = resolveGeo({ level: 'india' });
    return {
      ok: true,
      data: {
        level: 'state' as const,
        centre: [india.lat, india.lng],
        states: stateOptions(),
        languages: languageBreakdown({ level: 'india' }),
        channels: INTAKE_CHANNELS,
        meta: datasetMeta(),
        total_districts: list.reduce((s, st) => s + st.districts, 0),
      },
    };
  });
}

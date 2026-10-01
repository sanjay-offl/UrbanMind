import { geoFilterFromParams, handle, requirePermission, type ApiResult } from '@/lib/api-helpers';
import { getDashboardData, type DashboardPayload } from '@/lib/services/dashboardService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_dashboard');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);

  return handle((): ApiResult<DashboardPayload> => ({
    ok: true,
    data: getDashboardData(geo),
  }));
}

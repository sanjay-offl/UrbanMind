import { handle, requirePermission, type ApiResult } from '@/lib/api-helpers';
import { REPORT_LABELS, REPORT_TYPES, renderReportPdf, type ReportType } from '@/lib/reports';
import type { GeoLevel } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/reports/download?type=&level=&state=&district=
 *
 * Streams a real PDF generated on demand from the deterministic aggregates —
 * no stored blob, so the document always matches the current data.
 */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'generate_reports');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  return Promise.resolve(buildResponse(request, guard.claims));
}

function buildResponse(request: Request, claims: { name: string; role: string }): Response {
  const params = new URL(request.url).searchParams;
  const typeParam = params.get('type') ?? 'national_summary';
  const type: ReportType = (REPORT_TYPES as readonly string[]).includes(typeParam)
    ? (typeParam as ReportType)
    : 'national_summary';

  const levelParam = (params.get('level') ?? 'india') as GeoLevel;
  const level: GeoLevel = ['india', 'state', 'district', 'city', 'ward'].includes(levelParam)
    ? levelParam
    : 'india';

  const geo = {
    level,
    state: params.get('state'),
    district: params.get('district'),
    city: params.get('city'),
    ward: params.get('ward'),
  };

  const { buffer, filename } = renderReportPdf(type, geo, {
    generatedBy: claims.name,
    role: claims.role,
  });

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(buffer.byteLength),
      'Cache-Control': 'no-store',
      'X-Report-Title': encodeURIComponent(REPORT_LABELS[type]),
    },
  });
}

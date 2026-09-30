import { randomUUID } from 'node:crypto';
import {
  geoFilterFromParams,
  handle,
  requirePermission,
  type ApiResult,
} from '@/lib/api-helpers';
import { kpis, filterRequests, priorityProjects, type GeoFilter } from '@/lib/analytics';
import { resolveGeo, type GeoLevel } from '@/lib/civic-data';
import { REPORT_LABELS, REPORT_TYPES, renderReportPdf, type ReportType } from '@/lib/reports';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GeneratedReport {
  id: string;
  type: ReportType;
  title: string;
  scope: string;
  generated_at: string;
  generated_by: string;
  role: string;
  size_label: string;
  stats: {
    requests: number;
    critical: number;
    priority_projects: number;
  };
}

/** Reports generated in this process, newest first. */
const registry: GeneratedReport[] = [];

/** GET /api/reports — the report catalogue + what can be generated. */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_reports');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);

  return handle((): ApiResult<unknown> => ({
    ok: true,
    data: {
      available: REPORT_TYPES.map((t) => ({
        type: t,
        label: REPORT_LABELS[t],
        description: REPORT_DESCRIPTIONS[t],
      })),
      generated: registry.filter((r) => r.scope === resolveGeo(geo).name || params.get('all') === '1'),
      scope: resolveGeo(geo).name,
    },
  }));
}

const REPORT_DESCRIPTIONS: Record<ReportType, string> = {
  national_summary: 'Headline indicators, sector mix, movement and state comparison.',
  state_brief: 'Administrative brief for a single state with district annexure.',
  district_annexure: 'District-level table with infrastructure coverage columns.',
  priority_dossier: 'Ranked investment shortlist with indicative costs.',
  language_coverage: 'Distribution of requests across the 17 language variants.',
};

/** POST /api/reports — generate a report for the current scope. */
export async function POST(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'generate_reports');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  let body: { type?: unknown; level?: unknown; state?: unknown; district?: unknown; city?: unknown; ward?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  const type = (REPORT_TYPES as readonly string[]).includes(body.type as string)
    ? (body.type as ReportType)
    : 'national_summary';

  const levelParam = (body.level ?? 'india') as GeoLevel;
  const level: GeoLevel = ['india', 'state', 'district', 'city', 'ward'].includes(levelParam)
    ? levelParam
    : 'india';

  const geo: GeoFilter = {
    level,
    state: typeof body.state === 'string' ? body.state : null,
    district: typeof body.district === 'string' ? body.district : null,
    city: typeof body.city === 'string' ? body.city : null,
    ward: typeof body.ward === 'string' ? body.ward : null,
  };

  return handle((): ApiResult<unknown> => {
    const scope = resolveGeo(geo);
    const { buffer, filename, title } = renderReportPdf(type, geo, {
      generatedBy: guard.claims.name,
      role: guard.claims.role,
    });

    const rows = filterRequests(geo);
    const k = kpis(rows);
    const projects = priorityProjects(rows, 12);

    const id = randomUUID();
    registry.unshift({
      id,
      type,
      title,
      scope: scope.name,
      generated_at: new Date().toISOString(),
      generated_by: guard.claims.name,
      role: guard.claims.role,
      size_label: `${Math.max(1, Math.round(buffer.byteLength / 1024))} KB`,
      stats: {
        requests: k.total_requests,
        critical: k.critical_requests,
        priority_projects: projects.length,
      },
    });
    if (registry.length > 25) registry.pop();

    return {
      ok: true,
      data: {
        id,
        filename,
        title,
        scope: scope.name,
        bytes: buffer.byteLength,
        content_type: 'application/pdf',
      },
    };
  });
}

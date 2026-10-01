import {
  asInt,
  clampText,
  handle,
  notFound,
  requirePermission,
  type ApiResult,
} from '@/lib/api-helpers';
import { findRequest, notesFor, patchRequest } from '@/lib/grievance-store';
import { geoContextForRequest, type RequestStatus } from '@/lib/civic-data';
import {
  normalizeCategory,
  normalizeStatus,
  priorityLevelFromScore,
  type GrievanceRecord,
} from '@/types/grievance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUSES: RequestStatus[] = [
  'pending',
  'classified',
  'in_progress',
  'resolved',
  'closed',
];

/** GET /api/grievances/:id — one request plus geo context and activity notes. */
export function GET(request: Request, { params }: { params: { id: string } }): Promise<Response> {
  const guard = requirePermission(request, 'view_grievances');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const id = asInt(params.id, NaN);
  return handle((): ApiResult<unknown> => {
    if (!Number.isFinite(id)) return notFound('Invalid request id');
    const row = findRequest(id);
    if (!row) return notFound(`No request with id ${params.id}`);

    const rawScore = row.priority_score;
    const score = typeof rawScore === 'number' && !Number.isNaN(rawScore) ? rawScore : null;
    const record: GrievanceRecord = {
      id: row.id,
      displayId: `GRV-${row.id.toString().padStart(6, '0')}`,
      timestamp: row.created_at || new Date().toISOString(),
      state: row.state,
      district: row.district,
      city: row.city || 'Not available',
      ward: row.ward && row.ward.trim() ? row.ward : 'Not available',
      languageCode: row.languageCode || row.language || 'en',
      language: row.language_name || 'English',
      category: normalizeCategory(row.category || row.sector),
      description: row.description || row.translation || 'No description provided',
      severity: row.severity || 0,
      urgency: row.urgency || 0,
      priorityScore: score,
      priorityLevel: priorityLevelFromScore(score),
      status: normalizeStatus(row.status),
      processingStatus: row.ai_analysed ? 'Classified' : 'Pending',
      dataSource: row.source.toLowerCase().includes('synthetic') || row.source.toLowerCase().includes('demo') ? 'Synthetic' : 'Public',
      latitude: row.lat,
      longitude: row.lng,
      title: row.description ? (row.description.length > 55 ? `${row.description.slice(0, 52)}...` : row.description) : row.category,
      affectedPopulation: row.affected_population,
      hotspotScore: row.hotspot_score,
      recommendedAction: row.recommended_action,
      aiReasoning: row.ai_reasoning,
      originalText: row.originalText || row.description,
      translatedText: row.translatedText || row.translation,
      factors: row.priority_factors,
    };

    return { ok: true, data: { ...row, ...record, geo: geoContextForRequest(row), notes: notesFor(id) } };
  });
}

/**
 * PATCH /api/grievances/:id — status transitions and officer notes.
 *
 * `edit_grievances` is admin + ward officer only. A ward officer is further
 * restricted, in logic, to the districts attached to their account.
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
): Promise<Response> {
  const guard = requirePermission(request, 'edit_grievances');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const id = asInt(params.id, NaN);
  let body: { status?: unknown; note?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'Expected a JSON body',
      code: 'bad_request',
    }));
  }

  return handle((): ApiResult<unknown> => {
    if (!Number.isFinite(id)) return notFound('Invalid request id');
    const existing = findRequest(id);
    if (!existing) return notFound(`No request with id ${params.id}`);

    const status = STATUSES.includes(body.status as RequestStatus)
      ? (body.status as RequestStatus)
      : undefined;
    if (body.status !== undefined && !status) {
      return {
        ok: false,
        error: `status must be one of: ${STATUSES.join(', ')}`,
        code: 'bad_request',
      };
    }

    // Ward officers cannot act outside the ward on their account.
    if (guard.claims.role === 'ward_officer') {
      if (existing.district !== WARD_OFFICER_DISTRICT) {
        return {
          ok: false,
          error: `This account is scoped to ${WARD_OFFICER_DISTRICT}. The request is in ${existing.district}, so it must be actioned by the district office.`,
          code: 'forbidden',
        };
      }
      if (guard.claims.ward && existing.ward !== guard.claims.ward) {
        return {
          ok: false,
          error: `This account is scoped to ${guard.claims.ward}. The request belongs to "${existing.ward}".`,
          code: 'forbidden',
        };
      }
    }

    const updated = patchRequest(id, { status, note: clampText(body.note, 500) }, guard.claims.name);
    if (!updated) return notFound(`No request with id ${params.id}`);

    return { ok: true, data: { ...updated, notes: notesFor(id) } };
  });
}

/** District the seeded ward-officer account is scoped to. */
const WARD_OFFICER_DISTRICT = 'Chennai';

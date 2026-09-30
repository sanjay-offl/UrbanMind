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
    return { ok: true, data: { ...row, geo: geoContextForRequest(row), notes: notesFor(id) } };
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

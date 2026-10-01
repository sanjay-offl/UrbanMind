import { clampText, handle, requirePermission, type ApiResult } from '@/lib/api-helpers';
import { classifyComplaint } from '@/lib/civic-ai';
import { redactPII } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/complaints — text intake.
 *
 * Accepts JSON `{ text, locationHint }` or a multipart form with `text`.
 * Returns the structured civic record plus an explicit `provider` so the UI can
 * say whether Gemini or the rules engine produced it.
 */
export async function POST(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'submit_complaint');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const contentType = request.headers.get('content-type') ?? '';
  let text = '';
  let locationHint: string | null = null;

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      text = clampText(form.get('text'), 6000);
      locationHint = clampText(form.get('locationHint') || form.get('location'), 120) || null;
    } else {
      const body = (await request.json()) as { text?: unknown; locationHint?: unknown; location?: unknown };
      text = clampText(body.text, 6000);
      locationHint =
        clampText(body.locationHint ?? body.location, 120) || null;
    }
  } catch {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'Could not read the request body',
      code: 'bad_request',
    }));
  }

  if (text.length < 8) {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'Please describe the problem in at least 8 characters.',
      code: 'bad_request',
    }));
  }

  return handle(async (): Promise<ApiResult<unknown>> => {
    const redaction = redactPII(text);
    const envelope = await classifyComplaint({ text, locationHint });
    return {
      ok: true,
      data: {
        ...envelope,
        input: { text, location_hint: locationHint },
        redaction,
      },
    };
  });
}

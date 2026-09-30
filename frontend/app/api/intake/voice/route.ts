import { clampText, handle, requirePermission, type ApiResult } from '@/lib/api-helpers';
import { classifyComplaint, translateAndDetect } from '@/lib/civic-ai';
import { redactPII } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/intake/voice — voice intake.
 *
 * The browser's SpeechRecognition (or the manual transcript box) supplies the
 * text; the server has no audio model, so audio bytes are *not* accepted. The
 * transcript is then classified exactly like a typed complaint.
 */
export async function POST(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'submit_complaint');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const contentType = request.headers.get('content-type') ?? '';
  let transcript = '';
  let language = '';
  let locationHint: string | null = null;

  try {
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      if (form.get('audio')) {
        return handle((): ApiResult<never> => ({
          ok: false,
          error:
            'Audio upload is not supported. Record with the in-page microphone, which transcribes in the browser, or paste the transcript.',
          code: 'bad_request',
        }));
      }
      transcript = clampText(form.get('transcript') ?? form.get('text'), 6000);
      language = clampText(form.get('language'), 20);
      locationHint = clampText(form.get('locationHint'), 120) || null;
    } else {
      const body = (await request.json()) as {
        transcript?: unknown;
        text?: unknown;
        language?: unknown;
        locationHint?: unknown;
      };
      transcript = clampText(body.transcript ?? body.text, 6000);
      language = clampText(body.language, 20);
      locationHint = clampText(body.locationHint, 120) || null;
    }
  } catch {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'Could not read the request body',
      code: 'bad_request',
    }));
  }

  if (transcript.length < 8) {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'The transcript is too short to classify. Record for a few seconds and try again.',
      code: 'bad_request',
    }));
  }

  return handle(async (): Promise<ApiResult<unknown>> => {
    const redaction = redactPII(transcript);
    const detection = await translateAndDetect({ text: transcript });
    const envelope = await classifyComplaint({ text: transcript, locationHint });
    return {
      ok: true,
      data: {
        ...envelope,
        capture: {
          mode: 'browser-speech-recognition',
          declared_language: language || null,
          characters: transcript.length,
          transcript,
        },
        detection,
        redaction,
      },
    };
  });
}

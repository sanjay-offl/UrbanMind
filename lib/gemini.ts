/**
 * Google AI (Gemini) access layer.
 *
 * Responsibilities:
 *   • report honestly whether Google AI is configured (`isConfigured`)
 *   • hold the real model names used in responses
 *   • perform JSON-schema-constrained generation and translation/chat calls
 *   • retry transient failures with exponential backoff
 *
 * Hard rule: this module never labels heuristic output as a model result. When
 * no credential is present, callers fall back to `deterministic.ts`, which
 * reports `provider: 'fallback'` all the way to the UI.
 */

// Server-only module: imported exclusively by Next.js route handlers, which
// never reach the browser bundle. The `server-only` guard package is
// intentionally not added as a dependency.

export const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.0-flash';
export const GEMINI_MODEL_FALLBACK = 'gemini-1.5-flash';
export const GEMINI_EMBEDDING_MODEL =
  process.env.GEMINI_EMBEDDING_MODEL ?? 'text-embedding-004';

const API_KEY =
  process.env.GEMINI_API_KEY ??
  process.env.GOOGLE_API_KEY ??
  process.env.GOOGLE_AI_API_KEY ??
  '';

export interface AiProviderInfo {
  provider: 'google' | 'fallback';
  model: string;
  configured: boolean;
  /** shown in the UI when Google AI is not reachable */
  note: string | null;
  tasks: string[];
}

export function aiProviderInfo(): AiProviderInfo {
  const configured = API_KEY.length > 20;
  return {
    provider: configured ? 'google' : 'fallback',
    model: configured ? GEMINI_MODEL : 'deterministic-rules',
    configured,
    note: configured
      ? null
      : 'GEMINI_API_KEY is not set. Structured analysis uses the deterministic UrbanMind rules engine and is labelled as such throughout the UI.',
    tasks: configured
      ? [
          'Complaint classification (schema-constrained JSON)',
          'Language detection + English translation',
          'Severity, urgency and sentiment scoring',
          'Civic assistant answers grounded in live aggregates',
          'Report narrative generation',
        ]
      : ['Complaint classification (rules engine)', 'Deterministic priority scoring'],
  };
}

export function isConfigured(): boolean {
  return API_KEY.length > 20;
}

// ── Low-level transport ──────────────────────────────────────────────────────

export class GeminiError extends Error {
  status?: number;
  retryable: boolean;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'GeminiError';
    this.status = status;
    this.retryable =
      status === undefined || status === 429 || status === 500 || status === 503 || status === 504;
  }
}

const RATE_LIMIT_MARKERS = ['429', 'RESOURCE_EXHAUSTED', 'rate limit', 'quota'];

function isRateLimit(text: string, status?: number): boolean {
  if (status === 429) return true;
  const lower = text.toLowerCase();
  return RATE_LIMIT_MARKERS.some((m) => lower.includes(m.toLowerCase()));
}

interface GenerateOptions {
  systemInstruction?: string;
  prompt: string;
  /** Gemini responseSchema — forces structured JSON output */
  schema?: Record<string, unknown>;
  temperature?: number;
  maxOutputTokens?: number;
  /** try GEMINI_MODEL_FALLBACK if the primary model is unavailable */
  allowModelFallback?: boolean;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function callGemini(
  model: string,
  opts: GenerateOptions,
  attempt = 0
): Promise<string> {
  if (!isConfigured()) {
    throw new GeminiError('Google AI is not configured (missing GEMINI_API_KEY).');
  }

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.schema ? { responseMimeType: 'application/json', responseSchema: opts.schema } : {}),
    },
  };
  if (opts.systemInstruction) {
    body.systemInstruction = { parts: [{ text: opts.systemInstruction }] };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': API_KEY,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        cache: 'no-store',
      }
    );
  } catch (err) {
    clearTimeout(timeout);
    if (attempt < 3) {
      await sleep(400 * 2 ** attempt);
      return callGemini(model, opts, attempt + 1);
    }
    throw new GeminiError(
      `Could not reach Google AI: ${err instanceof Error ? err.message : 'network error'}`
    );
  }
  clearTimeout(timeout);

  if (!res.ok) {
    const detail = await res.text();
    const message = detail.slice(0, 400);
    const rateLimited = isRateLimit(message, res.status);
    if ((res.status === 404 || res.status === 400) && opts.allowModelFallback !== false) {
      throw new GeminiError(message, res.status);
    }
    if ((rateLimited || res.status >= 500) && attempt < 3) {
      await sleep(500 * 2 ** attempt);
      return callGemini(model, opts, attempt + 1);
    }
    throw new GeminiError(message, res.status);
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) {
    const blocked = json.promptFeedback?.blockReason;
    throw new GeminiError(
      blocked
        ? `Gemini blocked the request (${blocked}).`
        : 'Gemini returned an empty response.'
    );
  }
  return text;
}

export interface GenerateResult {
  text: string;
  model: string;
  provider: 'google';
}

/**
 * Run a generation. If `GEMINI_MODEL` is unavailable (404 / bad model name) and
 * the caller allows it, transparently retry on the stable fallback model.
 */
export async function generate(opts: GenerateOptions): Promise<GenerateResult> {
  try {
    const text = await callGemini(GEMINI_MODEL, opts);
    return { text, model: GEMINI_MODEL, provider: 'google' };
  } catch (err) {
    const status = err instanceof GeminiError ? err.status : undefined;
    if (status === 404 && opts.allowModelFallback !== false) {
      const text = await callGemini(GEMINI_MODEL_FALLBACK, {
        ...opts,
        allowModelFallback: false,
      });
      return { text, model: GEMINI_MODEL_FALLBACK, provider: 'google' };
    }
    throw err;
  }
}

/** Generate and parse schema-constrained JSON, tolerating stray code fences. */
export async function generateJson<T>(
  opts: GenerateOptions
): Promise<{ data: T; model: string }> {
  const result = await generate(opts);
  const cleaned = result.text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  return { data: JSON.parse(cleaned) as T, model: result.model };
}

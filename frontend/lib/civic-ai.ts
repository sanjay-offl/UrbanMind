/**
 * Civic classification service.
 *
 * Tries Google AI first (Gemini, schema-constrained JSON). If no key is
 * configured, or the model call fails, it falls back to the deterministic
 * rules engine and — critically — reports which path produced the result.
 *
 * The returned envelope always contains:
 *   provider: 'google' | 'fallback'
 *   model:    the actual model used, or 'deterministic-rules'
 *   degraded: true when the AI path was attempted but did not succeed
 *
 * Nothing here ever invents a result: on failure the caller still gets a
 * genuine rules-engine analysis, clearly labelled.
 */

// Server-only module: imported exclusively by Next.js route handlers, which
// never reach the browser bundle. The `server-only` guard package is
// intentionally not added as a dependency.

import {
  districtsOfState,
  districtByDistrictName,
  states,
} from './civic-data';
import {
  CLASSIFICATION_SCHEMA,
  SYSTEM_PROMPT,
  buildClassificationPrompt,
  classifyComplaintDeterministic,
  type Classification,
} from './deterministic';
import { GeminiError, aiProviderInfo, generateJson, isConfigured } from './gemini';

export interface ClassificationEnvelope {
  classification: Classification;
  provider: 'google' | 'fallback';
  model: string;
  degraded: boolean;
  /** user-facing note, e.g. why the fallback was used */
  note: string | null;
  latency_ms: number;
}

const VALID_SECTORS = new Set([
  'water',
  'roads',
  'sanitation',
  'electricity',
  'health',
  'education',
  'public_safety',
  'agriculture',
  'environment',
  'transport',
]);

/**
 * Never trust model output blindly. Coerce every field into the expected type
 * and range, and fall back to the rules engine for anything unusable.
 */
function validate(raw: unknown, sourceText: string, locationHint?: string | null): Classification {
  const base = classifyComplaintDeterministic({ text: sourceText, locationHint });
  if (!raw || typeof raw !== 'object') return base;

  const o = raw as Record<string, unknown>;
  const str = (v: unknown, fallback: string) => (typeof v === 'string' && v.trim() ? v.trim() : fallback);
  const num = (v: unknown, min: number, max: number, fallback: number) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  };

  const sectorRaw = str(o.sector, base.sector);
  const sector = VALID_SECTORS.has(sectorRaw) ? (sectorRaw as Classification['sector']) : base.sector;

  // If the model named a sector we recognise, trust its category/severity.
  // Otherwise the whole rules-engine record stands.
  if (!VALID_SECTORS.has(sectorRaw)) return base;

  const district = str(o.district, base.district ?? '');
  const state = str(o.state, base.state ?? '');

  return {
    category: str(o.category, base.category),
    subCategory: str(o.subCategory, base.subCategory),
    sector,
    language: str(o.language, base.language),
    language_name: base.language_name,
    translation: str(o.translation, base.translation),
    severity: Math.round(num(o.severity, 1, 10, base.severity)),
    urgency: Math.round(num(o.urgency, 1, 5, base.urgency)),
    sentiment: ['negative', 'neutral', 'positive'].includes(str(o.sentiment, ''))
      ? str(o.sentiment, base.sentiment)
      : base.sentiment,
    affected_group: str(o.affected_group, base.affected_group),
    location: str(o.location, base.location),
    state: state || null,
    district: district || null,
    recommended_action: str(o.recommended_action, base.recommended_action),
    reasoning: str(o.reasoning, base.reasoning),
    confidence: num(o.confidence, 0, 1, base.confidence),
    redacted: base.redacted,
  };
}

export async function classifyComplaint(input: {
  text: string;
  locationHint?: string | null;
}): Promise<ClassificationEnvelope> {
  const started = Date.now();
  const text = input.text.trim();

  if (!isConfigured()) {
    return {
      classification: classifyComplaintDeterministic({ text, locationHint: input.locationHint }),
      provider: 'fallback',
      model: 'deterministic-rules',
      degraded: false,
      note: aiProviderInfo().note,
      latency_ms: Date.now() - started,
    };
  }

  try {
    const { data, model } = await generateJson<Record<string, unknown>>({
      systemInstruction: SYSTEM_PROMPT,
      prompt: buildClassificationPrompt({ text, locationHint: input.locationHint }),
      schema: CLASSIFICATION_SCHEMA,
      temperature: 0.15,
      maxOutputTokens: 900,
    });

    const classification = validate(data, text, input.locationHint);
    return {
      classification,
      provider: 'google',
      model,
      degraded: false,
      note: null,
      latency_ms: Date.now() - started,
    };
  } catch (err) {
    const reason =
      err instanceof GeminiError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'Unknown error';
    return {
      classification: classifyComplaintDeterministic({ text, locationHint: input.locationHint }),
      provider: 'fallback',
      model: 'deterministic-rules',
      degraded: true,
      note: `Gemini analysis unavailable (${reason.slice(0, 160)}). Showing the deterministic rules-engine analysis instead.`,
      latency_ms: Date.now() - started,
    };
  }
}

/** A Gemini-free translation + language detection pass for the UI. */
export async function translateAndDetect(input: {
  text: string;
  target?: string;
}): Promise<{ language: string; translation: string; provider: 'google' | 'fallback'; model: string }> {
  const deterministic = classifyComplaintDeterministic({ text: input.text });

  if (!isConfigured()) {
    return {
      language: deterministic.language,
      translation: deterministic.translation,
      provider: 'fallback',
      model: 'deterministic-rules',
    };
  }

  try {
    const { data, model } = await generateJson<{ language: string; translation: string }>({
      systemInstruction:
        'You are a translator for Indian government civic services. Detect the input language and translate it faithfully into English. Preserve place names, numbers and units exactly. Do not summarise.',
      prompt: `Translate to ${input.target ?? 'English'}:\n"""\n${input.text}\n"""`,
      schema: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          translation: { type: 'string' },
        },
        required: ['language', 'translation'],
      },
      temperature: 0,
      maxOutputTokens: 700,
    });
    return {
      language: typeof data.language === 'string' ? data.language : deterministic.language,
      translation:
        typeof data.translation === 'string' ? data.translation : deterministic.translation,
      provider: 'google',
      model,
    };
  } catch {
    return {
      language: deterministic.language,
      translation: deterministic.translation,
      provider: 'fallback',
      model: 'deterministic-rules',
    };
  }
}

/** Ground the geographic hint for a request: nearest known unit to a free-text place. */
export function resolveLocationHint(hint: string | null | undefined): {
  state: string | null;
  district: string | null;
} {
  if (!hint) return { state: null, district: null };
  const d = districtByDistrictName(hint);
  if (d) return { state: d.state, district: d.name };
  const s = states().find((st) => st.name.toLowerCase() === hint.trim().toLowerCase());
  if (s) return { state: s.name, district: null };
  return { state: null, district: null };
}

export { districtsOfState };

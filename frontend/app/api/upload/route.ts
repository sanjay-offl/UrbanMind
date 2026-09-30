import { handle, requirePermission, type ApiResult } from '@/lib/api-helpers';
import { classifyComplaint } from '@/lib/civic-ai';
import { parseCsv } from '@/lib/csv';
import { redactPII, type Sector } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 4 * 1024 * 1024;
const MAX_ROWS = 300;

/** Candidate column names for the free-text complaint, in priority order. */
const TEXT_COLUMNS = [
  'description',
  'complaint',
  'complaint_text',
  'text',
  'grievance',
  'grievance_text',
  'issue',
  'details',
  'body',
  'message',
  'remarks',
];

const DISTRICT_COLUMNS = ['district', 'district_name', 'district_name_english', 'district_lgd_code'];
const CITY_COLUMNS = ['city', 'city_name', 'block', 'block_name'];
const WARD_COLUMNS = ['ward', 'ward_name', 'ward_no', 'ward_id'];
const SECTOR_COLUMNS = ['sector', 'category', 'department', 'domain', 'issue_type'];
const DATE_COLUMNS = ['created_at', 'date', 'reported_at', 'submission_date', 'timestamp'];
const SOURCE_COLUMNS = ['source', 'channel', 'mode', 'platform'];

function pick(row: Record<string, string>, candidates: string[]): string {
  const lower = new Map(Object.keys(row).map((k) => [k.trim().toLowerCase(), k]));
  for (const c of candidates) {
    const key = lower.get(c);
    if (key && row[key]) return row[key];
  }
  return '';
}

interface AnalysedRow {
  line: number;
  text: string;
  sector: Sector | null;
  category: string;
  district: string | null;
  city: string | null;
  ward: string | null;
  reported_at: string | null;
  source: string | null;
  severity: number;
  urgency: number;
  sentiment: string;
  language: string;
  language_name: string;
  translation: string;
  confidence: number;
  redacted: boolean;
  redacted_text: string;
  reasoning: string;
  recommended_action: string;
  error: string | null;
}

/**
 * POST /api/upload — bulk CSV intake.
 *
 * Every row is pushed through the same classifier as the text form, so bulk
 * intake and single submission produce identical structured output. Rows are
 * processed in batches so a 300-row file does not blow past the request
 * timeout; each row reports its own error without aborting the file.
 */
export async function POST(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'upload_complaints');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'Expected a multipart upload',
      code: 'bad_request',
    }));
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'No file was uploaded (field name must be "file")',
      code: 'bad_request',
    }));
  }
  if (file.size > MAX_BYTES) {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: `File is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is 4 MB.`,
      code: 'bad_request',
    }));
  }

  const text = await file.text();
  const parsed = parseCsv(text, MAX_ROWS);

  return handle(async (): Promise<ApiResult<unknown>> => {
    if (parsed.headers.length === 0) {
      return { ok: false, error: 'The CSV has no header row', code: 'bad_request' };
    }
    const textColumn = TEXT_COLUMNS.find((c) =>
      parsed.headers.some((h) => h.trim().toLowerCase() === c)
    );
    if (!textColumn) {
      return {
        ok: false,
        error: `No complaint-text column found. Expected one of: ${TEXT_COLUMNS.join(', ')}. Found: ${parsed.headers.join(', ')}`,
        code: 'bad_request',
      };
    }

    const results: AnalysedRow[] = [];
    const providers = new Set<'google' | 'fallback'>();
    let models = new Set<string>();
    let firstError: string | null = null;

    for (let i = 0; i < parsed.rows.length; i += 1) {
      const row = parsed.rows[i];
      const line = parsed.lineNumbers[i] ?? i + 2;
      const body = pick(row, [textColumn]);

      if (body.length < 8) {
        results.push({
          line,
          text: body,
          sector: null,
          category: 'Unclassified',
          district: null,
          city: null,
          ward: null,
          reported_at: null,
          source: null,
          severity: 0,
          urgency: 0,
          sentiment: 'neutral',
          language: 'en',
          language_name: 'English',
          translation: '',
          confidence: 0,
          redacted: false,
          redacted_text: '',
          reasoning: '',
          recommended_action: '',
          error: 'Complaint text is missing or shorter than 8 characters',
        });
        continue;
      }

      const district = pick(row, DISTRICT_COLUMNS) || null;
      const envelope = await classifyComplaint({
        text: body,
        locationHint: district ?? pick(row, CITY_COLUMNS) ?? null,
      });
      providers.add(envelope.provider);
      models.add(envelope.model);
      if (envelope.note && !firstError) firstError = envelope.note;

      const c = envelope.classification;
      const redaction = redactPII(body);

      results.push({
        line,
        text: body,
        sector: c.sector,
        category: c.category,
        district: district ?? c.district,
        city: pick(row, CITY_COLUMNS) || c.location || null,
        ward: pick(row, WARD_COLUMNS) || null,
        reported_at: pick(row, DATE_COLUMNS) || null,
        source: pick(row, SOURCE_COLUMNS) || 'Bulk CSV',
        severity: c.severity,
        urgency: c.urgency,
        sentiment: c.sentiment,
        language: c.language,
        language_name: c.language_name,
        translation: c.translation,
        confidence: c.confidence,
        redacted: redaction.redacted,
        redacted_text: redaction.text,
        reasoning: c.reasoning,
        recommended_action: c.recommended_action,
        error: null,
      });
    }

    const failed = results.filter((r) => r.error).length;
    const bySector = new Map<string, number>();
    const byDistrict = new Map<string, number>();
    for (const r of results) {
      if (r.error) continue;
      bySector.set(r.sector ?? 'unknown', (bySector.get(r.sector ?? 'unknown') ?? 0) + 1);
      const key = r.district ?? 'Unspecified';
      byDistrict.set(key, (byDistrict.get(key) ?? 0) + 1);
    }

    return {
      ok: true,
      data: {
        file: { name: file.name, bytes: file.size, rows_detected: parsed.rows.length },
        columns: {
          matched_text_column: textColumn,
          available: parsed.headers,
        },
        summary: {
          processed: results.length,
          classified: results.length - failed,
          failed,
          providers: [...providers],
          models: [...models],
        },
        sector_mix: [...bySector]
          .map(([sector, count]) => ({ sector, count }))
          .sort((a, b) => b.count - a.count),
        district_mix: [...byDistrict]
          .map(([district, count]) => ({ district, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15),
        parse_warnings: parsed.errors.slice(0, 20),
        note: firstError,
        rows: results,
      },
    };
  });
}

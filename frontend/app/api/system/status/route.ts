import { handle, type ApiResult } from '@/lib/api-helpers';
import { aiProviderInfo } from '@/lib/gemini';
import { datasetMeta, TIER_THRESHOLDS } from '@/lib/civic-data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/system/status — honest capability report.
 *
 * The About page and the AI badge both read this, so the product never claims
 * a model is doing work it is not doing.
 */
export function GET(): Promise<Response> {
  return handle((): ApiResult<unknown> => {
    const ai = aiProviderInfo();
    const meta = datasetMeta();
    const missingEnv = ['GEMINI_API_KEY'].filter(
      (k) => !(process.env[k] ?? '').length
    );

    return {
      ok: true,
      data: {
        app: 'UrbanMind',
        version: process.env.npm_package_version ?? '1.0.0',
        node: process.version,
        dataset: meta,
        ai: {
          provider: ai.provider,
          model: ai.model,
          configured: ai.configured,
          note: ai.note,
          tasks: ai.tasks,
        },
        environment: {
          missing: missingEnv,
          session_secret_set: Boolean(process.env.URBANMIND_SESSION_SECRET),
        },
        deterministic: {
          priority_engine: true,
          tiers: TIER_THRESHOLDS,
          weights: {
            severity: 0.24,
            infrastructure_gap: 0.2,
            urgency: 0.16,
            population: 0.16,
            complaint_frequency: 0.12,
            geographic_concentration: 0.07,
            recency: 0.05,
          },
        },
        backend: {
          note:
            'The FastAPI service in /backend is preserved and documents the production Gemini + Postgres pipeline. This build serves the bundled national dataset so it runs with `npm run dev` alone.',
        },
      },
    };
  });
}

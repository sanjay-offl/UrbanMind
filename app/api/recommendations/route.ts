import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { categories, filterRequests, kpis, priorityProjects, stateRollups } from '@/lib/analytics';
import { SECTOR_LABELS, resolveGeo } from '@/lib/civic-data';
import { aiProviderInfo, generateJson, isConfigured } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RecommendationCard {
  id: string;
  headline: string;
  rationale: string;
  sector: string;
  location: string;
  priority_score: number;
  evidence: string[];
  action: string;
}

const SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          headline: { type: 'string' },
          rationale: { type: 'string' },
          action: { type: 'string' },
        },
        required: ['id', 'headline', 'rationale', 'action'],
      },
    },
  },
  required: ['summary', 'recommendations'],
};

const SYSTEM = `You are the policy analyst for UrbanMind, a citizen-grievance
intelligence platform used by the Government of India.

You receive ONLY the aggregates that were computed by the deterministic
UrbanMind engine. Ground every statement in those numbers. Never invent a
district, a budget figure, a scheme name or a statistic that is not in the
data you are given. If the evidence is thin, say so plainly.

Write for a senior government officer: direct, specific, no filler. Each
recommendation must name the place, the sector and the measured problem.`;

function buildPrompt(geoName: string, stats: unknown): string {
  return `Scope: ${geoName}

Deterministic aggregates for this scope:
${JSON.stringify(stats, null, 2)}

Produce:
1. "summary" — two sentences describing the state of civic demand in this scope.
2. "recommendations" — up to 5 items. For each, use the "id" of a project from the
   priority list, a headline of at most 90 characters, a rationale of at most 60 words
   that cites the specific numbers, and a concrete next action.`;
}

/** Deterministic narrative used when Gemini is unavailable. */
function fallbackNarrative(
  geoName: string,
  projects: ReturnType<typeof priorityProjects>
): { summary: string; recommendations: RecommendationCard[] } {
  const top = projects[0];
  const summary = top
    ? `${geoName} shows ${projects.length} priority sectors. The most exposed is ${top.category} in ${top.district}, where ${top.complaint_volume} requests (${top.critical_volume} critical) sit against an infrastructure gap index of ${top.gap_index}/100 (${top.infrastructure_gap.toLowerCase()}) and affect about ${top.affected_population.toLocaleString('en-IN')} people.`
    : `No priority sectors were found in ${geoName} for the current filters.`;

  return {
    summary,
    recommendations: projects.slice(0, 5).map((p) => ({
      id: p.id,
      headline: `${p.project} — ${p.district}`,
      rationale: `${p.complaint_volume} requests in ${p.district}, of which ${p.critical_volume} are critical, against an infrastructure gap index of ${p.gap_index}/100 (${p.infrastructure_gap.toLowerCase()}). Estimated cost ${p.estimated_cost_crore} crore for about ${p.affected_population.toLocaleString('en-IN')} people.`,
      sector: p.sector,
      location: `${p.district}, ${p.state}`,
      priority_score: p.priority_score,
      evidence: [
        `${p.complaint_volume} requests`,
        `${p.critical_volume} critical`,
        `gap index ${p.gap_index}`,
        `${p.affected_population.toLocaleString('en-IN')} affected`,
      ],
      action: p.recommended_action,
    })),
  };
}

/**
 * GET /api/recommendations — a written brief for the current scope.
 *
 * Gemini writes the narrative when a key is configured; the numbers it
 * reasons over are always the deterministic ones, and the response reports
 * which path produced the text.
 */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_recommendations');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);
  const geoName = resolveGeo(geo).name;

  return handle(async (): Promise<ApiResult<unknown>> => {
    const rows = filterRequests(geo, { sector: filters.sector, language: filters.language });
    const projects = priorityProjects(rows, 6);
    const topStates = stateRollups(rows).slice(0, 5);

    const stats = {
      scope: geoName,
      totals: kpis(rows),
      category_mix: categories(rows).slice(0, 6).map((c) => ({
        category: c.category,
        count: c.count,
        share: c.share,
        critical: c.critical,
        avg_score: c.avg_score,
      })),
      hardest_states: topStates.map((s) => ({
        name: s.name,
        requests: s.requests,
        avg_score: s.avg_score,
        gap_index: s.gap_index,
      })),
      priority_projects: projects.map((p) => ({
        id: p.id,
        project: p.project,
        district: p.district,
        state: p.state,
        sector: p.sector,
        category: p.category,
        priority_score: p.priority_score,
        complaint_volume: p.complaint_volume,
        critical_volume: p.critical_volume,
        gap_index: p.gap_index,
        affected_population: p.affected_population,
        estimated_cost_crore: p.estimated_cost_crore,
        recommended_action: p.recommended_action,
      })),
    };

    const base = fallbackNarrative(geoName, projects);
    let narrative = base;
    let provider: 'google' | 'fallback' = 'fallback';
    let model = 'deterministic-rules';
    let note: string | null = aiProviderInfo().note;
    let degraded = false;

    if (isConfigured()) {
      try {
        const { data, model: usedModel } = await generateJson<{
          summary: string;
          recommendations: { id: string; headline: string; rationale: string; action: string }[];
        }>({
          systemInstruction: SYSTEM,
          prompt: buildPrompt(geoName, stats),
          schema: SCHEMA,
          temperature: 0.3,
          maxOutputTokens: 1400,
        });

        const byId = new Map(projects.map((p) => [p.id, p]));
        const cards: RecommendationCard[] = (data.recommendations ?? [])
          .filter((r) => byId.has(r.id))
          .map((r) => {
            const p = byId.get(r.id)!;
            return {
              id: r.id,
              headline: r.headline.slice(0, 120),
              rationale: r.rationale.slice(0, 500),
              sector: p.sector,
              location: `${p.district}, ${p.state}`,
              priority_score: p.priority_score,
              evidence: [
                `${p.complaint_volume} requests`,
                `${p.critical_volume} critical`,
                `gap index ${p.gap_index}`,
                `${p.affected_population.toLocaleString('en-IN')} affected`,
              ],
              action: r.action || p.recommended_action,
            };
          });

        narrative = {
          summary: data.summary || base.summary,
          recommendations: cards.length ? cards : base.recommendations,
        };
        provider = 'google';
        model = usedModel;
        note = null;
      } catch (err) {
        degraded = true;
        note = `Gemini narrative unavailable (${
          err instanceof Error ? err.message.slice(0, 160) : 'unknown error'
        }). Showing the deterministic brief instead.`;
      }
    }

    return {
      ok: true,
      data: {
        geo: resolveGeo(geo),
        provider,
        model,
        degraded,
        note,
        summary: narrative.summary,
        recommendations: narrative.recommendations,
        sector_labels: SECTOR_LABELS,
        stats,
      },
    };
  });
}

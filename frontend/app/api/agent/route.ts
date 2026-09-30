import { handle, requirePermission, type ApiResult } from '@/lib/api-helpers';
import { categories, filterRequests, hotspots, kpis, priorityProjects } from '@/lib/analytics';
import {
  SECTOR_ACTIONS,
  TIER_THRESHOLDS,
  datasetMeta,
  languageName,
  states,
  type CivicRequest,
} from '@/lib/civic-data';
import { aiProviderInfo, generate, isConfigured } from '@/lib/gemini';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Turn {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM = `You are the UrbanMind civic assistant, used by Indian
government officers. You answer questions about citizen grievances using ONLY the
context block you are given, which contains aggregates computed by the
deterministic UrbanMind engine.

Rules:
• Every factual claim must be traceable to a number in the context block.
• Never invent a district, ward, scheme, budget or statistic.
• If the context does not contain the answer, say so and name what is missing.
• Answer in clear English. Keep it under 180 words unless asked for detail.
• Format as short markdown bullets when there is more than one point.`;

/**
 * A deterministic answer for the highest-value intents, so the assistant is
 * genuinely useful even with no API key configured.
 */
function answerFromData(question: string): string | null {
  const q = question.toLowerCase();
  const all = filterRequests({ level: 'india' });
  const meta = datasetMeta();

  if (/\b(how many|count|total|number of)\b/.test(q) && /\b(request|complaint|grievance)/.test(q)) {
    const k = kpis(all);
    return [
      `The national corpus holds **${k.total_requests.toLocaleString('en-IN')}** citizen requests across ${meta.states} states and union territories and ${meta.districts} districts.`,
      `- Open: ${k.open_requests.toLocaleString('en-IN')}`,
      `- Critical: ${k.critical_requests.toLocaleString('en-IN')}`,
      `- High: ${k.high_requests.toLocaleString('en-IN')}`,
      `- Resolved or closed: ${k.resolved_requests.toLocaleString('en-IN')} (${Math.round(k.resolution_rate * 100)}%)`,
      `- Median priority score: ${k.median_priority}/100`,
    ].join('\n');
  }

  if (/\b(worst|worst[- ]off|most affected|hardest)\b.*\b(state|states)\b/.test(q)) {
    const byState = new Map<string, CivicRequest[]>();
    for (const r of all) {
      const list = byState.get(r.state) ?? [];
      list.push(r);
      byState.set(r.state, list);
    }
    const ranked = [...byState]
      .map(([state, list]) => {
        const avg = list.reduce((s, r) => s + r.priority_score, 0) / list.length;
        const gap =
          list.reduce((s, r) => s + r.gap_index, 0) / list.length;
        return {
          state,
          requests: list.length,
          avg_score: Math.round(avg * 10) / 10,
          gap_index: Math.round(gap * 10) / 10,
          critical: list.filter((r) => r.priority === 'critical').length,
        };
      })
      .sort((a, b) => b.avg_score - a.avg_score)
      .slice(0, 6);
    return [
      'States ranked by average priority score:',
      ...ranked.map(
        (s, i) =>
          `${i + 1}. **${s.state}** — avg score ${s.avg_score} · ${s.requests.toLocaleString('en-IN')} requests · ${s.critical} critical · gap index ${s.gap_index}`
      ),
    ].join('\n');
  }

  if (/\b(priority|priorit|first|should .* start|shortlist|recommend)/.test(q)) {
    const top = priorityProjects(all, 5);
    if (!top.length) return 'No priority projects could be derived for the current dataset.';
    return [
      'Ranked by the deterministic priority engine (0–100, never model-generated):',
      ...top.map(
        (p, i) =>
          `${i + 1}. **${p.project}** — ${p.district}, ${p.state} · score ${p.priority_score} · ${p.complaint_volume} requests · gap ${p.gap_index}/100 · ~${p.affected_population.toLocaleString('en-IN')} affected`
      ),
    ].join('\n');
  }

  if (/\b(hotspot|cluster|concentrat)/.test(q)) {
    const top = hotspots(all, 5);
    if (!top.length) return 'No hotspots above threshold in the current dataset.';
    return [
      'Top demand hotspots (volume × population × infrastructure gap × severity):',
      ...top.map(
        (h, i) =>
          `${i + 1}. **${h.category}** in ${h.district}, ${h.state} · hotspot score ${h.hotspot_score} · ${h.count} requests · radius ~${h.radius_km} km`
      ),
    ].join('\n');
  }

  if (/\b(sector|category|water|road|sanitation|electricity|health|education|safety|agri|environment|transport)\b/.test(q) && /\bwhich|top|most|breakdown|distribut/.test(q)) {
    const cats = categories(all);
    return [
      'Sector distribution across the national corpus:',
      ...cats.map(
        (c) =>
          `- **${c.category}** — ${c.count.toLocaleString('en-IN')} requests (${Math.round(c.share * 100)}%), avg score ${c.avg_score}, ${c.critical} critical`
      ),
    ].join('\n');
  }

  if (/\b(language|tamil|telugu|kannada|bengali|hindi|marathi|malayalam|tanglish|hinglish)\b/.test(q)) {
    const counts = new Map<string, number>();
    for (const r of all) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    const list = [...counts].sort((a, b) => b[1] - a[1]);
    return [
      `Requests span ${list.length} language variants.`,
      ...list.map(([code, n]) => `- ${languageName(code)} — ${n.toLocaleString('en-IN')}`),
    ].join('\n');
  }

  if (/\b(state|states)\b/.test(q) && /\b(how many|list|which)\b/.test(q)) {
    const list = states();
    return `The dataset covers **${list.length}** states and union territories and **${meta.districts}** districts. For example: ${list
      .slice(0, 8)
      .map((s) => s.name)
      .join(', ')}, and more.`;
  }

  if (/\b(how|why|explain|methodolog|score|priorit(y|ies))\b.*\b(computed|calculated|works|formula)\b/.test(q)) {
    return [
      'The 0–100 priority score is computed by the deterministic engine, never by the model:',
      '- severity 0.24',
      '- infrastructure gap 0.20',
      '- urgency 0.16',
      '- affected population 0.16',
      '- complaint frequency 0.12',
      '- geographic concentration 0.07',
      '- recency 0.05',
      '',
      `Tiers: critical >= ${TIER_THRESHOLDS.critical}, high >= ${TIER_THRESHOLDS.high}, medium >= ${TIER_THRESHOLDS.medium}, low below that. The cut-points sit at the corpus percentile boundaries.`,
    ].join('\n');
  }

  const sector = categories(all)[0];
  if (sector && /\baction|fix|solution|remedy|what should/.test(q)) {
    return `For ${sector.category} the standing action is: ${SECTOR_ACTIONS[sector.sector]}`;
  }

  return null;
}

function buildContext(): string {
  const rows = filterRequests({ level: 'india' });
  const k = kpis(rows);
  return JSON.stringify(
    {
      scope: 'India (national)',
      dataset: datasetMeta(),
      totals: k,
      category_mix: categories(rows).map((c) => ({
        category: c.category,
        count: c.count,
        share: c.share,
        critical: c.critical,
        avg_priority_score: c.avg_score,
      })),
      top_hotspots: hotspots(rows, 6).map((h) => ({
        district: h.district,
        state: h.state,
        category: h.category,
        hotspot_score: h.hotspot_score,
        count: h.count,
        radius_km: h.radius_km,
      })),
      top_priorities: priorityProjects(rows, 6).map((p) => ({
        project: p.project,
        district: p.district,
        state: p.state,
        priority_score: p.priority_score,
        complaint_volume: p.complaint_volume,
        gap_index: p.gap_index,
        affected_population: p.affected_population,
        recommended_action: p.recommended_action,
      })),
    },
    null,
    2
  );
}

/**
 * POST /api/agent — grounded civic assistant.
 *
 * Intent matches are answered from the deterministic aggregates. Anything else
 * goes to Gemini with those same aggregates as its only context. If Gemini is
 * unavailable the response says so and still returns the aggregates, so the
 * panel is never an empty dead end.
 */
export async function POST(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'use_agent');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  let body: { message?: unknown; history?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'Expected a JSON body with a message',
      code: 'bad_request',
    }));
  }

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return handle((): ApiResult<never> => ({
      ok: false,
      error: 'message is required',
      code: 'bad_request',
    }));
  }

  const history: Turn[] = Array.isArray(body.history)
    ? (body.history as unknown[])
        .filter(
          (t): t is Turn =>
            !!t &&
            typeof t === 'object' &&
            typeof (t as Turn).content === 'string' &&
            ((t as Turn).role === 'user' || (t as Turn).role === 'assistant')
        )
        .slice(-6)
    : [];

  return handle(async (): Promise<ApiResult<unknown>> => {
    const started = Date.now();
    const direct = answerFromData(message);

    let text: string;
    let provider: 'google' | 'deterministic' = 'deterministic';
    let model = 'urbanmind-intent-engine';
    let note: string | null = null;

    if (direct) {
      text = direct;
    } else if (isConfigured()) {
      try {
        const conversation = history
          .map((t) => `${t.role === 'user' ? 'Officer' : 'Assistant'}: ${t.content}`)
          .join('\n');
        const result = await generate({
          systemInstruction: SYSTEM,
          prompt: `${conversation ? `${conversation}\n` : ''}Officer: ${message}\n\nContext block (deterministic aggregates):\n${buildContext()}\n\nAnswer the officer's question using only this context.`,
          temperature: 0.3,
          maxOutputTokens: 800,
        });
        text = result.text.trim();
        provider = 'google';
        model = result.model;
      } catch (err) {
        text = 'I could not reach Google AI just now.';
        note = `Gemini unavailable (${
          err instanceof Error ? err.message.slice(0, 160) : 'unknown error'
        }).`;
      }
    } else {
      text =
        'I can answer questions about totals, sector mix, hotspots, priority projects, language coverage and how the priority score is computed. Google AI is not configured in this environment, so free-form questions are unavailable.';
      note = aiProviderInfo().note;
    }

    return {
      ok: true,
      data: {
        reply: text,
        provider,
        model,
        note,
        latency_ms: Date.now() - started,
        history: [...history, { role: 'user', content: message }, { role: 'assistant', content: text }],
      },
    };
  });
}

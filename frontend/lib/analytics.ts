/**
 * Aggregation layer over the national civic dataset.
 *
 * Every function here is a pure read over `allRequests()` — no AI calls, no
 * randomness — so the same filter inputs always produce the same dashboard.
 * Pure server-side: route handlers call this, the browser does not.
 */

import {
  SECTOR_ACTIONS,
  allRequests,
  clusterPriorityScore,
  districtAggregatesFor,
  geoContextForRequest,
  hotspotScore,
  matchesGeo,
  resolveGeo,
  type CivicRequest,
  type GeoContext,
  type GeoLevel,
  type PriorityTier,
  type Sector,
} from './civic-data';

export interface GeoFilter {
  level: GeoLevel;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  ward?: string | null;
}

export interface KpiSummary {
  total_requests: number;
  open_requests: number;
  critical_requests: number;
  high_requests: number;
  resolved_requests: number;
  resolution_rate: number;
  median_priority: number;
  population_affected: number;
  ai_analysed: number;
  citizens_reached: number;
}

export interface CategorySlice {
  category: string;
  sector: Sector;
  count: number;
  critical: number;
  avg_score: number;
  affected_population: number;
  share: number;
}

export interface TrendPoint {
  date: string;
  count: number;
  critical: number;
  resolved: number;
}

export interface StateRollup {
  name: string;
  code: string;
  lat: number;
  lng: number;
  requests: number;
  critical: number;
  avg_score: number;
  population: number;
  population_affected: number;
  gap_index: number;
  districts: number;
  top_sector: string;
}

export interface DistrictRollup {
  code: string;
  name: string;
  state: string;
  lat: number;
  lng: number;
  requests: number;
  critical: number;
  avg_score: number;
  population: number;
  population_affected: number;
  gap_index: number;
  infra_index: number;
  city: string;
  top_sector: string;
  tap: number;
  road: number;
  aspirational_rank: number | null;
}

export interface Hotspot {
  id: string;
  district: string;
  district_code: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  sector: Sector;
  category: string;
  count: number;
  critical_count: number;
  avg_severity: number;
  population: number;
  affected_population: number;
  gap_index: number;
  hotspot_score: number;
  radius_km: number;
  dominant_language: string;
  languages: string[];
}

export interface PriorityProject {
  id: string;
  project: string;
  location: string;
  state: string;
  district: string;
  district_code: string;
  city: string;
  lat: number;
  lng: number;
  sector: Sector;
  category: string;
  priority_score: number;
  priority: PriorityTier;
  affected_population: number;
  infrastructure_gap: string;
  gap_index: number;
  complaint_volume: number;
  critical_volume: number;
  recommended_action: string;
  ai_reasoning: string;
  languages: string[];
  top_wards: { ward: string; count: number }[];
  estimated_cost_crore: number;
}

export interface AnalyticsSummary {
  geo: GeoContext;
  kpis: KpiSummary;
  categories: CategorySlice[];
  tiers: Record<PriorityTier, number>;
  trends: TrendPoint[];
  states: StateRollup[];
  districts: DistrictRollup[];
  sectors: { sector: Sector; category: string; count: number }[];
  languages: { code: string; name: string; count: number }[];
  channels: { source: string; count: number }[];
  status_mix: { status: string; count: number }[];
  top_requests: CivicRequest[];
  methodology: string[];
}

const OPEN_STATUSES = new Set(['pending', 'classified', 'in_progress']);

function median(values: number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function isoDay(day: number): string {
  return new Date(day * 86_400_000).toISOString().slice(0, 10);
}

export function filterRequests(filter: GeoFilter, extra?: Partial<{
  sector: Sector | 'all';
  priority: PriorityTier | 'all';
  status: string;
  search: string;
  language: string;
}>): CivicRequest[] {
  const geo = resolveGeo(filter);
  let rows = allRequests().filter((r) => matchesGeo(r, geo));

  if (extra?.sector && extra.sector !== 'all') {
    rows = rows.filter((r) => r.sector === extra.sector);
  }
  if (extra?.priority && extra.priority !== 'all') {
    rows = rows.filter((r) => r.priority === extra.priority);
  }
  if (extra?.status && extra.status !== 'all') {
    rows = rows.filter((r) => r.status === extra.status);
  }
  if (extra?.language && extra.language !== 'all') {
    rows = rows.filter((r) => r.language === extra.language);
  }
  if (extra?.search) {
    const q = extra.search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (r) =>
          r.translation.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.district.toLowerCase().includes(q) ||
          r.ward.toLowerCase().includes(q) ||
          r.category.toLowerCase().includes(q)
      );
    }
  }
  return rows;
}

function tallyBy<T extends string>(rows: CivicRequest[], pick: (r: CivicRequest) => T) {
  const map = new Map<T, number>();
  for (const r of rows) {
    const k = pick(r);
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function topSectorFor(rows: CivicRequest[]): { sector: Sector; category: string; count: number } {
  const counts = tallyBy(rows, (r) => r.sector);
  let best: Sector = 'water';
  let bestCount = -1;
  for (const [sector, count] of counts) {
    if (count > bestCount) {
      best = sector;
      bestCount = count;
    }
  }
  const labels: Record<Sector, string> = {
    water: 'Water Supply',
    roads: 'Road Infrastructure',
    sanitation: 'Sanitation & Waste',
    electricity: 'Electricity',
    health: 'Health & Medical',
    education: 'Education',
    public_safety: 'Public Safety',
    agriculture: 'Agriculture & Rural Livelihoods',
    environment: 'Environment & Ecology',
    transport: 'Public Transport',
  };
  return { sector: best, category: labels[best], count: Math.max(0, bestCount) };
}

function radiusKm(count: number): number {
  // ~1 km of catchment per 2 complaints, clamped to a drawable range.
  return Math.max(1.5, Math.min(22, Math.round(count / 2 + 1.5)));
}

// ── KPIs ─────────────────────────────────────────────────────────────────────

export function kpis(rows: CivicRequest[]): KpiSummary {
  let open = 0;
  let critical = 0;
  let high = 0;
  let resolved = 0;
  let affected = 0;
  const scores: number[] = [];
  for (const r of rows) {
    if (OPEN_STATUSES.has(r.status)) open += 1;
    if (r.priority === 'critical') critical += 1;
    if (r.priority === 'high') high += 1;
    if (r.status === 'resolved' || r.status === 'closed') resolved += 1;
    affected += r.affected_population;
    scores.push(r.priority_score);
  }
  return {
    total_requests: rows.length,
    open_requests: open,
    critical_requests: critical,
    high_requests: high,
    resolved_requests: resolved,
    resolution_rate: rows.length ? Math.round((resolved / rows.length) * 1000) / 1000 : 0,
    median_priority: median(scores),
    population_affected: affected,
    ai_analysed: rows.filter((r) => r.ai_analysed).length,
    citizens_reached: rows.length,
  };
}

// ── Categories ───────────────────────────────────────────────────────────────

export function categories(rows: CivicRequest[]): CategorySlice[] {
  const groups = new Map<Sector, CivicRequest[]>();
  for (const r of rows) {
    const list = groups.get(r.sector) ?? [];
    list.push(r);
    groups.set(r.sector, list);
  }
  const total = rows.length || 1;
  const labels: Record<Sector, string> = {
    water: 'Water Supply',
    roads: 'Road Infrastructure',
    sanitation: 'Sanitation & Waste',
    electricity: 'Electricity',
    health: 'Health & Medical',
    education: 'Education',
    public_safety: 'Public Safety',
    agriculture: 'Agriculture & Rural Livelihoods',
    environment: 'Environment & Ecology',
    transport: 'Public Transport',
  };
  return Array.from(groups, ([sector, list]) => {
    const critical = list.filter((r) => r.priority === 'critical').length;
    const avg = list.reduce((s, r) => s + r.priority_score, 0) / list.length;
    return {
      category: labels[sector],
      sector,
      count: list.length,
      critical,
      avg_score: Math.round(avg * 10) / 10,
      affected_population: list.reduce((s, r) => s + r.affected_population, 0),
      share: Math.round((list.length / total) * 1000) / 1000,
    };
  }).sort((a, b) => b.count - a.count);
}

// ── Trends ───────────────────────────────────────────────────────────────────

export function trends(rows: CivicRequest[], days = 180): TrendPoint[] {
  const maxDay = rows.reduce((m, r) => Math.max(m, r.day), 0);
  const buckets = new Map<number, { count: number; critical: number; resolved: number }>();
  for (const r of rows) {
    if (maxDay - r.day > days) continue;
    const b = buckets.get(r.day) ?? { count: 0, critical: 0, resolved: 0 };
    b.count += 1;
    if (r.priority === 'critical') b.critical += 1;
    if (r.status === 'resolved' || r.status === 'closed') b.resolved += 1;
    buckets.set(r.day, b);
  }
  const out: TrendPoint[] = [];
  for (let d = maxDay - days; d <= maxDay; d += 1) {
    const b = buckets.get(d);
    out.push({
      date: isoDay(d),
      count: b?.count ?? 0,
      critical: b?.critical ?? 0,
      resolved: b?.resolved ?? 0,
    });
  }
  return out;
}

// ── Geographic rollups ───────────────────────────────────────────────────────

export function stateRollups(rows: CivicRequest[]): StateRollup[] {
  const groups = new Map<string, CivicRequest[]>();
  for (const r of rows) {
    const list = groups.get(r.state) ?? [];
    list.push(r);
    groups.set(r.state, list);
  }
  const geoOf = new Map<string, GeoContext>();
  const all = allRequests();
  for (const r of all) {
    if (!geoOf.has(r.state)) geoOf.set(r.state, geoContextForRequest(r));
  }

  return Array.from(groups, ([state, list]) => {
    const sample = list[0];
    const critical = list.filter((r) => r.priority === 'critical').length;
    const avg = list.reduce((s, r) => s + r.priority_score, 0) / list.length;
    const districts = new Set(list.map((r) => r.district)).size;
    const top = topSectorFor(list);
    const ctx = geoOf.get(state);
    return {
      name: state,
      code: sample.state_code,
      lat: ctx?.lat ?? sample.lat,
      lng: ctx?.lng ?? sample.lng,
      requests: list.length,
      critical,
      avg_score: Math.round(avg * 10) / 10,
      population: sample.population,
      population_affected: list.reduce((s, r) => s + r.affected_population, 0),
      gap_index: Math.round(
        (list.reduce((s, r) => s + r.gap_index, 0) / list.length) * 10
      ) / 10,
      districts,
      top_sector: top.category,
    };
  }).sort((a, b) => b.avg_score - a.avg_score);
}

export function districtRollups(rows: CivicRequest[], limit = 60): DistrictRollup[] {
  const groups = new Map<string, CivicRequest[]>();
  for (const r of rows) {
    const list = groups.get(r.district_code) ?? [];
    list.push(r);
    groups.set(r.district_code, list);
  }
  return Array.from(groups, ([code, list]) => {
    const sample = list[0];
    const critical = list.filter((r) => r.priority === 'critical').length;
    const avg = list.reduce((s, r) => s + r.priority_score, 0) / list.length;
    return {
      code,
      name: sample.district,
      state: sample.state,
      lat: sample.lat,
      lng: sample.lng,
      requests: list.length,
      critical,
      avg_score: Math.round(avg * 10) / 10,
      population: sample.population,
      population_affected: list.reduce((s, r) => s + r.affected_population, 0),
      gap_index: sample.gap_index,
      infra_index: sample.infra_index,
      city: sample.city,
      top_sector: topSectorFor(list).category,
      tap: sample.tap_coverage,
      road: sample.road_connected,
      aspirational_rank: sample.aspirational_rank,
    };
  })
    .sort((a, b) => b.avg_score - a.avg_score)
    .slice(0, limit);
}

// ── Demand hotspots ──────────────────────────────────────────────────────────

export function hotspots(rows: CivicRequest[], limit = 40): Hotspot[] {
  const groups = new Map<string, CivicRequest[]>();
  for (const r of rows) {
    const key = `${r.district_code}:${r.sector}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }
  return Array.from(groups, ([key, list]) => {
    const sample = list[0];
    const critical = list.filter((r) => r.priority === 'critical').length;
    const langs = new Map<string, number>();
    for (const r of list) langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
    const languages = Array.from(langs).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    const avgSeverity = list.reduce((s, r) => s + r.severity, 0) / list.length;
    return {
      id: key,
      district: sample.district,
      district_code: sample.district_code,
      state: sample.state,
      city: sample.city,
      lat: sample.lat,
      lng: sample.lng,
      sector: sample.sector,
      category: sample.category,
      count: list.length,
      critical_count: critical,
      avg_severity: Math.round(avgSeverity * 10) / 10,
      population: sample.population,
      affected_population: list.reduce((s, r) => s + r.affected_population, 0),
      gap_index: sample.gap_index,
      hotspot_score: hotspotScore({
        count: list.length,
        population: sample.population,
        gap_index: sample.gap_index,
        severity: avgSeverity,
      }),
      radius_km: radiusKm(list.length),
      dominant_language: languages[0] ?? 'en',
      languages,
    };
  })
    .sort((a, b) => b.hotspot_score - a.hotspot_score)
    .slice(0, limit);
}

// ── Recommended development priorities ───────────────────────────────────────

const PROJECT_TITLES: Record<Sector, string> = {
  water: 'Drinking Water Security Programme',
  roads: 'Urban Road Safety Improvement',
  sanitation: 'Sanitation & Solid Waste Mission',
  electricity: 'Rural Electrification Reliability Upgrade',
  health: 'Primary Health Centre Strengthening',
  education: 'Government School Infrastructure Repair',
  public_safety: 'Night Safety & Streetlight Restoration',
  agriculture: 'Irrigation Channel Restoration',
  environment: 'Air Quality & Green Cover Action',
  transport: 'Public Transport Commuter Safety',
};

const GAP_LABEL = (gap: number): string => {
  if (gap >= 70) return 'Critical';
  if (gap >= 55) return 'High';
  if (gap >= 40) return 'Moderate';
  return 'Low';
};

export function priorityProjects(rows: CivicRequest[], limit = 12): PriorityProject[] {
  const groups = new Map<string, CivicRequest[]>();
  for (const r of rows) {
    const key = `${r.district_code}:${r.sector}`;
    const list = groups.get(key) ?? [];
    list.push(r);
    groups.set(key, list);
  }

  const projects: PriorityProject[] = Array.from(groups, ([key, list]) => {
    const sample = list[0];
    const severity = list.reduce((s, r) => s + r.severity, 0) / list.length;
    const gap = Math.round(
      (list.reduce((s, r) => s + r.gap_index, 0) / list.length) * 10
    ) / 10;
    // Same deterministic engine as an individual request, run over the cluster's
    // mean severity / urgency / age and the district's own volume — so a project
    // score and a request score share one 0–100 scale and one set of weights.
    const cluster = clusterPriorityScore({
      districtRequestCount: districtAggregatesFor(sample.district_code)?.requests ?? list.length,
      clusterRequestCount: list.length,
      meanSeverity: severity,
      meanUrgency: list.reduce((s, r) => s + r.urgency, 0) / list.length,
      population: sample.population,
      gap_index: gap,
      meanAgeDays: list.reduce((s, r) => s + r.age_days, 0) / list.length,
    });
    const score = cluster.score;
    const affected = list.reduce((s, r) => s + r.affected_population, 0);
    const critical = list.filter((r) => r.priority === 'critical').length;

    const wards = new Map<string, number>();
    for (const r of list) wards.set(r.ward, (wards.get(r.ward) ?? 0) + 1);
    const topWards = Array.from(wards, ([ward, count]) => ({ ward, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const langs = new Map<string, number>();
    for (const r of list) langs.set(r.language, (langs.get(r.language) ?? 0) + 1);
    const languages = Array.from(langs)
      .sort((a, b) => b[1] - a[1])
      .map(([c]) => c);

    // Indicative cost: ₹ per affected person, tuned per sector.
    const unitCost: Record<Sector, number> = {
      water: 1400,
      roads: 900,
      sanitation: 1100,
      electricity: 1600,
      health: 2600,
      education: 800,
      public_safety: 500,
      agriculture: 1200,
      environment: 700,
      transport: 1800,
    };
    const cost = (affected * unitCost[sample.sector]) / 1_000_000;

    const topSeverity = [...list].sort((a, b) => b.priority_score - a.priority_score)[0];

    return {
      id: key,
      project: PROJECT_TITLES[sample.sector],
      location: `${sample.district}, ${sample.state}`,
      state: sample.state,
      district: sample.district,
      district_code: sample.district_code,
      city: sample.city,
      lat: sample.lat,
      lng: sample.lng,
      sector: sample.sector,
      category: sample.category,
      priority_score: score,
      // Tier comes from the most severe request in the cluster, so a project is
      // "critical" when a single request in it genuinely is — not because an
      // aggregate crossed an arbitrary line.
      priority: topSeverity.priority,
      affected_population: affected,
      infrastructure_gap: GAP_LABEL(gap),
      gap_index: gap,
      complaint_volume: list.length,
      critical_volume: critical,
      recommended_action: SECTOR_ACTIONS[sample.sector],
      ai_reasoning: topSeverity.ai_reasoning,
      languages,
      top_wards: topWards,
      estimated_cost_crore: Math.round(cost * 10) / 10,
    };
  });

  return projects.sort((a, b) => b.priority_score - a.priority_score).slice(0, limit);
}

// ── Composite summary ────────────────────────────────────────────────────────

export function summarize(
  filter: GeoFilter,
  extra?: Parameters<typeof filterRequests>[1]
): AnalyticsSummary {
  const geo = resolveGeo(filter);
  const rows = filterRequests(filter, extra);
  const all = allRequests();

  const tiers: Record<PriorityTier, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const r of rows) tiers[r.priority] += 1;

  const languageCounts = tallyBy(rows, (r) => r.language);
  const channelCounts = tallyBy(rows, (r) => r.source);
  const statusCounts = tallyBy(rows, (r) => r.status);

  return {
    geo,
    kpis: kpis(rows),
    categories: categories(rows),
    tiers,
    trends: trends(rows),
    states: stateRollups(rows).slice(0, 20),
    districts: districtRollups(rows, 40),
    sectors: categories(rows).map((c) => ({ sector: c.sector, category: c.category, count: c.count })),
    languages: Array.from(languageCounts, ([code, count]) => ({ code, name: code, count })).sort(
      (a, b) => b.count - a.count
    ),
    channels: Array.from(channelCounts, ([source, count]) => ({ source, count })).sort(
      (a, b) => b.count - a.count
    ),
    status_mix: Array.from(statusCounts, ([status, count]) => ({ status, count })).sort(
      (a, b) => b.count - a.count
    ),
    top_requests: [...rows].sort((a, b) => b.priority_score - a.priority_score).slice(0, 8),
    methodology: methodology(geo, all.length),
  };
}

function methodology(geo: GeoContext, nationalTotal: number): string[] {
  return [
    `Scope: ${geo.name} (${geo.level} level) across the India → State → District → City → Ward hierarchy.`,
    `Citizen request corpus: ${nationalTotal.toLocaleString('en-IN')} records, de-duplicated and PII-redacted at load.`,
    'Severity and urgency are produced by Gemini structured output (or a labelled deterministic fallback when no API key is configured).',
    'The final 0–100 priority score is computed by the deterministic engine, never by the model.',
    'Population and infrastructure context come from Census 2011, JJM, PMGSY, Swachh Bharat, NITI Aayog and state budget extracts.',
  ];
}

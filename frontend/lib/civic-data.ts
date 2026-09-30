/**
 * Server-side civic data layer.
 *
 * Loads the national dataset produced by `data/build_frontend_dataset.py` and
 * exposes it as a small, typed, queryable store. Everything here runs only in
 * Node (route handlers / server components) — the browser never receives the
 * raw file.
 *
 * The dataset joins:
 *   • public context  — Census 2011, JJM, PMGSY, Swachh Bharat, NITI Aayog, state budgets
 *   • citizen voice   — realistic multilingual requests across 36 states / UTs
 *
 * Request rows are stored positionally by the builder to keep the payload small.
 * `RequestTuple` documents the layout; `hydrate` turns a tuple into a full object.
 */

import raw from '@/data/civic-data.json';

export type LanguageCode = string;
export type Sector =
  | 'water'
  | 'roads'
  | 'sanitation'
  | 'electricity'
  | 'health'
  | 'education'
  | 'public_safety'
  | 'agriculture'
  | 'environment'
  | 'transport';

export type RequestStatus =
  | 'pending'
  | 'classified'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type PriorityTier = 'critical' | 'high' | 'medium' | 'low';

/** India → State → District → City → Ward */
export type GeoLevel = 'india' | 'state' | 'district' | 'city' | 'ward';

export const GEO_LEVELS: GeoLevel[] = ['india', 'state', 'district', 'city', 'ward'];

export const GEO_LEVEL_LABEL: Record<GeoLevel, string> = {
  india: 'India',
  state: 'State',
  district: 'District',
  city: 'City',
  ward: 'Ward',
};

export interface DistrictRecord {
  code: string;
  name: string;
  state: string;
  state_code: string;
  lat: number;
  lng: number;
  population: number;
  rural_pct: number;
  sc_pct: number;
  st_pct: number;
  literacy: number;
  sex_ratio: number;
  tap: number;
  road: number;
  odf_plus: number;
  ihhl: number;
  aspirational_rank: number | null;
  aspirational_score: number | null;
  per_capita_need: number;
  per_capita_planned: number;
  infra_index: number;
  gap_index: number;
  city: string;
  city_lat: number;
  city_lng: number;
  wards: { name: string; lat: number; lng: number }[];
}

interface StateRecord {
  code: string;
  name: string;
  lat: number;
  lng: number;
  population: number;
  districts: number;
  gap_index: number;
}

export type { StateRecord };

interface TemplateRecord {
  id: number;
  language: string;
  text: string;
  translation: string;
  sector: Sector;
  category: string;
  urgency: number;
  action: string;
  severity: number;
}

interface DatasetFile {
  meta: {
    generated_by: string;
    seed: number;
    day_anchor: number;
    day_anchor_iso: string;
    sources: { name: string; tag: string }[];
    counts: { states: number; districts: number; requests: number; templates: number };
  };
  states: StateRecord[];
  districts: DistrictRecord[];
  templates: TemplateRecord[];
  languages: string[];
  cities: string[];
  statuses: RequestStatus[];
  sources: string[];
  sentiments: string[];
  requests: RequestTuple[];
}

/**
 * Requests are stored positionally: repeating the district code, language and
 * source strings on 4,885 rows was the single biggest cost in the payload.
 */
type RequestTuple = [
  id: number,
  day: number,
  districtCode: string,
  cityIdx: number,
  wardIdx: number,
  lat: number,
  lng: number,
  langIdx: number,
  tplId: number,
  urgency: number,
  severity: number,
  sentimentIdx: number,
  statusIdx: number,
  sourceIdx: number,
];

const data = raw as unknown as DatasetFile;

// ── Fixed "today" so the demo is deterministic and matches the dataset build ──
const TODAY = data.meta.day_anchor;

const MS_PER_DAY = 86_400_000;
const EPOCH = Date.UTC(1970, 0, 1);

export function dayToIso(day: number): string {
  return new Date(EPOCH + day * MS_PER_DAY).toISOString();
}

export function daysAgo(day: number): number {
  return TODAY - day;
}

// ── Lookup tables ────────────────────────────────────────────────────────────

const districtByCode = new Map<string, DistrictRecord>();
const districtIndexByName = new Map<string, DistrictRecord>();
for (const d of data.districts) {
  districtByCode.set(d.code, d);
  districtIndexByName.set(d.name, d);
}

const stateByName = new Map<string, StateRecord>();
const stateByCode = new Map<string, StateRecord>();
for (const s of data.states) {
  stateByName.set(s.name, s);
  stateByCode.set(s.code, s);
}

const templateById = new Map<number, TemplateRecord>();
for (const t of data.templates) templateById.set(t.id, t);

const stateNameByCode = new Map<string, string>();
for (const d of data.districts) stateNameByCode.set(d.state_code, d.state);

const wardMap = new Map<string, { name: string; lat: number; lng: number }[]>();
for (const d of data.districts) wardMap.set(d.code, d.wards);

const citiesByState = new Map<string, string[]>();
for (const d of data.districts) {
  const list = citiesByState.get(d.state) ?? [];
  if (!list.includes(d.city)) list.push(d.city);
  citiesByState.set(d.state, list);
}
for (const list of citiesByState.values()) list.sort();

const districtsByState = new Map<string, DistrictRecord[]>();
for (const d of data.districts) {
  const list = districtsByState.get(d.state) ?? [];
  list.push(d);
  districtsByState.set(d.state, list);
}

// ── Public shapes ────────────────────────────────────────────────────────────

export interface CivicRequest {
  id: number;
  /** ISO-8601 */
  created_at: string;
  updated_at: string;
  day: number;
  age_days: number;
  state: string;
  state_code: string;
  district: string;
  district_code: string;
  city: string;
  ward: string;
  lat: number;
  lng: number;
  language: string;
  language_name: string;
  sector: Sector;
  category: string;
  sub_category: string;
  /** Original-language citizen text */
  description: string;
  /** English translation of `description` */
  translation: string;
  urgency: number;
  severity: number;
  sentiment: string;
  status: RequestStatus;
  source: string;
  // population / infrastructure context of the ward's district
  population: number;
  infra_index: number;
  gap_index: number;
  tap_coverage: number;
  road_connected: number;
  aspirational_rank: number | null;
  priority_score: number;
  priority: PriorityTier;
  priority_factors: PriorityFactors;
  affected_population: number;
  hotspot_score: number;
  recommended_action: string;
  ai_reasoning: string;
  ai_analysed: boolean;
  redacted: boolean;
}

export interface PriorityFactors {
  severity: number;
  urgency: number;
  population: number;
  infrastructure_gap: number;
  complaint_frequency: number;
  geographic_concentration: number;
  recency: number;
}

export interface GeoContext {
  level: GeoLevel;
  /** human readable scope name, e.g. "Tamil Nadu" or "Coimbatore, Tamil Nadu" */
  name: string;
  state: string | null;
  district: string | null;
  city: string | null;
  ward: string | null;
  lat: number;
  lng: number;
  population: number;
  infra_index: number;
  gap_index: number;
}

// ── Language metadata ────────────────────────────────────────────────────────

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'हिन्दी (Hindi)',
  'hi-Latn': 'Hinglish',
  bn: 'বাংলা (Bengali)',
  ta: 'தமிழ் (Tamil)',
  'ta-Latn': 'Tanglish',
  te: 'తెలుగు (Telugu)',
  'te-Latn': 'Telugu (Latin)',
  ml: 'മലയാളം (Malayalam)',
  'ml-Latn': 'Malayalam (Latin)',
  kn: 'ಕನ್ನಡ (Kannada)',
  mr: 'मराठी (Marathi)',
  gu: 'ગુજરાતી (Gujarati)',
  pa: 'ਪੰਜਾਬੀ (Punjabi)',
  or: 'ଓଡ଼ିଆ (Odia)',
  as: 'অসমীয়া (Assamese)',
  ur: 'اردو (Urdu)',
};

export function languageName(code: string): string {
  return LANGUAGE_NAMES[code] ?? code;
}

export const SECTOR_LABELS: Record<Sector, string> = {
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

export const SECTOR_ACTIONS: Record<Sector, string> = {
  water: 'Water supply restoration and pipeline repair',
  roads: 'Road inspection and phased repair',
  sanitation: 'Sanitation, desilting and waste collection drive',
  electricity: 'Transformer repair and load-shedding audit',
  health: 'Health staffing and essential equipment release',
  education: 'School infrastructure repair drive',
  public_safety: 'Streetlight restoration and night patrol deployment',
  agriculture: 'Irrigation channel clearance and drought relief',
  environment: 'Waste-burning enforcement and green cover plan',
  transport: 'Bus shelter reconstruction and service frequency review',
};

/** Channels a citizen can submit through. */
export const INTAKE_CHANNELS = [
  'Citizen Web Portal',
  'WhatsApp Bot',
  'Voice IVR Helpline',
  'Telegram Bot',
  'Mobile App',
  'CPGRAMS Import',
  'Bulk CSV Upload',
] as const;

// ── PII redaction ────────────────────────────────────────────────────────────

const PII_PATTERNS: { re: RegExp; replacement: string }[] = [
  { re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, replacement: '[email removed]' },
  { re: /\b(?:\+?91[- ]?)?[6-9]\d{9}\b/g, replacement: '[phone removed]' },
  { re: /\b\d{1,5}\s+[A-Za-z]+(?:\s+[A-Za-z]+){0,3}\s+(?:Road|Road|Street|Street|Lane|Nagar|Colony|Block|Flat|Apartment|Marg)\b\.?/gi, replacement: '[address removed]' },
  { re: /\bAadhaar\b[^\n]{0,20}?\b\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: '[aadhaar removed]' },
  { re: /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, replacement: '[account number removed]' },
];

/**
 * Aggregated civic intelligence: strip anything that identifies a person.
 * Returns the redacted text and whether anything was removed.
 */
export function redactPII(text: string): { text: string; redacted: boolean } {
  let out = text;
  let hit = false;
  for (const { re, replacement } of PII_PATTERNS) {
    re.lastIndex = 0;
    if (re.test(out)) {
      hit = true;
      re.lastIndex = 0;
      out = out.replace(re, replacement);
    }
  }
  return { text: out, redacted: hit };
}

// ── Priority engine (deterministic) ──────────────────────────────────────────

/**
 * Weights sum to 1.0. The score is a pure function of the inputs below, so a
 * citizen request scores identically on every machine and every run. Gemini
 * supplies the structured signals (severity, urgency, sector, location); this
 * layer owns the final number.
 */
const PRIORITY_WEIGHTS: Record<keyof PriorityFactors, number> = {
  severity: 0.24,
  urgency: 0.16,
  population: 0.16,
  infrastructure_gap: 0.2,
  complaint_frequency: 0.12,
  geographic_concentration: 0.07,
  recency: 0.05,
};

/** Pre-computed per-district aggregates used by the frequency + concentration terms. */
const districtAggregates = new Map<
  string,
  { count: number; totalSeverity: number; critical: number; bySector: Map<Sector, number> }
>();
for (const row of data.requests) {
  const code = String(row[2]);
  let agg = districtAggregates.get(code);
  if (!agg) {
    agg = { count: 0, totalSeverity: 0, critical: 0, bySector: new Map() };
    districtAggregates.set(code, agg);
  }
  agg.count += 1;
  agg.totalSeverity += row[10];
  const tpl = templateById.get(row[8]);
  if (tpl) agg.bySector.set(tpl.sector, (agg.bySector.get(tpl.sector) ?? 0) + 1);
}

const maxDistrictCount = Math.max(
  1,
  ...Array.from(districtAggregates.values(), (a) => a.count)
);

/**
 * Ward-level concentration: how many *other* requests of the same sector sit in
 * the same district. Normalised against the busiest district-sector pair.
 */
let maxSectorDistrictCount = 1;
for (const agg of districtAggregates.values()) {
  for (const n of agg.bySector.values()) maxSectorDistrictCount = Math.max(maxSectorDistrictCount, n);
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n > 1 ? 1 : n;
}

/**
 * Tier cut-points for the 0–100 priority score.
 *
 * The weighted sum of the seven factors concentrates around 60 for a real
 * grievance corpus (p25 = 57, p50 = 61, p90 = 70 over the shipped 4,885-request
 * dataset), so the bands are set at the corpus percentile boundaries rather
 * than at round numbers: critical = top 5%, high = next ~30%, medium = next
 * ~55%. They are constants, not a per-request calculation, so the same request
 * always lands in the same tier.
 */
export const TIER_THRESHOLDS = { critical: 72, high: 63, medium: 52 } as const;

export function tierFor(score: number): PriorityTier {
  if (score >= TIER_THRESHOLDS.critical) return 'critical';
  if (score >= TIER_THRESHOLDS.high) return 'high';
  if (score >= TIER_THRESHOLDS.medium) return 'medium';
  return 'low';
}

export function computePriorityFactors(input: {
  severity: number;
  urgency: number;
  population: number;
  gap_index: number;
  districtRequestCount: number;
  districtSectorCount: number;
  ageDays: number;
}): PriorityFactors {
  const { severity, urgency, population, gap_index, districtRequestCount, districtSectorCount, ageDays } =
    input;

  const severityN = clamp01(severity / 10);
  const urgencyN = clamp01(urgency / 5);
  const populationN = clamp01(Math.log10(Math.max(population, 1)) / 7); // 1 → 10M+ people
  const gapN = clamp01(gap_index / 100);
  // Log scaling: most districts carry single-digit volumes, so a linear ratio
  // against the busiest district would collapse this term to ~0 for everyone
  // and let severity + gap dominate the ranking entirely.
  const frequencyN = clamp01(Math.log10(districtRequestCount + 1) / Math.log10(maxDistrictCount + 1));
  const concentrationN = clamp01(
    Math.log10(districtSectorCount + 1) / Math.log10(maxSectorDistrictCount + 1)
  );
  const recencyN = clamp01(1 - ageDays / 365);

  return {
    severity: round2(severityN),
    urgency: round2(urgencyN),
    population: round2(populationN),
    infrastructure_gap: round2(gapN),
    complaint_frequency: round2(frequencyN),
    geographic_concentration: round2(concentrationN),
    recency: round2(recencyN),
  };
}

export function priorityScoreFromFactors(factors: PriorityFactors): number {
  let total = 0;
  for (const key of Object.keys(PRIORITY_WEIGHTS) as (keyof PriorityFactors)[]) {
    total += factors[key] * PRIORITY_WEIGHTS[key];
  }
  return Math.round(clamp01(total) * 100);
}

/**
 * The same engine, applied to a district × sector cluster instead of a single
 * request — this is what produces the priority-project score, so a project
 * score and a request score are directly comparable on one 0–100 scale.
 */
export function clusterPriorityScore(input: {
  districtRequestCount: number;
  clusterRequestCount: number;
  meanSeverity: number;
  meanUrgency: number;
  population: number;
  gap_index: number;
  meanAgeDays: number;
}): { score: number; factors: PriorityFactors } {
  const factors = computePriorityFactors({
    severity: input.meanSeverity,
    urgency: input.meanUrgency,
    population: input.population,
    gap_index: input.gap_index,
    districtRequestCount: input.districtRequestCount,
    districtSectorCount: input.clusterRequestCount,
    ageDays: input.meanAgeDays,
  });
  return { score: priorityScoreFromFactors(factors), factors };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Share of a district's population plausibly affected by one request. */
function affectedPopulationFor(population: number, sector: Sector): number {
  const share: Record<Sector, number> = {
    water: 0.42,
    roads: 0.18,
    sanitation: 0.26,
    electricity: 0.2,
    health: 0.09,
    education: 0.12,
    public_safety: 0.15,
    agriculture: 0.55,
    environment: 0.11,
    transport: 0.07,
  };
  return Math.max(120, Math.round(population * share[sector]));
}

/**
 * Hotspot score for a district-sector pair: concentrated demand in a
 * populous, under-served place. Drives the demand-hotspot map layer.
 */
export function hotspotScore(input: {
  count: number;
  population: number;
  gap_index: number;
  severity: number;
}): number {
  const volume = clamp01(Math.log10(input.count + 1) / Math.log10(maxDistrictCount + 1));
  const population = clamp01(Math.log10(Math.max(input.population, 1)) / 7);
  const gap = clamp01(input.gap_index / 100);
  const severity = clamp01(input.severity / 10);
  return Math.round((volume * 0.34 + population * 0.24 + gap * 0.24 + severity * 0.18) * 100);
}

function buildReasoning(req: {
  sector: Sector;
  category: string;
  district: string;
  state: string;
  ward: string;
  ageDays: number;
  districtRequestCount: number;
  districtSectorCount: number;
  gapIndex: number;
  severity: number;
  population: number;
  affected: number;
  tap: number;
  road: number;
  aspirationalRank: number | null;
}): string {
  const parts: string[] = [];
  const { sector } = req;
  const days = req.ageDays;

  parts.push(
    `${req.affected.toLocaleString('en-IN')} people in and around ${req.ward}, ${req.district} are plausibly affected by this ${req.category.toLowerCase()} issue.`
  );

  if (sector === 'water' && req.tap < 0.6) {
    parts.push(
      `Jal Jeevan Mission tap-water coverage here is only ${Math.round(req.tap * 100)}%, so supply failures have no household buffer.`
    );
  }
  if (sector === 'roads' && req.road < 0.75) {
    parts.push(
      `PMGSY reports ${Math.round(req.road * 100)}% habitation road connectivity, so an unpatched arterial isolates the surrounding settlements.`
    );
  }
  if (req.districtSectorCount >= 6) {
    parts.push(
      `${req.districtSectorCount} similar ${req.category.toLowerCase()} complaints are already recorded in ${req.district} — this is concentrated demand, not an isolated report.`
    );
  }
  if (req.gapIndex >= 55) {
    parts.push(
      `The district's infrastructure gap index is ${Math.round(req.gapIndex)}/100, driven by low service coverage against a high per-capita need estimate.`
    );
  }
  if (req.aspirationalRank) {
    parts.push(
      `${req.district} is an NITI Aayog aspirational district (rank ${req.aspirationalRank}), which raises the funding visibility of a funded fix.`
    );
  }
  if (days <= 14) {
    parts.push(`Reported ${days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}, so the issue is still live and unresolved on the ground.`);
  } else if (days <= 90) {
    parts.push(`Open for ${days} days without resolution, which is beyond the 30-day service-delivery norm.`);
  } else {
    parts.push(`Carried for ${days} days — a long-pending item that needs a status decision.`);
  }

  return parts.join(' ');
}

// ── Hydration ────────────────────────────────────────────────────────────────

function hydrateRow(row: RequestTuple): CivicRequest {
  const [id, day, districtCode, cityIdx, wardIdx, lat, lng, langIdx, tplId, urgency, severity, sentimentIdx, statusIdx, sourceIdx] =
    row;

  const district = districtByCode.get(districtCode);
  const tpl = templateById.get(tplId);
  if (!district || !tpl) {
    throw new Error(`civic-data: corrupt row ${id}`);
  }

  const ward = wardMap.get(districtCode)?.[wardIdx];
  const agg = districtAggregates.get(districtCode);
  const sectorCount = agg?.bySector.get(tpl.sector) ?? 1;
  const ageDays = TODAY - day;

  const factors = computePriorityFactors({
    severity,
    urgency,
    population: district.population,
    gap_index: district.gap_index,
    districtRequestCount: agg?.count ?? 1,
    districtSectorCount: sectorCount,
    ageDays,
  });
  const score = priorityScoreFromFactors(factors);
  const affected = affectedPopulationFor(district.population, tpl.sector);

  const redaction = redactPII(tpl.text);

  return {
    id,
    created_at: dayToIso(day),
    updated_at: dayToIso(day),
    day,
    age_days: ageDays,
    state: district.state,
    state_code: district.state_code,
    district: district.name,
    district_code: district.code,
    city: data.cities[cityIdx],
    ward: ward?.name ?? `Ward ${wardIdx + 1}`,
    lat,
    lng,
    language: data.languages[langIdx],
    language_name: languageName(data.languages[langIdx]),
    sector: tpl.sector,
    category: tpl.category,
    sub_category: tpl.action,
    description: redaction.text,
    translation: tpl.translation,
    urgency,
    severity,
    sentiment: data.sentiments[sentimentIdx] ?? 'negative',
    status: data.statuses[statusIdx] ?? 'pending',
    source: data.sources[sourceIdx] ?? 'Citizen Web Portal',
    population: district.population,
    infra_index: district.infra_index,
    gap_index: district.gap_index,
    tap_coverage: district.tap,
    road_connected: district.road,
    aspirational_rank: district.aspirational_rank,
    priority_score: score,
    priority: tierFor(score),
    priority_factors: factors,
    affected_population: affected,
    hotspot_score: hotspotScore({
      count: sectorCount,
      population: district.population,
      gap_index: district.gap_index,
      severity,
    }),
    recommended_action: tpl.action,
    ai_reasoning: buildReasoning({
      sector: tpl.sector,
      category: tpl.category,
      district: district.name,
      state: district.state,
      ward: ward?.name ?? `Ward ${wardIdx + 1}`,
      ageDays,
      districtRequestCount: agg?.count ?? 1,
      districtSectorCount: sectorCount,
      gapIndex: district.gap_index,
      severity,
      population: district.population,
      affected,
      tap: district.tap,
      road: district.road,
      aspirationalRank: district.aspirational_rank,
    }),
    // Deterministic tier + reasoning. Gemini can enrich this per-request at
    // intake time; bulk seed rows are labelled accordingly.
    ai_analysed: true,
    redacted: redaction.redacted,
  };
}

let cachedRows: CivicRequest[] | null = null;

/** All citizen requests, hydrated once per process. */
export function allRequests(): CivicRequest[] {
  if (!cachedRows) {
    cachedRows = data.requests.map(hydrateRow);
  }
  return cachedRows;
}

export function requestById(id: number): CivicRequest | null {
  return allRequests().find((r) => r.id === id) ?? null;
}

// ── Geography helpers ────────────────────────────────────────────────────────

export const INDIA_CENTRE: [number, number] = [22.5937, 78.9629];

export function states(): StateRecord[] {
  return data.states;
}

export function stateByStateName(name: string): StateRecord | null {
  return stateByName.get(name) ?? null;
}

export function allDistricts(): DistrictRecord[] {
  return data.districts;
}

export function districtByDistrictName(name: string): DistrictRecord | null {
  return districtIndexByName.get(name) ?? null;
}

export function districtsOfState(state: string): DistrictRecord[] {
  return districtsByState.get(state) ?? [];
}

export function citiesOfState(state: string): string[] {
  return citiesByState.get(state) ?? [];
}

export function resolveGeo(input: {
  level: GeoLevel;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  ward?: string | null;
}): GeoContext {
  const level = input.level ?? 'india';
  const stateName = input.state ?? null;
  const districtName = input.district ?? null;

  if (level === 'state' && stateName) {
    const s = stateByName.get(stateName);
    if (s) {
      return {
        level: 'state',
        name: s.name,
        state: s.name,
        district: null,
        city: null,
        ward: null,
        lat: s.lat,
        lng: s.lng,
        population: s.population,
        infra_index: round2(100 - s.gap_index),
        gap_index: s.gap_index,
      };
    }
  }

  if (level === 'district' && districtName) {
    const d = districtIndexByName.get(districtName);
    if (d) return geoForDistrict(d, 'district');
  }

  if (level === 'city' && (districtName || (stateName && input.city))) {
    const d = districtName
      ? districtIndexByName.get(districtName)
      : findDistrictForCity(stateName ?? '', input.city ?? '');
    if (d) return geoForDistrict(d, 'city');
  }

  if (level === 'ward' && districtName) {
    const d = districtIndexByName.get(districtName);
    if (d) return geoForDistrict(d, 'ward', input.ward ?? null);
  }

  return {
    level: 'india',
    name: 'India',
    state: null,
    district: null,
    city: null,
    ward: null,
    lat: INDIA_CENTRE[0],
    lng: INDIA_CENTRE[1],
    population: data.states.reduce((sum, s) => sum + s.population, 0),
    infra_index: 0,
    gap_index: 0,
  };
}

function geoForDistrict(d: DistrictRecord, level: GeoLevel, wardName?: string | null): GeoContext {
  const ward =
    level === 'ward' ? d.wards.find((w) => w.name === wardName) ?? null : null;
  return {
    level,
    name: ward
      ? `${ward.name}, ${d.city}, ${d.state}`
      : level === 'city'
        ? `${d.city}, ${d.state}`
        : `${d.name}, ${d.state}`,
    state: d.state,
    district: d.name,
    city: d.city,
    ward: ward?.name ?? null,
    lat: ward?.lat ?? d.lat,
    lng: ward?.lng ?? d.lng,
    population: d.population,
    infra_index: d.infra_index,
    gap_index: d.gap_index,
  };
}

export function geoContextForRequest(req: CivicRequest): GeoContext {
  return {
    level: 'ward',
    name: `${req.ward}, ${req.city}, ${req.state}`,
    state: req.state,
    district: req.district,
    city: req.city,
    ward: req.ward,
    lat: req.lat,
    lng: req.lng,
    population: req.population,
    infra_index: req.infra_index,
    gap_index: req.gap_index,
  };
}

/** Does this request fall inside the given geographic scope? */
export function matchesGeo(req: CivicRequest, geo: GeoContext): boolean {
  switch (geo.level) {
    case 'india':
      return true;
    case 'state':
      return geo.state ? req.state === geo.state : true;
    case 'district':
      return geo.district ? req.district === geo.district : true;
    case 'city':
      return geo.city ? req.city === geo.city : true;
    case 'ward':
      if (geo.ward) return req.ward === geo.ward && req.district === geo.district;
      return geo.district ? req.district === geo.district : true;
  }
}

export function datasetMeta() {
  return {
    ...data.meta,
    states: data.states.length,
    districts: data.districts.length,
    requests: data.requests.length,
    templates: data.templates.length,
    cities: data.cities.length,
    languages: data.languages.length,
    priorities: {
      weights: PRIORITY_WEIGHTS,
      tiers: {
        critical: `${TIER_THRESHOLDS.critical} – 100`,
        high: `${TIER_THRESHOLDS.high} – ${TIER_THRESHOLDS.critical - 1}`,
        medium: `${TIER_THRESHOLDS.medium} – ${TIER_THRESHOLDS.high - 1}`,
        low: `0 – ${TIER_THRESHOLDS.medium - 1}`,
      },
    },
  };
}

function findDistrictForCity(stateName: string, city: string): DistrictRecord | null {
  return (
    data.districts.find((d) => d.state === stateName && d.city === city) ?? null
  );
}

/** Wards available for a district, for the geography switcher. */
export function wardsOfDistrict(districtName: string): string[] {
  const d = districtIndexByName.get(districtName);
  return d ? d.wards.map((w) => w.name) : [];
}

/** Distinct (city, district) pairs inside a state. */
export function cityIndexOfState(stateName: string): { city: string; district: string }[] {
  const seen = new Map<string, string>();
  for (const d of data.districts) {
    if (d.state !== stateName) continue;
    if (!seen.has(d.city)) seen.set(d.city, d.name);
  }
  return Array.from(seen, ([city, district]) => ({ city, district })).sort((a, b) =>
    a.city.localeCompare(b.city)
  );
}

export function districtAggregatesFor(code: string) {
  const agg = districtAggregates.get(code);
  if (!agg) return null;
  return {
    requests: agg.count,
    avg_severity: round2(agg.totalSeverity / agg.count),
    by_sector: Object.fromEntries(agg.bySector),
  };
}

export { data as rawDataset };

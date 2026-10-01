import {
  geoFilterFromParams,
  handle,
  requirePermission,
  rowFiltersFromParams,
  type ApiResult,
} from '@/lib/api-helpers';
import { filterRequests } from '@/lib/analytics';
import { resolveGeo, type CivicRequest } from '@/lib/civic-data';
import {
  normalizeCategory,
  normalizeStatus,
  priorityLevelFromScore,
  type GrievanceRecord,
} from '@/types/grievance';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function toGrievanceRecord(req: CivicRequest): GrievanceRecord {
  const rawScore = req.priority_score;
  const score = typeof rawScore === 'number' && !Number.isNaN(rawScore) ? rawScore : null;
  const level = priorityLevelFromScore(score);
  const isSynthetic = req.source.toLowerCase().includes('synthetic') || req.source.toLowerCase().includes('demo');
  const cat = normalizeCategory(req.category || req.sector);
  const status = normalizeStatus(req.status);
  const ward = req.ward && req.ward.trim() ? req.ward : 'Not available';

  return {
    id: req.id,
    displayId: `GRV-${req.id.toString().padStart(6, '0')}`,
    timestamp: req.created_at || new Date().toISOString(),
    state: req.state,
    district: req.district,
    city: req.city || 'Not available',
    ward,
    languageCode: req.languageCode || req.language || 'en',
    language: req.language_name || 'English',
    category: cat,
    description: req.description || req.translation || 'No description provided',
    severity: req.severity || 0,
    urgency: req.urgency || 0,
    priorityScore: score,
    priorityLevel: level,
    status,
    processingStatus: req.ai_analysed ? 'Classified' : 'Pending',
    dataSource: isSynthetic ? 'Synthetic' : 'Public',
    latitude: req.lat,
    longitude: req.lng,
    title: req.description ? (req.description.length > 55 ? `${req.description.slice(0, 52)}...` : req.description) : req.category,
    affectedPopulation: req.affected_population,
    hotspotScore: req.hotspot_score,
    recommendedAction: req.recommended_action,
    aiReasoning: req.ai_reasoning,
    originalText: req.originalText || req.description,
    translatedText: req.translatedText || req.translation,
    factors: req.priority_factors,
  };
}

/** GET /api/grievances — paginated, filtered, searchable request list. */
export function GET(request: Request): Promise<Response> {
  const guard = requirePermission(request, 'view_grievances');
  if ('error' in guard) return handle(() => guard.error as ApiResult<never>);

  const params = new URL(request.url).searchParams;
  const geo = geoFilterFromParams(params);
  const filters = rowFiltersFromParams(params);
  const page = Math.max(1, Number(params.get('page')) || 1);
  const perPage = Math.min(100, Math.max(1, Number(params.get('per_page')) || 25));
  const sort = params.get('sort') ?? 'priority';

  const rows = filterRequests(geo, {
    sector: filters.sector,
    priority: filters.priority,
    status: filters.status,
    language: filters.language,
    search: filters.search,
  });

  const sorted = [...rows].sort((a, b) => {
    switch (sort) {
      case 'newest':
        return b.day - a.day || b.id - a.id;
      case 'oldest':
        return a.day - b.day || a.id - b.id;
      case 'severity':
        return b.severity - a.severity;
      default:
        return b.priority_score - a.priority_score || b.id - a.id;
    }
  });

  const start = (page - 1) * perPage;
  const items = sorted.slice(start, start + perPage).map(toGrievanceRecord);

  return handle((): ApiResult<{
    items: GrievanceRecord[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
    geo: ReturnType<typeof resolveGeo>;
  }> => ({
    ok: true,
    data: {
      items,
      total: sorted.length,
      page,
      per_page: perPage,
      total_pages: Math.max(1, Math.ceil(sorted.length / perPage)),
      geo: resolveGeo(geo),
    },
  }));
}

/**
 * Typed analytics service.
 * Powers hotspot clusters, priority projects, trends, and category distribution.
 */

import { summarize, hotspots, priorityProjects, filterRequests, type GeoFilter, type Hotspot, type PriorityProject } from '@/lib/analytics';
import type { AnalyticsSummary } from '@/lib/analytics';

export function getAnalyticsSummary(filter: GeoFilter): AnalyticsSummary {
  return summarize(filter);
}

export function getHotspots(filter: GeoFilter, limit = 10): Hotspot[] {
  const rows = filterRequests(filter);
  return hotspots(rows, limit);
}

export function getPriorityProjects(filter: GeoFilter, limit = 10): PriorityProject[] {
  const rows = filterRequests(filter);
  return priorityProjects(rows, limit);
}

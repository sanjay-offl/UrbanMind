/**
 * Typed dashboard service.
 * Single source of truth for dashboard analytics, KPI metrics, and activity.
 */

import { summarize, filterRequests, priorityProjects, type GeoFilter } from '@/lib/analytics';
import { listRequests } from '@/lib/grievance-store';
import type { CivicRequest } from '@/lib/civic-data';

export interface DashboardPayload {
  totalComplaints: number;
  openGrievances: number;
  criticalIssues: number;
  averagePriorityScore: number;
  complaintsByCategory: { category: string; count: number; share: number; critical: number }[];
  priorityTrend: { date: string; count: number; critical: number; resolved: number }[];
  topCriticalGrievances: CivicRequest[];
  geographicSummary: {
    name: string;
    level: string;
    population: number;
    infraIndex: number;
    gapIndex: number;
  };
  recentActivity: {
    id: number;
    title: string;
    category: string;
    ward: string;
    priority: string;
    score: number;
    timestamp: string;
    status: string;
  }[];
}

export function getDashboardData(filter: GeoFilter): DashboardPayload {
  const summary = summarize(filter);
  const rows = filterRequests(filter);

  const topCriticalGrievances = rows
    .filter((r) => r.priority === 'critical')
    .sort((a, b) => b.priority_score - a.priority_score)
    .slice(0, 5);

  const recentActivity = [...rows]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8)
    .map((r) => ({
      id: r.id,
      title: r.description.slice(0, 60) + (r.description.length > 60 ? '…' : ''),
      category: r.category,
      ward: r.ward,
      priority: r.priority,
      score: r.priority_score,
      timestamp: r.created_at,
      status: r.status,
    }));

  return {
    totalComplaints: summary.kpis.total_requests,
    openGrievances: summary.kpis.open_requests,
    criticalIssues: summary.kpis.critical_requests,
    averagePriorityScore: summary.kpis.median_priority,
    complaintsByCategory: summary.categories.map((c) => ({
      category: c.category,
      count: c.count,
      share: c.share,
      critical: c.critical,
    })),
    priorityTrend: summary.trends,
    topCriticalGrievances,
    geographicSummary: {
      name: summary.geo.name,
      level: summary.geo.level,
      population: summary.geo.population,
      infraIndex: summary.geo.infra_index,
      gapIndex: summary.geo.gap_index,
    },
    recentActivity,
  };
}

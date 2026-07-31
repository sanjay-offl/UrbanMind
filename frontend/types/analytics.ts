import type { Grievance } from '@/types/grievance';

export interface KpiCards {
  total: number;
  open: number;
  critical: number;
  avgScore: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface WardCount {
  ward: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  kpiCards: KpiCards;
  priorityBreakdown: Record<string, number>;
  topCritical: Grievance[];
  trend: TrendPoint[];
  byCategory: CategoryCount[];
  byWard: WardCount[];
}

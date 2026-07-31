import type { Grievance } from '@/types/grievance';

export interface KpiCards {
  total: number;
  open: number;
  critical: number;
  avg_score: number;
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface WardCount {
  ward_id: number;
  ward_name: string;
  count: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface AnalyticsSummary {
  kpis: KpiCards;
  categories: CategoryCount[];
  wards: WardCount[];
  trends: TrendPoint[];
}

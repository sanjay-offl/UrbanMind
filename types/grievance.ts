export type CanonicalCategory =
  | 'Water'
  | 'Roads'
  | 'Sanitation'
  | 'Transport'
  | 'Electricity'
  | 'Public Infrastructure'
  | 'Health'
  | 'Other';

export type PriorityLevel = 'Critical' | 'High' | 'Moderate' | 'Low' | 'Not scored';

export type CanonicalStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export type ProcessingStatus = 'Pending' | 'Classified' | 'Failed';

export type DataSourceType = 'Public' | 'Synthetic';

export interface PriorityFactorsShape {
  severity: number;
  urgency: number;
  population: number;
  infrastructure_gap: number;
  complaint_frequency: number;
  geographic_concentration: number;
  recency: number;
}

export interface GrievanceRecord {
  id: number;
  displayId: string;
  timestamp: string;
  state: string;
  district: string;
  city: string;
  ward: string;
  languageCode: string;
  language: string;
  category: CanonicalCategory;
  description: string;
  severity: number;
  urgency: number;
  priorityScore: number | null;
  priorityLevel: PriorityLevel;
  status: CanonicalStatus;
  processingStatus: ProcessingStatus;
  dataSource: DataSourceType;
  latitude: number;
  longitude: number;
  // Detail enrichment
  title?: string;
  affectedPopulation?: number;
  hotspotScore?: number;
  recommendedAction?: string;
  aiReasoning?: string;
  originalText?: string;
  translatedText?: string;
  factors?: PriorityFactorsShape;
}

export type Grievance = GrievanceRecord;

export function normalizeCategory(raw: string | undefined | null): CanonicalCategory {
  if (!raw) return 'Other';
  const norm = raw.trim().toLowerCase();
  if (norm.includes('water')) return 'Water';
  if (norm.includes('road')) return 'Roads';
  if (norm.includes('sanitat') || norm.includes('waste')) return 'Sanitation';
  if (norm.includes('transport') || norm.includes('bus') || norm.includes('traffic')) return 'Transport';
  if (norm.includes('electric') || norm.includes('power')) return 'Electricity';
  if (norm.includes('health') || norm.includes('medic') || norm.includes('hospital')) return 'Health';
  if (norm.includes('infra') || norm.includes('public_safety') || norm.includes('safety') || norm.includes('educat') || norm.includes('agri')) {
    return 'Public Infrastructure';
  }
  return 'Other';
}

export function normalizeStatus(raw: string | undefined | null): CanonicalStatus {
  if (!raw) return 'Open';
  const norm = raw.trim().toLowerCase();
  if (norm.includes('resolv')) return 'Resolved';
  if (norm.includes('clos')) return 'Closed';
  if (norm.includes('progress') || norm.includes('investigat')) return 'In Progress';
  return 'Open';
}

export function priorityLevelFromScore(score: number | null | undefined): PriorityLevel {
  if (score === null || score === undefined || Number.isNaN(score)) return 'Not scored';
  if (score >= 72) return 'Critical';
  if (score >= 63) return 'High';
  if (score >= 52) return 'Moderate';
  return 'Low';
}

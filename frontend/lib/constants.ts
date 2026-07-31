import type { Priority, Status } from '@/types/grievance';

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#16a34a',
};

export const CATEGORIES: string[] = [
  'Roads & Infrastructure',
  'Water Supply',
  'Sanitation & Waste',
  'Electricity',
  'Public Safety',
  'Parks & Green Spaces',
  'Health & Medical',
  'Education',
  'Housing & Buildings',
  'Noise & Environment',
  'Public Transport',
  'Others',
];

export const STATUS_OPTIONS: Status[] = [
  'pending',
  'classified',
  'in_progress',
  'resolved',
  'closed',
];

export const WARD_SELECT_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Wards' },
];

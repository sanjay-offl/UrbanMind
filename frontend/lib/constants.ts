import type { Priority, Status } from '@/types/grievance';

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#9A1750',
  high: '#EE4C7C',
  medium: '#E3AFBC',
  low: '#E3E2DF',
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

export const ROLES = {
  ADMIN: 'admin',
  WARD_OFFICER: 'ward_officer',
  ANALYST: 'analyst',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'view_dashboard',
    'view_grievances',
    'edit_grievances',
    'view_map',
    'view_trends',
    'use_agent',
    'view_reports',
    'generate_reports',
    'upload_complaints',
    'view_all_wards',
    'access_settings',
    'manage_users',
  ],
  ward_officer: [
    'view_dashboard',
    'view_grievances',
    'view_map',
    'view_trends',
    'use_agent',
    'view_reports',
    'upload_complaints',
    'view_own_ward',
  ],
  analyst: [
    'view_dashboard',
    'view_grievances',
    'view_map',
    'view_trends',
    'view_reports',
    'view_all_wards',
  ],
};

export const DEMO_USERS = [
  {
    email: 'admin@urbanmind.gov.in',
    password: 'UrbanMind@2024',
    name: 'Nithya Shree P G',
    role: 'admin' as Role,
    initials: 'NS',
    department: 'Municipal Corporation of Chennai',
    ward: null,
    badgeLabel: 'Admin Officer',
    badgeBg: 'rgba(154,23,80,0.18)',
    badgeColor: '#EE4C7C',
    badgeBorder: 'rgba(154,23,80,0.35)',
    chipBorder: 'rgba(154,23,80,0.20)',
    chipHoverBg: 'rgba(154,23,80,0.08)',
    chipHoverBorder: 'rgba(154,23,80,0.40)',
  },
  {
    email: 'ward@urbanmind.gov.in',
    password: 'WardDemo@2024',
    name: 'Sakthy Sabarish',
    role: 'ward_officer' as Role,
    initials: 'SS',
    department: 'Ward 42 — Adyar',
    ward: 'Ward 42',
    badgeLabel: 'Ward Officer',
    badgeBg: 'rgba(227,175,188,0.20)',
    badgeColor: '#E3AFBC',
    badgeBorder: 'rgba(227,175,188,0.40)',
    chipBorder: 'rgba(227,175,188,0.20)',
    chipHoverBg: 'rgba(227,175,188,0.08)',
    chipHoverBorder: 'rgba(227,175,188,0.45)',
  },
  {
    email: 'analyst@urbanmind.gov.in',
    password: 'Analyst@2024',
    name: 'Sanjay S',
    role: 'analyst' as Role,
    initials: 'SJ',
    department: 'Data & Analytics Division',
    ward: null,
    badgeLabel: 'Analyst',
    badgeBg: 'rgba(227,226,223,0.12)',
    badgeColor: '#E3E2DF',
    badgeBorder: 'rgba(227,226,223,0.30)',
    chipBorder: 'rgba(227,226,223,0.15)',
    chipHoverBg: 'rgba(227,226,223,0.06)',
    chipHoverBorder: 'rgba(227,226,223,0.35)',
  },
];

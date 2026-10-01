import type { Priority, Status } from '@/types/grievance';

/**
 * Google-inspired categorical palette. Used for charts, map clusters and
 * status chips so the whole product reads as one system.
 */
export const PALETTE = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC05',
  green: '#34A853',
  ink: '#111827',
  slate: '#64748B',
  line: '#E5E7EB',
} as const;

/** Sector colours — the same four accents, assigned by civic domain. */
export const SECTOR_COLORS: Record<string, string> = {
  water: PALETTE.blue,
  roads: PALETTE.yellow,
  sanitation: PALETTE.green,
  electricity: PALETTE.red,
  health: PALETTE.blue,
  education: PALETTE.green,
  public_safety: PALETTE.red,
  agriculture: PALETTE.yellow,
  environment: PALETTE.green,
  transport: PALETTE.blue,
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  critical: PALETTE.red,
  high: PALETTE.yellow,
  medium: PALETTE.blue,
  low: PALETTE.slate,
};

export const STATUS_COLORS: Record<Status, string> = {
  pending: PALETTE.slate,
  classified: PALETTE.blue,
  in_progress: PALETTE.yellow,
  resolved: PALETTE.green,
  closed: PALETTE.slate,
};

export const CATEGORIES: string[] = [
  'Water Supply',
  'Road Infrastructure',
  'Sanitation & Waste',
  'Electricity',
  'Health & Medical',
  'Education',
  'Public Safety',
  'Agriculture & Rural Livelihoods',
  'Environment & Ecology',
  'Public Transport',
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

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'National Administrator',
  ward_officer: 'Ward Officer',
  analyst: 'Policy Analyst',
};

/**
 * Capability names. Routes and API handlers check these rather than checking
 * the role string directly, so a new role only needs one entry here.
 */
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_GRIEVANCES: 'view_grievances',
  EDIT_GRIEVANCES: 'edit_grievances',
  VIEW_MAP: 'view_map',
  VIEW_TRENDS: 'view_trends',
  VIEW_HOTSPOTS: 'view_hotspots',
  VIEW_PRIORITY: 'view_priority',
  VIEW_RECOMMENDATIONS: 'view_recommendations',
  USE_AGENT: 'use_agent',
  VIEW_REPORTS: 'view_reports',
  GENERATE_REPORTS: 'generate_reports',
  UPLOAD_COMPLAINTS: 'upload_complaints',
  SUBMIT_COMPLAINT: 'submit_complaint',
  VIEW_ALL_WARDS: 'view_all_wards',
  ACCESS_SETTINGS: 'access_settings',
  MANAGE_USERS: 'manage_users',
} as const;

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: Object.values(PERMISSIONS),
  ward_officer: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_GRIEVANCES,
    PERMISSIONS.EDIT_GRIEVANCES,
    PERMISSIONS.VIEW_MAP,
    PERMISSIONS.VIEW_TRENDS,
    PERMISSIONS.VIEW_HOTSPOTS,
    PERMISSIONS.VIEW_PRIORITY,
    PERMISSIONS.USE_AGENT,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.UPLOAD_COMPLAINTS,
    PERMISSIONS.SUBMIT_COMPLAINT,
    'view_own_ward',
  ],
  analyst: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_GRIEVANCES,
    PERMISSIONS.VIEW_MAP,
    PERMISSIONS.VIEW_TRENDS,
    PERMISSIONS.VIEW_HOTSPOTS,
    PERMISSIONS.VIEW_PRIORITY,
    PERMISSIONS.VIEW_RECOMMENDATIONS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.SUBMIT_COMPLAINT,
    PERMISSIONS.VIEW_ALL_WARDS,
  ],
};

export interface DemoUser {
  email: string;
  password: string;
  name: string;
  role: Role;
  initials: string;
  department: string;
  ward: string | null;
  badgeLabel: string;
  badgeBg: string;
  badgeColor: string;
  badgeBorder: string;
  chipBorder: string;
  chipHoverBg: string;
  chipHoverBorder: string;
}

/**
 * The three seeded government accounts. The login page renders these as cards
 * that *fill the form* — clicking a card never authenticates by itself.
 */
export const DEMO_USERS: DemoUser[] = [
  {
    email: 'admin@urbanmind.gov.in',
    password: 'UrbanMind@2024',
    name: 'Sanjay S',
    role: 'admin',
    initials: 'SS',
    department: 'Ministry of Housing & Urban Affairs — National Cell',
    ward: null,
    badgeLabel: 'National Admin',
    badgeBg: 'rgba(66,133,244,0.12)',
    badgeColor: PALETTE.blue,
    badgeBorder: 'rgba(66,133,244,0.32)',
    chipBorder: 'rgba(66,133,244,0.22)',
    chipHoverBg: 'rgba(66,133,244,0.08)',
    chipHoverBorder: 'rgba(66,133,244,0.45)',
  },
  {
    email: 'ward@urbanmind.gov.in',
    password: 'WardDemo@2024',
    name: 'Gowsik',
    role: 'ward_officer',
    initials: 'GW',
    department: 'Greater Chennai Corporation — Ward 1, Chennai',
    ward: 'Ward 1 — Kunj',
    badgeLabel: 'Ward Officer',
    badgeBg: 'rgba(52,168,83,0.12)',
    badgeColor: PALETTE.green,
    badgeBorder: 'rgba(52,168,83,0.32)',
    chipBorder: 'rgba(52,168,83,0.22)',
    chipHoverBg: 'rgba(52,168,83,0.08)',
    chipHoverBorder: 'rgba(52,168,83,0.45)',
  },
  {
    email: 'analyst@urbanmind.gov.in',
    password: 'Analyst@2024',
    name: 'Dhanu Shree',
    role: 'analyst',
    initials: 'DS',
    department: 'NITI Aayog — Policy & Analytics Division',
    ward: null,
    badgeLabel: 'Policy Analyst',
    badgeBg: 'rgba(251,188,5,0.16)',
    badgeColor: '#B06000',
    badgeBorder: 'rgba(251,188,5,0.40)',
    chipBorder: 'rgba(251,188,5,0.30)',
    chipHoverBg: 'rgba(251,188,5,0.10)',
    chipHoverBorder: 'rgba(251,188,5,0.55)',
  },
];

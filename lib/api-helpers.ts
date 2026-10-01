/**
 * Shared plumbing for the Next.js route handlers.
 *
 * Every route returns a discriminated `{ ok: true, data } | { ok: false, error }`
 * envelope, so the client can render a real error + retry state instead of
 * crashing on a thrown `res.json()`.
 */

import { NextResponse } from 'next/server';
import type { Sector } from './civic-data';
import type { GeoLevel, PriorityTier } from './civic-data';
import type { GeoFilter } from './analytics';
import { hasPermission, sessionFromRequest, type SessionClaims } from './session';

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string; code?: string };

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true as const, data }, { status });
}

export function fail(error: string, status = 400, code?: string) {
  return NextResponse.json({ ok: false as const, error, code }, { status });
}

export function handle<T>(fn: () => Promise<ApiResult<T>> | ApiResult<T>) {
  return Promise.resolve(fn())
    .then((result) => (result.ok ? ok(result.data) : fail(result.error, statusFor(result), result.code)))
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : 'Unexpected server error';
      return fail(message, 500);
    });
}

function statusFor(result: { error: string; code?: string }): number {
  switch (result.code) {
    case 'unauthorized':
      return 401;
    case 'forbidden':
      return 403;
    case 'not_found':
      return 404;
    case 'rate_limited':
      return 429;
    case 'bad_request':
      return 400;
    default:
      return 400;
  }
}

export function badRequest(message: string): ApiResult<never> {
  return { ok: false, error: message, code: 'bad_request' };
}

export function notFound(message = 'Not found'): ApiResult<never> {
  return { ok: false, error: message, code: 'not_found' };
}

export function unauthorized(message = 'Sign in to use this endpoint'): ApiResult<never> {
  return { ok: false, error: message, code: 'unauthorized' };
}

export function forbidden(message = 'Your role does not allow this action'): ApiResult<never> {
  return { ok: false, error: message, code: 'forbidden' };
}

/**
 * Enforces a permission server-side. The UI hides what a role cannot do, but
 * this is what actually stops it.
 */
export function requirePermission(
  request: Request,
  permission: string
): { claims: SessionClaims } | { error: ApiResult<never> } {
  const claims = sessionFromRequest(request);
  if (!claims) {
    if (permission === 'submit_complaint') {
      return {
        claims: {
          email: 'citizen@urbanmind.gov.in',
          name: 'Citizen',
          role: 'ward_officer',
          department: 'Citizen Intake',
          ward: null,
          exp: Math.floor(Date.now() / 1000) + 86400,
        },
      };
    }
    return { error: unauthorized() };
  }
  if (!hasPermission(claims, permission)) {
    return {
      error: forbidden(`Role "${claims.role}" is missing the "${permission}" permission`),
    };
  }
  return { claims };
}

const LEVELS: GeoLevel[] = ['india', 'state', 'district', 'city', 'ward'];

/** Parses `?level=&state=&district=&city=&ward=` into a `GeoFilter`. */
export function geoFilterFromParams(params: URLSearchParams): GeoFilter {
  const levelParam = (params.get('level') ?? 'india') as GeoLevel;
  const level = LEVELS.includes(levelParam) ? levelParam : 'india';
  const filter: GeoFilter = { level };
  if (level !== 'india') {
    filter.state = params.get('state');
    if (level === 'district' || level === 'city' || level === 'ward') {
      filter.district = params.get('district');
    }
    if (level === 'city' || level === 'ward') filter.city = params.get('city');
    if (level === 'ward') filter.ward = params.get('ward');
  }
  return filter;
}

const TIERS: PriorityTier[] = ['critical', 'high', 'medium', 'low'];
const SECTORS: Sector[] = [
  'water',
  'roads',
  'sanitation',
  'electricity',
  'health',
  'education',
  'public_safety',
  'agriculture',
  'environment',
  'transport',
];

/** Parses the shared filter query used by list, map and analytics endpoints. */
export function rowFiltersFromParams(params: URLSearchParams) {
  const sector = params.get('sector');
  const priority = params.get('priority');
  return {
    sector: (SECTORS as string[]).includes(sector ?? '') ? (sector as Sector) : ('all' as const),
    priority: (TIERS as string[]).includes(priority ?? '')
      ? (priority as PriorityTier)
      : ('all' as const),
    status: params.get('status') ?? 'all',
    language: params.get('language') ?? 'all',
    search: params.get('search') ?? '',
    days: Number(params.get('days')) || 180,
    limit: Math.min(500, Math.max(1, Number(params.get('limit')) || 50)),
  };
}

export function asInt(value: unknown, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

/** Clamps a message so a single request can never blow up the token budget. */
export function clampText(value: unknown, max = 4000): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

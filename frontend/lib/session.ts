/**
 * Server-side session tokens.
 *
 * The demo sign-in is a three-account fixture, but authorisation is still
 * enforced in logic rather than in the UI: the browser never decides its own
 * role. `/api/auth/session` verifies the credentials here, mints an HMAC-signed
 * token, and every mutating route handler re-checks that token plus the
 * permission it needs. A tampered `localStorage` entry cannot widen access
 * because the signature will not verify.
 *
 * Server-only: imports `node:crypto`, must never be pulled into a client
 * bundle.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import { ROLE_PERMISSIONS, type Role } from './constants';

const SECRET =
  process.env.URBANMIND_SESSION_SECRET ??
  // Dev-only fallback. Set URBANMIND_SESSION_SECRET in any real deployment.
  'urbanmind-dev-secret-do-not-use-in-production';

const TTL_SECONDS = 60 * 60 * 12; // one working day

export interface SessionClaims {
  email: string;
  name: string;
  role: Role;
  department: string;
  ward: string | null;
  /** Seconds since epoch. */
  exp: number;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64url(input: string): string {
  const padded = input.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(payload: string): string {
  return base64url(createHmac('sha256', SECRET).update(payload).digest());
}

export function issueSession(claims: Omit<SessionClaims, 'exp'>): {
  token: string;
  expiresAt: string;
} {
  const full: SessionClaims = {
    ...claims,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const body = base64url(JSON.stringify(full));
  return {
    token: `${body}.${sign(body)}`,
    expiresAt: new Date(full.exp * 1000).toISOString(),
  };
}

/** Returns the claims, or null when the token is missing, forged or expired. */
export function verifySession(token: string | null | undefined): SessionClaims | null {
  if (!token || typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(body);

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let claims: SessionClaims;
  try {
    claims = JSON.parse(fromBase64url(body)) as SessionClaims;
  } catch {
    return null;
  }
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) return null;
  if (!claims.email || !claims.role || !ROLE_PERMISSIONS[claims.role]) return null;
  return claims;
}

/** Reads the bearer token from a request. */
export function sessionFromRequest(request: Request): SessionClaims | null {
  const header = request.headers.get('authorization') ?? '';
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
  return verifySession(bearer);
}

export function hasPermission(claims: SessionClaims | null, permission: string): boolean {
  if (!claims) return false;
  return ROLE_PERMISSIONS[claims.role]?.includes(permission) ?? false;
}

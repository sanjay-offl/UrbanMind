'use client';

/**
 * Typed client for the Next.js route handlers.
 *
 * Every handler answers with `{ ok: true, data }` or `{ ok: false, error, code }`,
 * so this layer can surface a real message plus a retry affordance instead of
 * letting a `res.json()` rejection surface as a blank screen.
 *
 * The bearer token comes from the signed session issued by
 * `/api/auth/session`; role checks happen on the server.
 */

import { getToken } from './auth';

export class ApiError extends Error {
  status: number;
  code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }

  /** Retrying is only useful for transient failures. */
  get retryable(): boolean {
    return this.status === 0 || this.status === 429 || this.status >= 500;
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

function qs(params?: Params): string {
  if (!params) return '';
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const out = search.toString();
  return out ? `?${out}` : '';
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  params?: Params
): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${path}${qs(params)}`, {
      ...init,
      cache: 'no-store',
      headers: {
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError('Network unreachable. Check your connection and retry.', 0);
  }

  const payload = (await res.json().catch(() => null)) as
    | { ok: true; data: T }
    | { ok: false; error: string; code?: string }
    | null;

  if (!payload) throw new ApiError(`Unexpected response (HTTP ${res.status}).`, res.status);
  if (!payload.ok) throw new ApiError(payload.error, res.status, payload.code);
  return payload.data;
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>(path, { method: 'GET' }, params),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  upload: <T>(path: string, form: FormData) =>
    request<T>(path, { method: 'POST', body: form }),
};

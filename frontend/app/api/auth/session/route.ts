import { NextResponse } from 'next/server';
import { DEMO_USERS } from '@/lib/constants';
import { issueSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/session — verify demo credentials and mint a signed token.
 *
 * There is no auto-login: the client must post an explicit email + password.
 */
export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Expected a JSON body with email and password' },
      { status: 400 }
    );
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  const match = DEMO_USERS.find((u) => u.email.toLowerCase() === email && u.password === password);

  if (!match) {
    // Uniform message: never reveal which half of the pair was wrong.
    return NextResponse.json(
      { ok: false, error: 'Those credentials do not match a UrbanMind account.' },
      { status: 401 }
    );
  }

  const { token, expiresAt } = issueSession({
    email: match.email,
    name: match.name,
    role: match.role,
    department: match.department,
    ward: match.ward,
  });

  return NextResponse.json({
    ok: true,
    data: {
      token,
      expiresAt,
      user: {
        email: match.email,
        name: match.name,
        role: match.role,
        initials: match.initials,
        department: match.department,
        ward: match.ward,
        badgeLabel: match.badgeLabel,
      },
    },
  });
}

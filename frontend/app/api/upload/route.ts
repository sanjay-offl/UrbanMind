import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export async function POST(request: NextRequest) {
  const formData = await request.formData();

  const res = await fetch(`${API_BASE}/upload/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    return NextResponse.json(
      { error: error?.detail || 'Analysis failed' },
      { status: res.status }
    );
  }

  const data = await res.json();
  return NextResponse.json(data);
}

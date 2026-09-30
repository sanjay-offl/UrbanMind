import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

export async function POST(request: NextRequest) {
  const body = await request.formData();
  const response = await fetch(`${API_BASE}/intake/complaints`, { method: 'POST', body });
  const data = await response.json().catch(() => null);
  return NextResponse.json(data, { status: response.status });
}
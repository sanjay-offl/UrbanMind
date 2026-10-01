import type { Grievance } from '@/types/grievance';
import type { AnalyticsSummary } from '@/types/analytics';
import type { ChatMessage } from '@/types/agent';
import type { Report } from '@/types/report';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? '';

type QueryParams = Record<string, string | number | undefined>;

interface GrievanceParams extends QueryParams {
  search?: string;
  category?: string;
  ward_id?: number;
  status?: string;
  priority?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
  const headers = new Headers(init?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...init, headers });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed with status ${res.status}`;
    throw new Error(detail);
  }
  if (data && typeof data === 'object' && 'ok' in data && 'data' in data && (data as any).ok) {
    return (data as any).data as T;
  }
  return data as T;
}

function buildQuery(params?: QueryParams): string {
  const searchParams = new URLSearchParams();
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') {
        searchParams.set(key, String(value));
      }
    }
  }
  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

interface GrievanceList {
  items: Grievance[];
  total: number;
  page: number;
  limit: number;
}

export function getGrievances(params?: GrievanceParams): Promise<Grievance[]> {
  return request<GrievanceList | Grievance[]>(`/api/grievances${buildQuery(params)}`).then((r) => {
    if (Array.isArray(r)) return r;
    return r?.items ?? [];
  });
}

export function getGrievance(id: number): Promise<Grievance> {
  return request(`/api/grievances/${id}`);
}

export function updateGrievance(
  id: number,
  patch: Record<string, unknown>
): Promise<Grievance> {
  return request(`/api/grievances/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
}

export async function uploadCsv(file: File): Promise<{ imported?: number; errors?: string[] }> {
  const formData = new FormData();
  formData.append('file', file);
  return request('/api/upload', {
    method: 'POST',
    body: formData,
  });
}

export interface AgentHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export async function chatAgent(
  message: string,
  history: AgentHistoryEntry[] = []
): Promise<ChatMessage> {
  const res = await request<{ reply?: string; content?: string } | ChatMessage>('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
  const text = (res as any)?.reply ?? (res as any)?.content ?? (typeof res === 'string' ? res : 'No response');
  return {
    role: 'assistant',
    content: text,
  };
}

export function getAnalytics(params?: { ward_id?: number }): Promise<AnalyticsSummary> {
  return request(`/api/analytics${buildQuery(params)}`);
}

export async function getReports(): Promise<Report[]> {
  const res = await request<{ generated?: any[]; items?: any[] } | any[]>('/api/reports');
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as any).generated)) {
    return (res as any).generated.map((r: any, idx: number) => ({
      id: r.id || idx + 1,
      type: r.type || 'summary',
      created_at: r.generated_at || new Date().toISOString(),
      file_url: `/api/reports/download?type=${r.type || 'national_summary'}`,
      status: 'ready',
    }));
  }
  return [];
}

export function generateReport(
  type: string,
  wardId?: number
): Promise<Report> {
  return request('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, ward_id: wardId }),
  });
}

export function downloadReportUrl(id: number | string, type: string = 'national_summary') {
  return `/api/reports/download?type=${encodeURIComponent(type)}`;
}

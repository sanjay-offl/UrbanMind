import type { Grievance } from '@/types/grievance';
import type { AnalyticsSummary } from '@/types/analytics';
import type { ChatMessage } from '@/types/agent';
import type { Report } from '@/types/report';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

type QueryParams = Record<string, string | number | undefined>;

interface GrievanceParams extends QueryParams {
  search?: string;
  category?: string;
  ward_id?: string;
  status?: string;
  priority?: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail =
      data && typeof data === 'object' && 'detail' in data && typeof data.detail === 'string'
        ? data.detail
        : `Request failed with status ${res.status}`;
    throw new Error(detail);
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

export function getGrievances(params?: GrievanceParams): Promise<Grievance[]> {
  return request(`/api/grievances${buildQuery(params)}`);
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
  return request('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history }),
  });
}

export function getAnalytics(): Promise<AnalyticsSummary> {
  return request('/api/analytics');
}

export function getReports(): Promise<Report[]> {
  return request('/api/reports');
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

export function downloadReportUrl(id: number) {
  return `${API_BASE}/reports/${id}/download`;
}

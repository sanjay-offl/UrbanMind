/**
 * Mutation overlay for the read-only national dataset.
 *
 * `data/civic-data.json` ships with the app and is never written to. Status
 * changes made during a demo session live in this process-level overlay, which
 * is documented in the UI as session-scoped. A production deployment swaps
 * this module for the Postgres/FastAPI backend that already exists in
 * `backend/`.
 */

import { allRequests, type CivicRequest, type RequestStatus } from './civic-data';

type Patch = {
  status?: RequestStatus;
  note?: string;
  assigned_to?: string;
  updated_at?: string;
};

const statusOverrides = new Map<string, RequestStatus>();
const notes = new Map<string, { text: string; by: string; at: string }[]>();
const created: CivicRequest[] = [];
let nextCreatedId = 900_000;

function withOverlay(row: CivicRequest): CivicRequest {
  const status = statusOverrides.get(String(row.id));
  if (!status || status === row.status) return row;
  return { ...row, status };
}

export function listRequests(): CivicRequest[] {
  if (statusOverrides.size === 0) return allRequests();
  return allRequests().map(withOverlay);
}

export function findRequest(id: number): CivicRequest | undefined {
  const createdRow = created.find((r) => r.id === id);
  if (createdRow) return createdRow;
  const base = allRequests().find((r) => r.id === id);
  return base ? withOverlay(base) : undefined;
}

export function patchRequest(
  id: number,
  patch: Patch,
  actor: string
): CivicRequest | null {
  const existing = findRequest(id);
  if (!existing) return null;

  const at = new Date().toISOString();
  if (patch.status && patch.status !== existing.status) {
    statusOverrides.set(String(id), patch.status);
  }
  if (patch.note?.trim()) {
    const list = notes.get(String(id)) ?? [];
    list.push({ text: patch.note.trim(), by: actor, at });
    notes.set(String(id), list);
  }
  return { ...existing, status: patch.status ?? existing.status, created_at: existing.created_at, updated_at: at };
}

export function notesFor(id: number) {
  return notes.get(String(id)) ?? [];
}

export function addRequest(row: Omit<CivicRequest, 'id' | 'created_at' | 'updated_at'>): CivicRequest {
  const at = new Date().toISOString();
  const full: CivicRequest = { ...row, id: nextCreatedId++, created_at: at, updated_at: at };
  created.unshift(full);
  return full;
}

export function createdCount(): number {
  return created.length;
}

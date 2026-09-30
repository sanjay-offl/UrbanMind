/**
 * Small read-only helpers for the geography and language pickers.
 * Pure aggregates over the same dataset the analytics layer uses.
 */

import { filterRequests, type GeoFilter } from './analytics';
import { allDistricts, languageName, states, type DistrictRecord } from './civic-data';

export interface DistrictOption {
  code: string;
  name: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  population: number;
  requests: number;
}

export function districts(geo: GeoFilter): DistrictOption[] {
  const unique = new Map<string, DistrictOption>();
  for (const r of filterRequests({ level: 'india' })) {
    if (geo.state && r.state !== geo.state) continue;
    if (geo.district && r.district !== geo.district) continue;
    const existing = unique.get(r.district_code);
    if (existing) {
      existing.requests += 1;
      continue;
    }
    unique.set(r.district_code, {
      code: r.district_code,
      name: r.district,
      state: r.state,
      city: r.city,
      lat: r.lat,
      lng: r.lng,
      population: r.population,
      requests: 1,
    });
  }
  return Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export interface StateOption {
  name: string;
  code: string;
  districts: number;
  population: number;
  lat: number;
  lng: number;
}

export function stateOptions(): StateOption[] {
  return states().map((s) => ({
    name: s.name,
    code: s.code,
    districts: s.districts,
    population: s.population,
    lat: s.lat,
    lng: s.lng,
  }));
}

export interface LanguageMix {
  code: string;
  name: string;
  count: number;
  share: number;
}

export function languages(geo: GeoFilter): LanguageMix[] {
  return languageBreakdown(geo);
}

export function languageBreakdown(geo: GeoFilter): LanguageMix[] {
  const rows = filterRequests(geo);
  const counts = new Map<string, number>();
  for (const r of rows) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  const total = rows.length || 1;
  return Array.from(counts, ([code, count]) => ({
    code,
    name: languageName(code),
    count,
    share: Math.round((count / total) * 1000) / 1000,
  })).sort((a, b) => b.count - a.count);
}

export function districtRecord(code: string): DistrictRecord | undefined {
  return allDistricts().find((d) => d.code === code);
}

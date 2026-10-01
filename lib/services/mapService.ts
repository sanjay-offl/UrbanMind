/**
 * Typed map service.
 * Prepares geocoded markers, bounding box, and clustering metadata for the spatial view.
 */

import { filterRequests, hotspots, type GeoFilter } from '@/lib/analytics';
import { resolveGeo } from '@/lib/civic-data';

export interface MapMarker {
  id: number;
  lat: number;
  lng: number;
  title: string;
  category: string;
  priority: string;
  score: number;
  ward: string;
  city: string;
  district: string;
  state: string;
  status: string;
}

export function getMapData(filter: GeoFilter) {
  const geo = resolveGeo(filter);
  const rows = filterRequests(filter);
  const hot = hotspots(rows, 15);

  const markers: MapMarker[] = rows.slice(0, 300).map((r) => ({
    id: r.id,
    lat: r.lat,
    lng: r.lng,
    title: r.description.slice(0, 60),
    category: r.category,
    priority: r.priority,
    score: r.priority_score,
    ward: r.ward,
    city: r.city,
    district: r.district,
    state: r.state,
    status: r.status,
  }));

  // Calculate bounding box or center
  const lats = markers.map((m) => m.lat);
  const lngs = markers.map((m) => m.lng);

  const bounds = lats.length > 0
    ? {
        minLat: Math.min(...lats),
        maxLat: Math.max(...lats),
        minLng: Math.min(...lngs),
        maxLng: Math.max(...lngs),
      }
    : null;

  return {
    center: [geo.lat, geo.lng] as [number, number],
    geo,
    bounds,
    totalCount: rows.length,
    markers,
    hotspots: hot,
  };
}

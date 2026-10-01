'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import type { GrievanceRecord } from '@/types/grievance';
import { formatScore } from '@/lib/format';

interface ComplaintMapProps {
  grievances: GrievanceRecord[];
  className?: string;
}

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false, loading: () => <div className="h-full w-full bg-[#F8FAFC] animate-pulse" /> }
);

function getMarkerColor(priority: string | undefined): string {
  const p = (priority || '').toLowerCase();
  if (p.includes('crit')) return '#EA4335'; // Red critical
  if (p.includes('high')) return '#FBBC05'; // Yellow high
  if (p.includes('mod') || p.includes('med')) return '#34A853'; // Green normal
  return '#4285F4'; // Blue informational
}

export default function ComplaintMap({ grievances, className = '' }: ComplaintMapProps) {
  const [leafletComponents, setLeafletComponents] = useState<{
    TileLayer: React.ElementType;
    CircleMarker: React.ElementType;
    Tooltip: React.ElementType;
  } | null>(null);

  useEffect(() => {
    let active = true;
    import('react-leaflet').then((m) => {
      if (!active) return;
      setLeafletComponents({
        TileLayer: m.TileLayer,
        CircleMarker: m.CircleMarker,
        Tooltip: m.Tooltip,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  // Filter valid coordinates
  const validGrievances = useMemo(() => {
    return grievances.filter((g) => {
      const lat = g.latitude ?? (g as any).lat;
      const lng = g.longitude ?? (g as any).lng;
      return typeof lat === 'number' && typeof lng === 'number' && !Number.isNaN(lat) && !Number.isNaN(lng);
    });
  }, [grievances]);

  // Center based on valid items
  const center: [number, number] = useMemo(() => {
    if (validGrievances.length > 0) {
      const first = validGrievances[0];
      const lat = first.latitude ?? (first as any).lat;
      const lng = first.longitude ?? (first as any).lng;
      return [lat, lng];
    }
    return [20.5937, 78.9629]; // India center
  }, [validGrievances]);

  if (!leafletComponents) {
    return (
      <div className={`flex items-center justify-center bg-[#F8FAFC] ${className}`}>
        <span className="text-xs text-[#5F6368]">Loading spatial map…</span>
      </div>
    );
  }

  const { TileLayer, CircleMarker, Tooltip } = leafletComponents;

  return (
    <div className={`relative h-full w-full ${className}`}>
      <MapContainer
        center={center}
        zoom={validGrievances.length > 0 ? 11 : 5}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />
        {validGrievances.map((g) => {
          const lat = g.latitude ?? (g as any).lat;
          const lng = g.longitude ?? (g as any).lng;
          const color = getMarkerColor(g.priorityLevel || (g as any).priority);
          const score = g.priorityScore ?? (g as any).priority_score ?? (g as any).score;
          const title = g.description ? (g.description.length > 50 ? `${g.description.slice(0, 48)}…` : g.description) : g.category;
          const affected = g.affectedPopulation ?? (g as any).affected_population ?? 1200;

          return (
            <CircleMarker
              key={g.id}
              center={[lat, lng]}
              radius={7}
              pathOptions={{
                color,
                fillColor: color,
                fillOpacity: 0.85,
                weight: 1.5,
              }}
            >
              {/* Dark Tooltip */}
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                <div
                  style={{
                    backgroundColor: '#202124',
                    color: '#FFFFFF',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    lineHeight: '1.4',
                    minWidth: '180px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#FFFFFF', marginBottom: '2px' }}>
                    {g.ward || 'Ward jurisdiction'}
                  </div>
                  <div style={{ color: '#DADCE0', fontSize: '11px', marginBottom: '4px' }}>
                    {title}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: '4px', marginTop: '4px', fontSize: '11px' }}>
                    <span style={{ color: '#9AA0A6' }}>Urgency Score:</span>
                    <strong style={{ color: '#4285F4', fontFamily: 'monospace' }}>
                      {formatScore(score)}/100
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                    <span style={{ color: '#9AA0A6' }}>Est. Affected:</span>
                    <span style={{ color: '#FFFFFF' }}>{affected.toLocaleString('en-IN')} people</span>
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}

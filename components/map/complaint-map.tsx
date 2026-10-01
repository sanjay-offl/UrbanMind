'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import type { Grievance, Priority } from '@/types/grievance';
import { formatScore } from '@/lib/format';

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#EA4335',
  high: '#FBBC05',
  medium: '#34A853',
  low: '#4285F4',
};

const DEFAULT_CENTER: [number, number] = [20.5937, 78.9629]; // India center

const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false, loading: () => null }
);

interface ComplaintMapProps {
  grievances: Grievance[];
  className?: string;
}

export default function ComplaintMap({ grievances, className }: ComplaintMapProps) {
  const [tileLayer, setTileLayer] = useState<React.ElementType | null>(null);
  const [circleMarker, setCircleMarker] = useState<React.ElementType | null>(null);
  const [popup, setPopup] = useState<React.ElementType | null>(null);

  useEffect(() => {
    let active = true;
    import('react-leaflet').then((m) => {
      if (!active) return;
      setTileLayer(() => m.TileLayer);
      setCircleMarker(() => m.CircleMarker);
      setPopup(() => m.Popup);
    });
    return () => {
      active = false;
    };
  }, []);

  const Tile = tileLayer;
  const Marker = circleMarker;
  const PopupBox = popup;

  return (
    <div className={className}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom
      >
        {Tile && (
          <Tile
            url={TILE_URL}
            attribution={TILE_ATTR}
          />
        )}
        {Marker &&
          PopupBox &&
          grievances.map((g) => (
            <Marker
              key={g.id}
              center={[g.lat, g.lng]}
              radius={8}
              pathOptions={{
                color: PRIORITY_COLORS[g.priority],
                fillColor: PRIORITY_COLORS[g.priority],
                fillOpacity: 0.8,
                weight: 1.5,
              }}
            >
              <PopupBox>
                <div
                  style={{
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 10,
                    padding: '10px 14px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 13,
                  }}
                  className="min-w-[180px] space-y-1"
                >
                  <div className="font-semibold">{g.title}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>{g.category}</div>
                  <div>
                    Score: <span className="font-mono font-medium">{formatScore(g.score)}</span>
                  </div>
                  <div className="capitalize">
                    Priority: <span className="font-medium">{g.priority}</span>
                  </div>
                </div>
              </PopupBox>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}

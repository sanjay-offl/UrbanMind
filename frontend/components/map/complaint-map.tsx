'use client';

import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { Grievance, Priority } from '@/types/grievance';
import { formatScore } from '@/lib/format';

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: '#dc2626',
  high: '#f97316',
  medium: '#eab308',
  low: '#16a34a',
};

const DEFAULT_CENTER: [number, number] = [17.385, 78.4867];

interface ComplaintMapProps {
  grievances: Grievance[];
  className?: string;
}

export default function ComplaintMap({ grievances, className }: ComplaintMapProps) {
  return (
    <div className={className}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {grievances.map((g) => (
          <CircleMarker
            key={g.id}
            center={[g.lat, g.lng]}
            radius={8}
            pathOptions={{
              color: PRIORITY_COLORS[g.priority],
              fillColor: PRIORITY_COLORS[g.priority],
              fillOpacity: 0.6,
              weight: 1.5,
            }}
          >
            <Popup>
              <div className="min-w-[180px] space-y-1 text-sm">
                <div className="font-semibold">{g.title}</div>
                <div className="text-muted-foreground">{g.category}</div>
                <div>
                  Score: <span className="font-medium">{formatScore(g.score)}</span>
                </div>
                <div className="capitalize">
                  Priority:{' '}
                  <span className="font-medium">{g.priority}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}

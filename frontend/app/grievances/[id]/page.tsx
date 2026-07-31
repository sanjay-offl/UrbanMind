'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MapPin, Tag, Building2, Smile } from 'lucide-react';
import { getGrievance, updateGrievance } from '@/lib/api';
import { formatDate, formatScore } from '@/lib/format';
import { STATUS_OPTIONS } from '@/lib/constants';
import type { Grievance, Status } from '@/types/grievance';
import PriorityBadge from '@/components/grievances/priority-badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

export default function GrievanceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [grievance, setGrievance] = useState<Grievance | null>(null);
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    getGrievance(id).then((g) => {
      setGrievance(g);
      setStatus(g.status);
    });
  }, [id]);

  const handleStatusChange = async (value: string) => {
    const next = value as Status;
    setStatus(next);
    try {
      const updated = await updateGrievance(id, { status: next });
      setGrievance(updated);
      toast.success('Status updated');
    } catch {
      setStatus(grievance?.status ?? null);
      toast.error('Failed to update status');
    }
  };

  if (!grievance) {
    return <p className="py-12 text-center text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <PriorityBadge priority={grievance.priority} />
            <span className="text-sm text-muted-foreground">
              Grievance #{grievance.id}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{grievance.title}</h1>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-primary">{formatScore(grievance.score)}</div>
          <div className="text-xs text-muted-foreground">urgency score</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-muted-foreground" />
                {grievance.category}
                {grievance.subcategory ? ` · ${grievance.subcategory}` : ''}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                {grievance.ward_name} (Ward {grievance.ward_id})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {grievance.lat.toFixed(5)}, {grievance.lng.toFixed(5)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Smile className="h-4 w-4 text-muted-foreground" />
                Sentiment: {grievance.sentiment}
              </span>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{grievance.description}</p>
          <div className="flex flex-wrap items-center gap-4 pt-2 text-sm text-muted-foreground">
            <span>
              Created: <span className="text-foreground">{formatDate(grievance.created_at)}</span>
            </span>
            <span>
              Updated: <span className="text-foreground">{formatDate(grievance.updated_at)}</span>
            </span>
            <span>Source: {grievance.source}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={status ?? grievance.status} onValueChange={handleStatusChange}>
            <SelectValue>{status ?? grievance.status}</SelectValue>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}

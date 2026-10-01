'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Tag, Building2, Calendar, ArrowLeft, CheckCircle2, ShieldCheck } from 'lucide-react';
import { getGrievance, updateGrievance } from '@/lib/api';
import { formatDate, formatScore } from '@/lib/format';
import type { GrievanceRecord, CanonicalStatus } from '@/types/grievance';
import PriorityBadge from '@/components/grievances/priority-badge';
import { toast } from '@/components/ui/toast';
import { useI18n } from '@/lib/i18n-context';

const STATUSES: CanonicalStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function GrievanceDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { locale, t } = useI18n();
  const [grievance, setGrievance] = useState<GrievanceRecord | null>(null);
  const [status, setStatus] = useState<CanonicalStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getGrievance(id)
      .then((g) => {
        setGrievance(g);
        setStatus(g.status);
      })
      .catch(() => toast.error('Failed to load grievance details'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (value: string) => {
    const next = value as CanonicalStatus;
    setStatus(next);
    try {
      const updated = await updateGrievance(id, { status: next });
      setGrievance(updated);
      toast.success('Grievance status updated');
    } catch {
      setStatus(grievance?.status ?? null);
      toast.error('Failed to update status');
    }
  };

  if (loading || !grievance) {
    return (
      <div className="py-24 text-center text-xs text-[#5F6368]">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1A73E8] border-t-transparent" />
          <span>{t('loading')}</span>
        </div>
      </div>
    );
  }

  const displayId = grievance.displayId || `GRV-${grievance.id.toString().padStart(6, '0')}`;
  const score = grievance.priorityScore ?? (grievance as any).priority_score ?? (grievance as any).score;
  const ward = grievance.ward || (grievance as any).ward_name || 'Not available';
  const lat = grievance.latitude ?? (grievance as any).lat;
  const lng = grievance.longitude ?? (grievance as any).lng;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex items-center justify-between">
        <Link
          href="/grievances"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1A73E8] hover:underline"
        >
          <ArrowLeft size={14} /> Back to Grievance Registry
        </Link>
        <span className="rounded bg-[#F8FAFC] px-2.5 py-1 text-xs font-semibold text-[#5F6368] border border-[#E8EAED]">
          {grievance.dataSource}
        </span>
      </div>

      {/* Header Summary */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-sm font-bold text-[#1A73E8]">
              {displayId}
            </span>
            <PriorityBadge priority={grievance.priorityLevel} />
          </div>
          <h1 className="text-xl font-bold text-[#202124]">
            {grievance.category} — {ward}, {grievance.district}
          </h1>
          <p className="text-xs text-[#5F6368]">
            Reported in {grievance.language} ({grievance.languageCode}) · Logged {formatDate(grievance.timestamp, locale)}
          </p>
        </div>

        <div className="text-right">
          <div className="font-mono text-3xl font-bold text-[#1A73E8]">
            {formatScore(score)}
          </div>
          <div className="text-[11px] font-semibold uppercase text-[#5F6368]">Urgency Score</div>
        </div>
      </div>

      {/* Main Details Panel */}
      <div className="civic-panel space-y-5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
            Citizen Description (Original)
          </h3>
          <p className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm leading-relaxed text-[#202124] border border-[#E8EAED]">
            {grievance.originalText || grievance.description}
          </p>
        </div>

        {grievance.translatedText && grievance.translatedText !== grievance.originalText && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#5F6368]">
              English Normalized Translation
            </h3>
            <p className="mt-2 rounded-lg bg-[#F8FAFC] p-4 text-sm leading-relaxed text-[#202124] border border-[#E8EAED]">
              {grievance.translatedText}
            </p>
          </div>
        )}

        {/* Location & Metadata Badges */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[#E8EAED] pt-4 text-xs text-[#5F6368]">
          <span className="inline-flex items-center gap-1.5">
            <Building2 size={15} className="text-[#4285F4]" />
            <strong className="text-[#202124]">{ward}</strong> ({grievance.district}, {grievance.state})
          </span>
          {typeof lat === 'number' && typeof lng === 'number' && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={15} className="text-[#34A853]" />
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-[#FBBC05]" />
            Severity: {grievance.severity}/10 · Urgency: {grievance.urgency}/5
          </span>
        </div>
      </div>

      {/* Deterministic Scoring Engine & Action Breakdown */}
      <div className="civic-panel space-y-4">
        <h3 className="text-base font-semibold text-[#202124]">
          Deterministic Priority Calculation
        </h3>
        <p className="text-xs text-[#5F6368]">
          Score is computed mathematically from severity (24%), infrastructure gap (20%), population (16%), urgency (16%), frequency (12%), concentration (7%), and recency (5%).
        </p>

        {grievance.aiReasoning && (
          <div className="rounded-lg bg-[#F8FAFC] p-3.5 text-xs leading-relaxed text-[#202124] border border-[#E8EAED]">
            <strong className="text-[#1A73E8]">Derived Impact Assessment: </strong>
            {grievance.aiReasoning}
          </div>
        )}

        {grievance.recommendedAction && (
          <div className="text-xs text-[#5F6368]">
            <strong className="text-[#202124]">Recommended Department Action: </strong>
            {grievance.recommendedAction}
          </div>
        )}
      </div>

      {/* Administrative Status Selector */}
      <div className="civic-panel flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-[#202124]">Jurisdiction Status</h3>
          <p className="text-xs text-[#5F6368]">Update the resolution lifecycle stage</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={status ?? grievance.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="h-9 rounded-lg border border-[#DADCE0] bg-white px-3 text-xs font-semibold text-[#202124]"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <span className="inline-flex items-center gap-1 text-xs text-[#137333]">
            <CheckCircle2 size={14} /> Synced
          </span>
        </div>
      </div>
    </div>
  );
}

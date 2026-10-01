'use client';

import { useState } from 'react';
import { FileText, Plus, Calendar, Sparkles } from 'lucide-react';
import PageHeader from '@/components/layout/page-header';
import ReportList from '@/components/reports/report-list';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';
import { toast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const REPORT_TYPES = [
  { id: 'national_summary', label: 'National Grievance Summary' },
  { id: 'state_brief', label: 'State Administrative Brief' },
  { id: 'district_annexure', label: 'District Infrastructure Annexure' },
  { id: 'priority_dossier', label: 'Priority Investment Shortlist' },
  { id: 'language_coverage', label: 'Multilingual Linguistic Breakdown' },
];

export default function ReportsPage() {
  const { selectedState, selectedDistrict, selectedCity, selectedWard, geoBreadcrumb } = useGeography();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('national_summary');
  const [dateRange, setDateRange] = useState('180');
  const [includeAiSummary, setIncludeAiSummary] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const scopeLabel = geoBreadcrumb.map((b) => b.name).join(' / ');

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/reports', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          type,
          level: selectedWard !== 'all' ? 'ward' : selectedDistrict !== 'all' ? 'district' : selectedState !== 'all' ? 'state' : 'india',
          state: selectedState !== 'all' ? selectedState : undefined,
          district: selectedDistrict !== 'all' ? selectedDistrict : undefined,
          city: selectedCity !== 'all' ? selectedCity : undefined,
          ward: selectedWard !== 'all' ? selectedWard : undefined,
          date_range_days: Number(dateRange),
          include_ai_summary: includeAiSummary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate report');

      toast.success('Report successfully compiled and ready for download');
      setOpen(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader
          title={t('reports')}
          description={`Downloadable PDF briefs with deterministic aggregations for ${scopeLabel}`}
        />

        <button
          type="button"
          onClick={() => setOpen(true)}
          className="btn-primary"
        >
          <Plus size={15} />
          <span>{t('generateReport')}</span>
        </button>
      </div>

      {/* Reports List */}
      <ReportList key={refreshKey} onOpenGenerate={() => setOpen(true)} />

      {/* Small Generate Form Modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-[#202124]">
              <FileText size={18} className="text-[#1A73E8]" />
              <span>{t('generateReport')}</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Scope Notice */}
            <div className="rounded-lg bg-[#F8FAFC] p-3 border border-[#E8EAED]">
              <span className="font-semibold uppercase tracking-wider text-[#5F6368] block">
                Target Jurisdiction
              </span>
              <p className="mt-1 font-medium text-[#202124]">{scopeLabel}</p>
            </div>

            {/* Report Type */}
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-[#5F6368]">
                Report Template
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-xs"
              >
                {REPORT_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="space-y-1.5">
              <label className="font-semibold uppercase tracking-wider text-[#5F6368]">
                Date Range
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full text-xs"
              >
                <option value="30">Last 30 Days (Live Pulse)</option>
                <option value="90">Last 90 Days (Quarterly Assessment)</option>
                <option value="180">Last 180 Days (Baseline Window)</option>
                <option value="365">Full Year Corpus</option>
              </select>
            </div>

            {/* Include AI Summary Toggle */}
            <label className="flex items-center gap-2 cursor-pointer pt-1 text-[#202124]">
              <input
                type="checkbox"
                checked={includeAiSummary}
                onChange={(e) => setIncludeAiSummary(e.target.checked)}
                className="h-4 w-4 rounded border-[#DADCE0] text-[#1A73E8]"
              />
              <span className="flex items-center gap-1 font-medium">
                <Sparkles size={13} className="text-[#4285F4]" />
                Include Gemini AI executive policy synthesis
              </span>
            </label>
          </div>

          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              className="btn-primary"
            >
              {generating ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating PDF…
                </>
              ) : (
                'Generate'
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

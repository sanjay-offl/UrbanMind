'use client';

import { useEffect, useState } from 'react';
import { Download, FileText, Plus, RefreshCw, CheckCircle2 } from 'lucide-react';
import { formatDate } from '@/lib/format';
import { useGeography } from '@/lib/ward-context';
import { useI18n } from '@/lib/i18n-context';

export interface ReportItem {
  id: string | number;
  type: string;
  title?: string;
  scope?: string;
  dataSource?: string;
  created_at: string;
  status: 'Ready' | 'Generating' | 'Failed' | 'ready';
  size_label?: string;
}

export default function ReportList({ onOpenGenerate }: { onOpenGenerate?: () => void }) {
  const { geoBreadcrumb } = useGeography();
  const { locale, t } = useI18n();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('urbanmind-token') : null;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('/api/reports?all=1', { headers })
      .then((res) => res.json())
      .then((res) => {
        if (res.ok && res.data && Array.isArray(res.data.generated)) {
          setReports(
            res.data.generated.map((r: any) => ({
              id: r.id,
              type: r.type || 'national_summary',
              title: r.title,
              scope: r.scope || 'National (India)',
              dataSource: 'Public data',
              created_at: r.generated_at || new Date().toISOString(),
              status: 'Ready',
              size_label: r.size_label || '24 KB',
            }))
          );
        } else if (Array.isArray(res)) {
          setReports(res);
        } else {
          setReports([]);
        }
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const getDownloadUrl = (item: ReportItem) => {
    return `/api/reports/download?type=${encodeURIComponent(item.type)}`;
  };

  if (loading) {
    return (
      <div className="civic-panel py-8 text-center text-xs text-[#5F6368]">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1A73E8] border-t-transparent" />
          <span>Loading generated reports…</span>
        </div>
      </div>
    );
  }

  // Compact Empty State: No table header, no large blank area, with Generate button
  if (reports.length === 0) {
    return (
      <div className="civic-panel flex flex-col items-center justify-center p-8 text-center">
        <FileText size={28} className="text-[#9AA0A6]" />
        <p className="mt-2 text-sm font-semibold text-[#202124]">No reports yet</p>
        <p className="mt-1 text-xs text-[#5F6368]">
          Generate your first official civic dossier for this jurisdiction.
        </p>
        {onOpenGenerate && (
          <button
            type="button"
            onClick={onOpenGenerate}
            className="btn-primary mt-4"
          >
            <Plus size={14} />
            <span>Generate Report</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="civic-panel overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="border-b border-[#E8EAED] bg-[#F8FAFC]">
            <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6368]">
              <th className="px-4 py-3">Report Document</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Scope</th>
              <th className="px-4 py-3">Data Source</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right">Download</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8EAED]">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-[#F8FAFC] transition-colors">
                <td className="px-4 py-3 font-medium text-[#202124]">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-[#1A73E8] shrink-0" />
                    <span>{report.title || `UrbanMind Civic Report #${report.id}`}</span>
                  </div>
                </td>

                <td className="px-4 py-3 text-[#5F6368] capitalize">
                  {report.type.replace(/_/g, ' ')}
                </td>

                <td className="px-4 py-3 text-[#202124]">
                  {report.scope || 'National (India)'}
                </td>

                <td className="px-4 py-3">
                  <span className="rounded bg-[#E6F4EA] px-2 py-0.5 text-[11px] font-semibold text-[#137333] border border-[#CEEAD6]">
                    {report.dataSource || 'Public data'}
                  </span>
                </td>

                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center gap-1 rounded bg-[#E8F0FE] px-2 py-0.5 text-[11px] font-semibold text-[#1967D2]">
                    <CheckCircle2 size={11} /> Ready
                  </span>
                </td>

                <td className="px-4 py-3 text-[#5F6368]">
                  {formatDate(report.created_at, locale)}
                </td>

                <td className="px-4 py-3 text-right">
                  <a
                    href={getDownloadUrl(report)}
                    download
                    className="btn-secondary py-1 px-2.5 text-xs inline-flex"
                  >
                    <Download size={13} />
                    <span>Download PDF</span>
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

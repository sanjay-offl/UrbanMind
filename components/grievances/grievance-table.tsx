'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GrievanceRecord } from '@/types/grievance';
import { formatDate, formatScore } from '@/lib/format';
import PriorityBadge from '@/components/grievances/priority-badge';
import { useI18n } from '@/lib/i18n-context';
import { ChevronLeft, ChevronRight, X, ExternalLink } from 'lucide-react';

interface GrievanceTableProps {
  grievances: GrievanceRecord[];
  loading?: boolean;
  page?: number;
  total?: number;
  perPage?: number;
  onPageChange?: (page: number) => void;
  onPerPageChange?: (perPage: number) => void;
}

export default function GrievanceTable({
  grievances,
  loading,
  page = 1,
  total = grievances.length,
  perPage = 25,
  onPageChange,
  onPerPageChange,
}: GrievanceTableProps) {
  const { locale, t } = useI18n();
  const [selectedItem, setSelectedItem] = useState<GrievanceRecord | null>(null);

  // Client-side fallback pagination if not externally paginated
  const [localPage, setLocalPage] = useState(1);
  const [localPerPage, setLocalPerPage] = useState(25);

  const isExternallyPaginated = typeof onPageChange === 'function';
  const currentPage = isExternallyPaginated ? page : localPage;
  const currentPerPage = isExternallyPaginated ? perPage : localPerPage;
  const totalCount = isExternallyPaginated ? total : grievances.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / currentPerPage));

  const displayRows = isExternallyPaginated
    ? grievances
    : grievances.slice((localPage - 1) * localPerPage, localPage * localPerPage);

  const handlePageChange = (next: number) => {
    if (next < 1 || next > totalPages) return;
    if (isExternallyPaginated) {
      onPageChange(next);
    } else {
      setLocalPage(next);
    }
  };

  const handlePerPageChange = (size: number) => {
    if (isExternallyPaginated && onPerPageChange) {
      onPerPageChange(size);
    } else {
      setLocalPerPage(size);
      setLocalPage(1);
    }
  };

  return (
    <>
      <div className="civic-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1360px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-[#E8EAED] bg-[#F8FAFC]">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6368]">
                <th className="px-4 py-3">{t('idHeader') || 'Complaint ID'}</th>
                <th className="px-4 py-3">{t('timestampHeader') || 'Timestamp'}</th>
                <th className="px-4 py-3">{t('stateHeader') || 'State'}</th>
                <th className="px-4 py-3">{t('districtHeader') || 'District'}</th>
                <th className="px-4 py-3">{t('cityHeader') || 'City'}</th>
                <th className="px-4 py-3">{t('wardHeader') || 'Ward'}</th>
                <th className="px-4 py-3">{t('languageHeader') || 'Language'}</th>
                <th className="px-4 py-3">{t('categoryHeader') || 'Category'}</th>
                <th className="min-w-[260px] px-4 py-3">{t('descriptionHeader') || 'Description'}</th>
                <th className="px-3 py-3 text-center">{t('severityHeader') || 'Severity'}</th>
                <th className="px-3 py-3 text-center">{t('urgencyHeader') || 'Urgency'}</th>
                <th className="px-4 py-3 text-right">{t('scoreHeader') || 'Score'}</th>
                <th className="px-4 py-3 text-center">{t('priorityHeader') || 'Priority'}</th>
                <th className="px-4 py-3 text-center">{t('statusHeader') || 'Status'}</th>
                <th className="px-4 py-3 text-center">{t('sourceHeader') || 'Source'}</th>
                <th className="px-4 py-3 text-center">{t('actionHeader') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {loading && (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-[#5F6368]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1A73E8] border-t-transparent" />
                      <span>{t('loading')}</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && displayRows.length === 0 && (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-[#5F6368]">
                    {t('empty')}
                  </td>
                </tr>
              )}
              {!loading &&
                displayRows.map((g) => {
                  const displayId = g.displayId || `GRV-${g.id.toString().padStart(6, '0')}`;
                  const ward = g.ward && g.ward.trim() ? g.ward : 'Not available';
                  const city = g.city && g.city.trim() ? g.city : 'Not available';
                  const description = g.description || g.title || 'No description provided';
                  const isPublic = g.dataSource === 'Public';

                  return (
                    <tr
                      key={g.id}
                      onClick={() => setSelectedItem(g)}
                      className="cursor-pointer transition-colors duration-150 hover:bg-[#F8FAFC]"
                      style={{ height: '48px' }}
                    >
                      {/* ID */}
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-[#1A73E8]">
                        <Link
                          href={`/grievances/${g.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:underline"
                        >
                          {displayId}
                        </Link>
                      </td>

                      {/* Timestamp */}
                      <td className="whitespace-nowrap px-4 py-3 text-[#5F6368]">
                        {formatDate(g.timestamp, locale)}
                      </td>

                      {/* State */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#202124]">
                        {g.state}
                      </td>

                      {/* District */}
                      <td className="whitespace-nowrap px-4 py-3 text-[#202124]">
                        {g.district}
                      </td>

                      {/* City */}
                      <td className="whitespace-nowrap px-4 py-3 text-[#5F6368]">
                        {city}
                      </td>

                      {/* Ward */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#202124]">
                        {ward}
                      </td>

                      {/* Language */}
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-[#5F6368]">
                        {g.language || 'English'}
                      </td>

                      {/* Category */}
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-[#202124]">
                        {g.category}
                      </td>

                      {/* Description (line-clamp-2) */}
                      <td className="max-w-[320px] px-4 py-3">
                        <p className="line-clamp-2 leading-relaxed text-[#202124]">
                          {description}
                        </p>
                      </td>

                      {/* Severity */}
                      <td className="whitespace-nowrap px-3 py-3 text-center font-mono text-xs font-semibold text-[#202124]">
                        {g.severity}/10
                      </td>

                      {/* Urgency */}
                      <td className="whitespace-nowrap px-3 py-3 text-center font-mono text-xs font-semibold text-[#202124]">
                        {g.urgency}/5
                      </td>

                      {/* Score */}
                      <td className="whitespace-nowrap px-4 py-3 text-right font-mono text-xs font-semibold text-[#202124]">
                        {formatScore(g.priorityScore)}
                      </td>

                      {/* Priority Level */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <PriorityBadge priority={g.priorityLevel || 'Not scored'} />
                      </td>

                      {/* Status */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span className="inline-block rounded-md border border-[#E8EAED] bg-[#F8FAFC] px-2 py-0.5 text-xs font-medium text-[#202124]">
                          {g.status}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold ${
                            isPublic
                              ? 'border border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]'
                              : 'border border-[#E8EAED] bg-[#F1F3F4] text-[#5F6368]'
                          }`}
                        >
                          {isPublic ? 'Public data' : 'Synthetic'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="whitespace-nowrap px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedItem(g);
                          }}
                          className="rounded px-2.5 py-1 text-xs font-medium text-[#1A73E8] hover:bg-[#E8F0FE]"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Server / Client Pagination Footer */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#E8EAED] bg-[#F8FAFC] px-4 py-3 text-xs text-[#5F6368]">
          <div className="flex items-center gap-2">
            <span>
              Showing {totalCount === 0 ? 0 : (currentPage - 1) * currentPerPage + 1} to{' '}
              {Math.min(currentPage * currentPerPage, totalCount)} of{' '}
              <strong className="text-[#202124]">{totalCount.toLocaleString('en-IN')}</strong> complaints
            </span>

            <div className="ml-4 flex items-center gap-1.5">
              <span>Per page:</span>
              <select
                value={currentPerPage}
                onChange={(e) => handlePerPageChange(Number(e.target.value))}
                className="h-7 rounded border border-[#DADCE0] bg-white px-2 text-xs font-medium text-[#202124]"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#DADCE0] bg-white text-[#202124] hover:bg-[#F1F3F4] disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="flex h-7 w-7 items-center justify-center rounded border border-[#DADCE0] bg-white text-[#202124] hover:bg-[#F1F3F4] disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Inspection Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="civic-panel relative max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E8EAED] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-[#1A73E8]">
                    {selectedItem.displayId}
                  </span>
                  <PriorityBadge priority={selectedItem.priorityLevel} />
                  <span className="rounded bg-[#F1F3F4] px-2 py-0.5 text-xs text-[#5F6368]">
                    {selectedItem.dataSource}
                  </span>
                </div>
                <h2 className="mt-1 text-lg font-semibold text-[#202124]">
                  {selectedItem.category} — {selectedItem.ward}, {selectedItem.district}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="rounded-lg p-1 text-[#5F6368] hover:bg-[#F1F3F4]"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-4 text-sm">
              {/* Citizen Voice */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] block">
                  Citizen Voice (Original)
                </span>
                <p className="mt-1 rounded-lg border border-[#E8EAED] bg-[#F8FAFC] p-3 text-[#202124] leading-relaxed">
                  {selectedItem.originalText || selectedItem.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#5F6368]">
                  <span>Language: {selectedItem.language} ({selectedItem.languageCode})</span>
                </div>
              </div>

              {/* Translation */}
              {selectedItem.translatedText && selectedItem.translatedText !== selectedItem.originalText && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] block">
                    English Translation
                  </span>
                  <p className="mt-1 rounded-lg border border-[#E8EAED] bg-[#F8FAFC] p-3 text-[#202124] leading-relaxed">
                    {selectedItem.translatedText}
                  </p>
                </div>
              )}

              {/* Deterministic Scoring Engine */}
              <div className="rounded-lg border border-[#E8EAED] p-3.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#5F6368] block">
                  Deterministic Scoring Engine
                </span>
                <div className="mt-2.5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="text-xs text-[#5F6368]">Priority Score</span>
                    <p className="font-mono text-lg font-bold text-[#1A73E8]">
                      {formatScore(selectedItem.priorityScore)}/100
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#5F6368]">Severity</span>
                    <p className="font-mono text-base font-semibold text-[#202124]">
                      {selectedItem.severity}/10
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#5F6368]">Urgency</span>
                    <p className="font-mono text-base font-semibold text-[#202124]">
                      {selectedItem.urgency}/5
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-[#5F6368]">Status</span>
                    <p className="text-sm font-semibold text-[#202124]">
                      {selectedItem.status}
                    </p>
                  </div>
                </div>

                {selectedItem.aiReasoning && (
                  <p className="mt-3 text-xs leading-relaxed text-[#5F6368] border-t border-[#F1F3F4] pt-2.5">
                    <strong className="text-[#202124]">Derived Impact:</strong> {selectedItem.aiReasoning}
                  </p>
                )}
              </div>

              {/* Location Hierarchy */}
              <div className="flex flex-wrap gap-2 text-xs text-[#5F6368]">
                <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">State: {selectedItem.state}</span>
                <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">District: {selectedItem.district}</span>
                <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">City: {selectedItem.city}</span>
                <span className="rounded bg-[#F8FAFC] px-2.5 py-1 border border-[#E8EAED]">Ward: {selectedItem.ward}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-[#E8EAED] pt-4">
              <Link
                href={`/grievances/${selectedItem.id}`}
                className="btn-primary"
              >
                <ExternalLink size={14} /> Open Full Grievance Record
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { GrievanceRecord } from '@/types/grievance';
import { formatDate, formatScore } from '@/lib/format';
import PriorityBadge from '@/components/grievances/priority-badge';
import { useI18n } from '@/lib/i18n-context';

export default function GrievanceTable({
  grievances,
  loading,
}: {
  grievances: GrievanceRecord[];
  loading?: boolean;
}) {
  const { locale, t } = useI18n();
  const [selectedItem, setSelectedItem] = useState<GrievanceRecord | null>(null);

  return (
    <>
      <div className="civic-panel overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px] border-collapse text-left text-[13px]">
            <thead className="sticky top-0 z-10 border-b border-[#E8EAED] bg-[#F8FAFC]">
              <tr className="text-[11px] font-semibold uppercase tracking-wider text-[#5F6368]">
                <th className="px-4 py-3">Complaint ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">State</th>
                <th className="px-4 py-3">District</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">Ward</th>
                <th className="px-4 py-3">Language</th>
                <th className="px-4 py-3">Category</th>
                <th className="min-w-[240px] px-4 py-3">Description</th>
                <th className="px-3 py-3 text-center">Severity</th>
                <th className="px-3 py-3 text-center">Urgency</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-center">Priority</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Source</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EAED]">
              {loading && (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-[#5F6368]">
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#1A73E8] border-t-transparent" />
                      <span>{t('loading') || 'Loading civic intelligence...'}</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && grievances.length === 0 && (
                <tr>
                  <td colSpan={16} className="py-12 text-center text-[#5F6368]">
                    {t('empty') || 'No grievance data available for this scope.'}
                  </td>
                </tr>
              )}
              {!loading &&
                grievances.map((g) => {
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

                      {/* Description */}
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

                      {/* Priority */}
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

                      {/* Action */}
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
              >
                ✕
              </button>
            </div>

            {/* Content Body */}
            <div className="mt-4 space-y-4 text-sm">
              {/* Citizen Voice */}
              <div>
                <span className="field-label block text-[#5F6368]">Citizen Voice (Original)</span>
                <p className="mt-1 rounded-lg border border-[#E8EAED] bg-[#F8FAFC] p-3 text-[#202124]">
                  {selectedItem.originalText || selectedItem.description}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs text-[#5F6368]">
                  <span>Language: {selectedItem.language} ({selectedItem.languageCode})</span>
                </div>
              </div>

              {/* Translation */}
              {selectedItem.translatedText && selectedItem.translatedText !== selectedItem.originalText && (
                <div>
                  <span className="field-label block text-[#5F6368]">English Translation</span>
                  <p className="mt-1 rounded-lg border border-[#E8EAED] bg-[#F8FAFC] p-3 text-[#202124]">
                    {selectedItem.translatedText}
                  </p>
                </div>
              )}

              {/* Priority & Factors */}
              <div className="rounded-lg border border-[#E8EAED] p-3">
                <span className="field-label block text-[#5F6368]">Deterministic Scoring Engine</span>
                <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div>
                    <span className="text-xs text-[#5F6368]">Score</span>
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
                  <p className="mt-3 text-xs leading-relaxed text-[#5F6368]">
                    <strong className="text-[#202124]">Derived Impact:</strong> {selectedItem.aiReasoning}
                  </p>
                )}
              </div>

              {/* Location Hierarchy */}
              <div className="flex flex-wrap gap-2 text-xs text-[#5F6368]">
                <span className="rounded bg-[#F8FAFC] px-2 py-1 border border-[#E8EAED]">State: {selectedItem.state}</span>
                <span className="rounded bg-[#F8FAFC] px-2 py-1 border border-[#E8EAED]">District: {selectedItem.district}</span>
                <span className="rounded bg-[#F8FAFC] px-2 py-1 border border-[#E8EAED]">City: {selectedItem.city}</span>
                <span className="rounded bg-[#F8FAFC] px-2 py-1 border border-[#E8EAED]">Ward: {selectedItem.ward}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 flex justify-end gap-3 border-t border-[#E8EAED] pt-4">
              <Link
                href={`/grievances/${selectedItem.id}`}
                className="btn-primary"
              >
                Open Full Grievance Record
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

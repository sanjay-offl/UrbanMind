'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatScore } from '@/lib/format';
import { getCategoryColor } from '@/components/charts/category-chart';

function getScoreColor(score: number | null | undefined): string {
  if (score === null || score === undefined || Number.isNaN(score)) {
    return 'var(--text-muted, #5F6368)';
  }
  if (score >= 80) return 'var(--critical, #D93025)';
  if (score >= 60) return 'var(--high, #E37400)';
  if (score >= 40) return 'var(--medium, #F9AB00)';
  return 'var(--low, #188038)';
}

export default function GrievanceCard({ grievance }: { grievance: any }) {
  const [showEnglish, setShowEnglish] = useState(false);

  const id = grievance.id;
  const displayId = grievance.displayId || `GRV-${id.toString().padStart(6, '0')}`;
  
  const originalText =
    grievance.description ||
    grievance.text ||
    grievance.title ||
    'Civic infrastructure issue';

  const englishText =
    grievance.translation ||
    grievance.textEnglish ||
    grievance.englishTranslation ||
    originalText;

  const hasTranslation = englishText && originalText && englishText !== originalText;
  const currentTitle = showEnglish ? englishText : originalText;

  const ward = grievance.ward || grievance.ward_name || 'Not available';
  const category = grievance.category || 'Public Infrastructure';
  const score = grievance.priorityScore ?? grievance.priority_score ?? grievance.score ?? 0;
  const numericScore = typeof score === 'number' && !Number.isNaN(score) ? score : 0;
  const scoreColor = getScoreColor(numericScore);

  return (
    <Link
      href={`/grievances/${id}`}
      className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--primary)] hover:shadow-sm"
    >
      {/* Row 1, Col 1: ID + Critical Badge + English Toggle */}
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[13px] font-bold text-[var(--primary)]">
          {displayId}
        </span>
        <span
          style={{ height: '28px' }}
          className="inline-flex items-center rounded-md bg-[var(--critical-soft)] px-2.5 text-xs font-semibold text-[var(--critical)]"
        >
          Critical
        </span>
        {hasTranslation && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowEnglish((prev) => !prev);
            }}
            title="Toggle between original citizen language and English translation"
            className="inline-flex items-center rounded border border-[var(--border)] bg-[var(--bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--primary)] hover:bg-[var(--primary-soft)] transition-colors"
          >
            {showEnglish ? 'Original' : 'English'}
          </button>
        )}
      </div>

      {/* Row 1, Col 2: Score + SCORE Label */}
      <div className="text-right">
        <div
          style={{ color: scoreColor }}
          className="font-mono text-[24px] font-bold leading-none tabular-nums"
        >
          {formatScore(score)}
        </div>
        <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          SCORE
        </div>
      </div>

      {/* Row 2, Full Width (Col-span 2): Title with 2-line clamp and full-text tooltip */}
      <div className="col-span-2">
        <h4
          title={currentTitle}
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
          className="text-[14px] font-medium leading-snug text-[var(--text)]"
        >
          {currentTitle}
        </h4>
      </div>

      {/* Row 3, Full Width (Col-span 2): Meta line [category chip] • [Ward N — Area] */}
      <div className="col-span-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
        <span
          style={{ color: getCategoryColor(category) }}
          className="whitespace-nowrap font-semibold"
        >
          {category}
        </span>
        <span
          style={{ width: '4px', height: '4px' }}
          className="shrink-0 rounded-full bg-[var(--text-muted)] opacity-60 self-center"
          aria-hidden="true"
        />
        <span className="whitespace-nowrap font-medium text-[var(--text-muted)]">
          {ward}
        </span>
      </div>
    </Link>
  );
}

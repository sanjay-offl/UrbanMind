'use client';

import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export interface GrievanceFiltersState {
  search?: string;
  category?: string;
  status?: string;
  priority?: string;
  severity?: string;
  urgency?: string;
  language?: string;
  sort?: string;
}

const CATEGORIES = [
  'Water',
  'Roads',
  'Sanitation',
  'Transport',
  'Electricity',
  'Public Infrastructure',
  'Health',
  'Other',
];

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

const PRIORITIES = ['Critical', 'High', 'Moderate', 'Low'];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
];

export default function GrievanceFilters({
  onFilterChange,
}: {
  onFilterChange: (filters: GrievanceFiltersState) => void;
}) {
  const { t } = useI18n();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [moreOpen, setMoreOpen] = useState(false);
  const [severity, setSeverity] = useState('all');
  const [urgency, setUrgency] = useState('all');
  const [language, setLanguage] = useState('all');
  const [sort, setSort] = useState('priority');

  // Debounced search
  useEffect(() => {
    const handler = setTimeout(() => {
      onFilterChange({
        search: search.trim() || undefined,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        priority: priority !== 'all' ? priority : undefined,
        severity: severity !== 'all' ? severity : undefined,
        urgency: urgency !== 'all' ? urgency : undefined,
        language: language !== 'all' ? language : undefined,
        sort,
      });
    }, 250);
    return () => clearTimeout(handler);
  }, [search, category, status, priority, severity, urgency, language, sort, onFilterChange]);

  const hasExtraFilters = severity !== 'all' || urgency !== 'all' || language !== 'all';

  return (
    <div className="space-y-3">
      {/* Unboxed Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Debounced Search */}
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5F6368]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('searchPlaceholder') || 'Search complaints by keyword, ward, or sector...'}
            className="w-full pl-9 text-xs"
          />
        </div>

        {/* Category Select */}
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-9 rounded-lg border border-[#DADCE0] bg-white px-3 text-xs font-medium text-[#202124]"
        >
          <option value="all">{t('filterCategory')}: All Categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        {/* Status Select */}
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 rounded-lg border border-[#DADCE0] bg-white px-3 text-xs font-medium text-[#202124]"
        >
          <option value="all">{t('filterStatus')}: All Statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Priority Select */}
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="h-9 rounded-lg border border-[#DADCE0] bg-white px-3 text-xs font-medium text-[#202124]"
        >
          <option value="all">{t('filterPriority')}: All Priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        {/* Sort Select */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown size={14} className="text-[#5F6368]" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 rounded-lg border border-[#DADCE0] bg-white px-3 text-xs font-medium text-[#202124]"
          >
            <option value="priority">Sort: Highest Urgency</option>
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="severity">Sort: Highest Severity</option>
          </select>
        </div>

        {/* More Filters Toggle */}
        <button
          type="button"
          onClick={() => setMoreOpen(!moreOpen)}
          className={`flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors ${
            hasExtraFilters || moreOpen
              ? 'border-[#1A73E8] bg-[#E8F0FE] text-[#1967D2]'
              : 'border-[#DADCE0] bg-white text-[#202124] hover:bg-[#F8FAFC]'
          }`}
        >
          <SlidersHorizontal size={13} />
          <span>{t('moreFilters') || 'More filters'}</span>
        </button>
      </div>

      {/* Expanded More Filters Row (Unboxed) */}
      {moreOpen && (
        <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
          {/* Severity */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#5F6368]">Severity:</span>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-8 rounded-md border border-[#DADCE0] bg-white px-2 text-xs"
            >
              <option value="all">Any</option>
              <option value="high">High (8–10)</option>
              <option value="med">Medium (5–7)</option>
              <option value="low">Low (1–4)</option>
            </select>
          </div>

          {/* Urgency */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#5F6368]">Urgency:</span>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value)}
              className="h-8 rounded-md border border-[#DADCE0] bg-white px-2 text-xs"
            >
              <option value="all">Any</option>
              <option value="5">Immediate (5/5)</option>
              <option value="4">Urgent (4/5)</option>
              <option value="3">Normal (3/5)</option>
            </select>
          </div>

          {/* Language */}
          <div className="flex items-center gap-1.5">
            <span className="text-[#5F6368]">Language:</span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="h-8 rounded-md border border-[#DADCE0] bg-white px-2 text-xs"
            >
              <option value="all">All Languages</option>
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {hasExtraFilters && (
            <button
              type="button"
              onClick={() => {
                setSeverity('all');
                setUrgency('all');
                setLanguage('all');
              }}
              className="text-xs font-semibold text-[#EA4335] hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import { buildPdf, type PdfLine } from '@/lib/pdf';
import {
  categories,
  districtRollups,
  filterRequests,
  hotspots,
  kpis,
  priorityProjects,
  stateRollups,
  trends,
} from '@/lib/analytics';
import { SECTOR_ACTIONS, TIER_THRESHOLDS, datasetMeta, resolveGeo } from '@/lib/civic-data';
import type { GeoFilter } from './analytics';
import { aiProviderInfo } from '@/lib/gemini';

export const runtime = 'nodejs';

export const REPORT_TYPES = [
  'national_summary',
  'state_brief',
  'district_annexure',
  'priority_dossier',
  'language_coverage',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export const REPORT_LABELS: Record<ReportType, string> = {
  national_summary: 'National Grievance Summary',
  state_brief: 'State Administrative Brief',
  district_annexure: 'District Annexure',
  priority_dossier: 'Priority Investment Dossier',
  language_coverage: 'Language Coverage Report',
};

function heading(text: string): PdfLine {
  return { text, size: 15, bold: true, gap: 6, rule: true };
}

function sub(text: string): PdfLine {
  return { text, size: 10, gap: 8 };
}

function row(label: string, value: string): PdfLine {
  return { text: `${label.padEnd(26, ' ')} ${value}`, size: 10, gap: 1 };
}

/**
 * Renders a real, downloadable PDF brief for a geography.
 * Every figure comes from the deterministic aggregation layer.
 */
export function renderReportPdf(
  type: ReportType,
  geo: GeoFilter,
  options: { generatedBy: string; role: string }
): { buffer: Buffer; filename: string; title: string } {
  const rows = filterRequests(geo);
  const k = kpis(rows);
  const geoName = resolveGeo(geo).name;
  const meta = datasetMeta();
  const ai = aiProviderInfo();

  const lines: PdfLine[] = [];
  lines.push({ text: 'URBANMIND', size: 20, bold: true, gap: 0 });
  lines.push({ text: 'Citizen Grievance Intelligence — Government of India', size: 10, gap: 14 });
  lines.push(heading(REPORT_LABELS[type]));
  lines.push(sub(`Scope: ${geoName} · Generated ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC`));
  lines.push(sub(`Prepared for ${options.generatedBy} (${options.role}). Source corpus: ${meta.requests.toLocaleString('en-IN')} requests across ${meta.states} states/UTs and ${meta.districts} districts.`));

  lines.push(heading('1. Headline indicators'));
  lines.push(row('Total citizen requests', k.total_requests.toLocaleString('en-IN')));
  lines.push(row('Open requests', k.open_requests.toLocaleString('en-IN')));
  lines.push(row('Critical priority', k.critical_requests.toLocaleString('en-IN')));
  lines.push(row('High priority', k.high_requests.toLocaleString('en-IN')));
  lines.push(row('Resolved or closed', k.resolved_requests.toLocaleString('en-IN')));
  lines.push(row('Resolution rate', `${Math.round(k.resolution_rate * 100)}%`));
  lines.push(row('Median priority score', `${k.median_priority} / 100`));
  lines.push(row('Population affected', k.population_affected.toLocaleString('en-IN')));
  lines.push({ text: '', gap: 6 });

  lines.push(heading('2. Sector distribution'));
  const cats = categories(rows).slice(0, 10);
  if (cats.length === 0) lines.push(sub('No requests match the current scope.'));
  for (const c of cats) {
    lines.push(
      row(
        c.category,
        `${c.count.toLocaleString('en-IN')} requests · ${Math.round(c.share * 100)}% · avg score ${c.avg_score} · ${c.critical} critical`
      )
    );
  }
  lines.push({ text: '', gap: 6 });

  lines.push(heading('3. Monthly movement (last 180 days)'));
  const t = trends(rows, 180).filter((p) => p.count > 0);
  if (t.length === 0) lines.push(sub('No activity in the window.'));
  for (const p of t.slice(-24)) {
    lines.push(row(p.date, `${p.count} requests · ${p.critical} critical · ${p.resolved} resolved`));
  }
  lines.push({ text: '', gap: 6 });

  if (type === 'national_summary' || type === 'state_brief' || type === 'priority_dossier') {
    lines.push({ text: '', pageBreak: true, gap: 0 });
    lines.push(heading('4. State comparison'));
    const states = stateRollups(rows).slice(0, 15);
    if (states.length === 0) lines.push(sub('No state-level data in scope.'));
    for (const s of states) {
      lines.push(
        row(
          s.name,
          `${s.requests.toLocaleString('en-IN')} requests · avg score ${s.avg_score} · gap index ${s.gap_index} · top sector: ${s.top_sector}`
        )
      );
    }
    lines.push({ text: '', gap: 6 });
  }

  if (type === 'district_annexure' || type === 'priority_dossier' || type === 'national_summary') {
    lines.push(heading('5. District annexure'));
    const districts = districtRollups(rows, 25);
    if (districts.length === 0) lines.push(sub('No district data in scope.'));
    for (const d of districts) {
      lines.push(
        row(
          `${d.name}, ${d.state}`,
          `${d.requests} requests · avg ${d.avg_score} · gap ${d.gap_index} · tap ${Math.round(d.tap * 100)}% · roads ${Math.round(d.road * 100)}%`
        )
      );
    }
    lines.push({ text: '', gap: 6 });
  }

  lines.push({ text: '', pageBreak: true, gap: 0 });
  lines.push(heading('6. Demand hotspots'));
  const hs = hotspots(rows, 12);
  if (hs.length === 0) lines.push(sub('No hotspots above threshold.'));
  for (const h of hs) {
    lines.push(
      row(
        `${h.category} — ${h.district}`,
        `score ${h.hotspot_score} · ${h.count} requests · ${h.critical_count} critical · radius ~${h.radius_km} km`
      )
    );
    lines.push({ text: `    Action: ${SECTOR_ACTIONS[h.sector]}`, size: 9, gap: 3 });
  }
  lines.push({ text: '', gap: 6 });

  lines.push(heading('7. Recommended priorities'));
  const projects = priorityProjects(rows, 12);
  if (projects.length === 0) lines.push(sub('No priority projects derived.'));
  for (const p of projects) {
    lines.push(
      row(
        `${p.project} — ${p.district}`,
        `score ${p.priority_score} (${p.priority}) · ${p.complaint_volume} requests · ~Rs ${p.estimated_cost_crore} Cr · ${p.affected_population.toLocaleString('en-IN')} affected`
      )
    );
    lines.push({ text: `    Action: ${p.recommended_action}`, size: 9, gap: 3 });
  }

  if (type === 'language_coverage') {
    lines.push({ text: '', pageBreak: true, gap: 0 });
    lines.push(heading('8. Language coverage'));
    const counts = new Map<string, number>();
    for (const r of rows) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
    for (const [code, n] of [...counts].sort((a, b) => b[1] - a[1])) {
      lines.push(row(code, `${n.toLocaleString('en-IN')} requests`));
    }
  }

  lines.push({ text: '', gap: 10 });
  lines.push(heading('Methodology'));
  lines.push(
    sub(
      `Severity and urgency are produced by Google AI (Gemini) structured output when GEMINI_API_KEY is configured, and by the labelled UrbanMind rules engine otherwise. The 0–100 priority score is always computed by the deterministic engine from seven weighted factors: severity 0.24, infrastructure gap 0.20, urgency 0.16, affected population 0.16, complaint frequency 0.12, geographic concentration 0.07 and recency 0.05. Tier cut-points are set at the corpus percentile boundaries: critical >= ${TIER_THRESHOLDS.critical}, high >= ${TIER_THRESHOLDS.high}, medium >= ${TIER_THRESHOLDS.medium}.`
    )
  );
  lines.push(
    sub(
      `Analysis provider in this run: ${ai.provider === 'google' ? `Google AI (${ai.model})` : 'deterministic rules engine (no GEMINI_API_KEY configured)'}. Population and infrastructure context derives from Census 2011, JJM, PMGSY, Swachh Bharat, NITI Aayog and state budget extracts.`
    )
  );
  lines.push({ text: '', gap: 4 });
  lines.push(sub(`Dataset anchor date ${meta.day_anchor_iso} · build seed ${meta.seed} · generator "${meta.generated_by}".`));

  const slug = `${type}-${geoName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return {
    buffer: buildPdf(lines, {
      title: `${REPORT_LABELS[type]} — ${geoName}`,
      author: `UrbanMind (generated for ${options.generatedBy})`,
      subject: REPORT_LABELS[type],
      footer: `UrbanMind · ${geoName} · ${new Date().getUTCFullYear()}`,
    }),
    filename: `urbanmind-${slug}.pdf`,
    title: REPORT_LABELS[type],
  };
}

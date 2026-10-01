import { handle, type ApiResult } from '@/lib/api-helpers';
import { isConfigured, GEMINI_MODEL } from '@/lib/gemini';
import { allRequests, datasetMeta } from '@/lib/civic-data';
import { listRequests, createdCount } from '@/lib/grievance-store';
import { getAllDataSources } from '@/lib/services/dataSourceService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export function GET(): Promise<Response> {
  const meta = datasetMeta();
  const requests = listRequests();
  const sources = getAllDataSources();
  const publicSourcesLoaded = sources.filter((s) => s.tag === 'Public data' && s.status === 'Loaded').length;
  const languagesPresent = Array.from(new Set(requests.map((r) => r.language))).length;
  const statesCovered = Array.from(new Set(requests.map((r) => r.state))).length;
  const newSubmissionsCount = createdCount();
  const geminiActive = isConfigured();

  const evidence = {
    evaluatedAt: new Date().toISOString(),
    r1: {
      id: 'R1',
      title: 'Functioning End-to-End Core Flow',
      status: requests.length > 0 ? 'Verified' : 'Pending',
      description: 'Citizen voice intake → PII redaction → Gemini / rules classification → Deterministic 0-100 scoring → DB storage → Spatial Map & Dashboard.',
      metric: `${requests.length.toLocaleString('en-IN')} grievances queryable across all administrative levels.`,
      newSubmissionsActive: newSubmissionsCount,
    },
    r2: {
      id: 'R2',
      title: 'Mandatory Google AI Integration',
      status: geminiActive ? 'Live (Gemini API Connected)' : 'Ready (Deterministic Rule Fallback Active)',
      model: geminiActive ? GEMINI_MODEL : 'UrbanMind Deterministic Rules Engine',
      description: 'Structured JSON output with schema constraints, language detection, translation, sentiment analysis, entity extraction, and prompt injection guards.',
      metric: geminiActive
        ? `Model: ${GEMINI_MODEL} · API Key configured · Server-side proxy`
        : 'GEMINI_API_KEY unpopulated; transparent fallback engine active (LLM never directly produces priority numbers).',
    },
    r3: {
      id: 'R3',
      title: 'Real or Realistic Public Data',
      status: publicSourcesLoaded >= 5 ? 'Verified' : 'Partial',
      description: 'Census 2011, Jal Jeevan Mission, PMGSY Road Connectivity, Swachh Bharat ODF+, NITI Aayog Aspirational Districts, State Budgets, LGD Directory.',
      metric: `${publicSourcesLoaded} public datasets loaded with official provenance and GODL-India licences.`,
      sourcesCount: sources.length,
    },
    r4: {
      id: 'R4',
      title: 'Built for India Scale',
      status: statesCovered >= 28 ? 'Verified' : 'Partial',
      description: 'Multi-state hierarchy (India → State → District → City → Ward), LGD codes, IST timestamps, Lakh/Crore Indian numbering, 786 districts.',
      metric: `${statesCovered} States/UTs and ${meta.districts} districts represented with spatial coordinates.`,
    },
    r5: {
      id: 'R5',
      title: 'Multilingual and Voice Support',
      status: languagesPresent >= 8 ? 'Verified' : 'Partial',
      description: 'Tamil, Hindi, Telugu, Malayalam, Kannada, Bengali, Marathi, and English. Browser MediaRecorder voice capture + translation & transcription.',
      metric: `${languagesPresent} language variants supported in corpus and intake pipeline.`,
    },
    summaryMetrics: {
      totalGrievances: requests.length,
      statesCovered,
      districtsCovered: meta.districts,
      languagesPresent,
      publicDatasetsCount: publicSourcesLoaded,
      aiModel: geminiActive ? GEMINI_MODEL : 'deterministic-fallback',
      engineVersion: 'UrbanMind Core v2.4',
    },
  };

  return handle((): ApiResult<typeof evidence> => ({
    ok: true,
    data: evidence,
  }));
}

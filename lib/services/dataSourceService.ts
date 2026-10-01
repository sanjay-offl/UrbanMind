/**
 * Typed Data Sources Service.
 * Tracks provenance, licence, URL, tag, and status for public datasets,
 * synthetic demo data, derived analytics, and AI models.
 */

export type DataSourceTag =
  | 'Public data'
  | 'Synthetic demo data'
  | 'Derived UrbanMind analytics'
  | 'AI generated interpretation';

export type DataSourceStatus = 'Loaded' | 'Not loaded' | 'Active' | 'Synthetic';

export interface DataSourceItem {
  id: string;
  name: string;
  agency: string;
  tag: DataSourceTag;
  status: DataSourceStatus;
  url: string;
  licence: string;
  retrievalDate: string;
  recordCount: string;
  fieldsUsed: string[];
  description: string;
}

export function getAllDataSources(): DataSourceItem[] {
  return [
    {
      id: 'census-2011',
      name: 'Census of India 2011 — District Population & Demographics',
      agency: 'Office of the Registrar General & Census Commissioner, Ministry of Home Affairs',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://censusindia.gov.in',
      licence: 'Government Open Data Licence - India (GODL-India)',
      retrievalDate: '2024-08-15',
      recordCount: '786 districts across 36 States/UTs',
      fieldsUsed: ['Total Population', 'Rural Population %', 'SC/ST Proportion', 'Literacy Rate', 'Sex Ratio'],
      description: 'Provides foundational population weightings for proportional grievance impact calculations.',
    },
    {
      id: 'jjm-water',
      name: 'Jal Jeevan Mission (JJM) — Household Tap Water Coverage',
      agency: 'Department of Drinking Water & Sanitation, Ministry of Jal Shakti',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://ejalshakti.gov.in/jjmreport/',
      licence: 'Open Government Data (OGD) Platform India',
      retrievalDate: '2024-09-01',
      recordCount: '786 districts',
      fieldsUsed: ['Tap Water Coverage %', 'Reported Pipeline Habitations'],
      description: 'Calibrates the water sector infrastructure gap index. Districts with under 60% coverage receive higher urgency weight.',
    },
    {
      id: 'pmgsy-roads',
      name: 'PMGSY Habitation Road Connectivity Indicators',
      agency: 'National Rural Infrastructure Development Agency (NRIDA), Ministry of Rural Development',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://omms.nic.in',
      licence: 'GODL-India',
      retrievalDate: '2024-09-05',
      recordCount: '786 districts',
      fieldsUsed: ['Habitation Connectivity %', 'Paved Road Density (km/sq km)'],
      description: 'Quantifies road infrastructure deficits for road safety and arterial complaint prioritization.',
    },
    {
      id: 'swachh-bharat',
      name: 'Swachh Bharat Mission — ODF Plus & Sanitation Coverage',
      agency: 'Ministry of Housing and Urban Affairs & Ministry of Jal Shakti',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://swachhbharatmission.ddws.gov.in/',
      licence: 'GODL-India',
      retrievalDate: '2024-09-08',
      recordCount: '786 districts',
      fieldsUsed: ['ODF Plus Verification %', 'Individual Household Latrine (IHHL) Coverage'],
      description: 'Used in sanitation and solid waste gap calculations.',
    },
    {
      id: 'niti-aayog',
      name: 'NITI Aayog Aspirational Districts Programme Composite Score',
      agency: 'NITI Aayog, Government of India',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://aspirationaldistricts.niti.gov.in/',
      licence: 'Official Government Document',
      retrievalDate: '2024-08-20',
      recordCount: '112 designated districts',
      fieldsUsed: ['Aspirational Rank', 'Composite Performance Score'],
      description: 'Increases funding visibility and action urgency for underserved aspirational districts.',
    },
    {
      id: 'state-budgets',
      name: 'State Infrastructure Budget Outlays & Capital Spend',
      agency: 'State Finance Departments & PRS Legislative Research',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://prsindia.org/budgets/states',
      licence: 'Public Government Disclosures',
      retrievalDate: '2024-09-10',
      recordCount: '36 States and Union Territories',
      fieldsUsed: ['Capital Outlay per Capita', 'Infrastructure Need Index', 'Municipal Grants'],
      description: 'Establishes the per-capita infrastructure gap against planned state allocations.',
    },
    {
      id: 'lgd-directory',
      name: 'Local Government Directory (LGD) Administrative Units',
      agency: 'Ministry of Panchayati Raj, Government of India',
      tag: 'Public data',
      status: 'Loaded',
      url: 'https://lgdirectory.gov.in',
      licence: 'GODL-India',
      retrievalDate: '2024-08-30',
      recordCount: '36 States, 786 Districts, 66 Cities, 823 Administrative Units',
      fieldsUsed: ['LGD State Code', 'LGD District Code', 'Official Spatial Centroids'],
      description: 'Standardizes the 5-tier India → State → District → City → Ward administrative hierarchy.',
    },
    {
      id: 'synthetic-voice-corpus',
      name: 'UrbanMind Multilingual Citizen Request Corpus',
      agency: 'UrbanMind Engineering (Deterministic Seed Engine)',
      tag: 'Synthetic demo data',
      status: 'Synthetic',
      url: 'Internal Generator (seed: 20240918)',
      licence: 'MIT / Apache-2.0 (Demo Corpus)',
      retrievalDate: '2026-09-30 (Day anchor: 18262)',
      recordCount: '4,885 requests across 17 Indic languages',
      fieldsUsed: ['Original Citizen Voice', 'Sector', 'Urgency', 'Severity', 'Coordinates', 'Time Day'],
      description: 'Realistic citizen grievances in 8 official Indic languages + transliterated variants. Strictly labeled as synthetic demo data.',
    },
    {
      id: 'derived-scoring-engine',
      name: 'UrbanMind Deterministic Priority Engine & Hotspots',
      agency: 'UrbanMind Transparent Algorithm',
      tag: 'Derived UrbanMind analytics',
      status: 'Active',
      url: 'lib/civic-data.ts: PRIORITY_WEIGHTS',
      licence: 'Proprietary Civic Intelligence Algorithm',
      retrievalDate: 'Continuous live evaluation',
      recordCount: 'Calculated over all active rows',
      fieldsUsed: ['Severity (0.24)', 'Urgency (0.16)', 'Population (0.16)', 'Infra Gap (0.20)', 'Frequency (0.12)', 'Concentration (0.07)', 'Recency (0.05)'],
      description: 'Fully reproducible 0–100 urgency score with transparent mathematical breakdown. LLMs never directly output this score.',
    },
    {
      id: 'gemini-ai-layer',
      name: 'Google AI Gemini 2.0 Flash / Structured Interpretation Layer',
      agency: 'Google DeepMind & Google Cloud',
      tag: 'AI generated interpretation',
      status: 'Active',
      url: 'https://ai.google.dev/',
      licence: 'Google AI Terms of Service',
      retrievalDate: 'On-demand server-side execution',
      recordCount: 'Live requests, assistant queries & voice transcription',
      fieldsUsed: ['schema-constrained JSON extraction', 'sentiment analysis', 'PII validation', 'language detection'],
      description: 'Interprets messy citizen input into structured civic entities with schema constraints and prompt injection guards.',
    },
  ];
}

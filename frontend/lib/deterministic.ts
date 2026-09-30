/**
 * Deterministic civic analysis.
 *
 * Two jobs:
 *
 * 1. `classifyComplaint` — the rules-based counterpart of the Gemini
 *    classification prompt. It produces the *same shape* of output so the UI
 *    can render both identically, and it reports `provider: 'fallback'` so
 *    nothing is ever passed off as a Gemini result.
 *
 * 2. Keyword scoring over the loaded corpus — powers the civic assistant
 *    without any model, and provides grounding context for the model when it
 *    *is* available.
 *
 * The final priority score is never produced here: that is the deterministic
 * engine in `civic-data.ts` (`computePriorityFactors` /
 * `priorityScoreFromFactors`).
 */

import {
  SECTOR_ACTIONS,
  districtByDistrictName,
  districtsOfState,
  languageName,
  redactPII,
  states,
  type Sector,
} from './civic-data';

// ── Sector keyword lexicon ───────────────────────────────────────────────────

interface SectorRule {
  sector: Sector;
  keywords: string[];
  subCategory: string;
}

const SECTOR_RULES: SectorRule[] = [
  {
    sector: 'water',
    subCategory: 'Potable water supply failure',
    keywords: [
      'water', 'tap', 'pipe', 'pipeline', 'borewell', 'tank', 'tanker', 'thanni',
      'pani', 'paani', 'paani', 'neru', 'vellam', 'pani', 'paani', 'dudh', 'jal',
      'नल', 'पानी', 'नागरिक', 'bore', 'ನೀರು', 'ನೀರಿನ', 'தண்ணி', 'நீர்', 'வெள்ளம்',
      'పని', 'తలి', 'પાણી', 'ਪਾਣੀ', 'ପାଣି', 'मराठी', 'जल', 'ನೀರು',
    ],
  },
  {
    sector: 'roads',
    subCategory: 'Road surface damage',
    keywords: [
      'road', 'pothole', 'street', 'bridge', 'culvert', 'highway', 'crack', 'tar',
      'road-la', 'pallam', 'khaddha', 'sadak', 'pothole', 'रास्ता', 'सड़क', 'खड्डा',
      'sari', 'pothole', 'रस्ता', 'खड्डे', 'రాడ్డు', 'గుంత', 'રસ્તો', 'ખાડો', 'ਸੜਕ',
      'ରସ୍ତା', 'ರಸ್ತೆ', 'வீதி', 'சாலை',
    ],
  },
  {
    sector: 'sanitation',
    subCategory: 'Solid waste and drainage',
    keywords: [
      'garbage', 'waste', 'sewage', 'drain', 'drainage', 'sanitation', 'toilet',
      'dump', 'litter', 'kachra', 'kuppai', 'sarc', 'nali', 'gutter', 'garbage',
      'कचरा', 'सीवेज', 'नाली', 'कचरा', 'മാലം', 'ഡ്രെയിൻ', 'పడవ', 'કચરો', 'ડ્રેન',
      'ਕਚਰਾ', 'ଅବର୍ଜନା', 'ಕಸ', 'கழிவு', 'சாக்கடை',
    ],
  },
  {
    sector: 'electricity',
    subCategory: 'Power supply interruption',
    keywords: [
      'electricity', 'power', 'transformer', 'light', 'pole', 'wire', 'outage',
      'current', 'inverter', 'bijli', 'padam', 'transformer', 'maatra', '.padam',
      'বিদ্যুৎ', 'বিজলী', 'বিদ্যুৎ', 'વિદ્યુત', 'ਬਿਜਲੀ', 'ବিদ୍ୟୁତ', 'ವಿದ್ಯುತ್', 'மின்',
    ],
  },
  {
    sector: 'health',
    subCategory: 'Access to public healthcare',
    keywords: [
      'hospital', 'doctor', 'health', 'clinic', 'phc', 'medicine', 'ambulance',
      'injection', 'patient', 'pregnant', 'oxygen', 'prescription', 'aspathri',
      'aasupathri', 'aspathri', 'मरीज', 'अस्पताल', 'डॉक्टर', 'ആസ്പത്രി', 'ഡോക്ടർ',
      'હોસ્પિટલ', 'ડૉક્ટર', 'ਹਸਪਤਲ', 'ହସପିଟାଲ',
    ],
  },
  {
    sector: 'education',
    subCategory: 'School infrastructure',
    keywords: [
      'school', 'teacher', 'college', 'student', 'classroom', 'education',
      'roof', 'building', 'paathashala', 'vidyalaya', 'pathshala', 'विद्यालय',
      'स्कूल', 'શાળા', 'ਸਕੂਲ', 'ସ୍କୂଲ', 'ಶಾಲೆ', 'பள்ளி', 'vidyalay', 'paathashala',
    ],
  },
  {
    sector: 'public_safety',
    subCategory: 'Public safety and lighting',
    keywords: [
      'streetlight', 'police', 'safety', 'dark', 'theft', 'women safety', 'patrol',
      'dheep', 'streetlight', 'விளக்கு', 'போலீஸ்', 'വഴിവെളക്ക്', 'સ્ટ્રીટલાઇટ',
      'ਸਟ੍ਰੀਟਲਾਇਟ', 'ସ୍ଟ୍ରୀଟଲାଇଟ', 'ದೀಪ',
    ],
  },
  {
    sector: 'agriculture',
    subCategory: 'Agricultural irrigation',
    keywords: [
      'crop', 'farm', 'irrigation', 'canal', 'farmers', 'seed', 'harvest',
      'விவசாய', 'பாசனம்', 'खेती', 'सिंचाई', 'పంట', 'विवसाय', 'ખેતી', 'ਖੇਤੀ',
      'କୃଷି', 'ಕೃಷಿ',
    ],
  },
  {
    sector: 'environment',
    subCategory: 'Environmental degradation',
    keywords: [
      'pollution', 'smoke', 'air', 'burning', 'garbage burning', 'noise', 'tree',
      'वायु', 'प्रदूषण', 'വായു', 'ప్రదూషణ', 'પ્રદૂષણ', 'ਹਵਾ', 'ପରିବେଶ',
      'ಪರಿಸರ', 'மாசு',
    ],
  },
  {
    sector: 'transport',
    subCategory: 'Public transport service',
    keywords: [
      'bus', 'bus stop', 'train', 'transport', 'metro', 'auto', 'shelter', 'railway',
      'बस', 'यात्रा', 'ബസ്', 'ബസ്', 'બસ', 'ਬੱਸ', 'ବସ୍', 'ಬಸ್', 'பேருந்து',
    ],
  },
];

const SECTOR_LABELS: Record<Sector, string> = {
  water: 'Water Supply',
  roads: 'Road Infrastructure',
  sanitation: 'Sanitation & Waste',
  electricity: 'Electricity',
  health: 'Health & Medical',
  education: 'Education',
  public_safety: 'Public Safety',
  agriculture: 'Agriculture & Rural Livelihoods',
  environment: 'Environment & Ecology',
  transport: 'Public Transport',
};

/** Words that signal a life-safety emergency, regardless of sector. */
const CRITICAL_SIGNALS = [
  'collapsed', 'collapse', 'accident', 'accidents', 'fatal', 'death', 'died',
  'child', 'children', 'school wall', 'electric shock', 'sparked', 'sparks',
  'snapped', 'drowning', 'flood', 'breached', 'submerged', 'fracture',
  'pregnant', 'oxygen', 'ambulance', 'bleeding', 'gas leak', 'fire',
  'விழுங்கிய', 'மருத்துவ', 'பெரிய', 'బాల', 'పిడిత', 'બાળકો', 'ਬੱਚੇ',
];

const URGENCY_SIGNALS = [
  'days', 'weeks', 'months', 'no water', 'no electricity', 'no doctor',
  'not working', 'overflow', 'overflowing', 'snapped', 'collapsed', 'breached',
  'broke', 'failed', 'sinking', 'danger', 'unsafe', 'repeated', 'continuing',
];

/** Indian language / transliteration hints used when Gemini is unavailable. */
const LANGUAGE_HINTS: { re: RegExp; code: string }[] = [
  { re: /[஀-௿]/, code: 'ta' },
  { re: /[ఀ-౿]/, code: 'te' },
  { re: /[ഀ-ൿ]/, code: 'ml' },
  { re: /[ಀ-೿]/, code: 'kn' },
  { re: /[ঀ-৿]/, code: 'bn' },
  { re: /[਀-੿]/, code: 'pa' },
  { re: /[઀-૿]/, code: 'gu' },
  { re: /[଀-୿]/, code: 'or' },
  { re: /[ঁ-ৱ]/, code: 'as' },
  { re: /[ا-ۿ]/, code: 'ur' },
  { re: /[द-न]/, code: 'hi' },
  { re: /[क-ह]/, code: 'hi' },
  { re: /[ऺ-ॿ]/, code: 'mr' },
  { re: /[a-zA-Z]/, code: 'en' },
];

export function detectLanguage(text: string): { code: string; confidence: number } {
  for (const { re, code } of LANGUAGE_HINTS) {
    const matches = text.match(new RegExp(re.source, 'g'));
    if (matches && matches.length >= 2) {
      const ratio = matches.length / Math.max(text.length, 1);
      return { code, confidence: Math.min(0.99, Math.max(0.6, 0.6 + ratio * 6)) };
    }
  }
  return { code: 'en', confidence: 0.5 };
}

// ── Classification result shape (shared with the Gemini path) ────────────────

export interface Classification {
  category: string;
  subCategory: string;
  sector: Sector;
  language: string;
  language_name: string;
  translation: string;
  severity: number;
  urgency: number;
  sentiment: string;
  affected_group: string;
  location: string;
  state: string | null;
  district: string | null;
  recommended_action: string;
  reasoning: string;
  confidence: number;
  redacted: boolean;
}

export const CLASSIFICATION_SCHEMA: Record<string, unknown> = {
  type: 'object',
  properties: {
    category: {
      type: 'string',
      enum: [
        'Water Supply',
        'Road Infrastructure',
        'Sanitation & Waste',
        'Electricity',
        'Health & Medical',
        'Education',
        'Public Safety',
        'Agriculture & Rural Livelihoods',
        'Environment & Ecology',
        'Public Transport',
      ],
    },
    subCategory: { type: 'string' },
    sector: {
      type: 'string',
      enum: [
        'water',
        'roads',
        'sanitation',
        'electricity',
        'health',
        'education',
        'public_safety',
        'agriculture',
        'environment',
        'transport',
      ],
    },
    language: { type: 'string', description: 'BCP-47 code, e.g. ta, hi, te, ml, kn, bn, mr, en' },
    translation: { type: 'string', description: 'Accurate English translation of the complaint' },
    severity: { type: 'integer', minimum: 1, maximum: 10 },
    urgency: { type: 'integer', minimum: 1, maximum: 5 },
    sentiment: { type: 'string', enum: ['negative', 'neutral', 'positive'] },
    affected_group: { type: 'string' },
    location: { type: 'string', description: 'Place named in the text, or empty string' },
    state: { type: 'string', description: 'Indian state name if identified, else empty string' },
    district: { type: 'string', description: 'Indian district name if identified, else empty string' },
    recommended_action: { type: 'string' },
    reasoning: { type: 'string', description: 'One or two sentences justifying the classification' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
  },
  required: [
    'category',
    'subCategory',
    'sector',
    'language',
    'translation',
    'severity',
    'urgency',
    'sentiment',
    'affected_group',
    'recommended_action',
    'reasoning',
    'confidence',
  ],
};

export const SYSTEM_PROMPT = `You are UrbanMind's civic classification engine for the Government of India.

Given a citizen's complaint in any Indian language, return a structured civic
record. Work entirely from the text — do not invent specifics.

Rules:
- Detect the input language and give a faithful English translation.
- Choose exactly one sector from the fixed enum. Use the closest match when
  ambiguous, and say so in reasoning.
- severity (1-10) is the harm to people if unaddressed: 8-10 means loss of life
  or a life-safety hazard, 5-7 serious degradation of essential service, 3-4
  inconvenience, 1-2 cosmetic.
- urgency (1-5) is how fast it must be acted on given public-health and safety
  exposure right now.
- affected_group names who feels this (e.g. "Daily-wage commuters", "School
  children", "Rural households").
- Only name a state or district if the text or the provided location context
  makes it clear. Otherwise return an empty string.
- recommended_action is one concrete, executable action for a district officer.
- Never echo phone numbers, addresses or any citizen identifier.`;

export function buildClassificationPrompt(input: {
  text: string;
  locationHint?: string | null;
}): string {
  const knownStates = states().map((s) => s.name).join(', ');
  return `Indian states and union territories: ${knownStates}.

Location context provided by the submission channel: ${
    input.locationHint?.trim() || 'none supplied'
  }

Citizen complaint:
"""
${input.text}
"""

Return the structured civic record.`;
}

// ── Deterministic classifier ─────────────────────────────────────────────────

function scoreSectors(text: string): { sector: Sector; score: number; subCategory: string }[] {
  const lower = text.toLowerCase();
  return SECTOR_RULES.map((rule) => {
    let score = 0;
    for (const kw of rule.keywords) {
      if (lower.includes(kw.toLowerCase())) score += 1;
    }
    return { sector: rule.sector, score, subCategory: rule.subCategory };
  }).sort((a, b) => b.score - a.score);
}

export function classifyComplaintDeterministic(input: {
  text: string;
  locationHint?: string | null;
}): Classification {
  const redaction = redactPII(input.text);
  const text = redaction.text;
  const lower = text.toLowerCase();

  const [top, second] = scoreSectors(text);
  const sector: Sector = top.score > 0 ? top.sector : 'public_safety';
  const subCategory = top.score > 0 ? top.subCategory : 'General civic issue';

  const criticalHits = CRITICAL_SIGNALS.filter((s) => lower.includes(s)).length;
  const urgencyHits = URGENCY_SIGNALS.filter((s) => lower.includes(s)).length;

  // Severity: sector risk base, lifted by life-safety signals.
  const sectorBase: Record<Sector, number> = {
    water: 6.5,
    roads: 6.5,
    sanitation: 5.5,
    electricity: 6.5,
    health: 8.5,
    education: 6.5,
    public_safety: 7.5,
    agriculture: 5.5,
    environment: 4.5,
    transport: 5,
  };
  let severity = sectorBase[sector] + criticalHits * 1.1;
  if (sector === 'water' && /\b5 days|5 நாட்கள்|week|weeks|हफ्ते|నాగు|days\b/.test(lower)) {
    severity += 0.8;
  }
  severity = Math.max(1, Math.min(10, Math.round(severity)));

  const urgency = Math.max(1, Math.min(5, Math.round(2.5 + criticalHits * 0.7 + urgencyHits * 0.4)));

  const sentiment = criticalHits >= 2 || urgency >= 4 ? 'negative' : 'neutral';

  const lang = detectLanguage(text);
  const code = lang.code;

  // Location: honour an explicit hint, else look for a known district name.
  let state: string | null = null;
  let district: string | null = null;
  let location = input.locationHint?.trim() ?? '';

  if (location) {
    const d = districtByDistrictName(location);
    if (d) {
      district = d.name;
      state = d.state;
    } else {
      const s = states().find((st) => st.name.toLowerCase() === location.toLowerCase());
      if (s) state = s.name;
    }
  }

  if (!district) {
    // Longest-first match so "Coimbatore" wins over a partial overlap.
    for (const c of districtCandidates()) {
      if (lower.includes(c.name.toLowerCase())) {
        district = c.name;
        state = c.state;
        if (!location) location = c.name;
        break;
      }
    }
  }

  if (!location && state) location = state;

  const affectedGroup: Record<Sector, string> = {
    water: 'Households without an alternative water source',
    roads: 'Daily commuters and freight movement',
    sanitation: 'Residents exposed to untreated waste',
    electricity: 'Households and small businesses',
    health: 'Patients and their caregivers',
    education: 'School children and teaching staff',
    public_safety: 'Residents, especially women and night-shift workers',
    agriculture: 'Farming households dependent on irrigation',
    environment: 'Residents exposed to degraded air quality',
    transport: 'Public transport commuters',
  };

  const totalHits = top.score + second.score;
  const confidence = Math.min(
    0.9,
    Math.max(0.35, 0.45 + totalHits * 0.06 + criticalHits * 0.04)
  );

  const reasoningParts = [
    `Classified as ${SECTOR_LABELS[sector]} on ${
      top.score > 0 ? `${top.score} keyword match${top.score === 1 ? '' : 'es'}` : 'no direct keyword match, so the nearest sector was used'
    }.`,
    criticalHits
      ? `${criticalHits} life-safety or escalation signal${criticalHits === 1 ? '' : 's'} present, lifting severity to ${severity}/10.`
      : 'No life-safety signal, so severity reflects essential-service degradation only.',
    urgency >= 4
      ? `Urgency ${urgency}/5 because the report describes an ongoing, unresolved failure.`
      : `Urgency ${urgency}/5 based on the reported duration of the problem.`,
  ];
  if (district || state) {
    reasoningParts.push(`Location resolved to ${[district, state].filter(Boolean).join(', ')}.`);
  }

  return {
    category: SECTOR_LABELS[sector],
    subCategory,
    sector,
    language: code,
    language_name: languageName(code),
    translation: text,
    severity,
    urgency,
    sentiment,
    affected_group: affectedGroup[sector],
    location,
    state,
    district,
    recommended_action: SECTOR_ACTIONS[sector],
    reasoning: reasoningParts.join(' '),
    confidence,
    redacted: redaction.redacted,
  };
}

let districtCandidatesCache: { name: string; state: string }[] | null = null;

/**
 * Every district name, longest first, so a text match prefers
 * "Chhatrapati Sambhajinagar" over a shorter overlapping token.
 */
function districtCandidates(): { name: string; state: string }[] {
  if (districtCandidatesCache) return districtCandidatesCache;
  const out: { name: string; state: string }[] = [];
  for (const s of states()) {
    for (const d of districtsOfState(s.name)) {
      out.push({ name: d.name, state: s.name });
    }
  }
  out.sort((a, b) => b.name.length - a.name.length);
  districtCandidatesCache = out;
  return out;
}

/**
 * Indian PII Redaction Engine.
 * Strips Aadhaar, PAN cards, Indian mobile numbers (+91, 0, 10-digit), emails,
 * and vehicle registration numbers from citizen grievances before storing or analyzing.
 */

export interface RedactionResult {
  text: string;
  redacted: boolean;
  redactionsCount: number;
  typesFound: string[];
}

export const INDIAN_PII_PATTERNS = [
  // Aadhaar: 12 digits, optional spaces or dashes, e.g. 1234 5678 9012 or 1234-5678-9012 or 123456789012
  {
    type: 'Aadhaar',
    regex: /\b[2-9]\d{3}[ -]?\d{4}[ -]?\d{4}\b/g,
    replacement: '[AADHAAR REDACTED]',
  },
  // Permanent Account Number (PAN): 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F
  {
    type: 'PAN',
    regex: /\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b/gi,
    replacement: '[PAN REDACTED]',
  },
  // Indian Mobile Numbers: +91, 91, 0, or 10-digit starting with 6, 7, 8, 9
  {
    type: 'Phone',
    regex: /(?:\+91[\s.-]?|[0])?[6-9]\d{4}[\s.-]?\d{5}\b/g,
    replacement: '[PHONE REDACTED]',
  },
  // Email Addresses
  {
    type: 'Email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[EMAIL REDACTED]',
  },
  // Indian Vehicle Registration Plates: e.g. TN-01-AB-1234, MH 12 CD 5678, DL 1C A 1234, KA03HA1234
  {
    type: 'Vehicle Plate',
    regex: /\b[A-Z]{2}[ -]?[0-9]{1,2}(?:[ -]?[A-Z]{1,2})*[ -]?[0-9]{4}\b/gi,
    replacement: '[VEHICLE PLATE REDACTED]',
  },
  // Bank Account Numbers: 9 to 18 digits sequence
  {
    type: 'Bank Account',
    regex: /\b\d{9,18}\b/g,
    replacement: '[ACCOUNT REDACTED]',
  },
];

export function redactIndianPII(rawText: string): RedactionResult {
  if (!rawText || typeof rawText !== 'string') {
    return { text: '', redacted: false, redactionsCount: 0, typesFound: [] };
  }

  let text = rawText;
  let redactionsCount = 0;
  const typesFound = new Set<string>();

  for (const { type, regex, replacement } of INDIAN_PII_PATTERNS) {
    regex.lastIndex = 0;
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      redactionsCount += matches.length;
      typesFound.add(type);
      text = text.replace(regex, replacement);
    }
  }

  return {
    text,
    redacted: redactionsCount > 0,
    redactionsCount,
    typesFound: Array.from(typesFound),
  };
}

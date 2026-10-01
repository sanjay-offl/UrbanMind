/**
 * Tests for Multilingual Pipeline.
 * Verifies that all 8 required Indic languages classify into valid civic sectors.
 */

import { MULTILINGUAL_TEST_SET } from '../lib/multilingual-samples';
import { classifyComplaintDeterministic } from '../lib/deterministic';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

export function runMultilingualTests() {
  console.log('Running Multilingual Pipeline Tests (8 Languages, 24 Samples)...');

  const languagesTested = new Set<string>();

  for (const sample of MULTILINGUAL_TEST_SET) {
    languagesTested.add(sample.language);
    const result = classifyComplaintDeterministic({
      text: sample.text,
      locationHint: sample.district,
    });

    assert(Boolean(result.category), `Sample ${sample.id} (${sample.language}) must produce a category`);
    assert(Boolean(result.sector), `Sample ${sample.id} (${sample.language}) must produce a sector`);
    assert(result.severity >= 1 && result.severity <= 10, `Sample ${sample.id} severity in range`);
    assert(result.urgency >= 1 && result.urgency <= 5, `Sample ${sample.id} urgency in range`);
  }

  const expectedLanguages = [
    'English',
    'Tamil',
    'Hindi',
    'Telugu',
    'Malayalam',
    'Kannada',
    'Bengali',
    'Marathi',
  ];

  for (const lang of expectedLanguages) {
    assert(languagesTested.has(lang), `Language ${lang} must be tested`);
  }

  console.log(`✓ All 24 samples across all 8 Indic languages classified successfully.`);
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runMultilingualTests();
}

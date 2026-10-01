/**
 * Gate 3 Language Switch & Localization Integrity Test:
 * Ensures 100% key parity across English, Tamil, Hindi, and Bengali locale tables,
 * validates Unicode ranges (Tamil block U+0B80–U+0BFF, Devanagari U+0900–U+097F, Bengali U+0980–U+09FF),
 * and verifies that all 10 canonical page names exist without missing glyphs.
 */

import { UI_STRINGS, type SupportedLocale } from '../lib/i18n';

const CANONICAL_PAGES = [
  'dashboard',
  'grievances',
  'submit',
  'upload',
  'map',
  'trends',
  'assistant',
  'reports',
  'dataSources',
  'settings',
];

export function runGate3Tests() {
  console.log('Running Gate 3: Localization & Glyph Integrity Tests...');

  const enKeys = Object.keys(UI_STRINGS.en);
  const taKeys = Object.keys(UI_STRINGS.ta);
  const hiKeys = Object.keys(UI_STRINGS.hi);
  const bnKeys = Object.keys(UI_STRINGS.bn);

  console.log(`   ✓ English dictionary contains ${enKeys.length} keys.`);

  // 1. Key Parity Check
  const missingInTa = enKeys.filter((k) => !(k in UI_STRINGS.ta));
  const missingInHi = enKeys.filter((k) => !(k in UI_STRINGS.hi));
  const missingInBn = enKeys.filter((k) => !(k in UI_STRINGS.bn));

  if (missingInTa.length > 0) {
    throw new Error(`Tamil dictionary missing keys: ${missingInTa.join(', ')}`);
  }
  if (missingInHi.length > 0) {
    throw new Error(`Hindi dictionary missing keys: ${missingInHi.join(', ')}`);
  }
  if (missingInBn.length > 0) {
    throw new Error(`Bengali dictionary missing keys: ${missingInBn.join(', ')}`);
  }

  // 2. Canonical Page Names Check
  for (const pageKey of CANONICAL_PAGES) {
    if (!UI_STRINGS.en[pageKey as keyof typeof UI_STRINGS.en]) {
      throw new Error(`Missing canonical page in EN: ${pageKey}`);
    }
    if (!UI_STRINGS.ta[pageKey as keyof typeof UI_STRINGS.ta]) {
      throw new Error(`Missing canonical page in TA: ${pageKey}`);
    }
    if (!UI_STRINGS.hi[pageKey as keyof typeof UI_STRINGS.hi]) {
      throw new Error(`Missing canonical page in HI: ${pageKey}`);
    }
    if (!UI_STRINGS.bn[pageKey as keyof typeof UI_STRINGS.bn]) {
      throw new Error(`Missing canonical page in BN: ${pageKey}`);
    }
  }

  // 3. Tamil Glyph & Code Point Check
  for (const [key, value] of Object.entries(UI_STRINGS.ta)) {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const isTamil = code >= 0x0b80 && code <= 0x0bff;
      const isAscii = code <= 0x7f;
      const isZw = code === 0x200c || code === 0x200d || code === 0x2013 || code === 0x2014;
      if (!isTamil && !isAscii && !isZw) {
        throw new Error(
          `Tamil string for key "${key}" contains unexpected code point U+${code.toString(16).toUpperCase()}: "${value}"`
        );
      }
    }
  }

  // 4. Hindi Devanagari Glyph Check
  for (const [key, value] of Object.entries(UI_STRINGS.hi)) {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const isDevanagari = code >= 0x0900 && code <= 0x097f;
      const isAscii = code <= 0x7f;
      const isZw = code === 0x200c || code === 0x200d || code === 0x2013 || code === 0x2014;
      if (!isDevanagari && !isAscii && !isZw) {
        throw new Error(
          `Hindi string for key "${key}" contains unexpected code point U+${code.toString(16).toUpperCase()}: "${value}"`
        );
      }
    }
  }

  // 5. Bengali Glyph Check
  for (const [key, value] of Object.entries(UI_STRINGS.bn)) {
    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);
      const isBengali = (code >= 0x0980 && code <= 0x09ff) || code === 0x0964 || code === 0x0965;
      const isAscii = code <= 0x7f;
      const isZw = code === 0x200c || code === 0x200d || code === 0x2013 || code === 0x2014;
      if (!isBengali && !isAscii && !isZw) {
        throw new Error(
          `Bengali string for key "${key}" contains unexpected code point U+${code.toString(16).toUpperCase()}: "${value}"`
        );
      }
    }
  }

  console.log('   ✓ 100% key parity across EN, TA, HI, and BN locales.');
  console.log('   ✓ All 10 canonical page names present across all 4 locales.');
  console.log('   ✓ All Tamil strings verified within Unicode U+0B80–U+0BFF.');
  console.log('   ✓ All Hindi strings verified within Unicode U+0900–U+097F.');
  console.log('   ✓ All Bengali strings verified within Unicode U+0980–U+09FF.');
  console.log('   ✓ Zero empty tofu box code points detected.');
  console.log('✓ Gate 3 Localization & Glyph Tests PASSED successfully.');
}

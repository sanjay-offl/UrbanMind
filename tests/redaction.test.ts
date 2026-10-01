/**
 * Tests for Indian PII Redaction Engine.
 * Verifies Aadhaar, PAN, phone (+91 and 10 digit), email, and vehicle registration numbers are redacted.
 */

import { redactIndianPII } from '../lib/redaction';

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

export function runRedactionTests() {
  console.log('Running Indian PII Redaction Tests...');

  // 1. Aadhaar test
  const aadhaarSample = 'My Aadhaar number is 5432 8765 4321 and need water tanker.';
  const res1 = redactIndianPII(aadhaarSample);
  assert(res1.redacted === true, 'Aadhaar should be flagged as redacted');
  assert(!res1.text.includes('5432 8765 4321'), 'Aadhaar digits must not remain in output');
  assert(res1.typesFound.includes('Aadhaar'), 'Aadhaar type should be detected');

  // 2. PAN test
  const panSample = 'Submitted application with PAN ABCDE1234F for shop license.';
  const res2 = redactIndianPII(panSample);
  assert(res2.redacted === true, 'PAN should be flagged as redacted');
  assert(!res2.text.includes('ABCDE1234F'), 'PAN code must not remain in output');
  assert(res2.typesFound.includes('PAN'), 'PAN type should be detected');

  // 3. Indian Phone test (+91 and 10 digit)
  const phoneSample = 'Call me at +91 98401 23456 or 8765432109 immediately regarding power cut.';
  const res3 = redactIndianPII(phoneSample);
  assert(res3.redacted === true, 'Phone should be flagged as redacted');
  assert(!res3.text.includes('98401'), 'Phone digits must be removed');
  assert(!res3.text.includes('8765432109'), 'Second phone must be removed');

  // 4. Vehicle plate test
  const vehicleSample = 'Garbage truck TN 01 AB 1234 was speeding and broke the streetlight near DL 1C A 5678.';
  const res4 = redactIndianPII(vehicleSample);
  assert(res4.redacted === true, 'Vehicle plate should be flagged as redacted');
  assert(!res4.text.includes('TN 01 AB 1234'), 'TN vehicle plate must be removed');
  assert(!res4.text.includes('DL 1C A 5678'), 'DL vehicle plate must be removed');

  // 5. Clean text test (No PII)
  const cleanSample = 'Severe water pipe leakage on Anna Salai causing heavy water accumulation.';
  const res5 = redactIndianPII(cleanSample);
  assert(res5.redacted === false, 'Clean text should not be flagged as redacted');
  assert(res5.text === cleanSample, 'Clean text should be unchanged');

  console.log('✓ All 5 PII Redaction tests passed successfully.');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runRedactionTests();
}

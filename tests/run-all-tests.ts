/**
 * Master test suite runner for UrbanMind.
 * Executes Priority Engine, PII Redaction, Prompt Injection, Multilingual Pipeline,
 * and Gate 1 (Purge), Gate 2 (Contract & Data), Gate 3 (i18n & Glyphs) test suites.
 */

import { runPriorityEngineTests } from './priority-engine.test';
import { runRedactionTests } from './redaction.test';
import { runInjectionTests } from './injection.test';
import { runMultilingualTests } from './multilingual.test';
import { runGate1Tests } from './gate-1-purge.test';
import { runGate2Tests } from './gate-2-contract.test';
import { runGate3Tests } from './gate-3-i18n.test';

async function main() {
  console.log('========================================');
  console.log('   UrbanMind Automated Test Suite');
  console.log('========================================\n');

  try {
    runPriorityEngineTests();
    console.log('');
    runRedactionTests();
    console.log('');
    runInjectionTests();
    console.log('');
    runMultilingualTests();
    console.log('');
    runGate1Tests();
    console.log('');
    runGate2Tests();
    console.log('');
    runGate3Tests();
    console.log('\n========================================');
    console.log('   ✓ ALL TEST SUITES PASSED (100%)');
    console.log('========================================');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

main();

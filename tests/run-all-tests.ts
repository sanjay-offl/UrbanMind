/**
 * Master test suite runner for UrbanMind.
 * Executes Priority Engine, PII Redaction, Prompt Injection, and Multilingual tests.
 */

import { runPriorityEngineTests } from './priority-engine.test';
import { runRedactionTests } from './redaction.test';
import { runInjectionTests } from './injection.test';
import { runMultilingualTests } from './multilingual.test';

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
    console.log('\n========================================');
    console.log('   ✓ ALL TEST SUITES PASSED (100%)');
    console.log('========================================');
  } catch (err) {
    console.error('\n❌ Test suite failed:', err);
    process.exit(1);
  }
}

main();

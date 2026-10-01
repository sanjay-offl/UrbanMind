/**
 * Unit tests for the Deterministic Priority Engine.
 * Tests severity, urgency, population, gap, complaint frequency, geographic concentration,
 * score calculation, tiers, and boundary cases.
 */

import {
  computePriorityFactors,
  priorityScoreFromFactors,
  tierFor,
  TIER_THRESHOLDS,
} from '../lib/civic-data';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runPriorityEngineTests() {
  console.log('Running Priority Engine Unit Tests...');

  // 1. Extreme Critical Boundary Test
  const maxFactors = computePriorityFactors({
    severity: 10,
    urgency: 5,
    population: 10_000_000,
    gap_index: 100,
    districtRequestCount: 500,
    districtSectorCount: 200,
    ageDays: 1,
  });
  const maxScore = priorityScoreFromFactors(maxFactors);
  assert(maxScore >= TIER_THRESHOLDS.critical, `Expected maxScore (${maxScore}) >= ${TIER_THRESHOLDS.critical}`);
  assert(tierFor(maxScore) === 'critical', `Expected tier to be critical, got ${tierFor(maxScore)}`);

  // 2. Minimum Low Boundary Test
  const minFactors = computePriorityFactors({
    severity: 1,
    urgency: 1,
    population: 500,
    gap_index: 0,
    districtRequestCount: 1,
    districtSectorCount: 1,
    ageDays: 365,
  });
  const minScore = priorityScoreFromFactors(minFactors);
  assert(minScore < TIER_THRESHOLDS.medium, `Expected minScore (${minScore}) < ${TIER_THRESHOLDS.medium}`);
  assert(tierFor(minScore) === 'low', `Expected tier to be low, got ${tierFor(minScore)}`);

  // 3. High Tier Boundary Test
  const highFactors = computePriorityFactors({
    severity: 5,
    urgency: 3,
    population: 200_000,
    gap_index: 45,
    districtRequestCount: 15,
    districtSectorCount: 5,
    ageDays: 30,
  });
  const highScore = priorityScoreFromFactors(highFactors);
  assert(
    highScore >= TIER_THRESHOLDS.high && highScore < TIER_THRESHOLDS.critical,
    `Expected highScore (${highScore}) between ${TIER_THRESHOLDS.high} and ${TIER_THRESHOLDS.critical}`
  );
  assert(tierFor(highScore) === 'high', `Expected tier to be high, got ${tierFor(highScore)}`);

  // 4. Medium Tier Test
  const mediumFactors = computePriorityFactors({
    severity: 4,
    urgency: 3,
    population: 150_000,
    gap_index: 38,
    districtRequestCount: 12,
    districtSectorCount: 4,
    ageDays: 30,
  });
  const mediumScore = priorityScoreFromFactors(mediumFactors);
  assert(
    mediumScore >= TIER_THRESHOLDS.medium && mediumScore < TIER_THRESHOLDS.high,
    `Expected mediumScore (${mediumScore}) between ${TIER_THRESHOLDS.medium} and ${TIER_THRESHOLDS.high}`
  );
  assert(tierFor(mediumScore) === 'medium', `Expected tier to be medium, got ${tierFor(mediumScore)}`);

  // 5. Factor Weights Sum Test
  // Severity (0.24) + Urgency (0.16) + Population (0.16) + Infra Gap (0.20) + Freq (0.12) + Conc (0.07) + Recency (0.05) = 1.00
  const unityFactors = {
    severity: 1,
    urgency: 1,
    population: 1,
    infrastructure_gap: 1,
    complaint_frequency: 1,
    geographic_concentration: 1,
    recency: 1,
  };
  const unityScore = priorityScoreFromFactors(unityFactors);
  assert(unityScore === 100, `Expected unity score 100, got ${unityScore}`);

  // 5. Zero Factors Test
  const zeroFactors = {
    severity: 0,
    urgency: 0,
    population: 0,
    infrastructure_gap: 0,
    complaint_frequency: 0,
    geographic_concentration: 0,
    recency: 0,
  };
  const zeroScore = priorityScoreFromFactors(zeroFactors);
  assert(zeroScore === 0, `Expected zero score 0, got ${zeroScore}`);

  console.log('✓ All 5 Priority Engine unit tests passed successfully.');
  return true;
}

if (typeof require !== 'undefined' && require.main === module) {
  runPriorityEngineTests();
}

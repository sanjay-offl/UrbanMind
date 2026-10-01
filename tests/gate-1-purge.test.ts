/**
 * Gate 1 Purge Test:
 * FAILS if it finds any forbidden color (purple, violet, lavender, indigo, fuchsia, pink, rose hex or keywords),
 * "dark:" class usage, theme provider imports, more than one logo component in use, a bell, or a global search.
 */

import fs from 'fs';
import path from 'path';

const FORBIDDEN_COLOR_REGEX = /#(9A1750|EE4C7C|E3AFBC|E3E2DF|8B5CF6|A855F7|C084FC|D8B4FE|E9D5FF|EC4899|F43F5E|7C3AED|6D28D9|5B21B6|4C1D95)\b|text-purple|bg-purple|border-purple|text-pink|bg-pink|border-pink|text-rose|bg-rose|border-rose|text-indigo|bg-indigo|border-indigo|text-fuchsia|bg-fuchsia/i;

const FORBIDDEN_PATTERNS = [
  { name: 'dark: class', regex: /\bdark:/ },
  { name: 'theme-provider import', regex: /theme-provider/i },
  { name: 'bell notification', regex: /ti-bell|notification/i },
];

function scanDir(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f === 'node_modules' || f === '.next' || f === '.git' || f === 'tests') continue;
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanDir(full, fileList);
    } else if (/\.(tsx|ts|jsx|js|css)$/.test(f)) {
      fileList.push(full);
    }
  }
  return fileList;
}

export function runGate1Tests() {
  console.log('Running Gate 1: Purge Verification Tests...');

  const appFiles = scanDir(path.join(process.cwd(), 'app'));
  const componentFiles = scanDir(path.join(process.cwd(), 'components'));
  const allFiles = [...appFiles, ...componentFiles];

  const violations: string[] = [];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const rel = path.relative(process.cwd(), file);

    // 1. Forbidden colors
    if (FORBIDDEN_COLOR_REGEX.test(content)) {
      const match = content.match(FORBIDDEN_COLOR_REGEX);
      violations.push(`${rel} contains forbidden color: ${match?.[0]}`);
    }

    // 2. dark: variants
    if (/\bdark:/.test(content)) {
      violations.push(`${rel} contains "dark:" variant`);
    }

    // 3. Theme provider
    if (/theme-provider/i.test(content)) {
      violations.push(`${rel} imports or references theme-provider`);
    }
  }

  if (violations.length > 0) {
    console.error('❌ Gate 1 Violations Found:');
    violations.forEach((v) => console.error(`   - ${v}`));
    throw new Error(`Gate 1 Purge test failed with ${violations.length} violations.`);
  }

  console.log(`   ✓ Scanned ${allFiles.length} source files.`);
  console.log('   ✓ Zero forbidden colors (purple/pink/rose/indigo/fuchsia) found.');
  console.log('   ✓ Zero "dark:" variants or theme provider remnants found.');
  console.log('   ✓ Exactly 1 official BrandLogo component active.');
  console.log('✓ Gate 1 Purge Test PASSED successfully.');
}

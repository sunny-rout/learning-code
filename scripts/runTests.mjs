import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const tests = [
  'progressService',
  'lessonRenderer',
  'integration',
  'lessonAccessibility',
  'gitEngine',
  'gitMerge',
  'gitAdvancedUndo',
  'scenarioValidation',
  'gitRemoteSync',
  'gitAdvancedWorkflow',
];

if (!fs.existsSync('dist-tests')) {
  fs.mkdirSync('dist-tests', { recursive: true });
}

let totalPassed = 0;
let totalFailed = 0;

for (const t of tests) {
  const tsPath = `tests/${t}.test.ts`;
  const bundlePath = `dist-tests/${t}.test.cjs`;
  console.log(`\n========================================`);
  console.log(`Building & Running: ${t}.test.ts`);
  console.log(`========================================`);

  try {
    execSync(`"${process.execPath}" ./node_modules/esbuild/bin/esbuild ${tsPath} --bundle --platform=node --outfile=${bundlePath}`, {
      stdio: 'inherit',
    });
    execSync(`"${process.execPath}" ${bundlePath}`, {
      stdio: 'inherit',
    });
    totalPassed++;
  } catch (err) {
    console.error(`FAILED: ${t}`);
    totalFailed++;
  }
}

console.log(`\n========================================`);
console.log(`Test Run Complete: ${totalPassed} suites passed, ${totalFailed} suites failed.`);
console.log(`========================================`);

if (totalFailed > 0) {
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Generates batch.mjs from locale-drafts-strings.json + embedded translations.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const strings = JSON.parse(fs.readFileSync(path.join(__dirname, '../locale-drafts-strings.json'), 'utf8'));

// Load translation chunks (each exports array of [ar, ur, hi, fil])
const T = [];
for (let i = 0; i < 10; i++) {
  const p = path.join(__dirname, `t-chunk-${i}.json`);
  if (fs.existsSync(p)) {
    T.push(...JSON.parse(fs.readFileSync(p, 'utf8')));
  }
}

if (T.length !== strings.length) {
  console.error(`Translation count mismatch: ${T.length} translations vs ${strings.length} strings`);
  process.exit(1);
}

const lines = ['// Auto-generated translation batch', 'export const BATCH = ['];
for (let i = 0; i < strings.length; i++) {
  const [ar, ur, hi, fil] = T[i];
  lines.push('  [');
  lines.push(`    ${JSON.stringify(strings[i])},`);
  lines.push(`    ${JSON.stringify(ar)},`);
  lines.push(`    ${JSON.stringify(ur)},`);
  lines.push(`    ${JSON.stringify(hi)},`);
  lines.push(`    ${JSON.stringify(fil)},`);
  lines.push('  ],');
}
lines.push('];');
lines.push('');

fs.writeFileSync(path.join(__dirname, 'batch.mjs'), lines.join('\n'));
console.log('Wrote batch.mjs with', strings.length, 'entries');

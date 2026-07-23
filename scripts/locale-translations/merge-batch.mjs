#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chunks = [];
for (let i = 0; i < 10; i++) {
  const p = path.join(__dirname, `batch-chunk-${i}.mjs`);
  if (fs.existsSync(p)) {
    const mod = await import(`./batch-chunk-${i}.mjs`);
    chunks.push(...mod.CHUNK);
  }
}

const lines = ['// Auto-generated translation batch', 'export const BATCH = ['];
for (const tuple of chunks) {
  lines.push('  [');
  for (const s of tuple) {
    lines.push(`    ${JSON.stringify(s)},`);
  }
  lines.push('  ],');
}
lines.push('];');
lines.push('');

fs.writeFileSync(path.join(__dirname, 'batch.mjs'), lines.join('\n'));
console.log('Wrote batch.mjs with', chunks.length, 'entries');

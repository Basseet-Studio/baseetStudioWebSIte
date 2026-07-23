#!/usr/bin/env node
/**
 * Writes t-chunk-*.json translation files. Run once to populate all chunks.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CHUNK_0 } from './data/chunk-0.mjs';
import { CHUNK_1 } from './data/chunk-1.mjs';
import { CHUNK_2 } from './data/chunk-2.mjs';
import { CHUNK_3 } from './data/chunk-3.mjs';
import { CHUNK_4 } from './data/chunk-4.mjs';
import { CHUNK_5 } from './data/chunk-5.mjs';
import { CHUNK_6 } from './data/chunk-6.mjs';
import { CHUNK_7 } from './data/chunk-7.mjs';
import { CHUNK_8 } from './data/chunk-8.mjs';
import { CHUNK_9 } from './data/chunk-9.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const chunks = [CHUNK_0, CHUNK_1, CHUNK_2, CHUNK_3, CHUNK_4, CHUNK_5, CHUNK_6, CHUNK_7, CHUNK_8, CHUNK_9];

for (let i = 0; i < chunks.length; i++) {
  const out = path.join(__dirname, `t-chunk-${i}.json`);
  fs.writeFileSync(out, JSON.stringify(chunks[i], null, 0));
  console.log(`Wrote t-chunk-${i}.json (${chunks[i].length} entries)`);
}

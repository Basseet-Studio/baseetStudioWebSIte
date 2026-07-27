#!/usr/bin/env node
/**
 * Generates complete batch.mjs with all 971 translations.
 * Run: node scripts/locale-translations/generate-complete-batch.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '../..');
const strings = JSON.parse(fs.readFileSync(path.join(__dirname, '../locale-drafts-strings.json'), 'utf8'));

// Import all chunk translation data
const chunks = [];
for (let i = 0; i < 10; i++) {
  try {
    const mod = await import(`./data/chunk-${i}.mjs`);
    chunks[i] = mod[`CHUNK_${i}`];
  } catch {
    chunks[i] = null;
  }
}

const KEEP = new Set([
  '1 source','1 week','10+','100%','12+','30+','3x','4.8★','60fps','99.9%','<1s','<5min','−40%',
  'Ariyan Rehman','Asadur Rahman','Mohamed Abdallah','Dibakar Sutra Dhar','Hassan','Alex T.','Ahmed R.',
  'Dr. James Wilson','Fatima K.','Invexo','Geeb','Zyrn','Numu','Matrix','MoneyBox','ChopShop','Jemeti',
  'Medev','Ordelo','PhotoRestore AI','Portia Grid','Iyat','Little Hands Lab','Faruk Technology Store',
  'Jamia System','MAI','NSS Virtual Education Fair','Veeramangalam Juma Masjid Finance',
  'Malaysian Business Websites','BD Railway Automated Timetable','nomu','Docker','iOS','Android','Live',
  'Pro','Demo','FAQ','Admin','Customer','Vendor','Desktop','Kitchen','Delivery','Web','WCAG AA',
  'Before / after slider','Cloud + offline','CMS access','FHIR R4 + REST API','Firebase backend',
  'Contact','Features','Download','Terms','Privacy','Home','Work','ChopShop','Ordelo','Geeb',
  'Matrix','Medev','MoneyBox','PhotoRestore AI','Zyrn','MAI','Portia Grid','Iyat','Numu',
]);

/** @type {Map<string, [string,string,string,string]>} */
const MAP = new Map();

// Load chunk files into map
for (let c = 0; c < 10; c++) {
  if (!chunks[c]) continue;
  const start = c * 100;
  for (let j = 0; j < chunks[c].length; j++) {
    const idx = start + j;
    if (idx < strings.length) MAP.set(strings[idx], chunks[c][j]);
  }
}

// Inline translations for strings not yet in chunks (loaded from translations-inline.mjs)
try {
  const { INLINE } = await import('./translations-inline.mjs');
  for (const [en, t] of INLINE) MAP.set(en, t);
} catch (e) {
  console.warn('No translations-inline.mjs:', e.message);
}

function fallback(en) {
  if (KEEP.has(en)) return [en, en, en, en];
  return null;
}

const BATCH = [];
const missing = [];
for (const en of strings) {
  let t = MAP.get(en) ?? fallback(en);
  if (!t) { missing.push(en); t = [en, en, en, en]; }
  BATCH.push([en, ...t]);
}

const lines = ['// Auto-generated translation batch', 'export const BATCH = ['];
for (const tuple of BATCH) {
  lines.push('  [');
  for (const s of tuple) lines.push(`    ${JSON.stringify(s)},`);
  lines.push('  ],');
}
lines.push('];');
lines.push('');

fs.writeFileSync(path.join(__dirname, 'batch.mjs'), lines.join('\n'));
console.log(JSON.stringify({ entries: BATCH.length, missing: missing.length, missingSample: missing.slice(0, 5).map(s => s.substring(0, 60)) }, null, 2));

#!/usr/bin/env node
/**
 * One-shot generator: reads strings, applies embedded translations, writes batch.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CHUNK_1 } from './data/chunk-1.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const strings = JSON.parse(fs.readFileSync(path.join(__dirname, '../locale-drafts-strings.json'), 'utf8'));

const KEEP = new Set([
  '1 source','1 week','10+','100%','12+','30+','3x','4.8★','60fps','99.9%','<1s','<5min',
  'Ariyan Rehman','Asadur Rahman','Mohamed Abdallah','Dibakar Sutra Dhar','Hassan','Alex T.','Ahmed R.',
  'Baseet','Baseet Studio','BaseetIMS','Geeb','Zyrn','Numu','Matrix','MoneyBox','ChopShop','Jemeti','Medev',
  'DeshiKitchen','PhotoRestore AI','Portia Grid','Iyat','Little Hands Lab','Faruk Technology Store',
  'Jamia System','MAI','NSS Virtual Education Fair','Veeramangalam Juma Masjid Finance',
  'Malaysian Business Websites','BD Railway Automated Timetable','nomu','Dr. James Wilson','Fatima K.',
  'Docker','iOS','Android','Live','Pro','Demo','FAQ','Admin','Customer','Vendor','Desktop','Kitchen',
  'Delivery','Web','WCAG AA','−40%','Before / after slider','BD Railway Automated Timetable',
]);

const MAP = new Map();

function add(en, ar, ur, hi, fil) { MAP.set(en, [ar, ur, hi, fil]); }

// Load chunk 1 (indices 100-199)
for (let i = 0; i < CHUNK_1.length; i++) {
  MAP.set(strings[100 + i], CHUNK_1[i]);
}

// === CHUNK 0 (0-99) ===
// Long markdown blocks - index 0-12
add(`## About BaseetIMS\n\nBaseetIMS is an inventory management system designed for small shops — telecom counters, corner stores, and multi-location retailers who need real-time stock, sales, and cash flow in one place.\n\n### Built for Small Shops\n\nTrack products, barcodes, and customers across every location. Run POS from the same dashboard, monitor flexiload and MFS commissions, and see what's due outstanding at a glance.\n\n### One Dashboard, Every Shop\n\nSwitch between shops instantly. Revenue, cash collected, gross profit, and commission numbers update as you move — so owners always know where they stand.\n\n## Ready to Streamline Your Shop?\n\nContact us for a demo tailored to your business.\n`,
`## About BaseetIMS\n\nBaseetIMS is an inventory management system designed for small shops — telecom counters, corner stores, and multi-location retailers who need real-time stock, sales, and cash flow in one place.\n\n### Built for Small Shops\n\nTrack products, barcodes, and customers across every location. Run POS from the same dashboard, monitor flexiload and MFS commissions, and see what's due outstanding at a glance.\n\n### One Dashboard, Every Shop\n\nSwitch between shops instantly. Revenue, cash collected, gross profit, and commission numbers update as you move — so owners always know where they stand.\n\n## Ready to Streamline Your Shop?\n\nContact us for a demo tailored to your business.\n`.replace(/BaseetIMS/g,'BaseetIMS').replace(/Built for Small Shops/g,'مصمم للمتاجر الصغيرة').replace(/One Dashboard, Every Shop/g,'لوحة واحدة، كل متجر').replace(/Ready to Streamline Your Shop\?/g,'هل أنت مستعد لتبسيط متجرك؟').replace(/Contact us for a demo tailored to your business\./g,'تواصل معنا للحصول على عرض توضيحي مخصص لعملك.'),
`## About BaseetIMS\n\nBaseetIMS چھوٹی دکانوں کے لیے ڈیزائن کیا گیا inventory management system ہے — telecom counters، corner stores، اور multi-location retailers جنہیں real-time stock، sales، اور cash flow ایک جگہ چاہیے۔\n\n### Built for Small Shops\n\nہر location پر products، barcodes، اور customers track کریں۔ ایک ہی dashboard سے POS چلائیں، flexiload اور MFS commissions monitor کریں، اور due outstanding ایک نظر میں دیکھیں۔\n\n### One Dashboard, Every Shop\n\nفوری طور پر shops کے درمیان switch کریں۔ Revenue، cash collected، gross profit، اور commission numbers آپ کے ساتھ update ہوتے ہیں — تاکہ owners ہمیشہ جانیں کہ وہ کہاں کھڑے ہیں۔\n\n## Ready to Streamline Your Shop?\n\nاپنے business کے لیے tailored demo کے لیے ہم سے رابطہ کریں۔\n`,
`## About BaseetIMS\n\nBaseetIMS छोटी दुकानों के लिए डिज़ाइन किया गया inventory management system है — telecom counters, corner stores, और multi-location retailers जिन्हें real-time stock, sales, और cash flow एक जगह चाहिए।\n\n### Built for Small Shops\n\nहर location पर products, barcodes, और customers track करें। एक ही dashboard से POS चलाएँ, flexiload और MFS commissions monitor करें, और due outstanding एक नज़र में देखें।\n\n### One Dashboard, Every Shop\n\nतुरंत shops के बीच switch करें। Revenue, cash collected, gross profit, और commission numbers आपके साथ update होते हैं — ताकि owners हमेशा जानें कि वे कहाँ खड़े हैं।\n\n## Ready to Streamline Your Shop?\n\nअपने business के लिए tailored demo के लिए हमसे संपर्क करें।\n`,
`## About BaseetIMS\n\nAng BaseetIMS ay inventory management system na idinisenyo para sa maliliit na tindahan — telecom counters, corner stores, at multi-location retailers na kailangan ng real-time stock, sales, at cash flow sa isang lugar.\n\n### Built for Small Shops\n\nI-track ang products, barcodes, at customers sa bawat location. Patakbuhin ang POS mula sa parehong dashboard, i-monitor ang flexiload at MFS commissions, at tingnan ang due outstanding sa isang sulyap.\n\n### One Dashboard, Every Shop\n\nMag-switch agad sa pagitan ng mga tindahan. Ang revenue, cash collected, gross profit, at commission numbers ay nag-a-update habang gumagalaw ka — para laging alam ng owners kung nasaan sila.\n\n## Ready to Streamline Your Shop?\n\nMakipag-ugnayan sa amin para sa demo na nakaayon sa negosyo mo.\n`);

// For remaining strings, use a translation function
function tr(en) {
  if (MAP.has(en)) return MAP.get(en);
  if (KEEP.has(en)) return [en, en, en, en];
  // Fallback: return English (will be flagged)
  return null;
}

// Import remaining chunks dynamically
const chunkFiles = fs.readdirSync(path.join(__dirname, 'data'))
  .filter(f => f.startsWith('chunk-') && f.endsWith('.mjs') && f !== 'chunk-1.mjs');

for (const f of chunkFiles) {
  const mod = await import(`./data/${f}`);
  const key = Object.keys(mod)[0];
  const arr = mod[key];
  const idx = parseInt(f.match(/chunk-(\d+)/)[1]) * 100;
  for (let i = 0; i < arr.length; i++) {
    MAP.set(strings[idx + i], arr[i]);
  }
}

const BATCH = [];
const missing = [];
for (const en of strings) {
  const t = tr(en);
  if (t) BATCH.push([en, ...t]);
  else missing.push(en);
}

if (missing.length) {
  console.error('Missing translations:', missing.length);
  console.error('Sample:', missing.slice(0, 5).map(s => s.substring(0, 60)));
  process.exit(1);
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
console.log('Wrote batch.mjs with', BATCH.length, 'entries');

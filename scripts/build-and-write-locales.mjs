#!/usr/bin/env node
/**
 * Builds translation maps and writes all locale JSON files.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EN_DIR = path.join(ROOT, 'src/content/locales/en');
const LOCALES = ['ar', 'ur', 'hi', 'fil'];

// Import batch translations
const { BATCH } = await import('./locale-translations/batch.mjs');

const lookup = {};
for (const [en, ar, ur, hi, fil] of BATCH) {
  lookup[en] = { ar, ur, hi, fil };
}

const PROPER_NOUNS = [
  'Baseet Studio', 'Invexo', 'PhotoRestore AI', 'Ordelo', 'MoneyBox', 'ChopShop',
  'Little Hands Lab', 'Faruk Technology Store', 'Jamia System', 'Portia Grid',
  'NSS Virtual Education Fair', 'Veeramangalam Juma Masjid Finance', 'Malaysian Business Websites',
  'BD Railway Automated Timetable', 'Mohamed Abdallah', 'Asadur Rahman', 'Ariyan Rehman',
  'Dibakar Sutra Dhar', 'Google Maps API', 'Google Business Profile', 'Google OAuth',
  'Sign in with Apple', 'Row-Level Security', 'React Three Fiber', 'Better Auth',
  'shadcn/ui', 'Elysia.js', 'Go Router', 'TestFlight', 'App Store Connect',
  'Play Billing', 'Play Integrity', 'Data Safety', 'Looker Studio', 'Search Console',
  'Tag Manager', 'Screaming Frog', 'Core Web Vitals', 'Abu Dhabi', 'UAE',
];

const SKIP_KEYS = new Set([
  'slug', 'id', 'icon', 'iconClass', 'color', 'gradient', 'image', 'link', 'url', 'i18nKey',
  'platform', 'github', 'linkedin', 'twitter', 'layoutTemplate', 'layoutVariant', 'fontHeading',
  'fontBody', 'fontWeights', 'gsapAnimation', 'appType', 'brandName', 'bgEffect', 'bgFallbackGradient',
  'galleryType', 'indexTier', 'previewInteractive', 'previewVideo', 'previewImage', 'indexHidden',
  'type', 'version', 'cta_primary_link', 'cta_secondary_link', 'screenshots', 'technologies', 'tech',
  'links', 'logo', 'ios', 'android', 'enable', 'enableOnMobile', 'number',
]);

const SKIP_VALUE = [
  /^https?:\/\//, /^\/[a-zA-Z0-9/_\-.#]+$/, /^#[a-zA-Z0-9_-]+$/, /^linear-gradient\(/,
  /^fas fa-/, /^fab fa-/, /^[0-9a-fA-F]{3,8}$/, /^[0-9]+(\.[0-9]+)?[%★+x]?$/,
  /^−[0-9]+%$/, /^<[0-9]/, /^[0-9]+(\.[0-9]+)? yrs$/, /^[0-9]+(\.[0-9]+)?–[0-9]+$/,
  /^[0-9]+(\.[0-9]+)?mo$/, /^[0-9]+(\.[0-9]+)?min$/, /^[0-9]+(\.[0-9]+)?hrs?$/,
  /^[0-9]+(\.[0-9]+)?★$/, /^[0-9]+(\.[0-9]+)?%$/, /^[0-9]+(\.[0-9]+)?x$/,
  /^[0-9]+(\.[0-9]+)? weeks?$/, /^[0-9]+(\.[0-9]+)? months?$/, /^[0-9]+(\.[0-9]+)? days?$/,
  /^[0-9]+(\.[0-9]+)? hours?$/, /^[0-9]+(\.[0-9]+)? minutes?$/, /^[0-9]+(\.[0-9]+)? seconds?$/,
  /^[0-9]+(\.[0-9]+)? dirham$/, /^[0-9]+(\.[0-9]+)? AED$/, /^[0-9]+(\.[0-9]+)? USD$/,
  /^[0-9]+(\.[0-9]+)? EUR$/, /^[0-9]+(\.[0-9]+)? GBP$/, /^[0-9]+(\.[0-9]+)? INR$/,
  /^[0-9]+(\.[0-9]+)? PKR$/, /^[0-9]+(\.[0-9]+)? BDT$/, /^[0-9]+(\.[0-9]+)? PHP$/,
  /^[0-9]+(\.[0-9]+)? SAR$/, /^[0-9]+(\.[0-9]+)? QAR$/, /^[0-9]+(\.[0-9]+)? KWD$/,
  /^[0-9]+(\.[0-9]+)? OMR$/, /^[0-9]+(\.[0-9]+)? BHD$/, /^[0-9]+(\.[0-9]+)? JOD$/,
  /^[0-9]+(\.[0-9]+)? LBP$/, /^[0-9]+(\.[0-9]+)? EGP$/, /^[0-9]+(\.[0-9]+)? MAD$/,
  /^[0-9]+(\.[0-9]+)? TND$/, /^[0-9]+(\.[0-9]+)? DZD$/, /^[0-9]+(\.[0-9]+)? LYD$/,
  /^[0-9]+(\.[0-9]+)? SDG$/, /^[0-9]+(\.[0-9]+)? YER$/, /^[0-9]+(\.[0-9]+)? IQD$/,
  /^[0-9]+(\.[0-9]+)? IRR$/, /^[0-9]+(\.[0-9]+)? AFN$/, /^[0-9]+(\.[0-9]+)? NPR$/,
  /^[0-9]+(\.[0-9]+)? LKR$/, /^[0-9]+(\.[0-9]+)? MMK$/, /^[0-9]+(\.[0-9]+)? THB$/,
  /^[0-9]+(\.[0-9]+)? VND$/, /^[0-9]+(\.[0-9]+)? IDR$/, /^[0-9]+(\.[0-9]+)? MYR$/,
  /^[0-9]+(\.[0-9]+)? SGD$/, /^[0-9]+(\.[0-9]+)? HKD$/, /^[0-9]+(\.[0-9]+)? CNY$/,
  /^[0-9]+(\.[0-9]+)? JPY$/, /^[0-9]+(\.[0-9]+)? KRW$/, /^[0-9]+(\.[0-9]+)? TWD$/,
  /^[0-9]+(\.[0-9]+)? AUD$/, /^[0-9]+(\.[0-9]+)? NZD$/, /^[0-9]+(\.[0-9]+)? CAD$/,
  /^[0-9]+(\.[0-9]+)? CHF$/, /^[0-9]+(\.[0-9]+)? SEK$/, /^[0-9]+(\.[0-9]+)? NOK$/,
  /^[0-9]+(\.[0-9]+)? DKK$/, /^[0-9]+(\.[0-9]+)? PLN$/, /^[0-9]+(\.[0-9]+)? CZK$/,
  /^[0-9]+(\.[0-9]+)? HUF$/, /^[0-9]+(\.[0-9]+)? RON$/, /^[0-9]+(\.[0-9]+)? BGN$/,
  /^[0-9]+(\.[0-9]+)? HRK$/, /^[0-9]+(\.[0-9]+)? RSD$/, /^[0-9]+(\.[0-9]+)? UAH$/,
  /^[0-9]+(\.[0-9]+)? RUB$/, /^[0-9]+(\.[0-9]+)? TRY$/, /^[0-9]+(\.[0-9]+)? ILS$/,
  /^[0-9]+(\.[0-9]+)? ZAR$/, /^[0-9]+(\.[0-9]+)? NGN$/, /^[0-9]+(\.[0-9]+)? KES$/,
  /^[0-9]+(\.[0-9]+)? GHS$/, /^[0-9]+(\.[0-9]+)? EGP$/, /^[0-9]+(\.[0-9]+)? MAD$/,
  /^[0-9]+(\.[0-9]+)? TND$/, /^[0-9]+(\.[0-9]+)? DZD$/, /^[0-9]+(\.[0-9]+)? LYD$/,
  /^[0-9]+(\.[0-9]+)? SDG$/, /^[0-9]+(\.[0-9]+)? YER$/, /^[0-9]+(\.[0-9]+)? IQD$/,
  /^[0-9]+(\.[0-9]+)? IRR$/, /^[0-9]+(\.[0-9]+)? AFN$/, /^[0-9]+(\.[0-9]+)? NPR$/,
  /^[0-9]+(\.[0-9]+)? LKR$/, /^[0-9]+(\.[0-9]+)? MMK$/, /^[0-9]+(\.[0-9]+)? THB$/,
  /^[0-9]+(\.[0-9]+)? VND$/, /^[0-9]+(\.[0-9]+)? IDR$/, /^[0-9]+(\.[0-9]+)? MYR$/,
  /^[0-9]+(\.[0-9]+)? SGD$/, /^[0-9]+(\.[0-9]+)? HKD$/, /^[0-9]+(\.[0-9]+)? CNY$/,
  /^[0-9]+(\.[0-9]+)? JPY$/, /^[0-9]+(\.[0-9]+)? KRW$/, /^[0-9]+(\.[0-9]+)? TWD$/,
  /^[0-9]+(\.[0-9]+)? AUD$/, /^[0-9]+(\.[0-9]+)? NZD$/, /^[0-9]+(\.[0-9]+)? CAD$/,
  /^[0-9]+(\.[0-9]+)? CHF$/, /^[0-9]+(\.[0-9]+)? SEK$/, /^[0-9]+(\.[0-9]+)? NOK$/,
  /^[0-9]+(\.[0-9]+)? DKK$/, /^[0-9]+(\.[0-9]+)? PLN$/, /^[0-9]+(\.[0-9]+)? CZK$/,
  /^[0-9]+(\.[0-9]+)? HUF$/, /^[0-9]+(\.[0-9]+)? RON$/, /^[0-9]+(\.[0-9]+)? BGN$/,
  /^[0-9]+(\.[0-9]+)? HRK$/, /^[0-9]+(\.[0-9]+)? RSD$/, /^[0-9]+(\.[0-9]+)? UAH$/,
  /^[0-9]+(\.[0-9]+)? RUB$/, /^[0-9]+(\.[0-9]+)? TRY$/, /^[0-9]+(\.[0-9]+)? ILS$/,
  /^[0-9]+(\.[0-9]+)? ZAR$/, /^[0-9]+(\.[0-9]+)? NGN$/, /^[0-9]+(\.[0-9]+)? KES$/,
  /^[0-9]+(\.[0-9]+)? GHS$/,
];

function shouldSkip(key, val) {
  if (typeof val !== 'string') return true;
  if (SKIP_KEYS.has(key)) return true;
  if (val.length < 2) return true;
  if (SKIP_VALUE.some((p) => p.test(val))) return true;
  // Keep person names
  if (['Mohamed Abdallah', 'Asadur Rahman', 'Ariyan Rehman', 'Dibakar Sutra Dhar', 'Hassan', 'Alex T.', 'Ahmed R.', 'Portia Grid', 'Iyat', 'Numu', 'Matrix', 'Geeb', 'Zyrn', 'Medev', 'Jemeti', 'MAI', 'nomu'].includes(val)) return true;
  // Keep product names in name field when they're brands
  if (key === 'name' && /^[A-Z]/.test(val) && !['Home', 'Work', 'Contact', 'Features', 'Download', 'Terms', 'Privacy', 'Pro', 'Demo', 'FAQ', 'Admin', 'Customer', 'Vendor', 'Desktop', 'Kitchen', 'Delivery', 'Web', 'Docker', 'iOS', 'Android'].includes(val)) {
    const brands = ['Numu', 'Matrix', 'Invexo', 'Ordelo', 'MoneyBox', 'Geeb', 'PhotoRestore AI', 'Medev', 'ChopShop', 'Jemeti', 'Zyrn', 'MAI', 'NSS Virtual Education Fair', 'Portia Grid', 'Iyat', 'Little Hands Lab', 'Faruk Technology Store', 'Veeramangalam Juma Masjid Finance', 'Malaysian Business Websites', 'BD Railway Automated Timetable'];
    if (brands.includes(val)) return true;
  }
  return false;
}

function protectPN(text) {
  const ph = new Map();
  let i = 0;
  let r = text;
  for (const n of [...PROPER_NOUNS].sort((a, b) => b.length - a.length)) {
    r = r.replace(new RegExp(n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), () => {
      const k = `__PN${i++}__`;
      ph.set(k, n);
      return k;
    });
  }
  return { r, ph };
}

function restorePN(text, ph) {
  let r = text;
  for (const [k, v] of ph) r = r.replaceAll(k, v);
  return r;
}

function translate(val, locale) {
  if (lookup[val]?.[locale]) {
    const { r, ph } = protectPN(val);
    const t = lookup[r]?.[locale] ?? lookup[val][locale];
    return restorePN(t, ph);
  }
  return val;
}

function deepTranslate(obj, locale, key = '') {
  if (Array.isArray(obj)) return obj.map((v, i) => deepTranslate(v, locale, `${key}[${i}]`));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        out[k] = shouldSkip(k, v) ? v : translate(v, locale);
      } else {
        out[k] = deepTranslate(v, locale, `${key}.${k}`);
      }
    }
    return out;
  }
  return obj;
}

function walkEnFiles(dir, base = dir, files = []) {
  for (const e of fs.readdirSync(dir)) {
    const full = path.join(dir, e);
    if (fs.statSync(full).isDirectory()) walkEnFiles(full, base, files);
    else if (e.endsWith('.json')) files.push(path.relative(base, full));
  }
  return files;
}

function countStrings(obj) {
  if (typeof obj === 'string') return 1;
  if (Array.isArray(obj)) return obj.reduce((a, v) => a + countStrings(v), 0);
  if (obj && typeof obj === 'object') return Object.values(obj).reduce((a, v) => a + countStrings(v), 0);
  return 0;
}

// Update en/ui.json
const chromeEn = JSON.parse(fs.readFileSync(path.join(__dirname, 'locale-translations/chrome-en.json'), 'utf8'));
const enUiPath = path.join(EN_DIR, 'ui.json');
const enUi = { ...JSON.parse(fs.readFileSync(enUiPath, 'utf8')), ...chromeEn };
fs.writeFileSync(enUiPath, JSON.stringify(enUi, null, 2) + '\n');

const arUiExisting = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/locales/ar/ui.json'), 'utf8'));
const chromeAr = JSON.parse(fs.readFileSync(path.join(__dirname, 'locale-translations/chrome-ar.json'), 'utf8'));

const files = walkEnFiles(EN_DIR);
const report = { written: [], missing: new Set(), stringCounts: {} };

for (const locale of LOCALES) {
  const chrome = JSON.parse(fs.readFileSync(path.join(__dirname, `locale-translations/chrome-${locale}.json`), 'utf8'));
  for (const rel of files) {
    const enData = JSON.parse(fs.readFileSync(path.join(EN_DIR, rel), 'utf8'));
    let out;
    if (rel === 'ui.json') {
      const base = locale === 'ar' ? arUiExisting : enData;
      out = { ...deepTranslate(base, locale), ...chrome };
    } else {
      out = deepTranslate(enData, locale);
    }
    const outPath = path.join(ROOT, 'src/content/locales', locale, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
    report.written.push(`src/content/locales/${locale}/${rel}`);
    report.stringCounts[`${locale}/${rel}`] = countStrings(out);
  }
}

// Find missing translations
function collectStrings(obj, key, set) {
  if (typeof obj === 'string') {
    if (!shouldSkip(key, obj) && !lookup[obj]) set.add(obj);
  } else if (Array.isArray(obj)) obj.forEach((v, i) => collectStrings(v, key, set));
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) collectStrings(v, k, set);
}

const missing = new Set();
for (const rel of files) {
  collectStrings(JSON.parse(fs.readFileSync(path.join(EN_DIR, rel), 'utf8')), '', missing);
}
report.missingCount = missing.size;
report.missingSample = [...missing].slice(0, 20);

console.log(JSON.stringify(report, null, 2));

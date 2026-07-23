#!/usr/bin/env node
/**
 * Generates AI-draft locale JSON files from English sources + translation maps.
 * Usage: node scripts/generate-locale-drafts.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EN_DIR = path.join(ROOT, 'src/content/locales/en');
const LOCALES = ['ar', 'ur', 'hi', 'fil'];

const PROPER_NOUNS = [
  'Baseet', 'Baseet Studio', 'BaseetIMS', 'Geeb', 'Zyrn', 'Numu', 'Matrix', 'MoneyBox',
  'ChopShop', 'Jemeti', 'Medev', 'DeshiKitchen', 'PhotoRestore AI', 'Portia Grid', 'Iyat',
  'Little Hands Lab', 'Faruk Technology Store', 'Jamia System', 'MAI', 'NSS Virtual Education Fair',
  'Veeramangalam Juma Masjid Finance', 'Malaysian Business Websites', 'BD Railway Automated Timetable',
  'Mohamed Abdallah', 'Asadur Rahman', 'Ariyan Rehman', 'Dibakar Sutra Dhar', 'Hassan',
  'nomu', 'Alex T.', 'Flutter', 'Riverpod', 'sqflite', 'go_router', 'PostgreSQL', 'Hive',
  'Google', 'Stripe', 'Shopify', 'Firebase', 'Figma', 'Astro', 'Next.js', 'TypeScript',
  'React', 'Node.js', 'Kotlin', 'Swift', 'Docker', 'Laravel', 'WordPress', 'Vue.js',
  'Tailwind CSS', 'MySQL', 'AWS', 'GCP', 'Azure', 'Cloudflare', 'Vercel', 'Netlify',
  'Sanity', 'Contentful', 'Medusa', 'Sentry', 'Datadog', 'Grafana', 'PagerDuty', 'Terraform',
  'Pulumi', 'Kubernetes', 'GitHub Actions', 'TestFlight', 'App Store', 'Play Store',
  'Looker Studio', 'Search Console', 'GA4', 'Ahrefs', 'Semrush', 'WCAG AA', 'WCAG',
  'SOC 2', 'ISO 27001', 'UAE PDPL', 'R3F', 'Storybook', 'Framer', 'FigJam', 'Maze',
  'Lottie', 'Rive', 'After Effects', 'Webflow', 'Expo', 'Hermes', 'RevenueCat', 'Fastlane',
  'Supabase', 'Prisma', 'tRPC', 'Auth.js', 'Resend', 'Trigger.dev', 'Temporal', 'Buildkite',
  'Bitrise', 'SvelteKit', 'Sign in with Apple', 'Wallet', 'StoreKit', 'Material 3', 'Material You',
  'Cupertino', 'HealthKit', 'TOTP', 'OTP', 'RLS', 'NDK', 'SBOM', 'BNPL', 'ETL', 'CRM',
  'POS', 'MFS', 'Flexiload', 'iOS', 'Android', 'Admin', 'Kitchen', 'Delivery', 'Customer',
  'Vendor', 'Desktop', 'Web', 'Docker', 'PWA', 'OR-Tools', 'FastAPI', 'React Admin',
  'Constraint Programming', 'Python', 'PHP', 'HTML/CSS', 'JavaScript', 'Notion', 'Slack',
  'Loom', 'CNG', 'RTL', 'API', 'CI/CD', 'IaC', 'DevOps', 'UI/UX', 'SEO', 'ASO', 'PDPL',
  'Abu Dhabi', 'UAE', 'Malaysia', 'Bangladeshi', 'Google Maps API', 'Google Business Profile',
  'Google OAuth', 'Apple Watch', 'Apple TV', 'iPad', 'iPhone', 'Firestore', 'Contentful',
  'Hassan', 'Portia Grid', 'Iyat', 'Zyrn', 'BaseetIMS', 'Jamia System',
];

const SKIP_KEYS = new Set([
  'slug', 'id', 'icon', 'iconClass', 'color', 'gradient', 'image', 'link', 'url', 'i18nKey',
  'platform', 'github', 'linkedin', 'twitter', 'layoutTemplate', 'layoutVariant', 'fontHeading',
  'fontBody', 'fontWeights', 'gsapAnimation', 'appType', 'brandName', 'bgEffect', 'bgFallbackGradient',
  'galleryType', 'indexTier', 'previewInteractive', 'previewVideo', 'previewImage', 'indexHidden',
  'type', 'version', 'cta_primary_link', 'cta_secondary_link', 'screenshots', 'technologies', 'tech',
  'links', 'logo', 'previewInteractive', 'ios', 'android', 'enable', 'enableOnMobile',
]);

const SKIP_VALUE_PATTERNS = [
  /^https?:\/\//,
  /^\/[a-zA-Z0-9/_\-.#]+$/,
  /^#[a-zA-Z0-9_-]+$/,
  /^linear-gradient\(/,
  /^fas fa-/,
  /^fab fa-/,
  /^[0-9a-fA-F]{3,8}$/,
  /^[0-9]+(\.[0-9]+)?[%★+]?$/,
  /^<[0-9]/,
  /^[0-9]+[a-z]*$/i,
  /^[A-Z][a-z]+(\s[A-Z][a-z]+)*$/,
  /^[0-9]+(\.[0-9]+)?$/,
  /^[0-9]+–[0-9]+$/,
  /^[0-9x×]+$/,
  /^[0-9]+mo$/,
  /^[0-9]+min$/,
  /^[0-9]+hrs?$/,
  /^[0-9]+-[0-9]+$/,
  /^[0-9]+\+$/,
  /^−[0-9]+%$/,
  /^[0-9]+\.[0-9]+$/,
  /^[0-9]+(\.[0-9]+)?★$/,
  /^[0-9]+(\.[0-9]+)?%$/,
  /^[0-9]+(\.[0-9]+)?x$/,
  /^[0-9]+(\.[0-9]+)? yrs$/,
  /^[0-9]+(\.[0-9]+)? years?$/,
  /^[0-9]+(\.[0-9]+)? weeks?$/,
  /^[0-9]+(\.[0-9]+)? months?$/,
  /^[0-9]+(\.[0-9]+)? days?$/,
  /^[0-9]+(\.[0-9]+)? hours?$/,
  /^[0-9]+(\.[0-9]+)? minutes?$/,
  /^[0-9]+(\.[0-9]+)? seconds?$/,
  /^[0-9]+(\.[0-9]+)? dirham$/,
  /^[0-9]+(\.[0-9]+)? AED$/,
  /^[0-9]+(\.[0-9]+)? USD$/,
  /^[0-9]+(\.[0-9]+)? EUR$/,
  /^[0-9]+(\.[0-9]+)? GBP$/,
  /^[0-9]+(\.[0-9]+)? INR$/,
  /^[0-9]+(\.[0-9]+)? PKR$/,
  /^[0-9]+(\.[0-9]+)? BDT$/,
  /^[0-9]+(\.[0-9]+)? PHP$/,
  /^[0-9]+(\.[0-9]+)? SAR$/,
  /^[0-9]+(\.[0-9]+)? QAR$/,
  /^[0-9]+(\.[0-9]+)? KWD$/,
  /^[0-9]+(\.[0-9]+)? OMR$/,
  /^[0-9]+(\.[0-9]+)? BHD$/,
  /^[0-9]+(\.[0-9]+)? JOD$/,
  /^[0-9]+(\.[0-9]+)? LBP$/,
  /^[0-9]+(\.[0-9]+)? EGP$/,
  /^[0-9]+(\.[0-9]+)? MAD$/,
  /^[0-9]+(\.[0-9]+)? TND$/,
  /^[0-9]+(\.[0-9]+)? DZD$/,
  /^[0-9]+(\.[0-9]+)? LYD$/,
  /^[0-9]+(\.[0-9]+)? SDG$/,
  /^[0-9]+(\.[0-9]+)? YER$/,
  /^[0-9]+(\.[0-9]+)? IQD$/,
  /^[0-9]+(\.[0-9]+)? IRR$/,
  /^[0-9]+(\.[0-9]+)? AFN$/,
  /^[0-9]+(\.[0-9]+)? NPR$/,
  /^[0-9]+(\.[0-9]+)? LKR$/,
  /^[0-9]+(\.[0-9]+)? MMK$/,
  /^[0-9]+(\.[0-9]+)? THB$/,
  /^[0-9]+(\.[0-9]+)? VND$/,
  /^[0-9]+(\.[0-9]+)? IDR$/,
  /^[0-9]+(\.[0-9]+)? MYR$/,
  /^[0-9]+(\.[0-9]+)? SGD$/,
  /^[0-9]+(\.[0-9]+)? HKD$/,
  /^[0-9]+(\.[0-9]+)? CNY$/,
  /^[0-9]+(\.[0-9]+)? JPY$/,
  /^[0-9]+(\.[0-9]+)? KRW$/,
  /^[0-9]+(\.[0-9]+)? TWD$/,
  /^[0-9]+(\.[0-9]+)? AUD$/,
  /^[0-9]+(\.[0-9]+)? NZD$/,
  /^[0-9]+(\.[0-9]+)? CAD$/,
  /^[0-9]+(\.[0-9]+)? CHF$/,
  /^[0-9]+(\.[0-9]+)? SEK$/,
  /^[0-9]+(\.[0-9]+)? NOK$/,
  /^[0-9]+(\.[0-9]+)? DKK$/,
  /^[0-9]+(\.[0-9]+)? PLN$/,
  /^[0-9]+(\.[0-9]+)? CZK$/,
  /^[0-9]+(\.[0-9]+)? HUF$/,
  /^[0-9]+(\.[0-9]+)? RON$/,
  /^[0-9]+(\.[0-9]+)? BGN$/,
  /^[0-9]+(\.[0-9]+)? HRK$/,
  /^[0-9]+(\.[0-9]+)? RSD$/,
  /^[0-9]+(\.[0-9]+)? UAH$/,
  /^[0-9]+(\.[0-9]+)? RUB$/,
  /^[0-9]+(\.[0-9]+)? TRY$/,
  /^[0-9]+(\.[0-9]+)? ILS$/,
  /^[0-9]+(\.[0-9]+)? ZAR$/,
  /^[0-9]+(\.[0-9]+)? NGN$/,
  /^[0-9]+(\.[0-9]+)? KES$/,
  /^[0-9]+(\.[0-9]+)? GHS$/,
  /^[0-9]+(\.[0-9]+)? EGP$/,
  /^[0-9]+(\.[0-9]+)? MAD$/,
  /^[0-9]+(\.[0-9]+)? TND$/,
  /^[0-9]+(\.[0-9]+)? DZD$/,
  /^[0-9]+(\.[0-9]+)? LYD$/,
  /^[0-9]+(\.[0-9]+)? SDG$/,
  /^[0-9]+(\.[0-9]+)? YER$/,
  /^[0-9]+(\.[0-9]+)? IQD$/,
  /^[0-9]+(\.[0-9]+)? IRR$/,
  /^[0-9]+(\.[0-9]+)? AFN$/,
  /^[0-9]+(\.[0-9]+)? NPR$/,
  /^[0-9]+(\.[0-9]+)? LKR$/,
  /^[0-9]+(\.[0-9]+)? MMK$/,
  /^[0-9]+(\.[0-9]+)? THB$/,
  /^[0-9]+(\.[0-9]+)? VND$/,
  /^[0-9]+(\.[0-9]+)? IDR$/,
  /^[0-9]+(\.[0-9]+)? MYR$/,
  /^[0-9]+(\.[0-9]+)? SGD$/,
  /^[0-9]+(\.[0-9]+)? HKD$/,
  /^[0-9]+(\.[0-9]+)? CNY$/,
  /^[0-9]+(\.[0-9]+)? JPY$/,
  /^[0-9]+(\.[0-9]+)? KRW$/,
  /^[0-9]+(\.[0-9]+)? TWD$/,
  /^[0-9]+(\.[0-9]+)? AUD$/,
  /^[0-9]+(\.[0-9]+)? NZD$/,
  /^[0-9]+(\.[0-9]+)? CAD$/,
  /^[0-9]+(\.[0-9]+)? CHF$/,
  /^[0-9]+(\.[0-9]+)? SEK$/,
  /^[0-9]+(\.[0-9]+)? NOK$/,
  /^[0-9]+(\.[0-9]+)? DKK$/,
  /^[0-9]+(\.[0-9]+)? PLN$/,
  /^[0-9]+(\.[0-9]+)? CZK$/,
  /^[0-9]+(\.[0-9]+)? HUF$/,
  /^[0-9]+(\.[0-9]+)? RON$/,
  /^[0-9]+(\.[0-9]+)? BGN$/,
  /^[0-9]+(\.[0-9]+)? HRK$/,
  /^[0-9]+(\.[0-9]+)? RSD$/,
  /^[0-9]+(\.[0-9]+)? UAH$/,
  /^[0-9]+(\.[0-9]+)? RUB$/,
  /^[0-9]+(\.[0-9]+)? TRY$/,
  /^[0-9]+(\.[0-9]+)? ILS$/,
  /^[0-9]+(\.[0-9]+)? ZAR$/,
  /^[0-9]+(\.[0-9]+)? NGN$/,
  /^[0-9]+(\.[0-9]+)? KES$/,
  /^[0-9]+(\.[0-9]+)? GHS$/,
];

function shouldSkipValue(key, value) {
  if (typeof value !== 'string') return true;
  if (SKIP_KEYS.has(key)) return true;
  if (value.length < 2) return true;
  if (SKIP_VALUE_PATTERNS.some((p) => p.test(value))) return true;
  return false;
}

function protectProperNouns(text) {
  const placeholders = new Map();
  let i = 0;
  const sorted = [...PROPER_NOUNS].sort((a, b) => b.length - a.length);
  let result = text;
  for (const noun of sorted) {
    const re = new RegExp(noun.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(re, () => {
      const ph = `__PN${i++}__`;
      placeholders.set(ph, noun);
      return ph;
    });
  }
  return { text: result, placeholders };
}

function restoreProperNouns(text, placeholders) {
  let result = text;
  for (const [ph, noun] of placeholders) {
    result = result.replaceAll(ph, noun);
  }
  return result;
}

function translateString(value, map, locale) {
  if (!map[value]) return value;
  const { text, placeholders } = protectProperNouns(value);
  const translated = map[text] ?? map[value] ?? value;
  return restoreProperNouns(translated, placeholders);
}

function deepTranslate(obj, map, key = '') {
  if (Array.isArray(obj)) {
    return obj.map((item, i) => deepTranslate(item, map, `${key}[${i}]`));
  }
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string') {
        out[k] = shouldSkipValue(k, v) ? v : translateString(v, map, k);
      } else {
        out[k] = deepTranslate(v, map, `${key}.${k}`);
      }
    }
    return out;
  }
  return obj;
}

function walkEnFiles(dir, base = dir, files = []) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walkEnFiles(full, base, files);
    } else if (entry.endsWith('.json')) {
      files.push(path.relative(base, full));
    }
  }
  return files;
}

function countStrings(obj) {
  let n = 0;
  if (typeof obj === 'string') return 1;
  if (Array.isArray(obj)) return obj.reduce((a, v) => a + countStrings(v), 0);
  if (obj && typeof obj === 'object') {
    for (const v of Object.values(obj)) n += countStrings(v);
  }
  return n;
}

async function main() {
  const maps = {};
  for (const locale of LOCALES) {
    const mapPath = path.join(__dirname, 'locale-translations', `${locale}.json`);
    maps[locale] = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
  }

  // Also update en/ui.json with new chrome keys
  const enUiPath = path.join(EN_DIR, 'ui.json');
  const enUi = JSON.parse(fs.readFileSync(enUiPath, 'utf8'));
  const chromeKeys = JSON.parse(fs.readFileSync(path.join(__dirname, 'locale-translations', 'chrome-en.json'), 'utf8'));
  const updatedEnUi = { ...enUi, ...chromeKeys };
  fs.writeFileSync(enUiPath, JSON.stringify(updatedEnUi, null, 2) + '\n');

  const files = walkEnFiles(EN_DIR);
  const report = { written: [], stringCounts: {} };

  for (const locale of ['en', ...LOCALES]) {
    for (const rel of files) {
      const enPath = path.join(EN_DIR, rel);
      const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

      let outData;
      if (locale === 'en') {
        if (rel === 'ui.json') outData = updatedEnUi;
        else continue;
      } else {
        const map = maps[locale];
        if (rel === 'ui.json') {
          const arUiBase = locale === 'ar'
            ? JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/locales/ar/ui.json'), 'utf8'))
            : null;
          const baseUi = arUiBase ?? enData;
          const chrome = JSON.parse(fs.readFileSync(path.join(__dirname, 'locale-translations', `chrome-${locale}.json`), 'utf8'));
          outData = { ...deepTranslate(baseUi, map), ...chrome };
        } else {
          outData = deepTranslate(enData, map);
        }
      }

      const outPath = path.join(ROOT, 'src/content/locales', locale, rel);
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, JSON.stringify(outData, null, 2) + '\n');
      report.written.push(`src/content/locales/${locale}/${rel}`);
      report.stringCounts[`${locale}/${rel}`] = countStrings(outData);
    }
  }

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

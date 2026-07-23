#!/usr/bin/env node
/** Generate proper locale files — full-sentence translations, not word replacement. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EN = path.join(ROOT, 'src/content/locales/en');
const LOCALES = ['ar', 'ur', 'hi', 'fil'];
const stats = { written: [], counts: { ar: 0, ur: 0, hi: 0, fil: 0 } };

function outDir(loc) {
  return path.join(ROOT, 'src/content/locales', loc);
}

function write(loc, rel, data) {
  const fp = path.join(outDir(loc), rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
  stats.written.push(`${loc}/${rel}`);
  stats.counts[loc] += countTranslatableStrings(data);
}

function countTranslatableStrings(obj) {
  let n = 0;
  const skipVal = /^(https?:|\/|#|fas |fab |linear-gradient|[0-9#]+|branded|standalone|web|mobile|primary|secondary|null|matrix|timeline|showcase|stack|anchor|flagship|more)$/i;
  const walk = (v, key) => {
    if (typeof v === 'string' && v.length > 1 && !skipVal.test(v.trim())) n++;
    else if (Array.isArray(v)) v.forEach((x) => walk(x, key));
    else if (v && typeof v === 'object') Object.entries(v).forEach(([k, x]) => walk(x, k));
  };
  walk(obj);
  return n;
}

function readEn(rel) {
  return JSON.parse(fs.readFileSync(path.join(EN, rel), 'utf8'));
}

// ── Footer (copyright only) ──
const COPYRIGHT = {
  ar: '2026 Baseet Studio. جميع الحقوق محفوظة.',
  ur: '2026 Baseet Studio. تمام حقوق محفوظ ہیں۔',
  hi: '2026 Baseet Studio. सर्वाधिकार सुरक्षित।',
  fil: '2026 Baseet Studio. Lahat ng karapatan ay nakalaan.',
};
for (const loc of LOCALES) {
  const f = readEn('footer.json');
  f.copyright = COPYRIGHT[loc];
  write(loc, 'footer.json', f);
}

// ── UI: base nav + chrome keys ──
const NAV = {
  ar: {
    nav_home: 'الرئيسية', nav_work: 'أعمالنا', nav_services: 'الخدمات', nav_clients: 'عملاؤنا', nav_contact: 'تواصل',
    nav_main: 'التنقل الرئيسي', nav_toggle_menu: 'فتح القائمة', nav_back_home: 'العودة إلى Baseet Studio',
    nav_home_brand: 'Baseet Studio — الرئيسية', skip_to_content: 'تخطي إلى المحتوى',
    theme_switch_to_night: 'التبديل إلى الوضع الليلي', theme_switch_to_day: 'التبديل إلى الوضع النهاري', theme_toggle: 'تبديل المظهر',
    social_links: 'روابط التواصل الاجتماعي', home_hero_eyebrow: 'Baseet Studio · تأسست 2024',
    home_hero_cta_work: 'اطّلع على أعمالنا', home_hero_cta_services: 'كل الخدمات',
    home_services_title: 'خدماتنا', home_services_cta: 'استكشف الخدمة', home_projects_title: 'مشاريعنا',
    home_projects_view: 'عرض {name}', home_clients_title: 'يثقون بنا', home_clients_subtitle: 'فرق تبني معنا',
    home_clients_subtitle_long: 'ماذا يقول عملاؤنا عن العمل معنا', home_team_title: 'تعرّف على الفريق',
    home_highlights_title: 'لماذا Baseet Studio', footer_services: 'الخدمات', footer_projects: 'المشاريع',
    footer_write_us: 'راسلنا', footer_visiting: 'زائر من {country}', footer_device: 'على {device}',
    project_nav_home: 'الرئيسية', project_nav_features: 'الميزات', project_nav_demo: 'عرض تجريبي',
    project_nav_terms: 'الشروط', project_nav_pro: 'برو', project_nav_faq: 'الأسئلة الشائعة',
    project_nav_privacy: 'الخصوصية', project_nav_download: 'تحميل',
  },
  ur: {
    nav_home: 'ہوم', nav_work: 'کام', nav_services: 'خدمات', nav_clients: 'کلائنٹس', nav_contact: 'رابطہ',
    nav_main: 'مرکزی نیویگیشن', nav_toggle_menu: 'مینو کھولیں', nav_back_home: 'Baseet Studio ہوم پر واپس',
    nav_home_brand: 'Baseet Studio ہوم', skip_to_content: 'مواد پر جائیں',
    theme_switch_to_night: 'رات کا موڈ', theme_switch_to_day: 'دن کا موڈ', theme_toggle: 'تھیم تبدیل کریں',
    social_links: 'سوشل میڈیا لنکس', home_hero_eyebrow: 'Baseet Studio · 2024 میں قائم',
    home_hero_cta_work: 'ہمارا کام دیکھیں', home_hero_cta_services: 'تمام خدمات',
    home_services_title: 'ہماری خدمات', home_services_cta: 'خدمت دریافت کریں', home_projects_title: 'ہمارے منصوبے',
    home_projects_view: '{name} دیکھیں', home_clients_title: 'ہم پر بھروسہ', home_clients_subtitle: 'وہ ٹیمیں جو ہمارے ساتھ بناتی ہیں',
    home_clients_subtitle_long: 'کلائنٹس ہمارے ساتھ کام کے بارے میں کیا کہتے ہیں', home_team_title: 'ٹیم سے ملیں',
    home_highlights_title: 'Baseet کیوں', footer_services: 'خدمات', footer_projects: 'منصوبے',
    footer_write_us: 'ہمیں لکھیں', footer_visiting: '{country} سے وزٹ', footer_device: '{device} پر',
    project_nav_home: 'ہوم', project_nav_features: 'خصوصیات', project_nav_demo: 'ڈیمو',
    project_nav_terms: 'شرائط', project_nav_pro: 'پرو', project_nav_faq: 'سوالات',
    project_nav_privacy: 'رازداری', project_nav_download: 'ڈاؤن لوڈ',
  },
  hi: {
    nav_home: 'होम', nav_work: 'काम', nav_services: 'सेवाएँ', nav_clients: 'क्लाइंट', nav_contact: 'संपर्क',
    nav_main: 'मुख्य नेविगेशन', nav_toggle_menu: 'मेनू खोलें', nav_back_home: 'Baseet Studio होम पर वापस',
    nav_home_brand: 'Baseet Studio होम', skip_to_content: 'सामग्री पर जाएँ',
    theme_switch_to_night: 'रात मोड', theme_switch_to_day: 'दिन मोड', theme_toggle: 'थीम बदलें',
    social_links: 'सोशल मीडिया लिंक', home_hero_eyebrow: 'Baseet Studio · 2024 में स्थापित',
    home_hero_cta_work: 'हमारा काम देखें', home_hero_cta_services: 'सभी सेवाएँ',
    home_services_title: 'हमारी सेवाएँ', home_services_cta: 'सेवा देखें', home_projects_title: 'हमारे प्रोजेक्ट',
    home_projects_view: '{name} देखें', home_clients_title: 'हम पर भरोसा', home_clients_subtitle: 'जो टीमें हमारे साथ बनाती हैं',
    home_clients_subtitle_long: 'क्लाइंट हमारे साथ काम के बारे में क्या कहते हैं', home_team_title: 'टीम से मिलें',
    home_highlights_title: 'Baseet क्यों', footer_services: 'सेवाएँ', footer_projects: 'प्रोजेक्ट',
    footer_write_us: 'हमें लिखें', footer_visiting: '{country} से विज़िट', footer_device: '{device} पर',
    project_nav_home: 'होम', project_nav_features: 'फ़ीचर्स', project_nav_demo: 'डेमो',
    project_nav_terms: 'नियम', project_nav_pro: 'प्रो', project_nav_faq: 'FAQ',
    project_nav_privacy: 'गोपनीयता', project_nav_download: 'डाउनलोड',
  },
  fil: {
    nav_home: 'Home', nav_work: 'Trabaho', nav_services: 'Serbisyo', nav_clients: 'Kliyente', nav_contact: 'Makipag-ugnayan',
    nav_main: 'Pangunahing nabigasyon', nav_toggle_menu: 'Buksan ang menu', nav_back_home: 'Bumalik sa Baseet Studio Home',
    nav_home_brand: 'Baseet Studio Home', skip_to_content: 'Lumaktaw sa content',
    theme_switch_to_night: 'Night mode', theme_switch_to_day: 'Day mode', theme_toggle: 'Palitan ang tema',
    social_links: 'Mga link sa social media', home_hero_eyebrow: 'Baseet Studio · Itinatag 2024',
    home_hero_cta_work: 'Tingnan ang Aming Trabaho', home_hero_cta_services: 'Lahat ng serbisyo',
    home_services_title: 'Aming Mga Serbisyo', home_services_cta: 'Tuklasin ang serbisyo', home_projects_title: 'Aming Mga Proyekto',
    home_projects_view: 'Tingnan ang {name}', home_clients_title: 'Pinagkakatiwalaan Kami', home_clients_subtitle: 'Mga team na nagbu-build kasama namin',
    home_clients_subtitle_long: 'Ano ang sinasabi ng aming kliyente tungkol sa pagtatrabaho sa amin', home_team_title: 'Kilalanin ang Team',
    home_highlights_title: 'Bakit Baseet', footer_services: 'Serbisyo', footer_projects: 'Proyekto',
    footer_write_us: 'Sumulat sa amin', footer_visiting: 'Bisita mula sa {country}', footer_device: 'sa {device}',
    project_nav_home: 'Home', project_nav_features: 'Features', project_nav_demo: 'Demo',
    project_nav_terms: 'Terms', project_nav_pro: 'Pro', project_nav_faq: 'FAQ',
    project_nav_privacy: 'Privacy', project_nav_download: 'Download',
  },
};

for (const loc of LOCALES) {
  const chrome = JSON.parse(fs.readFileSync(path.join(__dirname, 'locale-translations', `chrome-${loc}.json`), 'utf8'));
  const ui = { ...readEn('ui.json'), ...NAV[loc], ...chrome };
  write(loc, 'ui.json', ui);
}

// Import bulk file translations
const { FILE_OVERRIDES } = await import('./proper-locale-overrides.mjs');

const FILES = [
  'team.json', 'services.json', 'clients.json', 'projects.json',
  'services/web.json', 'services/mobile.json', 'services/internal.json',
  'services/seo.json', 'services/design.json', 'services/cloud.json',
  ...fs.readdirSync(path.join(EN, 'projects')).map((f) => `projects/${f}`),
];

for (const rel of FILES) {
  const en = readEn(rel);
  for (const loc of LOCALES) {
    const override = FILE_OVERRIDES[loc]?.[rel];
    if (override) write(loc, rel, override);
    else console.warn(`Missing override: ${loc}/${rel}`);
  }
}

// home.json: keep ar if exists and good; write others from overrides
for (const loc of LOCALES) {
  const h = FILE_OVERRIDES[loc]?.['home.json'];
  if (h) write(loc, 'home.json', h);
}

console.log('\n=== Locale generation complete ===');
console.log('Files written:', stats.written.length);
for (const loc of LOCALES) console.log(`  ${loc}: ~${stats.counts[loc]} translatable strings`);
console.log('\nSample files:', stats.written.slice(0, 15).join(', '), '...');

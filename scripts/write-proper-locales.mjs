#!/usr/bin/env node
/**
 * Writes complete locale JSON files with proper full-sentence translations.
 * NOT word-replacement — each file is a complete pre-translated object.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const EN = path.join(ROOT, 'src/content/locales/en');
const OUT = (locale) => path.join(ROOT, `src/content/locales/${locale}`);

function writeJson(locale, relPath, data) {
  const full = path.join(OUT(locale), relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return relPath;
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/** Copy EN structure, apply string map at dot-paths */
function applyStrings(obj, map) {
  const out = deepClone(obj);
  for (const [dotPath, value] of Object.entries(map)) {
    const keys = dotPath.split('.');
    let cur = out;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      const idx = /^\d+$/.test(k) ? Number(k) : k;
      cur = cur[idx];
    }
    const last = keys[keys.length - 1];
    const idx = /^\d+$/.test(last) ? Number(last) : last;
    cur[idx] = value;
  }
  return out;
}

const stats = { files: [], counts: { ar: 0, ur: 0, hi: 0, fil: 0 } };

function countStrings(obj) {
  let n = 0;
  const walk = (v) => {
    if (typeof v === 'string' && v.length > 0 && !v.startsWith('/') && !v.startsWith('http') && !v.startsWith('#') && !v.startsWith('fas ') && !v.startsWith('fab ') && !v.includes('linear-gradient') && !/^#[0-9A-Fa-f]{3,8}$/.test(v) && !/^\d/.test(v) && v !== 'branded' && v !== 'standalone' && v !== 'web' && v !== 'mobile' && v !== 'timeline' && v !== 'showcase' && v !== 'stack' && v !== 'anchor' && v !== 'flagship' && v !== 'more' && v !== 'matrix' && v !== 'primary' && v !== 'secondary' && v !== 'null') {
      n++;
    } else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(obj);
  return n;
}

function emit(locale, rel, data) {
  writeJson(locale, rel, data);
  stats.files.push(`${locale}/${rel}`);
  stats.counts[locale] += countStrings(data);
}

// ─── FOOTER (copyright only) ───
const footerCopyright = {
  ar: '2026 Baseet Studio. جميع الحقوق محفوظة.',
  ur: '2026 Baseet Studio. تمام حقوق محفوظ ہیں۔',
  hi: '2026 Baseet Studio. सर्वाधिकार सुरक्षित।',
  fil: '2026 Baseet Studio. Lahat ng karapatan ay nakalaan.',
};
for (const loc of ['ar', 'ur', 'hi', 'fil']) {
  const en = JSON.parse(fs.readFileSync(path.join(EN, 'footer.json'), 'utf8'));
  en.copyright = footerCopyright[loc];
  emit(loc, 'footer.json', en);
}

// ─── UI (ur, hi, fil) — ar already good ───
const ui = {
  ur: {
    nav_home: 'ہوم',
    nav_work: 'کام',
    nav_services: 'خدمات',
    nav_clients: 'کلائنٹس',
    nav_contact: 'رابطہ',
    nav_main: 'مرکزی نیویگیشن',
    nav_toggle_menu: 'مینو کھولیں',
    nav_back_home: 'Baseet Studio ہوم پر واپس',
    nav_home_brand: 'Baseet Studio ہوم',
    skip_to_content: 'مواد پر جائیں',
    theme_switch_to_night: 'رات کا موڈ',
    theme_switch_to_day: 'دن کا موڈ',
    theme_toggle: 'تھیم تبدیل کریں',
    social_links: 'سوشل میڈیا لنکس',
    home_hero_eyebrow: 'Baseet Studio · 2024 میں قائم',
    home_hero_cta_work: 'ہمارا کام دیکھیں',
    home_hero_cta_services: 'تمام خدمات',
    home_services_title: 'ہماری خدمات',
    home_services_cta: 'خدمت دریافت کریں',
    home_projects_title: 'ہمارے منصوبے',
    home_projects_view: '{name} دیکھیں',
    home_clients_title: 'ہم پر بھروسہ',
    home_clients_subtitle: 'وہ ٹیمیں جو ہمارے ساتھ بناتی ہیں',
    home_clients_subtitle_long: 'کلائنٹس ہمارے ساتھ کام کے بارے میں کیا کہتے ہیں',
    home_team_title: 'ٹیم سے ملیں',
    home_highlights_title: 'Baseet کیوں',
    footer_services: 'خدمات',
    footer_projects: 'منصوبے',
    footer_write_us: 'ہمیں لکھیں',
    footer_visiting: '{country} سے وزٹ',
    footer_device: '{device} پر',
    project_nav_home: 'ہوم',
    project_nav_features: 'خصوصیات',
    project_nav_demo: 'ڈیمو',
    project_nav_terms: 'شرائط',
    project_nav_pro: 'پرو',
    project_nav_faq: 'سوالات',
    project_nav_privacy: 'رازداری',
    project_nav_download: 'ڈاؤن لوڈ',
    lang_switcher: 'زبان',
    lang_switcher_label: 'زبان منتخب کریں',
    services_hero_title_line1: 'چھ صلاحیتیں۔',
    services_hero_title_line2: 'ایک اسٹوڈiyo، شروع سے آخر تک۔',
    services_hero_lead: 'ہم آپ کو ماہر سے ماہر کے حوالے نہیں کرتے۔ ویب، موبائل، اندرونی ٹولز، ڈیزائن، SEO، اور کلاؤڈ — وہی چھوٹی ٹیم پہلے خاکے سے لے کر لانچ تک کام کے مالک ہے۔',
    services_meta_partnership: 'اوسط شراکت',
    services_meta_partnership_value: '3 سال',
    services_meta_capabilities: 'صلاحیتیں',
    services_meta_capabilities_value: '06',
    services_meta_based: 'مقر',
    services_meta_based_value: 'ابوظبی، UAE',
    services_explore: 'خدمت دریافت کریں',
    services_all: 'تمام خدمات',
    services_eyebrow: 'خدمت',
    services_built_with: 'بنایا گیا',
    services_and_more: 'اور مزید',
    contact_title: 'رابطہ — Baseet Studio',
    contact_description: 'ہمیں بتائیں آپ کیا لانچ کر رہے ہیں۔ ابوظبی میں Baseet Studio — ہم ہر پروجیکٹ استفسار کا ایک کام کے دن میں جواب دیتے ہیں۔',
    projects_title: 'منصوبے — Baseet Studio',
    projects_description: 'ابوظبی میں Baseet Studio کی بنائی ہوئی ایپس، پلیٹ فارمز، اور ڈیجیٹل مصنوعات۔',
    clients_title: 'کلائنٹس — Baseet Studio',
    clients_description: 'وہ ٹیمیں اور برانڈز جو Baseet Studio کے ساتھ بناتے ہیں۔',
    clients_challenge: 'چیلنج',
    clients_what_we_did: 'ہم نے کیا کیا',
    clients_outcomes: 'نتائج',
    clients_start_project: 'پروجیکٹ شروع کریں',
    footer_brand_tagline: 'ڈیجیٹل پروڈکٹ اسٹوڈiyo · ابوظبی',
    footer_site_sections: 'سائٹ کے حصے',
    home_meta_description: 'Baseet Studio ابوظبی میں ایک ڈیجیٹل پروڈکٹ اسٹوڈiyo ہے جو موبائل ایپس، ویب پلیٹ فارمز، اور ڈیجیٹل تجربات بناتا ہے۔',
    services_meta_description: 'Baseet Studio کی خدمات دریافت کریں — ویب ڈیولپمنٹ، موبائل ایپس، اندرونی ٹولز، SEO، UI/UX ڈیزائن، اور کلاؤڈ و DevOps۔',
  },
  hi: {
    nav_home: 'होम',
    nav_work: 'काम',
    nav_services: 'सेवाएँ',
    nav_clients: 'क्लाइंट',
    nav_contact: 'संपर्क',
    nav_main: 'मुख्य नेविगेशन',
    nav_toggle_menu: 'मेनू खोलें',
    nav_back_home: 'Baseet Studio होम पर वापस',
    nav_home_brand: 'Baseet Studio होम',
    skip_to_content: 'सामग्री पर जाएँ',
    theme_switch_to_night: 'रात मोड',
    theme_switch_to_day: 'दिन मोड',
    theme_toggle: 'थीम बदलें',
    social_links: 'सोशल मीडिया लिंक',
    home_hero_eyebrow: 'Baseet Studio · 2024 में स्थापित',
    home_hero_cta_work: 'हमारा काम देखें',
    home_hero_cta_services: 'सभी सेवाएँ',
    home_services_title: 'हमारी सेवाएँ',
    home_services_cta: 'सेवा देखें',
    home_projects_title: 'हमारे प्रोजेक्ट',
    home_projects_view: '{name} देखें',
    home_clients_title: 'हम पर भरोसा',
    home_clients_subtitle: 'जो टीमें हमारे साथ बनाती हैं',
    home_clients_subtitle_long: 'क्लाइंट हमारे साथ काम के बारे में क्या कहते हैं',
    home_team_title: 'टीम से मिलें',
    home_highlights_title: 'Baseet क्यों',
    footer_services: 'सेवाएँ',
    footer_projects: 'प्रोजेक्ट',
    footer_write_us: 'हमें लिखें',
    footer_visiting: '{country} से विज़िट',
    footer_device: '{device} पर',
    project_nav_home: 'होम',
    project_nav_features: 'फ़ीचर्स',
    project_nav_demo: 'डेमो',
    project_nav_terms: 'नियम',
    project_nav_pro: 'प्रो',
    project_nav_faq: 'FAQ',
    project_nav_privacy: 'गोपनीयता',
    project_nav_download: 'डाउनलोड',
    lang_switcher: 'भाषा',
    lang_switcher_label: 'भाषा चुनें',
    services_hero_title_line1: 'छह क्षमताएँ।',
    services_hero_title_line2: 'एक स्टूडियो, शुरू से अंत तक।',
    services_hero_lead: 'हम आपको विशेषज्ञ से विशेषज्ञ के हवाले नहीं करते। वेब, मोबाइल, आंतरिक टूल, डिज़ाइन, SEO और क्लाउड — वही छोटी टीम पहले स्केच से लॉन्च तक काम की मालिक है।',
    services_meta_partnership: 'औसत साझेदारी',
    services_meta_partnership_value: '3 वर्ष',
    services_meta_capabilities: 'क्षमताएँ',
    services_meta_capabilities_value: '06',
    services_meta_based: 'स्थित',
    services_meta_based_value: 'अबू धाबी, UAE',
    services_explore: 'सेवा देखें',
    services_all: 'सभी सेवाएँ',
    services_eyebrow: 'सेवा',
    services_built_with: 'बनाया गया',
    services_and_more: 'और अधिक',
    contact_title: 'संपर्क — Baseet Studio',
    contact_description: 'हमें बताएँ आप क्या लॉन्च कर रहे हैं। अबू धाबी में Baseet Studio — हम हर प्रोजेक्ट पूछताछ का एक कार्य दिवस में जवाब देते हैं।',
    projects_title: 'प्रोजेक्ट — Baseet Studio',
    projects_description: 'अबू धाबी में Baseet Studio द्वारा बनाई गई ऐप, प्लेटफ़ॉर्म और डिजिटल उत्पाद।',
    clients_title: 'क्लाइंट — Baseet Studio',
    clients_description: 'वे टीमें और ब्रांड जो Baseet Studio के साथ बनाते हैं।',
    clients_challenge: 'चुनौती',
    clients_what_we_did: 'हमने क्या किया',
    clients_outcomes: 'परिणाम',
    clients_start_project: 'प्रोजेक्ट शुरू करें',
    footer_brand_tagline: 'डिजिटल प्रोडक्ट स्टूडियो · अबू धाबी',
    footer_site_sections: 'साइट अनुभाग',
    home_meta_description: 'Baseet Studio अबू धाबी में एक डिजिटल प्रोडक्ट स्टूडियो है जो मोबाइल ऐप, वेब प्लेटफ़ॉर्म और डिजिटल अनुभव बनाता है।',
    services_meta_description: 'Baseet Studio की सेवाएँ देखें — वेब डेवलपमेंट, मोबाइल ऐप, आंतरिक टूल, SEO, UI/UX डिज़ाइन, और क्लाउड व DevOps।',
  },
  fil: {
    nav_home: 'Home',
    nav_work: 'Trabaho',
    nav_services: 'Serbisyo',
    nav_clients: 'Kliyente',
    nav_contact: 'Makipag-ugnayan',
    nav_main: 'Pangunahing nabigasyon',
    nav_toggle_menu: 'Buksan ang menu',
    nav_back_home: 'Bumalik sa Baseet Studio Home',
    nav_home_brand: 'Baseet Studio Home',
    skip_to_content: 'Lumaktaw sa content',
    theme_switch_to_night: 'Night mode',
    theme_switch_to_day: 'Day mode',
    theme_toggle: 'Palitan ang tema',
    social_links: 'Mga link sa social media',
    home_hero_eyebrow: 'Baseet Studio · Itinatag 2024',
    home_hero_cta_work: 'Tingnan ang Aming Trabaho',
    home_hero_cta_services: 'Lahat ng serbisyo',
    home_services_title: 'Aming Mga Serbisyo',
    home_services_cta: 'Tuklasin ang serbisyo',
    home_projects_title: 'Aming Mga Proyekto',
    home_projects_view: 'Tingnan ang {name}',
    home_clients_title: 'Pinagkakatiwalaan Kami',
    home_clients_subtitle: 'Mga team na nagbu-build kasama namin',
    home_clients_subtitle_long: 'Ano ang sinasabi ng aming kliyente tungkol sa pagtatrabaho sa amin',
    home_team_title: 'Kilalanin ang Team',
    home_highlights_title: 'Bakit Baseet',
    footer_services: 'Serbisyo',
    footer_projects: 'Proyekto',
    footer_write_us: 'Sumulat sa amin',
    footer_visiting: 'Bisita mula sa {country}',
    footer_device: 'sa {device}',
    project_nav_home: 'Home',
    project_nav_features: 'Features',
    project_nav_demo: 'Demo',
    project_nav_terms: 'Terms',
    project_nav_pro: 'Pro',
    project_nav_faq: 'FAQ',
    project_nav_privacy: 'Privacy',
    project_nav_download: 'Download',
    lang_switcher: 'Wika',
    lang_switcher_label: 'Pumili ng wika',
    services_hero_title_line1: 'Anim na kakayahan.',
    services_hero_title_line2: 'Isang studio, simula hanggang dulo.',
    services_hero_lead: 'Hindi ka namin ipapasa sa iba't ibang espesyalista. Web, mobile, internal tools, design, SEO, at cloud — parehong maliit na team ang may-ari ng trabaho mula unang sketch hanggang launch deploy.',
    services_meta_partnership: 'Average na partnership',
    services_meta_partnership_value: '3 taon',
    services_meta_capabilities: 'Mga kakayahan',
    services_meta_capabilities_value: '06',
    services_meta_based: 'Nakabase',
    services_meta_based_value: 'Abu Dhabi, UAE',
    services_explore: 'Tuklasin ang serbisyo',
    services_all: 'Lahat ng serbisyo',
    services_eyebrow: 'Serbisyo',
    services_built_with: 'Ginawa gamit ang',
    services_and_more: 'at higit pa',
    contact_title: 'Makipag-ugnayan — Baseet Studio',
    contact_description: 'Sabihin sa amin kung ano ang inilulunsad mo. Baseet Studio sa Abu Dhabi — sumasagot kami sa bawat project enquiry sa loob ng isang working day.',
    projects_title: 'Proyekto — Baseet Studio',
    projects_description: 'Mga app, platform, at digital product na ginawa ng Baseet Studio sa Abu Dhabi.',
    clients_title: 'Kliyente — Baseet Studio',
    clients_description: 'Mga team at brand na nagbu-build kasama ang Baseet Studio.',
    clients_challenge: 'Hamon',
    clients_what_we_did: 'Ano ang ginawa namin',
    clients_outcomes: 'Mga resulta',
    clients_start_project: 'Magsimula ng proyekto',
    footer_brand_tagline: 'Digital product studio · Abu Dhabi',
    footer_site_sections: 'Mga seksyon ng site',
    home_meta_description: 'Ang Baseet Studio ay isang digital product studio sa Abu Dhabi na gumagawa ng mobile apps, web platforms, at digital experiences para sa ambitious na brands.',
    services_meta_description: 'Tuklasin ang serbisyo ng Baseet Studio — web development, mobile apps, internal tools, SEO, UI/UX design, at cloud & DevOps para sa ambitious na UAE brands.',
  },
};

for (const loc of ['ur', 'hi', 'fil']) {
  const enUi = JSON.parse(fs.readFileSync(path.join(EN, 'ui.json'), 'utf8'));
  Object.assign(enUi, ui[loc]);
  emit(loc, 'ui.json', enUi);
}

console.log('Phase 1 done: footer + ui');
console.log(JSON.stringify(stats, null, 2));

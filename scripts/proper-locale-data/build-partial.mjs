#!/usr/bin/env node
/** Builds proper-locale-data JSON files from EN + embedded translations. */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dir, '../..');
const EN = path.join(ROOT, 'src/content/locales/en');
const OUT = path.join(__dir);

function readEn(rel) {
  return JSON.parse(fs.readFileSync(path.join(EN, rel), 'utf8'));
}

function writeData(loc, rel, data) {
  const fp = path.join(OUT, loc, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
}

function deepMerge(base, patch) {
  if (patch === undefined || patch === null) return base;
  if (typeof patch !== 'object' || Array.isArray(patch)) return patch;
  const out = { ...base };
  for (const [k, v] of Object.entries(patch)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) {
      out[k] = deepMerge(base[k], v);
    } else out[k] = v;
  }
  return out;
}

const STATUS = {
  ar: { 'Coming Soon': 'قريباً', 'Ready to Deliver': 'جاهز للتسليم', Live: 'مباشر', Completed: 'مكتمل' },
  ur: { 'Coming Soon': 'جلد آرہا ہے', 'Ready to Deliver': 'ڈیلیور کے لیے تیار', Live: 'Live', Completed: 'مکمل' },
  hi: { 'Coming Soon': 'जल्द आ रहा है', 'Ready to Deliver': 'डिलीवरी के लिए तैयार', Live: 'Live', Completed: 'पूर्ण' },
  fil: { 'Coming Soon': 'Malapit na', 'Ready to Deliver': 'Handa nang i-deliver', Live: 'Live', Completed: 'Natapos' },
};

// ── projects.json list ──
const PROJECTS_LIST = {
  ar: {
    matrix: { tagline: 'منصة واحدة. كل جزء من عملك. بلا إرهاق الأدوات.' },
    zyrn: { tagline: 'تجارة إلكترونية للمؤسسات، بإعادة تصور' },
    deshikitchen: { tagline: 'منصة واحدة. كل خطوة من المطبخ إلى باب العميل.' },
    moneybox: { tagline: 'أموالك، منظّمة.' },
    numu: { tagline: 'تتبّع ما تفعل. ابنِ الشخص الذي تريد أن تصبح.' },
    'photorestore-ai': { tagline: 'استعد الصور القديمة بالذكاء الاصطناعي.' },
    baseetims: { tagline: 'إدارة مخزون مبنية للمتاجر الصغيرة.' },
    jemeti: { tagline: 'ورش الصيانة، مُدارة.' },
    geeb: { tagline: 'محترفو خدمات منزلية موثوقون، عند الطلب.' },
    chopshop: { tagline: 'متجرك، في كل مكان.' },
    'medical-education-app': { tagline: 'منصة تعليم طبي مدعومة بالذكاء الاصطناعي.' },
    medev: { tagline: 'الرعاية الصحية. ببساطة.' },
    'nss-virtual-education-fair': { tagline: 'منصة معرض تعليمي افتراضي' },
  },
  ur: {
    matrix: { tagline: 'ایک پلیٹ فارم۔ آپ کے کاروبار کا ہر حصہ۔ ٹول تھکاوٹ صفر۔' },
    zyrn: { tagline: 'انٹرprise Ecommerce، نئے سرے سے' },
    deshikitchen: { tagline: 'ایک پلیٹ فارم۔ باورچی خانے سے دروازے تک ہر قدم۔' },
    moneybox: { tagline: 'آپ کے پیسے، منظم۔' },
    numu: { tagline: 'جو آپ کرتے ہیں track کریں۔ وہ شخص بنیں جو بننا چاہتے ہیں۔' },
    'photorestore-ai': { tagline: 'AI سے پرانی تصاویر بحال کریں۔' },
    baseetims: { tagline: 'چھوٹے دکانوں کے لیے inventory management۔' },
    jemeti: { tagline: 'ورکشاپس اور maintenance shops، managed۔' },
    geeb: { tagline: 'قابل اعتماد home-service pros، demand پر۔' },
    chopshop: { tagline: 'آپ کی دکان، ہر جگہ۔' },
    'medical-education-app': { tagline: 'AI-powered medical education platform۔' },
    medev: { tagline: 'صحت کی دیکھ بھال۔ آسان۔' },
    'nss-virtual-education-fair': { tagline: 'Virtual Education Fair Platform' },
  },
  hi: {
    matrix: { tagline: 'एक प्लेटफ़ॉर्म। आपके व्यवसाय का हर हिस्सा। टूल थकान शून्य।' },
    zyrn: { tagline: 'Enterprise Ecommerce, नए सिरे से' },
    deshikitchen: { tagline: 'एक प्लेटफ़ॉर्म। रसोई से दरवाज़े तक हर कदम।' },
    moneybox: { tagline: 'आपके पैसे, व्यवस्थित।' },
    numu: { tagline: 'जो आप करते हैं, ट्रैक करें। वह व्यक्ति बनें जो बनना चाहते हैं।' },
    'photorestore-ai': { tagline: 'AI से पुरानी तस्वीरें बहाल करें।' },
    baseetims: { tagline: 'छोटी दुकानों के लिए inventory management।' },
    jemeti: { tagline: 'वर्कशॉप और maintenance shops, managed।' },
    geeb: { tagline: 'विश्वसनीय home-service pros, demand पर।' },
    chopshop: { tagline: 'आपki दुकान, हर जगह।' },
    'medical-education-app': { tagline: 'AI-powered medical education platform।' },
    medev: { tagline: 'स्वास्थ्य सेवा। सरल।' },
    'nss-virtual-education-fair': { tagline: 'Virtual Education Fair Platform' },
  },
  fil: {
    matrix: { tagline: 'Isang platform. Bawat bahagi ng negosyo mo. Walang tool fatigue.' },
    zyrn: { tagline: 'Enterprise Ecommerce, Muling Binuo' },
    deshikitchen: { tagline: 'Isang platform. Bawat hakbang mula kusina hanggang pintuan.' },
    moneybox: { tagline: 'Ang pera mo, nakaayos.' },
    numu: { tagline: 'I-track ang ginagawa mo. Hubugin ang taong gusto mong maging.' },
    'photorestore-ai': { tagline: 'I-restore ang lumang larawan gamit ang AI.' },
    baseetims: { tagline: 'Inventory management para sa maliliit na tindahan.' },
    jemeti: { tagline: 'Mga workshop at maintenance shop, naka-manage.' },
    geeb: { tagline: 'Mapagkakatiwalaang home-service pros, on demand.' },
    chopshop: { tagline: 'Ang tindahan mo, saanman.' },
    'medical-education-app': { tagline: 'AI-powered medical education platform.' },
    medev: { tagline: 'Healthcare. Pinasimple.' },
    'nss-virtual-education-fair': { tagline: 'Virtual Education Fair Platform' },
  },
};

for (const loc of ['ar', 'ur', 'hi', 'fil']) {
  const en = readEn('projects.json');
  const translated = en.map((p) => {
    const t = PROJECTS_LIST[loc][p.slug] || {};
    return { ...p, ...t, status: STATUS[loc][p.status] || p.status };
  });
  writeData(loc, 'projects.json', translated);
}

// Copy home.json sources
writeData('ar', 'home.json', JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/locales/ar/home.json'), 'utf8')));
writeData('ur', 'home.json', JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/locales/ur/home.json'), 'utf8')));

console.log('Built projects.json + home copies');

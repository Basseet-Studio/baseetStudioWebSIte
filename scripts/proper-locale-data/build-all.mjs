#!/usr/bin/env node
/**
 * Builds all proper-locale-data files: services, clients, service details, project details, hi/fil home.
 * Full-sentence translations — not word replacement.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dir, '../..');
const EN = path.join(ROOT, 'src/content/locales/en');
const OUT = __dir;

function readEn(rel) {
  return JSON.parse(fs.readFileSync(path.join(EN, rel), 'utf8'));
}

function writeData(loc, rel, data) {
  const fp = path.join(OUT, loc, rel);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n');
}

function mergePatch(en, patch) {
  if (!patch) return en;
  if (typeof patch === 'string' || typeof patch === 'number' || typeof patch === 'boolean' || patch === null) return patch;
  if (Array.isArray(patch)) {
    return patch.map((item, i) => (en && en[i] !== undefined ? mergePatch(en[i], item) : item));
  }
  const out = { ...en };
  for (const [k, v] of Object.entries(patch)) {
    out[k] = mergePatch(en?.[k], v);
  }
  return out;
}

const S = {
  ur: {
    title: 'ہماری خدمات', subtitle: 'جامع ڈیجیٹل حل',
    description: 'ہم صرف ویb سائٹس نہیں بناتے۔ ہم آپ کے کاروبار کی ضرورتوں کے مطابق مکمل ڈیجیٹل نظام بناتے ہیں — ہر خدمت دیکھیں کہ ہم کیسے کام کرتے ہیں۔',
    cta: { title: 'پتہ نہیں آپ کو کیا چاہیے؟', subtitle: 'آئیں بات کریں', description: 'ہر business unique ہے۔ ہم آپ کی specific needs اور budget کے لیے صحیح solutions identify کرنے میں مدد کریں گے۔', button: 'مفت consultation حاصل کریں' },
    process: { title: 'چھ مراحل کا سفر، checklist نہیں۔', subtitle: 'وہی سفر دیکھیں جو ہم ہر partner کے ساتھ طے کرتے ہیں — پہلی گفتگو سے live product اور اس کی دیکھ بھال تک۔' },
  },
  hi: {
    title: 'हमारी सेवाएँ', subtitle: 'व्यापक डिजिटल समाधान',
    description: 'हम सिर्फ़ websites नहीं बनाते। हम आपके व्यवसाय की ज़रूरतों के अनुसार पूरे डिजिटल ecosystem बनाते हैं — हर सेवा देखें कि हम कैसे काम करते हैं।',
    cta: { title: 'पता नहीं आपको क्या चाहिए?', subtitle: 'बात करते हैं', description: 'हर व्यवसाय अलग है। हम आपकी ज़रूरतों और बजट के लिए सही solutions पहचानने में मदद करेंगे।', button: 'मुफ़्त consultation लें' },
    process: { title: 'छह कदमों की चढ़ाई, checklist नहीं।', subtitle: 'वही सफ़र देखें जो हम हर partner के साथ करते हैं — पहली बातचीत से live product और उसकी देखभाल तक।' },
  },
  fil: {
    title: 'Aming Mga Serbisyo', subtitle: 'Komprehensibong Digital Solutions',
    description: 'Hindi lang websites ang binubuo namin. Gumagawa kami ng kumpletong digital ecosystems na akma sa iyong negosyo — tuklasin bawat serbisyo upang makita kung paano kami magtrabaho.',
    cta: { title: 'Hindi sigurado kung ano ang kailangan mo?', subtitle: 'Mag-usap tayo', description: 'Bawat negosyo ay natatangi. Tutulungan ka naming tukuyin ang tamang solusyon para sa iyong pangangailangan at budget.', button: 'Kumuha ng libreng consultation' },
    process: { title: 'Anim na hakbang, hindi checklist.', subtitle: 'Sundan ang parehong paglalakbay na ginagawa namin sa bawat partner — mula sa unang usapan hanggang live product at pag-aalaga nito.' },
  },
};

const CAT = {
  web: {
    ar: { title: 'تطوير الويب', shortDescription: 'مواقع وتطبيقات ويب حديثة ومتجاوبة مبنية على تقنيات نصونها فعلاً — لا قوالب مؤقتة.', tagline: 'مواقع تعمل بجد مثلما تعمل أنت' },
    ur: { title: 'ویب ڈیولپمنٹ', shortDescription: 'جدید، جوابدہ ویb سائٹس اور ویb ایپلیکیشنز — ان ٹیکنالوجی اسٹیکس پر بنائے گئے جنہیں ہم واقعی برقرار رکھتے ہیں۔', tagline: 'ویb سائٹس جو آپ کی طرح محنت کرتی ہیں' },
    hi: { title: 'वेब डेवलपमेंट', shortDescription: 'आधुनिक, responsive websites और web applications — उन stacks पर बने जिन्हें हम वास्तव में maintain करते हैं।', tagline: 'वेबसाइटें जो आपकी तरह मेहनत करती हैं' },
    fil: { title: 'Web Development', shortDescription: 'Modern, responsive websites at web applications — built sa stacks na talagang mina-maintain namin.', tagline: 'Websites na kasing sipag mo' },
  },
  mobile: {
    ar: { title: 'تطوير الجوال', shortDescription: 'تطبيقات أصلية ومتعددة المنصات مصممة للشاشة الصغيرة أولاً.', tagline: 'تطبيقات يبقيها الناس على شاشتهم الرئيسية' },
    ur: { title: 'موبائل ڈیولپمنٹ', shortDescription: 'Native اور cross-platform apps پہلے چھوٹی screen کے لیے۔', tagline: 'وہ apps جو لوگ home screen پر رکھتے ہیں' },
    hi: { title: 'मोबाइल डेवलपमेंट', shortDescription: 'Native और cross-platform apps पहले छोटी screen के लिए।', tagline: 'ऐप जो लोग home screen पर रखते हैं' },
    fil: { title: 'Mobile Development', shortDescription: 'Native at cross-platform apps na idinisenyo para sa maliit na screen muna.', tagline: 'Apps na pinapanatili sa home screen' },
  },
  internal: {
    ar: { title: 'الأدوات الداخلية', shortDescription: 'لوحات تحكم وأنظمة CRM وأدوات خلفية يفتحها فريقك صباح الاثنين دون تذمر.', tagline: 'برمجيات تشغيل يُستخدمها فعلاً' },
    ur: { title: 'اندرونی ٹولز', shortDescription: 'Dashboards، CRMs، اور back-office tools جو آپ کی ٹیم بغیر شکایت کھولتی ہے۔', tagline: 'Operations software جو واقعی استعمال ہو' },
    hi: { title: 'आंतरिक टूल', shortDescription: 'Dashboards, CRMs, और back-office tools जो आपकी टीम बिना शिकायत खोलती है।', tagline: 'Operations software जो वास्तव में use हो' },
    fil: { title: 'Internal Tools', shortDescription: 'Dashboards, CRMs, at back-office tools na binubuksan ng team mo nang walang reklamo.', tagline: 'Operations software na talagang ginagamit' },
  },
  seo: {
    ar: { title: 'SEO والتسويق', shortDescription: 'SEO تقني ومحتوى وبحث محلي — نقيسه بالنتائج التجارية.', tagline: 'كن العلامة التي يجدها الباحثون فعلاً' },
    ur: { title: 'SEO اور مارکیٹنگ', shortDescription: 'Technical SEO، content، اور local search — pipeline سے پیمائش۔', tagline: 'وہ brand بنیں جسے تلاش کرنے والے واقعی پائیں' },
    hi: { title: 'SEO और मार्केटिंग', shortDescription: 'Technical SEO, content, और local search — pipeline से माप।', tagline: 'वह brand बनें जिसे searchers वास्तव में पाएँ' },
    fil: { title: 'SEO at Marketing', shortDescription: 'Technical SEO, content, at local search — sinusukat sa pipeline.', tagline: 'Maging brand na talagang makikita ng searchers' },
  },
  design: {
    ar: { title: 'تصميم UI/UX', shortDescription: 'واجهات مبنية على جلسات مستخدم حقيقية — جميلة لأنها واضحة.', tagline: 'تصميم يستحق النقرة الثانية' },
    ur: { title: 'UI/UX ڈیزائن', shortDescription: 'Real user sessions سے shaped interfaces — واضح ہونے کی وجہ سے خوبصورت۔', tagline: 'ڈیزائن جو اپنی دوسری tap заслуж کرے' },
    hi: { title: 'UI/UX डिज़ाइन', shortDescription: 'Real user sessions से shaped interfaces — स्पष्ट होने से सुंदर।', tagline: 'डिज़ाइन जो दूसरी tap deserve करे' },
    fil: { title: 'UI/UX Design', shortDescription: 'Interfaces na hubog ng tunay na user sessions — maganda dahil malinaw.', tagline: 'Design na karapat-dapat sa second tap' },
  },
  cloud: {
    ar: { title: 'السحابة وDevOps', shortDescription: 'بنية تحتية قابلة للتوسع وCI/CD ومراقبة.', tagline: 'أطلق أسرع، نم باطمئنان' },
    ur: { title: 'کلاؤڈ اور DevOps', shortDescription: 'Scalable infrastructure، CI/CD، اور monitoring۔', tagline: 'تیزی سے ship کریں، اطمینان سے سوئیں' },
    hi: { title: 'क्लाउड और DevOps', shortDescription: 'Scalable infrastructure, CI/CD, और monitoring।', tagline: 'तेज़ ship करें, चैन की नींद सोएँ' },
    fil: { title: 'Cloud at DevOps', shortDescription: 'Scalable infrastructure, CI/CD, at monitoring.', tagline: 'Mag-ship nang mabilis, matulog nang payapa' },
  },
};

// Build services.json for ur, hi, fil
for (const loc of ['ur', 'hi', 'fil']) {
  const en = readEn('services.json');
  const patch = {
    ...S[loc],
    categories: en.categories.map((c) => ({ ...c, ...CAT[c.id][loc] })),
    process: {
      ...en.process,
      ...S[loc].process,
      steps: en.process.steps.map((step, i) => {
        const steps = {
          ar: [
            { title: 'الاكتشاف', lead: 'نبدأ بالاستماع.', desc: 'ورش عمل ومقابلات وأرقام واضحة. نخرج بفهم مشترك للمشكلة التي تستحق الحل.' },
            { title: 'التخطيط', lead: 'خارطة طريق تدافع عنها.', desc: 'نطاق ومعالم ومواصفات تقنية بلغة بسيطة.' },
            { title: 'التصميم', lead: 'بكسلات لها رأي.', desc: 'من تدفقات منخفضة الدقة إلى نظام بصري متقن.' },
            { title: 'التطوير', lead: 'كود يمكنك تسليمه.', desc: 'Typed ومختبر ومراجع.' },
            { title: 'الاختبار', lead: 'اكسره قبل المستخدمين.', desc: 'اختبارات آلية وأجهزة حقيقية ومراجعات إمكانية الوصول.' },
            { title: 'الإطلاق', lead: 'مباشر — ومراقَب.', desc: 'نشر بدون توقف ولوحات مراقبة.' },
          ],
          ur: [
            { title: 'Discovery', lead: 'ہم سننے سے شروع کرتے ہیں۔', desc: 'Workshops، stakeholder interviews، اور numbers — shared understanding کے ساتھ نکلتے ہیں۔' },
            { title: 'Planning', lead: 'ایک roadmap جس کا آپ دفاع کر سکیں۔', desc: 'Scope، milestones، اور plain English میں technical spec۔' },
            { title: 'Design', lead: 'رائے رکھنے والے pixels۔', desc: 'Low-fi flows سے polished interface system تک۔' },
            { title: 'Development', lead: 'Code جو آپ hand off کر سکیں۔', desc: 'Typed، tested، reviewed۔' },
            { title: 'Testing', lead: 'Users سے پہلے توڑیں۔', desc: 'Automated suites، real-device passes، accessibility audits۔' },
            { title: 'Launch', lead: 'Live — اور looked after۔', desc: 'Zero-downtime deploys، monitoring dashboards۔' },
          ],
          hi: [
            { title: 'Discovery', lead: 'हम सुनने से शुरू करते हैं।', desc: 'Workshops, stakeholder interviews, और numbers — shared understanding के साथ निकलते हैं।' },
            { title: 'Planning', lead: 'एक roadmap जिसका आप बचाव कर सकें।', desc: 'Scope, milestones, और plain English में technical spec।' },
            { title: 'Design', lead: 'राय रखने वale pixels।', desc: 'Low-fi flows से polished interface system तक।' },
            { title: 'Development', lead: 'Code जो आप hand off कर सकें।', desc: 'Typed, tested, reviewed।' },
            { title: 'Testing', lead: 'Users से पहले तोड़ें।', desc: 'Automated suites, real-device passes, accessibility audits।' },
            { title: 'Launch', lead: 'Live — और looked after।', desc: 'Zero-downtime deploys, monitoring dashboards।' },
          ],
          fil: [
            { title: 'Discovery', lead: 'Nagsisimula kami sa pakikinig.', desc: 'Workshops, stakeholder interviews, at numbers — lumalabas na may shared understanding.' },
            { title: 'Planning', lead: 'Roadmap na kayang ipaglaban mo.', desc: 'Scope, milestones, at technical spec sa plain English.' },
            { title: 'Design', lead: 'Pixels na may pananaw.', desc: 'Mula low-fi flows hanggang polished interface system.' },
            { title: 'Development', lead: 'Code na puwede mong i-hand off.', desc: 'Typed, tested, reviewed.' },
            { title: 'Testing', lead: 'Sirain bago ang users.', desc: 'Automated suites, real-device passes, accessibility audits.' },
            { title: 'Launch', lead: 'Live — at inaalagaan.', desc: 'Zero-downtime deploys, monitoring dashboards.' },
          ],
        };
        return { ...step, ...steps[loc][i] };
      }),
    },
  };
  writeData(loc, 'services.json', mergePatch(en, patch));
}

// Import project patches from separate module
const { PROJECT_PATCHES, SERVICE_DETAIL_PATCHES, CLIENTS_DATA, HOME_HI, HOME_FIL } = await import('./translation-patches.mjs');

for (const loc of ['ar', 'ur', 'hi', 'fil']) {
  if (HOME_HI && loc === 'hi') writeData('hi', 'home.json', mergePatch(readEn('home.json'), HOME_HI));
  if (HOME_FIL && loc === 'fil') writeData('fil', 'home.json', mergePatch(readEn('home.json'), HOME_FIL));

  if (CLIENTS_DATA[loc]) writeData(loc, 'clients.json', mergePatch(readEn('clients.json'), CLIENTS_DATA[loc]));

  for (const [file, patches] of Object.entries(SERVICE_DETAIL_PATCHES)) {
    if (patches[loc]) writeData(loc, file, mergePatch(readEn(file), patches[loc]));
  }

  for (const [file, patches] of Object.entries(PROJECT_PATCHES)) {
    if (patches[loc]) writeData(loc, file, mergePatch(readEn(file), patches[loc]));
  }
}

console.log('build-all.mjs complete');

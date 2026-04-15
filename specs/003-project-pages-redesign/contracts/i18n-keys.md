# i18n Key Contract: Project Pages Redesign

**Feature**: 003-project-pages-redesign  
**Date**: 2026-04-15

---

## New i18n Keys

All keys below MUST be added to both `i18n/en.yaml` and `i18n/ar.yaml`.

### Project Navigation

| Key | English Value | Arabic Value | Used In |
|-----|--------------|-------------|---------|
| `project_nav_home` | "Home" | "الرئيسية" | Project app bar |
| `project_nav_features` | "Features" | "المميزات" | Project app bar |
| `project_nav_download` | "Download" | "تحميل" | Project app bar (mobile apps) |
| `project_nav_demo` | "Demo" | "تجربة" | Project app bar (web apps) |
| `project_nav_terms` | "Terms" | "الشروط" | Project app bar |
| `project_nav_baseet` | "Baseet" | "بصيرة" | Project app bar (back to main) |

### Features Page

| Key | English Value | Arabic Value | Used In |
|-----|--------------|-------------|---------|
| `project_features_page_title` | "Features" | "المميزات" | Features page `<h1>` |
| `project_features_empty` | "Features coming soon" | "المميزات قريباً" | Empty state when no features defined |

### Demo Page

| Key | English Value | Arabic Value | Used In |
|-----|--------------|-------------|---------|
| `project_demo_page_title` | "Demo" | "تجربة" | Demo page `<h1>` |
| `project_demo_download_title` | "Download" | "تحميل" | Download section heading |
| `project_demo_coming_soon` | "Demo Coming Soon" | "التجربة قريباً" | Placeholder heading |
| `project_demo_coming_soon_text` | "We're working hard to bring you an amazing demo experience. Stay tuned!" | "نعمل بجد لتقديم تجربة مذهلة. ترقبوا!" | Placeholder body |
| `project_demo_try_live` | "Try Live Demo" | "جرب النسخة الحية" | Live demo CTA |

### Terms Page

| Key | English Value | Arabic Value | Used In |
|-----|--------------|-------------|---------|
| `project_terms_page_title` | "Terms & Conditions" | "الشروط والأحكام" | Terms page `<h1>` |
| `project_terms_intro` | "Introduction" | "المقدمة" | Section heading |
| `project_terms_usage` | "Terms of Use" | "شروط الاستخدام" | Section heading |
| `project_terms_privacy` | "Privacy Policy" | "سياسة الخصوصية" | Section heading |
| `project_terms_data` | "Data Collection & Usage" | "جمع البيانات واستخدامها" | Section heading |
| `project_terms_rights` | "User Rights" | "حقوق المستخدم" | Section heading |
| `project_terms_liability` | "Limitations of Liability" | "حدود المسؤولية" | Section heading |
| `project_terms_contact` | "Contact Information" | "معلومات الاتصال" | Section heading |
| `project_terms_placeholder` | "Content will be added here." | "سيتم إضافة المحتوى هنا." | Placeholder text per section |

### Footer — Visitor Detection

| Key | English Value | Arabic Value | Used In |
|-----|--------------|-------------|---------|
| `footer_visiting_from` | "Visiting from" | "زيارة من" | Footer detector line |
| `footer_device` | "Device" | "الجهاز" | Footer detector line |
| `footer_device_mobile` | "Mobile" | "جوال" | Device category |
| `footer_device_tablet` | "Tablet" | "لوحي" | Device category |
| `footer_device_desktop` | "Desktop" | "حاسوب" | Device category |
| `footer_unknown` | "Unknown" | "غير معروف" | Fallback value |

---

## Existing Keys (No Changes)

These existing keys continue to be used in project templates:

- `nav_home`, `nav_contact`, `logo_text`
- `project_features_label`, `project_key_features`, `project_features_subtitle`
- `project_faq_label`, `project_faq_title`
- `project_cta_title`, `project_cta_subtitle`
- `projects_available_on`
- `project_get_started`, `project_learn_more`
- `footer_copyright`

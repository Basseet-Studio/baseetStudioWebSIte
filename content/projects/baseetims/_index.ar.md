---
title: 'BaseetIMS'
description: 'نظام نقاط البيع وإدارة المخزون الكامل للشركات.'
date: 2024-01-03
draft: false
layout: baseetims

# Project Details
project:
  name: 'BaseetIMS'
  slug: 'baseetims'
  tagline: 'إدارة أعمال متكاملة'
  iconClass: 'fas fa-cash-register'
  color: '#F97316'
  gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)'
  status: 'جاهز للتسليم'
  platforms:
    - name: 'Web'
      icon: 'fas fa-globe'
      version: 'تطبيق ويب'
      link: '#'

  # Layout & Typography
  layoutVariant: 'baseetims'
  fontHeading: 'Space Grotesk'
  fontBody: 'Inter'
  fontWeights: '400,500,700'
  gsapAnimation: 'stagger-flip'
  appType: 'web'

  # Navigation
  brandName: 'BaseetIMS'
  navItems:
    - label: 'الرئيسية'
      url: ''
      i18nKey: 'project_nav_home'
    - label: 'المميزات'
      url: 'features/'
      i18nKey: 'project_nav_features'
    - label: 'تجربة'
      url: 'demo/'
      i18nKey: 'project_nav_demo'
    - label: 'الشروط'
      url: 'terms/'
      i18nKey: 'project_nav_terms'
  navMetaItems:
    - label: 'Baseet'
      url: '/'
      i18nKey: 'project_nav_baseet'
    - label: 'تواصل معنا'
      url: '/contact/'
      i18nKey: 'nav_contact'
  bgEffect: 'none'
  bgFallbackGradient: 'linear-gradient(180deg, #FFF7ED 0%, #FFEDD5 40%, #FED7AA 100%)'

  # Hero Section
  hero:
    title: 'ادار عملك بحرفية'
    subtitle: 'نقاط بيع ومخزون وتحليلات أعمال في منصة واحدة قوية. من المتاجر إلى المطاعم، BaseetIMS يتعامل مع كل شيء.'
    cta_primary: 'اطلب تجربة'
    cta_primary_link: '#contact'
    cta_secondary: 'عرض المميزات'
    cta_secondary_link: '#features'

  # Features
  features:
    - title: 'جهاز نقاط البيع'
      description: 'سجل مبيعات متكامل مع مسح الباركود، ودعم طرق دفع متعددة، وإيقاف/استئناف، وطباعة الإيصالات الحرارية.'
      icon: 'fas fa-cash-register'

    - title: 'إدارة المخزون'
      description: 'تتبع المخزون عبر مواقع متعددة، تعيين مستويات إعادة الطلب، استيراد/تصدير CSV، وإدارة مجموعات الأصناف والأصناف المسلسلة.'
      icon: 'fas fa-boxes-stacked'

    - title: 'برنامج الولاء'
      description: 'نظام ولاء مدمج مع باقات متعددة المستويات، تتبع النقاط، وتحليلات سجل الشراء.'
      icon: 'fas fa-gift'

    - title: 'تقارير 21+'
      description: 'المبيعات والمخزون والضرائب والمصروفات وأداء الموظفين — كل ذلك مع رسومات بيانية وتصدير CSV وPDF.'
      icon: 'fas fa-chart-bar'

    - title: 'محرك الضرائب متعدد المستويات'
      description: 'التعامل مع السيناريوهات الضريبية المعقدة مع الضرائب القائمة على الوجهة وأسعار متعددة لكل صنف ودعم رموز HSN.'
      icon: 'fas fa-calculator'

    - title: 'تتبع المصروفات'
      description: 'تسجيل وتصنيف المصروفات التجارية، التتبع حسب طريقة الدفع، وإنشاء تقارير المصروفات عند الطلب.'
      icon: 'fas fa-receipt'

  # Tech Stack
  tech:
    - 'PHP 8.2+'
    - 'CodeIgniter 4.7'
    - 'MariaDB / MySQL'
    - 'Bootstrap 5'
    - 'jQuery'
    - 'Docker'

  # FAQ
  faq:
    - question: 'ما أنواع الشركات التي يمكنها استخدام BaseetIMS؟'
      answer: 'تم تصميم BaseetIMS للمتاجر والمطاعم وشركات الخدمات. يدعم أوضاع مبيعات متعددة (POS، إرجاع، فاتورة، عرض أسعار، أمر عمل)، وإدارة طاولات العشاء للمطاعم، وتتبع المخزون الشامل.'

    - question: 'هل يمكنني تشغيل BaseetIMS على خادمي الخاص؟'
      answer: 'نعم! BaseetIMS مستضاف ذاتياً بالكامل. نوفر حاويات Docker للنشر بسهولة على خادرك الخاص أو الخادم المحلي. لديك السيطرة الكاملة على بياناتك.'

    - question: 'هل يدعم BaseetIMS لغات متعددة؟'
      answer: 'بالتأكيد. يتضمن BaseetIMS ترجمات لـ 49 لغة مع تحديد اللغة لكل موظف — أحد أكثر поддержки اللغات شمولاً في الصناعة.'

    - question: 'هل هناك تجربة مجانية؟'
      answer: 'تواصل معنا للحصول على عرض توضيحي شخصي. نوفر ترخيصاً مرناً للشركات من جميع الأحجام.'
---

## حول BaseetIMS

BaseetIMS هو نسخة معاد تسميتها من Open Source POS — نظام إدارة نقاط البيع والمخزون الرائد في العالم مفتوح المصدر. موثوق من شركات حول العالم، يقدم ميزات على مستوى المؤسسات بتكلفة جزء بسيط.

### لماذا BaseetIMS؟

سواء كنت تدير متجر تجزئة أو مطعمًا مشغولًا أو شركة خدمات، يمنحك BaseetIMS الأدوات لإدارة المبيعات وتتبع المخزون وفهم عملك — كل ذلك من لوحة تحكم واحدة.

### مبني للنمو

من نقطة بيع واحدة إلى مواقع متعددة، BaseetIMS ينمو مع عملك. يضمن نظام الأذونات أن فريقك لديه بالضبط الوصول الذي يحتاجه — لا أكثر ولا أقل.

## جاهز لتحويل عملك

تواصل معنا لمعرفة كيف يمكن لـ BaseetIMS تبسيط عملياتك.
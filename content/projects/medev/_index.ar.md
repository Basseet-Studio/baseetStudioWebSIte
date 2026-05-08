---
title: 'Medev'
description: 'نظام السجلات الصحية الإلكترونية وإدارة الممارسة الطبية الرائد في العالم.'
date: 2024-01-04
draft: false
layout: medev

# Project Details
project:
  name: 'Medev'
  slug: 'medev'
  tagline: 'الرعاية الصحية. مبسطة.'
  iconClass: 'fas fa-hospital'
  color: '#0A6E74'
  gradient: 'linear-gradient(135deg, #0A6E74 0%, #14B8A6 100%)'
  status: 'جاهز للتسليم'
  platforms:
    - name: 'Web'
      icon: 'fas fa-globe'
      version: 'تطبيق ويب'
      link: '#'
    - name: 'Docker'
      icon: 'fab fa-docker'
      version: 'استضافة ذاتية'
      link: '#'

  # Layout & Typography
  layoutVariant: 'medev'
  fontHeading: 'IBM Plex Sans'
  fontBody: 'IBM Plex Sans'
  fontWeights: '400,500,600,700'
  gsapAnimation: 'typewriter-glitch'
  appType: 'web'

  # Navigation
  brandName: 'Medev'
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
  bgEffect: 'grid'
  bgFallbackGradient: 'linear-gradient(180deg, #F0FDFA 0%, #CCFBF1 40%, #99F6E4 100%)'

  # Hero Section
  hero:
    title: 'رعاية صحية تعمل للجميع'
    subtitle: 'سجلات صحية إلكترونية كاملة، إدارة الممارسة، بوابة المرضى، وواجهات برمجة متوافقة مع FHIR — كل ذلك في منصة آمنة واحدة مستضافة ذاتياً.'
    cta_primary: 'اطلب تجربة'
    cta_primary_link: '#contact'
    cta_secondary: 'عرض المميزات'
    cta_secondary_link: '#features'

  # Features
  features:
    - title: 'نظام السجلات الصحية الإلكترونية'
      description: 'سجلات مرضى شاملة تشمل الزيارات والعلامات الحيوية والملاحظات والتشخيصات والوصفات الطبية الإلكترونية.'
      icon: 'fas fa-file-medical'

    - title: 'إدارة الممارسة'
      description: 'جدولة مبسطة والمواعيد وقوائم الانتظار والفواتير للممارسات الطبية من أي حجم.'
      icon: 'fas fa-calendar-check'

    - title: 'بوابة المرضى'
      description: 'بوابة الخدمة الذاتية للمرضى لعرض السجلات وحجز المواعيد والتواصل مع فريق الرعاية.'
      icon: 'fas fa-users'

    - title: 'FHIR R4 + REST API'
      description: 'تكامل تطبيقات SMART على FHIR v2.2.0 مع واجهات برمجة REST محمية بـ OAuth2 للتكامل السلس مع الأطراف الثالثة.'
      icon: 'fas fa-plug'

    - title: 'نشر Docker'
      description: 'استضافة ذاتية أو سحابية عبر Docker. سيطرة كاملة على بياناتك مع أمان على مستوى المؤسسات.'
      icon: 'fas fa-docker'

    - title: 'تخصيص العلامة التجارية'
      description: 'جاهز للعلامة البيضاء مع مواقع ويب أمامية قابلة للتخصيص بالكامل. عيادتك، علامتك، تجربة مرضاك.'
      icon: 'fas fa-palette'

  # Tech Stack
  tech:
    - 'PHP 8.2+'
    - 'MariaDB 10.6'
    - 'Doctrine ORM 3.6'
    - 'Bootstrap 4'
    - 'Angular 1.8'
    - 'Docker Compose'

  # FAQ
  faq:
    - question: 'ما هو Medev؟'
      answer: 'Medev هو نسخة معاد تسميتها من Medev v7.0.3+ — نظام السجلات الصحية الإلكترونية وإدارة الممارسة الطبية الرائد في العالم مفتوح المصدر. يعمل على VPS عبر Docker.'

    - question: 'ما الميزات التي يتضمنها Medev؟'
      answer: 'يتضمن Medev سجلات صحية إلكترونية كاملة (سجلات المرضى والزيارات والعلامات الحيوية والملاحظات والوصفات)، إدارة الممارسة (الجدولة والمواعيد والفواتير)، بوابة المرضى، FHIR R4 + REST API مع OAuth2، وتكامل تطبيقات SMART على FHIR v2.2.0.'

    - question: 'هل يمكنني تخصيص الواجهة الأمامية للمرضى؟'
      answer: 'نعم! يتضمن Medev موقع ويب أمامي قابل للتخصيص يمكن لعيادتك أو مستشفى تخصيصه ليطابق علامة عيادتك ومتطلبات التصميم. تحدد المظهر؛ نبنى الواجهة الخلفية الموحدة مع الميزات والإضافات المتاحة.'

    - question: 'هل Medev مستضاف ذاتياً؟'
      answer: 'نعم، Medev مستضاف ذاتياً بالكامل عبر Docker. لديك سيطرة كاملة على بياناتك. نوفر أيضاً خيارات الاستضافة إذا كنت تفضل أن نتولى إدارتها لك.'
---

## حول Medev

Medev هو نظام إدارة الرعاية الصحية المبني للعيادات والمستشفيات التي تريد سيطرة كاملة دون تعقيد. سواء كنت تستضيفه بنفسك أو نستضيفه لك، تحصل على حل كامل مع موقع ويب أمامي قابل للتخصيص يعكس علامتك.

### مبني للرعاية الصحية الحديثة

جمع Medev متانة أنظمة الرعاية الصحية على مستوى المؤسسات مع مرونة تقنية مفتوحة المصدر. مصمم لينمو مع ممارستك — من العيادات الصغيرة إلى شبكات المستشفيات الكبيرة.

### علامتك، أسلوبك

يمكن تخصيص موقع الويب الأمامي المضمن ليتطابق مع هوية عيادتك. تتحكم في تجربة المريض بينما تظل الواجهة الخلفية موحدة مع العديد من الميزات والإضافات المتاحة.

## جاهز لتحويل ممارستك؟

تواصل معنا لمعرفة كيف يمكن لـ Medev تبسيط عمليات الرعاية الصحية الخاصة بك.
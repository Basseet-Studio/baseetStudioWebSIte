---
title: 'Medical Education App (MAI)'
description: 'AI-powered medical education platform for resident doctors with clinical decision support and personalized learning.'
date: 2026-01-27
draft: false
layout: 'single'

# Project Details
project:
  name: 'Medical Education App (MAI)'
  slug: 'medical-education-app'
  tagline: 'AI-Powered Medical Education Platform'
  iconClass: 'fas fa-stethoscope'
  color: '#0F766E'
  gradient: 'linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)'
  status: 'MVP Proof of Concept'
  platforms:
    - name: 'iOS'
      icon: 'fab fa-apple'
      version: 'iOS 15+'
      link: '#'
    - name: 'Android'
      icon: 'fab fa-android'
      version: 'Android 8+'
      link: '#'
    - name: 'Web'
      icon: 'fas fa-globe'
      version: 'Web App'
      link: '#'
    - name: 'Desktop'
      icon: 'fas fa-desktop'
      version: 'macOS | Windows'
      link: '#'

  # Hero Section
  hero:
    title: 'Clinical Learning, Reinvented'
    subtitle: 'An AI-powered education platform that blends clinical decision support, patient case management, and personalized learning for resident doctors.'
    cta_primary: 'Request Demo'
    cta_secondary: 'Explore Features'

  # Features
  features:
    - title: 'Clinical Decision Support'
      description: 'Two-stage differential diagnosis workflow with history taking, physical exam, tests, and management planning.'
      icon: 'fas fa-user-doctor'

    - title: 'Case Management'
      description: 'Patient dashboard with filtering, new case workflow, privacy settings, and tabbed case views.'
      icon: 'fas fa-folder-open'

    - title: 'Medical Imaging'
      description: 'DICOM upload simulation, AI scan analysis, annotated viewer, comparisons, and report generation.'
      icon: 'fas fa-x-ray'

    - title: 'Pharmacology & Drug Safety'
      description: 'Treatment plans, interaction alerts, dosing calculator, and alternative medication suggestions.'
      icon: 'fas fa-pills'

    - title: 'Clinical Rounds'
      description: 'Rounds dashboard, voice recording simulation, AI transcript review, and automated summaries.'
      icon: 'fas fa-notes-medical'

    - title: 'Personalized Learning'
      description: 'Learning hub with mind maps, flashcards, quizzes, audio summaries, videos, and guideline scenarios.'
      icon: 'fas fa-graduation-cap'

    - title: 'Analytics & Progress'
      description: 'Performance dashboard, mastery heatmaps, and case completion tracking.'
      icon: 'fas fa-chart-line'

  # Tech Stack
  tech:
    - 'Flutter 3.9+'
    - 'Dart 3.9+'
    - 'Provider'
    - 'Go Router'
    - 'Faker (Mock Data)'
    - 'fl_chart'

  # FAQ
  faq:
    - question: 'Is this connected to real patient data?'
      answer: 'No. This MVP uses mock data only. It is designed as a proof-of-concept for educational workflows.'

    - question: 'Does it support multiple platforms?'
      answer: 'Yes. The app targets iOS, Android, Web, and Desktop using Flutter’s multi-platform capabilities.'

    - question: 'Can this be integrated with a backend?'
      answer: 'Planned for future phases. The roadmap includes REST APIs, authentication, and cloud persistence.'
---

## About MAI

Medical Education App (MAI) is an AI-powered learning and clinical decision support platform built for resident doctors. It combines realistic case simulations, structured diagnostic workflows, and personalized learning tools into one integrated experience.

### Core Modules

- Clinical decision support (two-stage differential diagnosis)
- Patient case management and documentation
- Medical imaging workflows with AI annotations
- Pharmacology safety checks and dosing tools
- Clinical rounds summaries and document generation
- Personalized learning with quizzes, flashcards, and mind maps

### Architecture

MAI follows a clean, feature-first architecture with a shared core layer and mock data generation service. State management uses the Provider pattern, and routing is handled with Go Router.

### Mock Data System

The MVP uses a robust mock data service to simulate ICD-10 diagnoses, patient demographics, lab results, and learning progress for realistic workflows.

### Testing

The project includes widget tests, feature tests, and property-based tests to validate data consistency and UI behavior across devices.

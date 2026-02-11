<!--
  Sync Impact Report
  ───────────────────
  Version change: N/A → 1.0.0 (initial adoption)
  Modified principles: N/A (first ratification)
  Added sections:
    - Core Principles (5 principles)
    - Technology Stack & Standards
    - Development & Deployment Workflow
    - Governance
  Removed sections: N/A
  Templates requiring updates:
    - .specify/templates/plan-template.md        ✅ no update needed (dynamic placeholder)
    - .specify/templates/spec-template.md         ✅ no update needed (generic)
    - .specify/templates/tasks-template.md        ✅ no update needed (generic)
    - .specify/templates/checklist-template.md    ✅ no update needed (generic)
    - .specify/templates/agent-file-template.md   ✅ no update needed (generic)
  Follow-up TODOs: none
-->

# Baseet Studio Website Constitution

## Core Principles

### I. Performance & Core Web Vitals

Every page MUST load in under 3 seconds on a 3G connection.
All images MUST use Hugo's image processing pipeline with
responsive srcsets and lazy loading. CSS and JS assets MUST be
minified and bundled in production builds (`hugo --minify`).
No external runtime JavaScript frameworks are permitted; vanilla
JS only. Third-party scripts (analytics, fonts) MUST be loaded
asynchronously and MUST NOT block the critical rendering path.

**Rationale**: Baseet Studio's website is its primary sales
channel. Slow pages directly reduce conversion and credibility.

### II. Bilingual Parity (NON-NEGOTIABLE)

Every user-facing content change MUST be reflected in both
English (`en`) and Arabic (`ar`) before merging. This includes
Markdown content files, YAML data files, and i18n string keys
in `i18n/en.yaml` and `i18n/ar.yaml`. Arabic pages MUST render
correctly in RTL layout. New i18n keys MUST exist in both
language files; missing keys MUST cause a build-time or review
failure.

**Rationale**: The studio serves bilingual audiences. Partial
translations erode trust and create a broken user experience.

### III. Content-Data Separation

All page content MUST reside in `data/` (YAML) or `content/`
(Markdown) files — never hard-coded in Hugo templates or
partials. Templates in `layouts/` MUST be purely structural,
reading from data contexts. Adding a new project, service, or
team member MUST NOT require editing any HTML template.

**Rationale**: Non-developers (content editors, translators)
must be able to update the site without touching code.

### IV. Static-First Architecture

The production site MUST be fully functional as static HTML/CSS
served from any CDN or static host. Server-side logic (e.g.,
contact form submission) MUST be delegated to external services
(Web3Forms, serverless functions) and MUST degrade gracefully
when those services are unavailable. No feature may introduce a
server-side runtime dependency in the Hugo build output.

**Rationale**: Static sites are cheaper to host, faster to
serve, and simpler to secure than server-rendered alternatives.

### V. Visual & Brand Consistency

All UI changes MUST conform to the defined color profile:
- Stroke/Text: `#171D1C`
- Primary: `#496BC1`
- Secondary: `#C2CCCF`
- Tertiary: `#FBCD37`
- Surface: `#EBEBEB`

New colors MUST be added to `tailwind.config.js` before use
and MUST be justified in the PR description. Responsive
breakpoints MUST follow Tailwind's default scale. Every page
MUST be visually verified at mobile (375px), tablet (768px),
and desktop (1280px) widths before merge.

**Rationale**: Brand inconsistency signals unprofessionalism
for an agency whose product is design itself.

## Technology Stack & Standards

- **Static Site Generator**: Hugo Extended v0.152.2+
  with Go modules for theme management.
- **CSS**: Tailwind CSS v4.x via `@tailwindcss/cli`,
  with `@tailwindcss/typography` and Autoprefixer.
- **Testing**: Vitest with jsdom environment. Tests
  live alongside source in `assets/js/` or in a
  dedicated `tests/` directory.
- **Linting & Formatting**: ESLint (flat config) +
  Prettier with `prettier-plugin-go-template` and
  `prettier-plugin-tailwindcss`. All code MUST pass
  `npm run lint` and `npm run format` before merge.
- **Containerization**: Multi-stage Docker build
  (Node 20 + Hugo build → Nginx Alpine serve).
- **Deployment**: Static output in `public/` served
  via Nginx or any static host
  (GitHub Pages, Netlify, Coolify).

## Development & Deployment Workflow

1. **Branching**: Feature work MUST happen on a
   dedicated branch off `main`. Direct pushes to
   `main` are prohibited.
2. **Local verification**: Before opening a PR,
   the developer MUST run:
   - `npm run lint` (zero errors)
   - `npm run test` (all tests pass)
   - `npm run build` (clean production build)
3. **Review gates**: PRs MUST be reviewed for
   bilingual parity (Principle II), brand compliance
   (Principle V), and performance impact (Principle I).
4. **Content changes**: Content-only PRs (YAML/Markdown
   edits) may be self-merged after a successful build,
   provided both language variants are present.
5. **Deployment**: Merges to `main` trigger a production
   build. The Docker image MUST build successfully
   before deployment.

## Governance

This constitution supersedes all informal practices and
ad-hoc decisions. All pull requests and code reviews MUST
verify compliance with the principles above. Any proposed
amendment MUST include:

1. A description of the change and its rationale.
2. Impact analysis on existing content and templates.
3. A version bump following semantic versioning:
   - MAJOR: Principle removal or backward-incompatible
     redefinition.
   - MINOR: New principle or materially expanded guidance.
   - PATCH: Clarifications, wording, or typo fixes.
4. Update to this file with the new version, ratification
   date, and last-amended date.

Complexity MUST be justified. When in doubt, choose the
simpler approach (YAGNI). Use the agent guidance file
for runtime development context.

**Version**: 1.0.0 | **Ratified**: 2026-02-11 | **Last Amended**: 2026-02-11

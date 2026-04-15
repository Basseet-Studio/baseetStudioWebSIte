# Quickstart: Project Pages Redesign

**Feature**: 003-project-pages-redesign  
**Branch**: `003-project-pages-redesign`

---

## Prerequisites

- Hugo Extended installed (check: `hugo version`)
- Node.js 20+ (check: `node --version`)
- Dependencies installed: `npm install`

## Run Locally

```bash
# Switch to feature branch
git checkout 003-project-pages-redesign

# Install dependencies
npm install

# Start dev server
npm run dev
```

Dev server runs at `http://localhost:1313/baseetStudioWebSIte/`

## Verify Changes

### Project Landing Pages

Visit each project and confirm unique layout:

| Project | URL |
|---------|-----|
| Money Box | `http://localhost:1313/baseetStudioWebSIte/projects/money-box/` |
| Numu | `http://localhost:1313/baseetStudioWebSIte/projects/numu/` |
| Matrix | `http://localhost:1313/baseetStudioWebSIte/projects/matrix/` |
| Chopshop | `http://localhost:1313/baseetStudioWebSIte/projects/chopshop/` |
| Deshi Kitchen | `http://localhost:1313/baseetStudioWebSIte/projects/deshikitchen/` |

### Sub-Pages (per project)

Append to any project URL above:
- `/features/` — Features page
- `/demo/` — Demo page
- `/terms/` — Terms & Conditions page

### App Bar

1. Visit homepage → verify main Baseet navigation
2. Click any project → verify app bar transforms to project navigation
3. Click "Baseet" in project nav → returns to homepage
4. Click "Contact Us" in project nav → goes to `/contact/`

### Arabic (RTL)

Prefix any URL with `/ar/`:
- `http://localhost:1313/baseetStudioWebSIte/ar/projects/money-box/`
- Verify RTL layout, Arabic labels, and language switcher

### Footer Detector

Scroll to footer on any page → see "Visiting from: [Country] · Device: [Type]"

## Run Tests

```bash
npm run test         # Run once
npm run test:watch   # Watch mode
```

## Lint & Format

```bash
npm run lint         # ESLint
npm run format       # Prettier
```

## Build for Production

```bash
npm run build
```

Output in `public/`. Verify all 40 URLs (20 EN + 20 AR) generate correctly:

```bash
# Count generated project pages
find public/projects -name "index.html" | wc -l
```

Expected: at least 30 HTML files (5 projects × 4 pages × ~1.5 accounting for nested index files).

## Add a New Project

To add a 6th project with a unique layout:

1. Create `content/projects/<slug>/` directory
2. Add `_index.md` with project front matter (see `contracts/front-matter-schema.md`)
3. Set `layout: <slug>` and `layoutVariant: <slug>`
4. Create `layouts/projects/<slug>.html` with unique layout
5. Create `assets/css/project-<slug>.css` with font imports
6. Create `assets/js/gsap-<slug>.js` with unique animation
7. Add `features.md`, `demo.md`, `terms.md` sub-pages
8. Add Arabic variants (`.ar.md`) for all files
9. Add any new i18n keys to both `i18n/en.yaml` and `i18n/ar.yaml`

## File Map

| What | Where |
|------|-------|
| Project layouts | `layouts/projects/{slug}.html` |
| Sub-page templates | `layouts/projects/features.html`, `demo.html`, `terms.html` |
| Project app bar | `layouts/partials/project-header.html` |
| Main app bar | `layouts/partials/header.html` (modified) |
| Base template | `layouts/baseof.html` (modified) |
| Footer | `layouts/partials/shared/footer.html` (modified) |
| Project CSS | `assets/css/project-{slug}.css` |
| GSAP animations | `assets/js/gsap-{slug}.js` |
| Visitor detection | `assets/js/visitor-detect.js` |
| i18n strings | `i18n/en.yaml`, `i18n/ar.yaml` |
| Spec | `specs/003-project-pages-redesign/spec.md` |
| Plan | `specs/003-project-pages-redesign/plan.md` |
| Research | `specs/003-project-pages-redesign/research.md` |

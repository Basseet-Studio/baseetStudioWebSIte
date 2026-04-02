# Quickstart: Branded Project Showcase & Site Restructuring

**Feature**: `002-branded-project-showcase`  
**Branch**: `002-branded-project-showcase`

## Prerequisites

- Hugo Extended v0.152.2+ installed (`hugo version`)
- Node.js 20+ installed (`node --version`)
- Dependencies installed: `npm install`

## Local Development

```bash
# 1. Switch to feature branch
git checkout 002-branded-project-showcase

# 2. Install dependencies (if not already)
npm install

# 3. Start dev server
npm run dev
# → http://localhost:1313

# 4. Verify key pages:
#    Main site:           http://localhost:1313/
#    Nomu (branded):      http://localhost:1313/projects/numu/
#    Money Box (branded): http://localhost:1313/projects/money-box/
#    Desi Kitchen:        http://localhost:1313/projects/deshikitchen/
#    ChopShop (branded):  http://localhost:1313/projects/chopshop/
#    Matrix (branded):    http://localhost:1313/projects/matrix/
#    PhotoRestore AI:     http://localhost:1313/projects/photorestore-ai/
#    Clients section:     http://localhost:1313/clients/
#    Arabic variant:      http://localhost:1313/ar/
```

## Build & Verify

```bash
# Run linting
npm run lint

# Run tests
npm run test

# Production build
npm run build

# Check build output
ls public/projects/
# Should contain: numu/ money-box/ deshikitchen/ chopshop/ matrix/
#                 photorestore-ai/ medical-education-app/ ...

ls public/clients/
# Should contain: index.html (renamed from customers)
```

## File Change Map

### Modified Files

| File | Change |
|------|--------|
| `config/_default/menus.yaml` or `hugo.yaml` | Customers → Clients in menu |
| `layouts/baseof.html` | Conditional background loading |
| `layouts/home.html` | Homepage section restructuring |
| `layouts/partials/shared/header.html` | Adaptive app bar logic |
| `layouts/partials/shared/clouds-background.html` | Support multiple background effects |
| `data/home/projects.yaml` | Add type field, ChopShop & Matrix entries |
| `data/customers.yaml` → `data/clients.yaml` | Rename file, FleetOps→Portia Grid, add Iyat |
| `i18n/en.yaml` | New keys for branded nav, clients, etc. |
| `i18n/ar.yaml` | Arabic translations for all new keys |
| `assets/css/app-bar.css` | Branded mode styles |

### New Files

| File | Purpose |
|------|---------|
| `layouts/projects/branded.html` | Branded landing page layout |
| `assets/js/leaves.js` | Nomu background (leaf particle WebGL) |
| `assets/js/paper-notes.js` | Money Box background (paper WebGL) |
| `assets/js/kitchen.js` | Desi Kitchen background (steam WebGL) |
| `assets/js/shopping.js` | ChopShop background (packages WebGL) |
| `assets/js/grid.js` | Matrix background (grid WebGL) |
| `assets/css/branded-effects.css` | Shared branded background CSS |
| `content/projects/chopshop.md` + `.ar.md` | ChopShop content (en/ar) |
| `content/projects/matrix.md` + `.ar.md` | Matrix content (en/ar) |
| `content/clients/_index.md` + `.ar.md` | Clients section index (en/ar) |
| `layouts/clients/list.html` | Clients list layout |

## Verification Checklist

- [ ] App bar shows "Baseet Studio" on main site
- [ ] App bar shows product name on each branded page
- [ ] "Back to Baseet" works on all branded pages
- [ ] Each branded page has a unique background effect
- [ ] Backgrounds fallback gracefully (disable WebGL in DevTools)
- [ ] `prefers-reduced-motion` disables animations
- [ ] Mobile menu works on branded pages
- [ ] Homepage "Our Products" links correctly (branded → landing page, standard → project page)
- [ ] "Clients" label (not "Customers") in nav, headings, URLs
- [ ] Portia Grid shows with correct testimonial
- [ ] Iyat entry visible with working link
- [ ] Arabic versions render correctly (RTL layout)
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds

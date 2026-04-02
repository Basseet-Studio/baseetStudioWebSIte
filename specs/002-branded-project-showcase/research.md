# Research: Branded Project Showcase & Site Restructuring

**Feature**: `002-branded-project-showcase`  
**Date**: 2026-04-02

## R-001: Hugo Layout Override for Branded Pages

**Decision**: Use `layout: branded` in content front matter to load `layouts/projects/branded.html`.

**Rationale**: Hugo supports layout specification in front matter — already used in the codebase (e.g., `content/projects/_index.md` uses `layout: 'projects-list'`, `content/projects/money-box.md` uses `layout: 'single'`). The `layout:` key overrides the default section-based lookup. A new `layouts/projects/branded.html` template extending `baseof.html` can be loaded by any project page that sets `layout: branded`.

**Alternatives considered**:
- **Section-based routing** (create `content/products/` section) — Rejected because products are conceptually still projects under `/projects/`, and a new section would break the existing URL structure.
- **Type-based layout** (`type: branded` in front matter) — Would work, but `layout:` is simpler and already the established pattern in this codebase.

---

## R-002: Adaptive App Bar — Menu Switching Strategy

**Decision**: Use page front matter params (`navMenu`, `brandName`, `brandLogo`) to drive the app bar, with conditional logic in the shared header partial.

**Rationale**: The current header at `layouts/partials/shared/header.html` iterates `site.Menus.main`. For branded pages, we need different navigation items. Three options were evaluated:

1. **Hugo menus per product** — Define `nomu`, `moneybox`, etc. in `hugo.yaml` and switch via `site.Menus.<name>`. Works but creates menu definition sprawl (5 products × 2 languages = 10 menu blocks) and requires rebuilding the entire site when a product's nav changes.

2. **Front matter params** ✅ — Store nav items, brand name, and logo in the content page's front matter. The header partial checks for `{{ .Page.Params.navMenu }}` and renders product-specific nav items or falls back to `site.Menus.main`. This is self-contained per product and follows Constitution Principle III (content-data separation).

3. **Separate partial per layout** — Create `branded-header.html` and include it from the branded layout. This duplicates the header logic (mobile menu, RTL, accessibility). Rejected for DRY reasons.

**Implementation approach**: Modify `layouts/partials/shared/header.html` to:
- Check if `.Page.Params.brandName` exists
- If yes: render the product logo/name and iterate `.Page.Params.navItems` for links
- If no: render the default studio logo and `site.Menus.main`
- Always include a "Back to Baseet" link on branded pages
- Mobile menu follows the same conditional logic

**Alternatives considered**:
- Hugo menus per product — Too much config sprawl for 5 products × 2 languages.
- Separate branded header partial — Duplicates 200+ lines of header logic (mobile menu, RTL, accessibility).

---

## R-003: Header File Relationship

**Decision**: Modify ONLY `layouts/partials/shared/header.html` (the active header).

**Rationale**: There are two header files:
- `layouts/partials/header.html` — Older, simpler, UNUSED
- `layouts/partials/shared/header.html` — Active, referenced in `baseof.html` at line 167 via `{{ partial "shared/header" . }}`

The shared header has full mobile menu logic, active link detection, RTL support, and accessibility features. All app bar modifications go here. The root `layouts/partials/header.html` is legacy and should not be modified.

---

## R-004: Background Effect Architecture

**Decision**: Create per-product WebGL shader classes following the `CloudsRenderer` pattern, loaded conditionally by a modified `clouds-background.html` partial.

**Rationale**: The existing cloud effect uses a well-structured pattern:
1. **WebGL shader class** (`CloudsRenderer` in `assets/js/clouds.js`, ~589 lines) — handles context creation, shader compilation, uniform passing, animation loop, event listeners, auto-pause on tab hidden.
2. **CSS container + fallback** (`assets/css/clouds.css`) — provides fallback gradients for non-WebGL browsers and `prefers-reduced-motion` handling.
3. **Hugo partial** (`layouts/partials/shared/clouds-background.html`) — creates the canvas element, loads JS with Hugo's resource pipeline.
4. **YAML config** (`data/home/clouds.yaml`) — `enable` and `enableOnMobile` flags.

**Per-product effects**: Each effect will be a separate JS file with its own shader class (same interface as CloudsRenderer): `LeafRenderer`, `PaperNotesRenderer`, `KitchenRenderer`, `ShoppingRenderer`, `GridRenderer`. Each renders to the same `#clouds-canvas` element. The Hugo partial determines which renderer to load based on page context.

**Performance strategy** (mirroring clouds.js):
- 0.5x resolution scaling (set `canvas.width = clientWidth * 0.5`)
- Max 50 raymarching/particle steps
- Early exit conditions on opacity/distance
- Auto-pause when tab hidden
- IntersectionObserver for section-scoped effects
- Each effect is ~200-400 lines (simpler than full volumetric clouds)

**Effect concepts**:
| Product | Effect | Approach |
|---------|--------|----------|
| Nomu | Floating leaves | Particle system — 15-20 leaf shapes with drift physics, green tones, subtle wind |
| Money Box | Paper notes | Falling/floating paper rectangles with slight rotation, warm/gold tones |
| Desi Kitchen | Spice/steam | Rising steam wisps with warm orange/spice color palette, soft glow |
| ChopShop | Shopping bags/packages | Falling package outlines with bounce, colorful accent splashes |
| Matrix | Data grid | Animated grid lines with pulse effects, cool blue/cyan tones, matrix-rain inspired |

**Alternatives considered**:
- **CSS-only animations** — Simpler but cannot match the visual richness of the existing WebGL clouds. Would feel like a downgrade.
- **Single universal shader with parameters** — Too complex to make one shader produce leaves AND paper notes AND steam. Separate shaders are cleaner.
- **canvas 2D (non-WebGL)** — Would work for particles but cannot produce the visual quality of shader-based effects. WebGL is already proven in this codebase.

---

## R-005: Customers → Clients Rename

**Decision**: Rename `content/customers/` directory to `content/clients/`, update all references including Hugo section, menus, data files, i18n keys, and layout directory.

**Rationale**: Hugo uses the content directory name as the section name (`.Section` = directory name). Changing `/customers/` to `/clients/` in the URL requires:
1. Rename `content/customers/` → `content/clients/`
2. Rename `layouts/customers/` → `layouts/clients/`
3. Update `hugo.yaml` menu entries: `url: '/customers/'` → `url: '/clients/'`
4. Update `data/customers.yaml` → `data/clients.yaml`
5. Update any template references to `site.Data.customers` → `site.Data.clients`
6. Update i18n keys from `customer_` prefix to `client_` prefix
7. Add Hugo `aliases` in front matter for `/customers/` → `/clients/` redirect

**Alternatives considered**:
- **Keep directory as `customers/`, change only display text** — Would create confusion between URL, section name, and display text. A clean rename is worth the effort.
- **Hugo `url` override in front matter** — Could override the public URL while keeping the directory name, but creates hidden indirection.

---

## R-006: Branded Page Content Front Matter Schema

**Decision**: Extend the existing project front matter with branded-page-specific fields.

**Rationale**: Existing project pages (e.g., `content/projects/numu.md`) already have a rich `project:` front matter object with name, slug, tagline, color, gradient, status, platforms, hero, features, gallery, testimonials, and FAQ. Branded pages will add:
- `layout: branded` — triggers the branded layout
- `project.brandName` — displayed in the app bar (e.g., "Nomu")
- `project.navItems` — array of nav items for the product app bar
- `project.bgEffect` — which background renderer to load (e.g., "leaves", "paper-notes")
- `project.bgFallbackGradient` — CSS gradient for non-WebGL fallback

These fields are optional — omitting them means the page uses the standard project template and studio app bar.

---

## R-007: ChopShop & Matrix — New Product Data

**Decision**: Create new content files and data entries for ChopShop and Matrix following existing patterns.

**Rationale**: Nomu, Money Box, Desi Kitchen, and Photo Restore AI already have content files and data entries. ChopShop and Matrix need:
- `content/projects/chopshop.md` + `.ar.md`
- `content/projects/matrix.md` + `.ar.md`
- Entries in `data/home/projects.yaml`

**ChopShop**:
- B2C shopping platform for vendors
- Color: TBD (suggest `#E11D48` rose/red for commerce energy)
- Status: "Ready to Deliver"
- Nav: Home, Features, Demo, Contact, Back to Baseet

**Matrix**:
- Task management, meetings, project management
- Color: TBD (suggest `#0891B2` cyan for productivity/tech)
- Status: "Coming Soon"
- Nav: Home, Features, Demo, Contact, Back to Baseet

---

## R-008: Iyat & Portia Grid — Client Data

**Decision**: Rename FleetOps to Portia Grid in `data/customers.yaml` (to become `data/clients.yaml`) and add Iyat as a new client entry.

**Rationale**: The existing `data/customers.yaml` has one client entry (FleetOps). Changes needed:
- FleetOps `id: "fleetops"` → `id: "portia-grid"`, `name: "Portia Grid"`
- Add full testimonial for Portia Grid
- Add Iyat entry: digital agency, link to `https://iyat-site.mohameda-elobaid.workers.dev/portfolio`
- Update all i18n keys from `customer_fleetops_*` to `client_portia-grid_*`

**Alternatives considered**: None — this is a straightforward data update.

---
target: projects page design
total_score: 23
p0_count: 2
p1_count: 2
timestamp: 2026-07-01T05-10-34Z
slug: src-pages-projects-index-astro
---
Method: dual-agent (A: 96063f53-7ef8-40af-9353-fe73ce88ebf1 · B: b0d147ed-0fba-4ac0-b6fb-744f22e5cb7e)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Scroll-triggered card reveals give feedback, but no page-level orientation (count, live vs in-progress) |
| 2 | Match System / Real World | 2 | Generic lede and internal status vocabulary ("MVP PoC", "Ready to Deliver") |
| 3 | User Control and Freedom | 3 | Whole-card links, reduced-motion branch, standard nav escape hatches |
| 4 | Consistency and Standards | 2 | `--font-display` (Syne) + bold on h1 breaks Rammetto register; layout diverges from home ProximityProjects |
| 5 | Error Prevention | 3 | Browse-only surface; little to prevent |
| 6 | Recognition Rather Than Recall | 2 | No screenshots on cards; platform icons are hover-only labels |
| 7 | Flexibility and Efficiency | 1 | 13 undifferentiated cards, no filter, search, or featured shortcut |
| 8 | Aesthetic and Minimalist Design | 2 | Six chrome layers per card, low proof density |
| 9 | Error Recovery | 3 | N/A for happy path |
| 10 | Help and Documentation | 2 | No "where to start", no contact CTA, no guidance on Confidential/Coming Soon |
| **Total** | | **23/40** | **Acceptable — significant improvements needed** |

Cognitive load: **6/8 checklist failures** (high load for a 30–60s agency evaluation).

## Anti-Patterns Verdict

**LLM assessment: Likely yes** for a prospect shortlisting agencies. The page stacks three brand DON'Ts in the first viewport — `.proj-index__eyebrow` (tracked uppercase mono kicker), `.proj-card__index` (01/02/03 numbering on every card), and `.proj-index__lede` ("transform ideas into reality" agency-speak). Thirteen structurally identical `.card-window` rows read as a vertical identical-card grid. What saves it: honest translucent card-window tokens, per-project accent tinting, no gradient text or hero metrics.

**Deterministic scan:** 3 advisory findings, all `design-system-radius` — `border-radius: 20px` (`.proj-card__status`, L171), `8px` (`.proj-card__icon--img`, L204), `10px` (`.proj-card__icon--glyph`, L211). None match DESIGN.md rounded tokens (12/14/16/18/24/32px). Not false positives; map to `{rounded.small}`, `{rounded.nested}`, or `{rounded.pill}`.

**Browser overlays:** Not available. Live-server could not start in the assessment environment; Puppeteer not installed for URL scanning. Dev server confirmed HTTP 200 at `/projects/`.

## Overall Impression

The sky-and-window system is doing its job — cards float on the Vanta canvas instead of blocking it. But this page undersells a studio that already built something memorable on the homepage. ProximityProjects is spatial, logo-led, and bespoke; `/projects/` is a labeled catalog with no product imagery. For Fatima (UAE founder, fourth agency site today), the eyebrow + numbered cards + generic lede are exit triggers before she sees any shipped work.

**Single biggest opportunity:** Show the work on the card surface. Strip editorial chrome. Align energy with ProximityProjects.

## What's Working

1. **Card-as-window execution** — `.proj-card__link.card-window` inherits translucent surfaces from `global.css` with no backdrop-filter doubling. Cards read as windows into the sky.

2. **Clean data wiring** — `getProjectsIndex()` feeds typed summaries with accent colors, platforms, and icons from `projects.json`. Extensible without markup churn.

3. **Motion hygiene** — GSAP hero stagger, per-card ScrollTrigger with `once: true`, `prefers-reduced-motion` early return, and `astro:page-load` / `astro:before-swap` cleanup.

## Priority Issues

### [P0] Portfolio shows labels, not work
- **Why it matters:** Prospects cannot judge craft from `.proj-card__tagline` alone. Full `Project` data includes `screenshots[]` but the index never surfaces them.
- **Fix:** Add `.proj-card__media` with hero still or first screenshot per card; lazy-load; keep text secondary.
- **Suggested command:** `/impeccable shape` then `/impeccable layout`

### [P0] Anti-pattern cluster triggers template bounce
- **Why it matters:** Eyebrow + numbered indices + generic lede fire three explicit brand anti-patterns in the first viewport.
- **Fix:** Remove `.proj-index__eyebrow` and `.proj-card__index`; replace lede with one concrete claim or delete it.
- **Suggested command:** `/impeccable distill`

### [P1] Typography breaks brand register
- **Why it matters:** `.proj-index__title` uses `--font-display` (Syne) at `font-weight: 700`. Brand rule: Rammetto One 400 for display; no bold on single-weight faces.
- **Fix:** Use `--font-title` at weight 400; drop 700 on `.proj-card__name`; use size/color for hierarchy.
- **Suggested command:** `/impeccable typeset`

### [P1] Personality cliff vs. home ProximityProjects
- **Why it matters:** Home teases work with morph logos and scattered layout; index feels like a cheaper fallback catalog.
- **Fix:** Adapt proximity/scatter for index (subdued variant), or lead with 3 featured cases + compact list for the rest.
- **Suggested command:** `/impeccable adapt`

### [P2] 13 undifferentiated cards — no IA for evaluators
- **Why it matters:** Prospect cannot quickly answer what's live, UAE-relevant, or consumer vs B2B.
- **Fix:** Group by status (Live / Delivered / In progress) or add filter chips; demote Coming Soon visually.
- **Suggested command:** `/impeccable clarify` + `/impeccable layout`

## Persona Red Flags

**Jordan (first-timer):** "Portfolio" eyebrow doesn't say what to do next. 13 cards with no "start here." Status pills use internal jargon ("MVP PoC", "Ready to Deliver"). Platform icons require hover for meaning.

**Riley (stress tester):** 5× "Coming Soon" raises vaporware suspicion. "Confidential" with no teaser is a trust dead end. Mixed icon treatment (PNG vs Phosphor glyphs). Duplicate accent colors (DeshiKitchen and Zaryn both `#F97316`).

**Casey (mobile):** Long scroll through 13 full-width cards — thumb fatigue. 18px platform icons with no visible labels. Cards start `opacity: 0` before GSAP — blank list if script is slow.

**Fatima (UAE founder, 30–60s threshold):** Eyebrow + centered "Our Projects" = déjà vu from other studios. `01`/`02` numbering = editorial template signal. No product imagery = "they talk about digital products but show icons." Compared to ProximityProjects on home, this page reads as an afterthought.

## Minor Observations

- Double padding from `Page.astro` (120px top) plus `.proj-index` bottom padding — hero feels low relative to app bar.
- `project.gradient` unused on index (good — avoids gradient-card slop).
- Duplicate "Our Projects" heading if user navigated from home ProximityProjects section.
- `.proj-card__cta` inside `<a>` is redundant — whole card is already the link.
- English-only index; no `/ar/projects/` mirror.
- `will-change: transform, opacity` on cards — acceptable for animation.

## Questions to Consider

- If ProximityProjects on the homepage is the real portfolio, what job should `/projects/` own — and should they feel like the same product?
- What remains if you remove every element that doesn't show shipped work?
- Should "Coming Soon" and "Confidential" entries be on a public shortlist, or are they actively hurting trust in the first 30 seconds?

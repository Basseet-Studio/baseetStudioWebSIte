# Design Audit — Baseet Studio

> Source: impeccable critique pass on `baseetStudioWebSIte`.
> **Scope:** 12 project pages, 7 service pages, all `src/components/project/*`, `src/layouts/Project.astro`, `src/styles/projects/*`, `DESIGN.md`.
> **Register:** brand (agency portfolio).
> **Top-line:** the codebase has **6 critical bugs**, **~10 major structural issues**, and **~15 smaller consistency problems**. The good news: most are mechanical fixes once a single product-page template is introduced.

---

## P0 — Bugs that ship broken UI

### 1. `chopshop.css` color is wrong (the brand color is overridden to amber)
File: `src/styles/projects/chopshop.css` lines 3–4

```css
--project-color: #F59E0B;   /* amber */
--project-gradient: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
```

But `src/content/data/projects/chopshop.json` says `color: #E11D48` (rose) and `chopshop.astro` reads `#E11D48`. The CSS file is loaded after the layout's inline `--project-color:#E11D48` and **silently overrides it on `:root`**. Every wash, icon, pill, and testimonial on ChopShop renders in amber instead of rose.

### 2. `medev.css` color is wrong (overridden to blue)
File: `src/styles/projects/medev.css` lines 3–4

```css
--project-color: #3B82F6;   /* blue */
```

But `medev.json` and `medev.astro` use `#0A6E74` (teal). Same override bug as ChopShop. The whole page paints in cobalt blue, not the teal the brand intent specifies.

### 3. Zaryn CTA section has no gradient background
File: `src/pages/projects/zaryn.astro` line 223

```astro
<div style="max-width:1000px;...;color:white;" style={`background:${project.gradient};`}>
```

Two `style` attributes on the same element. Browsers keep only the first, so `background:${project.gradient}` is dropped. The entire "Interested in Zaryn?" CTA renders as a transparent white-text block on the page background. This is the only project with the bug, but it makes Zaryn's final fold visibly broken.

### 4. Zaryn "Get in Touch" button is broken
File: `src/pages/projects/zaryn.astro` line 235

```astro
style="display:inline-flex;...;background:white;color:${project.color};..."
```

The attribute is a static string (note: not the template-literal backtick form). The literal text `color:${project.color}` is shipped to the browser as a CSS declaration. The browser silently ignores the invalid rule, so the button is `background:white; color:inherit` on top of a parent with no background (line 223 bug). Effectively a white pill on the page surface.

### 5. Zaryn dashboard chrome dots are invisible
File: `src/pages/projects/zaryn.astro` lines 84–86

```astro
<div style="width:10px;height:10px;border-radius:50%;background:white/40;"></div>
```

`white/40` is not valid CSS. The browser ignores the background. Three small "macOS-style window dots" render as nothing.

### 6. `medev.astro` and `zaryn.astro` right-column hero visual is hidden on every breakpoint
File: `src/pages/projects/medev.astro` line 86 and `src/pages/projects/zaryn.astro` line 81

```astro
<div style="display:none;position:relative;" class="lg:block">
```

`display:none` in the inline style has higher specificity than `medev.css`'s `.medev-hero-visual { display: block; }` at the `lg` breakpoint. The dashboard mockup is invisible on every screen size, so the split-screen hero renders as a single column with a giant empty right half. The companion CSS rule never wins.

---

## P1 — Brand anti-patterns and structural problems

### 7. Side-stripe border on testimonials
File: `src/components/project/ProjectTestimonial.astro` line 21

```astro
border-left: 3px solid ${projectColor};
```

Exact "side-stripe border" anti-pattern banned in the shared design laws. Replace with full borders, a leading number/icon, or no border.

### 8. Glassmorphism as default
Files: `ProjectFeatureCard.astro`, `ProjectFAQ.astro`, `ProjectTestimonial.astro`, `projects/index.astro`

Every card on every product page uses `class="glass glass-card"`. PRODUCT.md anti-references call this out by name: *"glassmorphism, gradient-bar cards"* are the template tells the studio is trying to move past. Cards should sit on the surface, not float above it.

### 9. 13 different font families on 12 product pages
Each project imports its own Google Fonts:

| Page | Heading | Body |
|---|---|---|
| chopshop | Outfit | DM Sans |
| geeb | Manrope | Inter |
| medev | IBM Plex Sans | IBM Plex Sans |
| numu | Quicksand | Nunito |
| zaryn | Space Grotesk | Inter |
| 7 others | (site default) | (site default) |

The user lands on ChopShop, clicks a card to Geeb, and the typography changes drastically. The site no longer feels like one studio. Pick one project display face and one body face; commit.

### 10. Hardcoded English copy on every page
Every product page has this pattern in 8+ places:

```astro
<span>{/* TODO: localise this later */ 'Key Features'}</span>
<h2>{/* TODO: localise this later */ 'FAQ'}</h2>
<h2>{/* TODO: localise this later */ 'What People Say'}</h2>
<h2>{/* TODO: localise this later */ `Interested in ${project.name}?`}</h2>
<a>{/* TODO: localise this later */ 'Get in Touch'}</a>
<p>{/* TODO: localise this later */ 'Get in touch and we will help you get started.'}</p>
```

The `/ar/` mirror routes exist; the Arabic pages will render the English strings. The hreflang tags advertise a translation that isn't there.

### 11. Massive duplication of the product-page chrome
The hero, features section, gallery, testimonials, FAQ, and gradient CTA are copy-pasted into every one of the 12 product pages with near-identical markup. The only variations are font-family strings, padding values, and one-off decorations. This produces:

- ~1,800 lines of near-duplicate code
- 6 of the P0 bugs above exist *because* the same color is hand-typed into a CSS file in one place and a JSON in another
- Impossible to evolve the product-page template without editing 12 files
- A drift surface: each page invents its own padding, its own opacity value, its own status icon

The fix is one `<ProductLayout>` that takes `{project}` and a small slot, plus 4–5 sub-components (`<ProductHero>`, `<ProductFeatures>`, `<ProductGallery>`, `<ProductTestimonials>`, `<ProductFAQ>`, `<GradientCTA>`).

### 12. Hero layout has five different shapes
No two projects have the same hero:

- **chopshop, matrix, numu, moneybox, photorestore-ai, malaysian-business-websites, nss-virtual-education-fair, bd-railway-automated-timetable, medical-education-app, ordelo** — centered, single-column, icon at top
- **zaryn, medev** — split-screen with a hidden right column (see bug 6)
- **geeb** — completely custom 1,193-line CSS override with floating service icons, glow orbs, and a custom ribbon
- **numu** — also has a `feature-carousel` and `carousel-card` class that **is not defined in `numu.css`** — aspirational CSS, broken code

From a brand perspective, the product page is the studio's strongest asset. Right now it looks like 12 different designers' interpretations.

### 13. Hardcoded colors that break the night theme
Files: `zaryn.astro` lines 95, 117, 121, 126, 152, 163, 180, 235; `medev.astro` lines 87, 104, 105, 111, 115, 119, 126, 130

```astro
<span style="font-weight:700;color:#1C1917;font-size:0.9rem;">...</span>
<div style="font-size:1.5rem;font-weight:700;color:#0E4B4F;">...</div>
```

These bypass `var(--heading-text)` and `var(--muted-text)`. In night mode, the dashboard mockups in Zaryn and Medev render in near-invisible dark text on a near-invisible dark surface. The "dashboard" is unreadable in night mode.

### 14. Inline `onmouseover`/`onmouseout` JS for hover
Found in: `chopshop.astro` lines 77, 84; `matrix.astro` 72–73, 80–81; `medev.astro` 71, 78; `zaryn.astro` 236; and the gradient CTA on every page.

```astro
onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'"
```

Three problems: doesn't fire on touch, can't honor `prefers-reduced-motion`, CSP-unfriendly. Replace with `:hover` CSS rules (the DESIGN.md `button-primary` token already defines a hover state — just use the class).

### 15. The "Get in Touch" CTA copy is identical 12 times
Every product page ends with the same gradient pill saying the same thing. PRODUCT.md voice is *"confident, human, the kind of voice a real engineer would use with a real founder over coffee."* "Get in Touch" is none of those.

### 16. Geeb is a separate website
`src/styles/projects/geeb.css` is **1,193 lines** vs 5–80 lines for the other projects. Geeb has its own custom `geeb-hero`, `geeb-pill`, `geeb-btn`, `geeb-hero__*` classes, plus a service-categories section, a how-it-works section, and a layout that the shared template doesn't account for. This is fine for Geeb, but it should be acknowledged: Geeb is a special-cased template, and the other 11 are re-skinned clones. Decide which is the model.

### 17. Decorative icon mismatch on ChopShop
File: `src/pages/projects/chopshop.astro` lines 33–38

```astro
<Icon name="tag" size={128} color={project.color} />   <!-- top-right -->
<Icon name="truck" size={96} color={project.color} />  <!-- bottom-left -->
```

ChopShop is an e-commerce platform (icon: shopping bag). The decorative icons are a *tag* and a *truck* — the truck loosely matches delivery, but the tag is unrelated. Pick decorative icons that reinforce the product identity, or remove the decoration.

### 18. The hero takes 40%+ of a phone screen
Files: `chopshop.astro` line 31, `medev.astro` line 31, `matrix.astro` line 29, `ordelo.astro` (similar)

```astro
<section class="project-hero" style="padding:140px 24px 80px;...">
```

140px top padding pushes the title well below the fold on a 375×667 mobile viewport. The PRODUCT.md principle "no more than four decision points per page above the fold" is violated because *nothing* is above the fold except sky. Reduce to ~88–96px on mobile.

### 19. The `border-left` testimonial accent also conflicts with the design principle
Beyond the side-stripe ban, the testimonial `border-left: 3px solid ${projectColor}` is 3px of project color that says nothing the project color icon, gradient bar, and avatar doesn't already say. Visual noise.

### 20. The "blob" decoration is everywhere
Files: every gradient CTA section (12 places)

```astro
<div style="position:absolute;top:-80px;right:-80px;width:300px;height:300px;background:white;opacity:0.1;border-radius:50%;filter:blur(60px);"></div>
<div style="position:absolute;bottom:-60px;left:-60px;width:200px;height:200px;background:white;opacity:0.1;border-radius:50%;filter:blur(40px);"></div>
```

Two blurred white circles on a colored background. It is the SaaS gradient hero blob. PRODUCT.md anti-references: "Generic SaaS landing — gradient text, 3-up hero metric strips, glassmorphism as default, identical card grids." This isn't on the list literally, but it is in the same family. The first one of these in `chopshop.astro` lines 147–149 is copy-pasted into every other project page.

---

## P2 — Consistency and craft

### 21. The "status badge" is the same shape on every page
Pill, project color at 8% background, project color at 20% border. 12 near-identical copies. The icon varies (clock, hourglass, check-circle) with no documented rule.

### 22. The "Features" eyebrow + "Key Features" heading is identical
12 copies. Could be a `<SectionHeading eyebrow="Features" title="Key Features" />` component. The current state forces a "TODO: localise" comment in every page.

### 23. Italic on every testimonial quote
`ProjectTestimonial.astro` line 27: `font-style:italic`. Italic body copy on a sans face is rarely the right answer. Quotation marks already do the work.

### 24. Single-letter avatar
`ProjectTestimonial.astro` line 16: `const authorInitial = author.charAt(0).toUpperCase()`. The result is "M" for every Mary, Marc, Mohamed, Maria. A 2-character initial or a placeholder graphic is a 2-line fix.

### 25. The gradient CTA "Get in Touch" has tight horizontal breathing room
`max-width: 1000px` and `padding: 64px 48px`. At 1024px viewport, content has 48px of side padding inside a 1000px block. Generous inside, tight at the edges. Use 80–96px side padding or 56px top/bottom and 64px sides.

### 26. The hero h1 is 3.2rem on every page
`chopshop.astro` line 49, `matrix.astro` line 44, `numu.astro` line 57, `medev.astro` line 45, `zaryn.astro` line 44. Identical. The `font-family` varies, but the size, weight, and `letter-spacing:-0.02em` are copy-pasted. The display rhythm is one decision made 12 times by hand.

### 27. `data-animate="fade-up"` everywhere
Every product page stacks 6–8 `data-animate="fade-up"` elements. The animation library is also `data-animate="fade-in"` and `"fade-up"` only — no other variants. The animation strategy is uniform "everything fades up" with no story.

### 28. The `style="opacity:0.7"` and `style="opacity:0.5"` patterns
Throughout project pages, `opacity` is used to dim text instead of `var(--muted-text)`. In night mode, `opacity:0.5` on a dark text on a dark surface becomes hard to read. The `--muted-text` token exists; use it.

### 29. `numu.astro` references undefined CSS classes
Lines 119–129 use `class="feature-carousel"` and `class="carousel-card"`, but `numu.css` only defines `.floating-icon` and `.float`. The carousel renders as a default `block` div with the inline `style="animation-delay:..."`, which means cards stack vertically with no carousel. Aspirational code.

### 30. Zaryn mixes inline styles, scoped styles, Tailwind, and an external stylesheet
The Zaryn page uses inline `style="..."` for almost everything, but also has `<style>` scoped classes for `.bento-grid`, plus Tailwind utilities (`min-h-[85vh] flex items-center`, `lg:block`), and a `zaryn.css` file. Every other project page picks one approach. Zaryn looks like four iterations of the same page stacked.

### 31. The `<a>` tags with `onmouseover` for hover are accessibility-negative
Beyond the touch problem, screen readers announce the inline JS as a state change. The cards-as-links need a `:focus-visible` ring; the current design has no visible keyboard focus on any product page link.

---

## P3 — Smaller things

### 32. The hero pad varies between `padding:140px 24px 80px;` (chopshop, matrix, medev) and Tailwind `min-h-[85vh] flex items-center py-16` (zaryn). Pick one.

### 33. The "Zaryn" `font-weights: "400,500,700"` (zaryn.json) excludes 600, but the hero uses `font-weight:800` (zaryn.astro line 44). 800 isn't loaded. Falls back to browser synthesis (bold of 700 = fake 800).

### 34. `chopshop.astro` line 33 uses `Icon name="tag"` for a generic decoration, but `tag` is a Phosphor icon, not a project-relevant motif.

### 35. The status icon rule is undocumented — `numu` (Coming Soon) uses `clock`, `geeb` (Coming Soon) uses `hourglass`, `chopshop` (Ready to Deliver) uses `check-circle`, `zaryn` (Ready to Deliver) uses `check-circle`. Some services that share status pick different icons.

### 36. `medev.css` line 8: `.medev-hero-visual { display: none; }` and `@media (min-width: 1024px) { .medev-hero-visual { display: block; } }`. The page's inline `style="display:none"` wins. The CSS is dead code.

### 37. `ProjectFAQ.astro` line 14: `<details>` has no `id` and no `aria-labelledby`. Acceptable for now, but the FAQ should be a list with anchor links from the hero CTAs.

### 38. `ProjectGallery.astro` line 19: `<h2>Screenshots</h2>` is hardcoded English with no TODO comment, while everything else on the page has the TODO. Inconsistency in how the team is tracking localization.

### 39. `numu.astro` line 86: `<div style="position:absolute;top:15%;left:10%;font-size:3rem;color:${project.color};">` is the floating icon style. The font-size is 3rem but the `<Icon size={48}>` is fixed. The font-size inline style is meaningless because the icon's own size wins.

### 40. The mobile-project pages use `text-align:center` on the hero for every project. On a phone, the centered hero makes the title wrap awkwardly; the body copy is constrained to 580px max-width regardless of viewport. Hero typography is locked to desktop thinking.

---

## What's working

- **`Project.astro` and the `.project-hero-wash`** (shared.css) — the theme-aware, fading-out color band is a genuinely good solution to "each project has its own brand color but the site is one design." This is the right pattern to extend, not replace.
- **The per-project JSON schema** — `services.json` and `projects.json` carry color, gradient, fonts, and `layoutVariant`. Once the data is right, the templates can consume it cleanly.
- **The icon system** — local Phosphor SVGs, `resolveIcon()` mapping FA → Phosphor. Sensible.
- **The `cards/card-window` token system in `DESIGN.md`** is thoughtful; it's just that the project pages ignore it and re-invent cards 12 times.
- **The shared `<ProjectFeatureCard>`, `<ProjectTestimonial>`, `<ProjectFAQ>`, `<ProjectCTA>` components** are a good start; the issue is that the rest of the page markup around them is duplicated 12 times instead of pulled into a `<ProductLayout>`.

---

## Recommended fix order

If you want to do this in passes:

1. **Fix the 6 P0 bugs** (60 minutes). All are color/JSX fixes, no design judgment needed.
2. **Extract `<ProductLayout>` + 6 sub-components** (4–6 hours). This collapses ~1,800 lines of duplicate code and unblocks every other fix.
3. **Audit hardcoded English and ship a translation file** (2–3 hours). Every `TODO: localise` becomes a key in `i18n/projects.json`.
4. **Consolidate fonts to 1 heading + 1 body** (1 hour). Pick from the existing pool: Manrope + Inter or Space Grotesk + Inter. Remove the per-page Google Font imports.
5. **Replace `glass glass-card` on project cards** with `card-window` from DESIGN.md (1–2 hours). Drop the side-stripe border on testimonials.
6. **Standardize hero pattern, hero pad, hero h1 size, and gradient CTA** into the new `<ProductLayout>`.
7. **Run `impeccable polish`** as the final pass to catch anything that drifts during consolidation.

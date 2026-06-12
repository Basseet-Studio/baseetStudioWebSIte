# DeshiKitchen — Landing Page Redesign Spec

> Project: DeshiKitchen (slug: `deshikitchen`) — authentic Bangladeshi restaurant ordering platform
> Stack: Astro 5 (SSG) + TypeScript + Tailwind 3 + GSAP + Vanta clouds background (already wired in Base.astro)
> Goal: Unique editorial restaurant layout. Cloud background shows through everywhere. Day/Night theming.

---

## 1 — Brand & Mood

**Brand:** Warm, authentic, modern Bangladeshi kitchen. Premium-but-welcoming, not generic SaaS.
**Color identity:** Warm orange/amber (project color `#F97316`, gradient `#F97316 → #FB923C`). Cream + terracotta accents. No blues, no purples.
**Mood by mode:**
- **Day:** Sunlit morning kitchen — cream/amber washes, soft pastel menus, terracotta badges. Vanta clouds show as a soft blue sky with white clouds.
- **Night:** Warm candlelit dining room — deep umber wash, glowing amber CTAs, orange-on-charcoal typography. Vanta clouds show as a moody night sky with subtle highlights.

**Typography:**
- Heading: **Playfair Display** (700, 800) — editorial serif for restaurant vibe
- Body: **Inter** (400, 500, 600) — clean reading
- Accent: **JetBrains Mono** (500) — for prices, order numbers, "live" badges

---

## 2 — Layout Architecture (Top → Bottom)

### A. Split Editorial Hero
- **Left column (60%)** — massive editorial type, asymmetric. Status chip top-left. Restaurant name in serif. Tagline. Two CTAs ("Visit Site" / "View Menu"). A small "Open Now" pill with live indicator dot.
- **Right column (40%)** — stacked menu-card mockup (3 mini cards: dish name, price, spice indicator, "Bestseller" badge). Slightly rotated, layered.
- Hero background: **translucent** warm wash (NOT solid) so vanta clouds show through.

### B. Stats Marquee (auto-scrolling)
- Horizontal infinite-scroll strip with stats: "1,200+ Dishes", "30-min Avg Delivery", "4.9★", "12 Cities", "Stripe Secured", "Real-time Tracking".
- Subtle gradient fade on edges.
- Day: warm cream bg with orange text. Night: dark translucent strip with amber text.

### C. The Experience (feature section, 3-up with one large)
- Editorial layout: 1 large feature card on the left ("3D Hero Experience" — the standout), 2 small stacked on the right.
- Each card has a Phosphor icon in a soft square, title, body, hover lift.
- This breaks the boring 3-column grid.

### D. Order Flow Timeline
- Horizontal 4-step: **Browse → Cart → Pay → Track**.
- Connected by a soft line that fills with orange as the user scrolls into view (CSS animation, scroll-triggered).
- Each step: Phosphor icon, step number (mono font), title, short body.
- This is the killer section — no other project page has it, and it fits DeshiKitchen's actual product story.

### E. Menu Showcase — "Today's Bestsellers"
- 4-card grid of "menu items" with: dish image (using existing screenshots), price (mono), spice dots (🌶🌶🌶), bestseller badge. Card hover lifts.
- This is the visual hook — looks like a real restaurant menu, not a SaaS grid.

### F. Screenshot Gallery
- Reuse `<ProjectGallery>` component with `galleryType: 'web'` (horizontal scroll-snap).

### G. Tech Stack pills
- Small section, mono-font pills, warm chip background.

### H. Testimonial
- Reuse `<ProjectTestimonial>` (already glass-card + project color).

### I. FAQ
- Reuse `<ProjectFAQ>`.

### J. Gradient CTA + ProjectCTA
- Keep the gradient CTA box and `<ProjectCTA>` (Live status → "Get Started Today").

---

## 3 — Design System Tokens

```
--project-color: #F97316          /* primary orange */
--project-gradient: linear-gradient(135deg, #F97316 0%, #FB923C 100%)
--project-warm-bg: rgba(255, 247, 230, 0.55)   /* day hero wash — translucent so clouds show */
--project-warm-bg-night: rgba(40, 22, 8, 0.55) /* night hero wash */
--project-cream: #FFFBEB
--project-amber: #FDE68A
--project-terracotta: #C2410C
--project-umber: #451A03
--project-spice: #DC2626
--project-mint: #10B981
```

### Surfaces (day)
- Hero wash: `linear-gradient(180deg, rgba(255,251,235,0.55) 0%, rgba(253,230,138,0.35) 50%, rgba(251,191,36,0.15) 100%)` — translucent, clouds visible
- Card surface: `var(--card-bg)` (white-ish, already defined in global.css)
- Menu card: white with terracotta border, soft warm shadow

### Surfaces (night)
- Hero wash: `linear-gradient(180deg, rgba(40,22,8,0.7) 0%, rgba(69,26,3,0.55) 50%, rgba(20,12,4,0.7) 100%)`
- Card surface: `var(--card-bg)` (already dark-glass)
- Menu card: dark glass with amber border, warm glow

### Glass treatment
- All cards use `.glass glass-card` so vanta clouds blur through them.

---

## 4 — Motion

- **Hero entrance:** GSAP stagger fade-up on the editorial type, slight rotation on the menu mockup cards (-3deg / 0 / 3deg).
- **Stats marquee:** pure CSS `@keyframes scroll` infinite linear, paused on hover.
- **Order flow line:** CSS `width` transition on `.dk-step` when it enters viewport (using IntersectionObserver in `<script>`).
- **Menu cards:** hover lift (`translateY(-6px)`) + warm shadow.
- **All animations** respect `prefers-reduced-motion` (already handled in global.ts).

---

## 5 — Files to Touch

1. **`src/styles/projects/deshikitchen.css`** — full rewrite with day/night tokens, marquee, order flow, menu cards, editorial typography.
2. **`src/pages/projects/deshikitchen.astro`** — full rewrite of body. Keep imports, slug, project lookups. New structure per Section 2.
3. **`src/pages/ar/projects/deshikitchen.astro`** — mirror the EN rewrite. RTL flows from `dir="rtl"` on the Base layout; the spec uses CSS logical properties (`margin-inline-start`, etc.) where it matters; otherwise copy structure with deeper relative imports.

**Not touched:** Base.astro, Project.astro, VantaBg, ProjectLayout, project components, projects.json, links.json, **geeb** project.

---

## 6 — Verification Checklist

- [ ] `npm run build` exits 0
- [ ] `npm run preview` (or dev) serves `/projects/deshikitchen/` without console errors
- [ ] Day mode (`data-theme="day"`) renders the warm wash + cream cards + clouds visible
- [ ] Night mode (`data-theme="night"`) renders dark glass + amber accents + clouds dimmed
- [ ] No broken image / icon paths (all Phosphor names resolve)
- [ ] No blue/purple anywhere
- [ ] Marquee scrolls smoothly, pauses on hover
- [ ] Order flow line animates on scroll
- [ ] Mobile (375px) — hero stacks, menu grid 1-col, marquee still scrolls
- [ ] RTL (`/ar/projects/deshikitchen/`) — layout mirrors, text reads right-to-left

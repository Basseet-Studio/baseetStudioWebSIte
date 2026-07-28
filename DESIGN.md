---
name: Baseet Studio
description: Digital product studio in Abu Dhabi. Calm, confident, human; the page is the sky.
colors:
  cobalt: "#496BC1"
  marigold: "#FBCD37"
  cyan-drift: "#0EA5E9"
  cyan-glacial: "#0891B2"
  verdant: "#16A34A"
  plum: "#AF52DE"
  ink: "#171D1C"
  ink-soft: "#1c1917"
  slate-mist: "#C2CCCF"
  bone: "#EBEBEB"
  day-mist: "#f4f8fc"
  page-section: "#f8f7f5"
  night-sky: "#0f1726"
  night-elevated: "rgba(10, 16, 28, 0.68)"
  night-elevated-strong: "rgba(8, 12, 22, 0.82)"
  night-text: "#ebeff8"
  card-window-day: "rgba(255, 255, 255, 0.72)"
  card-window-night: "rgba(10, 16, 28, 0.62)"
  card-border-day: "rgba(0, 0, 0, 0.06)"
  card-border-night: "rgba(255, 255, 255, 0.10)"
  chip-bg-day: "#f5f5f4"
  chip-bg-night: "rgba(255, 255, 255, 0.08)"
  muted-stone: "#78716c"
typography:
  display:
    fontFamily: "'Space Grotesk', system-ui, -apple-system, sans-serif"
    fontWeight: 700
    letterSpacing: "-0.03em"
  accent:
    fontFamily: "'Fraunces', 'Times New Roman', serif"
    fontWeight: 500
    fontStyle: italic
  body:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontWeight: 400
  body-strong:
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
    fontWeight: 600
  arabic:
    fontFamily: "'Amiri Quran', 'Amiri', 'Noto Naskh Arabic', serif"
    fontWeight: 400
  urdu:
    fontFamily: "'Noto Nastaliq Urdu', 'Amiri Quran', 'Noto Naskh Arabic', serif"
    fontWeight: 400
  hindi:
    fontFamily: "'Noto Sans Devanagari', 'Inter', system-ui, sans-serif"
    fontWeight: 600
rounded:
  pill: "9999px"
  soft: "50px"
  panel: "32px"
  card: "24px"
  ticket: "22px"
  nested: "18px"
  metric: "16px"
  chip-square: "14px"
  small: "12px"
  icon: "8px"
  tight: "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  2xl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-primary-service:
    backgroundColor: "{colors.cobalt}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "14px 28px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.pill}"
    padding: "14px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.muted-stone}"
    rounded: "0"
    padding: "0"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.muted-stone}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  nav-link-active:
    backgroundColor: "rgba(73, 107, 193, 0.08)"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  card-window:
    backgroundColor: "{colors.card-window-day}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.card}"
    padding: "32px"
  card-window-tight:
    backgroundColor: "{colors.card-window-day}"
    textColor: "{colors.ink-soft}"
    rounded: "{rounded.nested}"
    padding: "22px"
  eyebrow-chip:
    backgroundColor: "transparent"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.pill}"
    padding: "6px 14px"
  metric-tile:
    backgroundColor: "rgba(255, 255, 255, 0.06)"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.metric}"
    padding: "18px 14px"
  input-field:
    backgroundColor: "{colors.chip-bg-day}"
    textColor: "{colors.ink}"
    rounded: "{rounded.small}"
    padding: "12px 16px"
---

# Design System: Baseet Studio

## 1. Overview

**Creative North Star: "The Open Sky Page."**

The page is the sky. The Vanta clouds are the dominant surface; everything else is type and small color accents floating on it. The studio's work appears as windows into the sky, not as objects blocking it. Confidence comes from the clouds, not from the chrome around them.

The system is calm, confident, and human. It refuses the obvious moves: no 3-up hero metric strips, no glassmorphism as default, no identical card grids, no gradient text, no dark mode by default. The page is mostly page. Density and saturation are earned, not granted.

**Key Characteristics:**
- **Cloud-first.** Every foreground decision is made to belong in the same air as the Vanta clouds, not pasted on top of them.
- **Translucent, never heavy.** Surfaces are lightly tinted and minimally frosted. The clouds show through.
- **Type carries the hierarchy.** Display headings (Space Grotesk) do the work. Body (Inter) stays quiet. Fraunces italic marks a single accent word inside a headline — never a full line.
- **Per-service color is accent, not armor.** The six service colors are used as small highlights — chip backgrounds, icon tints, halo washes — not as full-card fills.
- **Spacious and warm.** Generous padding, generous line height, generous color. The page should feel easy to be in.

**Named Rule: The Open Sky Rule.** The Vanta clouds are the canvas. Foreground elements must let the clouds breathe through them. A surface that obscures the clouds is the wrong surface.

**Named Rule: The Accent-Only Rule.** Per-service color is used at 10% of a surface or less. It earns its rarity. The cobalt, marigold, and plum are seasoning, not paint.

## 2. Colors

**Palette character: a daylight sky over a warm-grey studio floor.** Cobalt, marigold, and the service-family colors are accents. The page is overwhelmingly paper, mist, and cloud.

### Primary
- **Cobalt** (`#496BC1`, oklch(50% 0.16 265)): the studio's anchor. Used on the logo accent, the home hero CTA, the language-switcher active state, the eyebrow chips. Reserve for moments that need to read as the studio, not the service.
- **Marigold** (`#FBCD37`, oklch(88% 0.16 90)): the sun-marker. Used on the Mobile service tint, the focus ring, and the rare pop of warm energy. Less than 5% of the page; its job is to be a wink.

### Secondary
- **Slate Mist** (`#C2CCCF`): a cool warm-grey. Background tints, disabled states, micro-borders. Not a brand color; an atmosphere color.

### Tertiary
- (omitted; the project does not commit to a third named role. Service colors act as functional tertiary, one per service.)

### Service colors (per-service accents, not a third role)
- **Cyan Drift** (`#0EA5E9`, Cloud & DevOps)
- **Cyan Glacial** (`#0891B2`, Internal Tools)
- **Verdant** (`#16A34A`, SEO & Marketing)
- **Plum** (`#AF52DE`, UI/UX Design)

Cobalt and Marigold double as the Web and Mobile service colors respectively. The remaining four are service-only and never appear on chrome, badges, or generic UI.

### Neutral
- **Ink** (`#171D1C`): primary text in day mode. Reads as near-black, not pure black; tinted 1% toward the brand hue.
- **Ink Soft** (`#1c1917`): heading text. Same family, slightly cooler.
- **Bone** (`#EBEBEB`): the studio's light surface. Used for the page section background and as a base for tinted cards.
- **Day Mist** (`#f4f8fc`): the day-mode page background. A 2% blue-white, not a true neutral.
- **Page Section** (`#f8f7f5`): a warm off-white for grouped sections. A 1% warm tint.
- **Night Sky** (`#0f1726`): the night-mode page background. A 2% blue-black, not pure black.
- **Muted Stone** (`#78716c`): secondary text. A 1% warm-grey; the body copy secondary color.
- **Card Window Day** (`rgba(255, 255, 255, 0.72)`): the card-as-window tint. 72% white — translucent enough that the clouds show through.
- **Card Window Night** (`rgba(10, 16, 28, 0.62)`): the night-mode equivalent. Translucent dark.

### Named Rules
**The One Accent Rule.** No screen carries more than 10% of its surface in any single accent color. The cobalt, marigold, and per-service tints are seasoning. If a service color starts to feel "loud," the tint is too saturated, not the layout.

**The No-Black Rule.** Never `#000` or `#fff`. Every neutral is tinted 1–2% toward the brand hue. The day page reads as blue-white, not gray; the night page reads as blue-black, not black.

**The Cloud-Tint Rule.** A surface that obscures the Vanta clouds is the wrong surface. Cards and chips are translucent (72% day / 62% night), never opaque. Borders are 1px and tinted, never black.

## 3. Typography

**Display Font:** Space Grotesk (with system-ui fallback). Weights 400–700. Used for all headings, nav, buttons, numbers, and labels.
**Accent Font:** Fraunces italic (optical sizing on). Weights 400–600. Used only for single emphasized words inside headlines (e.g. "best.", "properly."). Never for full sentences or body copy.
**Body Font:** Inter (with system-ui fallback). Weights 400, 500, 600. Used for paragraphs, lead text, and captions.
**Label Font:** Space Grotesk 600, 12px, uppercase, letter-spacing 0.22em. Eyebrows and section labels.
**Arabic Font:** Amiri Quran (with Amiri and Noto Naskh Arabic fallbacks). Activated by reassigning `--font-body` / `--font-display` under `[lang="ar"]` / `[dir="rtl"]`.
**Urdu Font:** Noto Nastaliq Urdu. Activated under `[lang="ur"]`.
**Hindi Font:** Noto Sans Devanagari. Activated under `[lang="hi"]`.

**Character:** Space Grotesk is geometric and confident; Inter is neutral and readable; Fraunces italic is the rare literary wink on one word. The pairing reads as "the headline is a statement, the body is a conversation, the accent word is a smile."

### Hierarchy
- **Hero / H1** (Space Grotesk 700, `clamp(56px, 7vw + 14px, 118px)`, line-height 0.98, letter-spacing -0.03em): home hero title.
- **Section / H2** (Space Grotesk 700, `clamp(34px, 3.4vw + 14px, 52px)`, letter-spacing -0.02em): section heads.
- **Subhead / H3** (Space Grotesk 600, `clamp(24px, 2vw + 14px, 30px)`, letter-spacing -0.01em): card and feature titles.
- **Lead** (Inter 400, `clamp(19px, 1.4vw + 14px, 23px)`, line-height 1.5): supporting paragraph under a headline.
- **Body** (Inter 400, 17px, line-height 1.6, max 65–75ch): primary content.
- **Body small** (Inter 400/500, 14px): descriptions under stats, team roles.
- **Caption** (Inter 600, 13px, uppercase, letter-spacing 0.06em): small labels and attribution titles.
- **Eyebrow** (Space Grotesk 600, 12px, uppercase, letter-spacing 0.22em): section labels above headlines.
- **Accent word** (Fraunces italic 500, inherits parent size, optical sizing on): single emphasized word inside a headline only.

### Named Rules
**The Three-Face Rule.** Only Space Grotesk, Fraunces, and Inter appear on Latin pages. Locale script faces override the same tokens for ar/ur/hi.

**The Accent-Word Rule.** Fraunces appears only on a single emphasized word inside a headline (via `.type-accent` or scoped strong/em). Never on a full line, sentence, or paragraph.

**The 65ch Body Rule.** Body copy caps at 65–75 characters per line. The wider it goes, the more the eye loses its place.

## 4. Elevation

**The system uses soft lift, not structural shadow.** A card is lifted by 1–2 shadow steps above the page; a hover state lifts it one more. Shadows are always paired with a translucent surface so the clouds show through them.

**The hero halo is the only "structural" elevation.** The Parallax sky hero uses a per-service color halo (z=1) that drifts above the clouds (z=0) and below the type (z=2). Everything else on the page is at the same z as the cards.

### Shadow Vocabulary
- **Card Lift** (`box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06)`): the resting state of every card-window. Soft, ambient, almost invisible.
- **Card Hover** (`box-shadow: 0 12px 40px rgba(0, 0, 0, 0.10)`): on hover, one step up. Combined with `transform: translateY(-4px)`. Never combined with a colored shadow.
- **CTA Lift** (`box-shadow: 0 8px 30px color-mix(in srgb, var(--service-color) 40%, transparent)`): primary buttons on hover. Tinted by the service color, never a generic dark.
- **Hero Halo** (`filter: blur(60px)` over a low-opacity service-color circle): the hero's atmospheric layer. The only `filter: blur` in the system.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow appears as a response to state (hover, focus, elevation) — never as decoration. A card that has a shadow and no hover state is wrong.

**The Translucent-Elevation Rule.** Elevation comes from a translucent surface + a soft shadow, not from a saturated color fill. The sky shows through every elevated surface.

## 5. Components

### Buttons
- **Shape:** fully rounded pill (`9999px`).
- **Primary:** solid cobalt background, white text, 14px 28px padding, no border. Hover lifts (`translateY(-2px)`) and tints a cobalt halo.
- **Service-Primary:** the same shape, but the background swaps to the active service's gradient (a 135° linear from the deeper to the lighter service color). Used on detail-page heroes.
- **Secondary:** transparent background, 1px cobalt-tinted border (25% mix), heading-text color, 14px 24px padding. Hover shifts the border to full cobalt.
- **Ghost:** no background, no border, muted-stone text, no padding. Used for inline links and breadcrumb back-links.

### App Bar (Navigation)
- **Shape:** pill (`50px`) with full backdrop-filter blur. Floats 16px from the top, centered, max 900px wide.
- **Active state:** the active link gets a cobalt background at 8% mix and full cobalt text. No underline; the background is the affordance.
- **Service / project theming:** when a project page is active, the app bar's accent colors shift to the project color. The Services section's accent is the studio cobalt.

### Cards
- **Corner Style:** 24px radius (panel) or 18px radius (compact list).
- **Background:** translucent — `card-window-day` (72% white) in day mode, `card-window-night` (62% dark) in night mode. The clouds show through.
- **Border:** 1px cloud-tinted — `card-border-day` in day, `card-border-night` in night. Never a solid black or white border.
- **Shadow:** the card-lift shadow at rest, the card-hover shadow on hover. No colored shadow.
- **Internal Padding:** 32px (panel), 22px (compact), 18px (metric).
- **The Card-as-Window Test:** if a card completely obscures the Vanta clouds behind it, it is the wrong card. The right card is a window.

### Eyebrow Chips
- **Shape:** pill (`9999px`), 6px 14px padding.
- **Background:** transparent. The chip has a 22%-mixed border in the active color and a 10%-mixed background — barely there.
- **Color:** the active service color (or cobalt on the home page). 0.8rem, weight 600, letter-spacing 0.04em, uppercase. Never carries a "primary" or "important" badge.

### Tech Chips
- **Shape:** pill (`9999px`), 8px 18px padding.
- **Background:** `chip-bg-day` (`#f5f5f4`) in day, `chip-bg-night` in night. The chip is opaque because it carries a label that needs to read at a glance, not float.
- **Color:** `muted-stone` in day, `night-text` at 74% in night. 0.85rem, weight 500.
- **Hover:** border and color shift to the active service color. Confirms the chip is interactive.

### Hero (Parallax Sky)
- **Three layers:**
  1. **z=0:** the Vanta clouds background (unchanged; the studio already ships this).
  2. **z=1:** a per-service color halo — a 60px-blurred circle at low opacity, drifting at a different scroll rate than the clouds. Service-tinted only, never a generic accent.
  3. **z=2:** the eyebrow, h1, subtitle, CTAs, and breadcrumb. Type-led, no decorative shapes.
- **Animation:** the halo drifts; the clouds drift; the type stays still. The page feels like one continuous sky with the studio's name floating in it.
- **Reduced motion:** the halo disappears; the type and clouds stay. Static.

### Form Inputs
- **Style:** 1px `chip-bg-day` border in day, `card-border-night` in night. 12px 16px padding. `12px` radius.
- **Background:** `chip-bg-day` / `chip-bg-night`. Opaque, not translucent — typing needs a stable surface.
- **Focus:** 2px cobalt outline, 2px offset. No color fill on focus; the outline is the affordance.
- **Error:** red text and a red 1px border. No red background.

## 6. Do's and Don'ts

### Do
- **Do** let the Vanta clouds be the page's primary visual. The clouds are not decoration; they are the canvas.
- **Do** use card-as-window for every card — translucent, 1px cloud-tinted border, soft shadow, no fill that obscures the clouds.
- **Do** use Space Grotesk for headings/labels, Inter for body, and Fraunces italic only for a single accent word in a headline.
- **Do** cap body copy at 65–75 characters per line. The wider it goes, the more the eye loses its place.
- **Do** use the per-service color as accent — 10% of a surface or less. Cobalt, marigold, and the service colors are seasoning.
- **Do** honor `prefers-reduced-motion`. Hero halos, scroll transitions, and the typewriter effect all collapse to static.
- **Do** ship WCAG 2.1 AA contrast in both day and night modes, including the tinted surfaces and the service color texts.
- **Do** commit to the parallax-sky hero treatment. The clouds are the motion; the foreground is mostly still.

### Don't
- **Don't** use `backdrop-filter: blur(20px) saturate(180%)` as a default. The clouds are already filtered; doubling it produces the heavy-glass tell.
- **Don't** ship a 3-up hero metric strip. The big-number, small-label, supporting-stats pattern is the SaaS metric template — refuse it.
- **Don't** ship six CSS-only hero animations. The current six widgets do the same job. Distill.
- **Don't** ship card grids of identical icon + heading + text + CTA tiles. Vary the shape — accent, panel, thread, no card at all.
- **Don't** ship a hero with gradient text. Decorative, never meaningful. Use a single solid color, or weight, or size.
- **Don't** ship a dark mode by default. The studio's home opens in day mode; the user toggles night. The studio is not a developer tool.
- **Don't** ship the project page structure (FAQ, deliverables, process, tech, related) with the same `service-section__head` repeated seven times. Vary the section shape so the page has rhythm.
- **Don't** ship placeholder boxes that say "Replace with screenshot or mockup." A studio that sells visual work should ship the visuals, or remove the slot.
- **Don't** ship identical card grids. The category-reflex check: a six-card grid of services is the first training reflex; rework the layout until it isn't.
- **Don't** ship the agency-speak anti-references listed in `PRODUCT.md`: "we deliver excellence," "trusted by 10,000+ companies," "unlimited revisions," "supercharge your workflow," "we don't just X, we Y."
- **Don't** ship full-line italic display or Fraunces on body copy. Accent italic is one word inside a headline only.
- **Don't** ship em dashes. Use commas, colons, semicolons, periods, parentheses, or `--`.

---

*Generated by `impeccable document` from the Baseet Studio codebase on 2026-06-17. Re-run when the design drifts.*

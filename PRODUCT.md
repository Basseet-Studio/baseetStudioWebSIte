# Product

## Register

brand

## Users

Ambitious teams in the UAE and emerging markets who need a digital product partner they can trust to ship end-to-end. Concretely: founders, heads of product, marketing leads, and operations owners at companies that have outgrown freelancers and need a studio that thinks with them, not for them.

Their context when they arrive: they are shortlisting. They have read three or four agency sites already that day. They are skimming for proof the team can actually build what they need, that the timeline and budget are honest, and that the team will think through the problem instead of just executing tickets. They will leave in 30–60 seconds if the page is templatey; they will stay if they feel the studio respects their time and tells the truth.

## Product Purpose

Position Baseet Studio as a calm, capable, in-house engineering team that ships digital products (web, mobile, internal tools, cloud) end-to-end. The site should make a prospect feel they have found a partner, not a vendor.

Success means qualified leads, partnerships that last (the studio's current average is 3 years per client), and clients who come back. The site is the front door of that trust.

## Brand Personality

Voice in three words: **calm, confident, human**.

- **Calm.** Confidence shows up as breathing room and considered choices, not loud color or busy animation. The brand speaks softly because the work is strong.
- **Confident.** Concrete claims, real numbers with sources the prospect can verify, opinions on what is worth building. No hedging, no agency-speak, no "we deliver excellence."
- **Human.** Warm, approachable, and a little bit dry. The studio is in the Gulf; the audience includes founders who would rather talk to a person than read a spec.

The studio already has a strong ear. Phrases like "earn their keep", "ship faster, sleep better", and "we think through the logic with you" are the kind of voice to keep, not sand down. The test for any new copy: would a real engineer say this to a real founder over coffee? If not, rewrite it.

## Aesthetic Direction

Spacious and warm. Generous whitespace, large confident type, photography-led where imagery is available, warm accent color (not neon, not corporate navy, not editorial monochrome). The current services pages lean tech-minimal with template tells (glassmorphism, gradient-bar cards, hero-metric strips); the next iteration should move toward the consumer-warm lane while keeping the engineering credibility.

References in the right family to study (not to copy): **Pitch**, **Gumroad**, **Cereal magazine**, **Loom**, **Apt Studio**. The shared trait: each treats the visitor like a person with limited time and gives the page room to breathe.

## Anti-references

Refuse these patterns, even when they are the obvious move for a digital agency site.

- **Generic SaaS landing.** Gradient text, 3-up hero metric strips, glassmorphism as default, identical card grids, six identical service cards in a row.
- **Stock-photo agency site.** Handshake photos, blue-and-white corporate, "we deliver excellence" copy, partner badges, "trusted by 10,000+ companies" without names.
- **Hyped AI-tool aesthetic.** Dark mode by default, neon accents, gradient meshes, monospace as costume, "supercharge your workflow" copy.
- **Cheap freelancer site.** Skills lists, hourly rates, "100% satisfaction" badges, "unlimited revisions," portfolio galleries of unrelated work.
- **Editorial-typographic reflex.** A display-italic + small-mono + ruled-separator layout as a default, even though the brand is not a magazine. Editorial is one lane, not the catch-all for "designed."

## Design Principles

1. **Show, don't tell.** Every claim on the services page is backed by something a prospect can click through to verify: a real project, a real artifact, a real number with a source. No "12+ Stacks shipped" without the stacks.
2. **Calm over loud.** Confidence comes from breathing room and considered choices, not from saturated color or busy animation. The brand earns attention by being easy to be in.
3. **Spacious, not sparse.** Spacious means every element has room to land. It does not mean elements are missing. Whitespace is a tool, not a default.
4. **Warm, never clinical.** Color, type, and tone should feel approachable. The studio sells to founders, not procurement teams; the page should read like a person, not a process.
5. **Practice what you preach.** The studio ships for clients; the studio's own site should ship the same way: fast, accessible, instrumented, well-typed, verifiable, and bilingual on day one.

## Accessibility & Inclusion

- **Target: WCAG 2.1 AA.** Industry default, achievable, defensible. Revisit AAA only if motion and color budgets allow without compromising the aesthetic.
- **Full Arabic localization scope.** Build `/ar/services/` mirroring `/services/`, plus translations file for the hard-coded eyebrows ("Service", "All services", "What we deliver", "How we work", "Deliverables", "Stack", "FAQ", "Keep exploring") and CTAs. The hreflang tags already advertise Arabic; ship the content. `Amiri Quran` is the planned Arabic display face; the `[lang="ar"]` selectors in `global.css` are already wired.
- **Motion.** All decorative animation must honor `prefers-reduced-motion`. Hero animations collapse to static. Hover transforms (translateY, scale) are exempt as they are response, not choreography.
- **Color contrast.** Clear AA in both day and night modes for text, icons, and tinted backgrounds. Service colors are high-chroma; any text on a tinted background must mix toward the surface color first.
- **Keyboard.** All interactive elements (cards-as-links, FAQ, mobile nav, language switcher) must be reachable and operable with the keyboard alone. Focus rings must be visible in both themes.
- **Cognitive load.** No more than four decision points per page above the fold. The services index should not require a calculator to compare categories.

## Out of scope for now

- DESIGN.md is not written yet. Run `impeccable document` to generate it from the existing CSS tokens (`src/styles/global.css`, `src/styles/glass.css`, `src/styles/services.css`) and per-service color data. Until then, this PRODUCT.md is the only context file future commands will read.
- The six service hero animations (`anim-browser`, `anim-phone`, `anim-dashboard`, `anim-chart`, `anim-palette`, `anim-cloud`) are flagged for review under the "spacious, not sparse" and "warm, never clinical" principles. Likely outcome: distill to one committed treatment rather than six similar widgets.

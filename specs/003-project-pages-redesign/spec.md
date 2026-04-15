# Feature Specification: Project Pages Redesign — Unique Layouts, Standalone Pages & Smart Navigation

**Feature Branch**: `003-project-pages-redesign`  
**Created**: 2026-04-15  
**Status**: Draft  
**Input**: User description: "Redesign all five project landing pages (Money Box, Numu, Matrix, Chopshop, Deshi Kitchen) with completely unique and distinct layouts per project. Create standalone Features, Demo, and Terms & Conditions pages for each project. Redesign the app bar so it transforms to project-specific navigation when inside a project. Add GSAP-based scroll animations unique per project. Add a country and device detector displayed in the footer."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Unique Project Landing Pages (Priority: P1)

A visitor navigates to any of the five project pages (Money Box, Numu, Matrix, Chopshop, Deshi Kitchen) and immediately sees a landing page with a layout, component arrangement, typography, and micro-interactions that are completely distinct from every other project. Each project retains its existing branded background effect (paper-notes, clouds, etc.) but differs in section order, component style, font pairing, and animation approach. Currently Chopshop and Deshi Kitchen share an identical layout — this must be resolved so every project feels like its own product site.

**Why this priority**: The core request — each project must feel like a standalone branded experience. Without this, all downstream pages (features, demo, terms) lack a visual identity to inherit.

**Independent Test**: Navigate to each of the five project pages side-by-side and verify that no two share the same section layout, font stack, or component arrangement, while background effects remain intact.

**Acceptance Scenarios**:

1. **Given** a visitor is on the Money Box page, **When** they compare it to Numu, **Then** they see different section ordering, different fonts, and different component designs (e.g., cards vs. tiles vs. accordion vs. timeline)
2. **Given** a visitor is on the Chopshop page, **When** they compare it to Deshi Kitchen, **Then** the layouts are completely different despite both previously using the same template
3. **Given** a visitor views any project page, **When** the page loads, **Then** the project's existing branded background effect (clouds, paper-notes, etc.) is preserved
4. **Given** a visitor views a project page on mobile, **When** the layout renders, **Then** the unique design adapts responsively without breaking

---

### User Story 2 — Project-Specific App Bar Navigation (Priority: P1)

When a visitor enters a project section (e.g., Money Box), the app bar transforms from the main Baseet Studio navigation into a project-branded navigation bar. The project app bar shows: **[Project Logo/Name] — Home | Features | Download | Terms | Baseet | Contact Us | Language Selector**. "Contact Us" links to the main Baseet contact page. "Baseet" links back to the Baseet Studio homepage. The app bar styling (logo, colors) reflects the current project brand. The app bar layout remains structurally identical across all five projects — only content and branding change.

**Why this priority**: Navigation context is essential for the standalone project experience. Without the redesigned app bar, visitors cannot navigate between standalone pages (features, demo, terms) within a project.

**Independent Test**: Click into any project, verify the app bar transforms to project-specific navigation. Click each link and confirm correct destinations. Click "Baseet" to return to main site.

**Acceptance Scenarios**:

1. **Given** a visitor is on the Baseet Studio homepage, **When** they navigate to Money Box, **Then** the app bar transitions to show: Money Box logo, Home, Features, Download, Terms, Baseet, Contact Us, Language Selector
2. **Given** a visitor is on the Money Box Features page, **When** they click "Baseet", **Then** they return to the Baseet Studio homepage
3. **Given** a visitor is on any project page, **When** they click "Contact Us", **Then** they go to the main Baseet contact page
4. **Given** a visitor is on any project page, **When** they switch language, **Then** the app bar labels update to the selected language (EN/AR) and layout adjusts for RTL
5. **Given** a visitor is on a project that has no demo (e.g., Matrix, Deshi Kitchen as web apps), **When** they view the app bar, **Then** the "Download" link is replaced by "Demo" linking to the demo placeholder page

---

### User Story 3 — Standalone Features Pages (Priority: P2)

Each of the five projects has a dedicated standalone Features page at its own URL path (e.g., `/projects/money-box/features/`). The page showcases that project's features in a layout and presentation style consistent with that project's unique identity. Content presents the features already defined in each project's front matter data, displayed with project-branded styling.

**Why this priority**: Features pages give each project depth beyond the landing page. They are referenced in the project app bar and are a natural next step for visitors.

**Independent Test**: Navigate to each project's features URL and verify: page loads, features display correctly, styling matches the project identity, app bar shows project navigation.

**Acceptance Scenarios**:

1. **Given** a visitor is on Money Box's landing page, **When** they click "Features" in the app bar, **Then** they navigate to `/projects/money-box/features/` and see Money Box features presented in Money Box's unique style
2. **Given** a visitor loads `/<lang>/projects/<project>/features/`, **When** the page renders, **Then** the project-specific app bar is shown with "Features" highlighted as active
3. **Given** a visitor views a features page on mobile, **When** they scroll, **Then** features display responsively and animations trigger correctly

---

### User Story 4 — Standalone Demo Pages (Priority: P2)

Each project has a standalone Demo page at its own URL path (e.g., `/projects/money-box/demo/`). For Money Box and Numu (mobile apps), the demo page shows download links / app store links and interactive previews. For Chopshop (web app with live demo available), the demo page embeds or links to the live demo. For Matrix and Deshi Kitchen (web apps without a live demo yet), the demo page shows a branded "Coming Soon" placeholder matching the project's visual identity.

**Why this priority**: Demo access is a primary conversion action for potential clients. The demo page is linked from the project app bar.

**Independent Test**: Navigate to each project's demo URL. Verify apps with demos show actionable download/access links. Verify Matrix and Deshi Kitchen show branded placeholder content.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/projects/money-box/demo/`, **When** the page loads, **Then** they see download/platform links for Money Box
2. **Given** a visitor navigates to `/projects/matrix/demo/`, **When** the page loads, **Then** they see a branded placeholder stating the demo is coming soon, styled in Matrix's identity
3. **Given** a visitor navigates to `/projects/deshikitchen/demo/`, **When** the page loads, **Then** they see a branded placeholder stating the demo is coming soon, styled in Deshi Kitchen's identity
4. **Given** a visitor is on a demo page, **When** they view the app bar, **Then** the project navigation is present and "Demo" or "Download" is the active link

---

### User Story 5 — Standalone Terms & Conditions / Privacy Policy Pages (Priority: P2)

Each of the five projects has its own Terms & Conditions page at a dedicated URL path (e.g., `/projects/money-box/terms/`). All five pages follow the same structural template (identical section headings and layout skeleton) but are branded to each project's visual identity (colors, fonts). The page content is placeholder only — the owner will fill in the actual legal text later. The terms page is linked from the project-specific app bar.

**Why this priority**: Legal pages are required for app store compliance and professional presentation. They are referenced in the project app bar under "Terms."

**Independent Test**: Navigate to each project's terms URL. Verify: page loads, placeholder structure is present, project branding is applied, no actual legal text is present (just placeholder markers indicating where text goes).

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/projects/money-box/terms/`, **When** the page loads, **Then** they see a structured terms page with section headings and placeholder content, branded in Money Box's style
2. **Given** a visitor navigates to each of the five project terms pages, **When** they compare layouts, **Then** all five follow the same structural template (same sections, same order) but differ in color scheme and typography matching their parent project
3. **Given** the site owner looks at a terms page, **When** they inspect the content, **Then** they find clearly marked placeholder areas where they can add their own legal text

---

### User Story 6 — GSAP Scroll Animations Per Project (Priority: P3)

Each of the five project landing pages uses one to two GSAP-powered scroll-triggered animations that are unique to that project. No two projects share the same GSAP animation effect. Animations are subtle and enhance individuality without overwhelming content. The existing vanilla JS Intersection Observer animations on the main Baseet site remain unchanged. GSAP is only loaded on project pages.

**Why this priority**: Animations add polish and differentiation but are not structural. They enhance the unique feel established by layout and typography.

**Independent Test**: Visit each project page, scroll through, and verify that GSAP animations trigger. Compare animations across projects and confirm no two are identical.

**Acceptance Scenarios**:

1. **Given** a visitor scrolls down Money Box's page, **When** a section enters the viewport, **Then** a GSAP animation unique to Money Box triggers (e.g., staggered card reveal)
2. **Given** a visitor scrolls down Numu's page, **When** a section enters the viewport, **Then** a GSAP animation unique to Numu triggers, different from Money Box (e.g., parallax text slide)
3. **Given** a visitor views a project page on a low-powered device, **When** animations play, **Then** performance remains smooth (no jank, animations are GPU-friendly)
4. **Given** a visitor is on the main Baseet homepage, **When** they scroll, **Then** existing Intersection Observer animations work as before — no GSAP is loaded

---

### User Story 7 — Country & Device Detector in Footer (Priority: P3)

Every page on the site (both main Baseet pages and project pages) displays the visitor's detected country and device type in the footer area. Detection is lightweight and non-intrusive — it uses the browser's built-in capabilities and a free geolocation service. The information is shown purely for the site owner's visibility (displayed in the footer for the owner to see during visits) and has no functional impact on the site experience.

**Why this priority**: A nice-to-have diagnostic feature. Low priority since it doesn't affect core navigation or project presentation.

**Independent Test**: Load any page on the site, scroll to footer, verify country name and device type (mobile/desktop/tablet) display. Test from different devices and verify accuracy.

**Acceptance Scenarios**:

1. **Given** a visitor loads any page, **When** they scroll to the footer, **Then** they see a small text line showing their detected country and device type (e.g., "Visiting from: UAE · Device: Mobile")
2. **Given** a visitor is on a slow connection, **When** country detection fails or times out, **Then** the footer gracefully falls back to showing "Unknown" for country without layout breakage
3. **Given** a visitor is on a desktop browser, **When** the device detector runs, **Then** it correctly identifies "Desktop" (not "Mobile" or "Tablet")

---

### Edge Cases

- What happens when a project has no features defined in front matter? — The features page shows a branded empty state with the message "Features coming soon"
- What happens when a visitor navigates directly to a project sub-page via URL (e.g., `/projects/numu/terms/`) without first visiting the landing page? — The page loads correctly with full project branding and project-specific app bar
- What happens when a visitor toggles language on a project sub-page? — The URL updates to the localized version and all content (app bar, headings, placeholders) reflects the selected language
- What happens when JavaScript is disabled? — Background effects degrade to CSS gradient fallbacks (existing behavior). GSAP animations do not run but layout remains intact. Country/device detector does not show (acceptable graceful degradation)
- What happens when a new project is added in the future? — The template system allows adding a new project by defining its front matter (layout variant, font, animation choice) without creating new template files

## Requirements *(mandatory)*

### Functional Requirements

#### Unique Project Landing Pages

- **FR-001**: Each of the five projects (Money Box, Numu, Matrix, Chopshop, Deshi Kitchen) MUST have a completely distinct landing page layout — different section ordering, different component types (e.g., feature cards, timelines, split-screen hero, tabbed content), and different font pairings
- **FR-002**: Chopshop and Deshi Kitchen MUST no longer share the same landing page layout — each MUST have its own unique design
- **FR-003**: Each project landing page MUST retain its existing branded background effect (paper-notes, clouds, etc.)
- **FR-004**: Each project landing page MUST be fully responsive across desktop, tablet, and mobile viewports

#### Project-Specific App Bar

- **FR-005**: When a visitor is inside any project section, the app bar MUST transform to show project-specific navigation: [Project Name/Logo] — Home | Features | Download/Demo | Terms | Baseet | Contact Us | Language Selector
- **FR-006**: The "Baseet" link in the project app bar MUST navigate to the Baseet Studio homepage
- **FR-007**: The "Contact Us" link in the project app bar MUST navigate to the main Baseet Studio contact page
- **FR-008**: The "Download" label MUST be used for mobile apps (Money Box, Numu) and "Demo" MUST be used for web apps (Matrix, Chopshop, Deshi Kitchen)
- **FR-009**: The app bar structure MUST remain identical across all five projects — only branding (logo, colors) and label text change
- **FR-010**: The app bar MUST support both LTR (English) and RTL (Arabic) layouts
- **FR-011**: The active page link in the app bar MUST be visually highlighted

#### Standalone Feature Pages

- **FR-012**: Each project MUST have a standalone Features page at a dedicated URL path under its project directory
- **FR-013**: The Features page MUST display the project's features from its data source in a style consistent with the project's unique visual identity
- **FR-014**: The Features page MUST show the project-specific app bar with "Features" as the active link

#### Standalone Demo Pages

- **FR-015**: Each project MUST have a standalone Demo page at a dedicated URL path under its project directory
- **FR-016**: For projects with available downloads (Money Box, Numu), the Demo page MUST show platform download links
- **FR-017**: For projects with a live web demo (Chopshop), the Demo page MUST link to or embed the live demo
- **FR-018**: For projects without a live demo (Matrix, Deshi Kitchen), the Demo page MUST show a branded "Coming Soon" placeholder
- **FR-019**: The Demo page MUST show the project-specific app bar

#### Standalone Terms & Conditions Pages

- **FR-020**: Each project MUST have a standalone Terms & Conditions page at a dedicated URL path under its project directory
- **FR-021**: All five Terms pages MUST follow the same structural template (identical section headings: Introduction, Terms of Use, Privacy Policy, Data Collection, User Rights, Contact Information)
- **FR-022**: Terms pages MUST contain placeholder content only — no actual legal text
- **FR-023**: Terms pages MUST be branded to their parent project's color scheme and typography
- **FR-024**: The Terms page MUST show the project-specific app bar with "Terms" as the active link

#### GSAP Animations

- **FR-025**: Each project landing page MUST use one to two GSAP-powered scroll-triggered animations
- **FR-026**: No two projects MUST share the same GSAP animation combination
- **FR-027**: GSAP MUST only be loaded on project pages, not on main Baseet site pages
- **FR-028**: GSAP animations MUST be GPU-friendly and not cause layout shifts or jank

#### Country & Device Detector

- **FR-029**: Every page on the site MUST display the visitor's detected country and device type in the footer
- **FR-030**: Country detection MUST use a lightweight, free geolocation lookup with a reasonable timeout
- **FR-031**: Device detection MUST categorize as Mobile, Tablet, or Desktop
- **FR-032**: If detection fails, the footer MUST fall back gracefully to "Unknown" without breaking layout

### Key Entities

- **Project**: Represents one of the five product projects. Key attributes: name, slug, color, gradient, background effect, layout variant, font pairing, GSAP animation choice, gallery type (mobile/web), project status, app bar label for download/demo
- **Project Sub-Page**: A child page under a project (Features, Demo, Terms). Key attributes: parent project reference, page type, URL path, active nav link identifier
- **App Bar State**: Two modes — main site navigation and project-specific navigation. Key attributes: current context (site or project), project reference (if project mode), active link, language direction
- **Visitor Info**: Detected visitor metadata. Key attributes: country name, device category (Mobile/Tablet/Desktop)

## Assumptions

- The five projects in scope are: Money Box, Numu, Matrix, Chopshop, and Deshi Kitchen. Other projects on the site (PhotoRestore AI, Medical Education App, etc.) are out of scope and keep their current layouts
- "Download" is the appropriate label for mobile-first apps (Money Box, Numu); "Demo" is the appropriate label for web apps (Matrix, Chopshop, Deshi Kitchen)
- Chopshop has a live demo available; Matrix and Deshi Kitchen do not yet
- The country detector will use a free IP-based geolocation service (e.g., ip-api.com or similar free tier service)
- Device detection will use standard browser-based techniques to identify the visitor's device category
- Terms page section headings follow a standard structure: Introduction, Terms of Use, Privacy Policy, Data Collection, User Rights, Contact Information
- Font pairings for each project will be sourced from Google Fonts (free, widely available)
- Existing projects not listed (PhotoRestore AI, etc.) continue to use the current branded.html template unchanged
- GSAP library will be loaded from a CDN on project pages only
- The Numu project page does not currently exist in the content directory but will follow the same pattern

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All five project landing pages have visually distinct layouts — a side-by-side comparison shows different section arrangements, different component types, and different font pairings with zero duplication
- **SC-002**: Visitors can navigate between a project's landing page, features page, demo page, and terms page using the project-specific app bar within 2 seconds per navigation
- **SC-003**: The app bar correctly transforms between main site mode and project mode on every navigation, with zero broken links
- **SC-004**: All 20 standalone pages (5 projects × 4 pages each: landing, features, demo, terms) load successfully with correct branding and responsive layout across desktop, tablet, and mobile
- **SC-005**: Each project's GSAP animation runs at 60fps on mid-range devices without layout shifts
- **SC-006**: Country and device detection displays in the footer within 3 seconds of page load on standard connections, with graceful fallback on failure
- **SC-007**: All pages render correctly in both English (LTR) and Arabic (RTL) with correct app bar label translations
- **SC-008**: 100% of project app bar links resolve to valid, loading pages with correct content

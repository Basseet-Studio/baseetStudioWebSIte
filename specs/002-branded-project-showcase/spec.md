# Feature Specification: Branded Project Showcase & Site Restructuring

**Feature Branch**: `002-branded-project-showcase`  
**Created**: 2025-04-02  
**Status**: Draft  
**Input**: Restructure Baseet Studio's project showcase into three tiers of presentation — branded landing pages, standard project pages, and a client work showcase — with a unified adaptive app bar, unique visual identities per product, homepage reorganization, and client section updates.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Branded Product Landing Pages (Priority: P1)

A potential user visits baseetstudio.com/projects/nomu and lands on a fully immersive landing page that looks and feels like Nomu's own site. The app bar shows the Nomu logo, navigation specific to Nomu (Home, Features, Download, Contact, Back to Baseet), and a unique animated leaf-themed background. The page convinces the user to download the app. The same experience applies for Money Box, Desi Kitchen, ChopShop, and Matrix — each with their own identity, app bar navigation, and background effect.

**Why this priority**: These branded pages are the primary deliverable — they transform how Baseet Studio presents its flagship products and are the main vehicle for converting visitors into users or vendor partners.

**Independent Test**: Navigate to each branded product URL and verify the page loads with its own logo, navigation items, background effect, and identity. Confirm the "Back to Baseet" link returns to the main studio site.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/projects/nomu`, **When** the page loads, **Then** the app bar displays the Nomu logo, shows navigation items (Home, Features, Download, Contact, Back to Baseet), and the page background uses an animated leaf effect.
2. **Given** a visitor navigates to `/projects/money-box`, **When** the page loads, **Then** the app bar displays the Money Box logo, shows navigation items (Home, Features, Download, Contact, Back to Baseet), and the page background uses an animated paper-notes effect.
3. **Given** a visitor navigates to `/projects/deshikitchen`, **When** the page loads, **Then** the app bar displays the Desi Kitchen logo, shows navigation items (Home, Features, Demo, Contact, Back to Baseet), and the page has a unique themed background.
4. **Given** a visitor navigates to `/projects/chopshop`, **When** the page loads, **Then** the app bar displays the ChopShop logo, shows navigation items (Home, Features, Demo, Contact, Back to Baseet), and the page has a unique themed background.
5. **Given** a visitor navigates to `/projects/matrix`, **When** the page loads, **Then** the app bar displays the Matrix logo, shows navigation items (Home, Features, Demo, Contact, Back to Baseet), the page has a unique themed background, and the page clearly communicates "Coming Soon" status.
6. **Given** a visitor is on any branded product page, **When** they click "Back to Baseet", **Then** they are taken to the main Baseet Studio homepage.
7. **Given** a visitor is on any branded product page, **When** they view the app bar, **Then** the app bar background is white regardless of which product page they are on.

---

### User Story 2 — Unified Adaptive App Bar (Priority: P2)

A visitor navigating between Baseet Studio and its product pages experiences a seamless transition. The app bar remains visually consistent (white background) but dynamically adapts its logo and navigation links based on the current page context. On the main studio site, the app bar shows "Baseet Studio" with (Home, Services, Projects, Clients, Contact, Language). On any product page, it swaps to that product's branding and relevant navigation.

**Why this priority**: The app bar is the connective tissue between all pages — without it, the branded pages feel disconnected. It must work correctly for the multi-site experience to be coherent.

**Independent Test**: Navigate from the main site to a product page and back, verifying the app bar updates logo, navigation items, and maintains the white background throughout.

**Acceptance Scenarios**:

1. **Given** a visitor is on the Baseet Studio homepage, **When** they view the app bar, **Then** it shows "Baseet Studio" logo with links: Home, Services, Projects, Clients, Contact, and Language switcher.
2. **Given** a visitor navigates from the main site to a branded product page, **When** the product page loads, **Then** the app bar transitions to show the product's logo and product-specific navigation.
3. **Given** a visitor is on a product page, **When** they click "Back to Baseet", **Then** the app bar reverts to the main Baseet Studio branding and navigation.
4. **Given** a visitor resizes the browser on any product page, **When** the viewport is mobile-sized, **Then** the adaptive app bar collapses into a mobile menu while retaining the correct product branding.

---

### User Story 3 — Unique Background Effects Per Site (Priority: P3)

Each branded product page has a distinctive animated background effect that reinforces the product's visual identity. These effects replace/extend the main site's cloud animation with product-appropriate themes.

**Why this priority**: Background effects are the key visual differentiator that makes each product page feel like its own site. They are what give each page its unique identity and "wow factor."

**Independent Test**: Load each branded product page and verify the correct background animation plays, is performant, and does not obscure content.

**Acceptance Scenarios**:

1. **Given** a visitor is on the main Baseet Studio site, **When** the page loads, **Then** the existing cloud animation background is displayed.
2. **Given** a visitor is on the Nomu page, **When** the page loads, **Then** an animated leaf/nature-themed background effect is displayed.
3. **Given** a visitor is on the Money Box page, **When** the page loads, **Then** an animated paper-notes/currency-themed background effect is displayed.
4. **Given** a visitor is on the Desi Kitchen page, **When** the page loads, **Then** a food/kitchen-themed background effect is displayed.
5. **Given** a visitor is on the ChopShop page, **When** the page loads, **Then** a shopping/marketplace-themed background effect is displayed.
6. **Given** a visitor is on the Matrix page, **When** the page loads, **Then** a productivity/data-grid-themed background effect is displayed.
7. **Given** a visitor is on any page with a background effect, **When** they scroll, **Then** the animation remains smooth and does not cause jank or slow page interaction.

---

### User Story 4 — Standard Project Pages (Priority: P4)

A visitor browsing Baseet Studio's project list clicks on Photo Restore AI, Medical Education App, BD Railway Timetable, NSS Virtual Education Fair, or Malaysian Corporate Websites and lands on a clean single-page project showcase within the studio framework. These pages use a consistent project template and retain the main Baseet Studio app bar.

**Why this priority**: These projects don't need their own branded identity but still need proper showcase pages. They fill out the portfolio and demonstrate range.

**Independent Test**: Navigate to each standard project page and verify it loads within the studio framework with correct content and the main Baseet Studio app bar.

**Acceptance Scenarios**:

1. **Given** a visitor navigates to `/projects/photorestore-ai`, **When** the page loads, **Then** a single-page project showcase is displayed with the main Baseet Studio app bar and project details.
2. **Given** a visitor navigates to `/projects/medical-education-app`, **When** the page loads, **Then** a project showcase page is displayed with a "Coming Soon" status indicator.
3. **Given** a visitor navigates to any standard project page, **When** they view the app bar, **Then** the main Baseet Studio logo and navigation are shown (not a product-specific app bar).

---

### User Story 5 — Homepage Restructuring & Client Section (Priority: P5)

The Baseet Studio homepage is updated so the "Our Products" section properly categorizes projects into branded products (linking to their landing pages) vs. standard project showcases. The "Customers" section is renamed to "Clients" throughout the site. Portia Grid (formerly Fleet Ops) is added with an updated testimonial, and Iyat (digital agency) is added as a new client entry.

**Why this priority**: The homepage is the entry point and must accurately reflect the new structure. The client section updates (Portia Grid rename, Iyat addition) are content corrections that align with reality.

**Independent Test**: Load the homepage and verify "Our Products" links to the correct branded landing pages, the section is renamed to "Clients", Portia Grid appears with the correct testimonial, and Iyat appears with its preview link.

**Acceptance Scenarios**:

1. **Given** a visitor is on the homepage, **When** they view the "Our Products" section, **Then** Nomu, Money Box, Desi Kitchen, ChopShop, and Matrix link to their respective branded landing pages.
2. **Given** a visitor is on the homepage, **When** they view standard projects (Photo Restore AI, Medical Education App, BD Railway, NSS Virtual Education Fair, Malaysian Corporate Websites), **Then** these link to standard project pages within the studio framework.
3. **Given** a visitor is on the homepage, **When** they look for the "Customers" section, **Then** it is labeled "Clients" instead.
4. **Given** a visitor views the Clients section, **When** they look at the Portia Grid entry, **Then** it displays the name "Portia Grid" (not "Fleet Ops") with the testimonial: *"Most devs just build what you tell them; this team actually thinks through the logic with you. Building Portia Grid required a lot of tactical intelligence and complex data handling, and Mohamed, Asad, and Ariyan absolutely nailed it. They've got great energy, they know their tech inside out, and they held my hand through the entire process. If you want a team that takes ownership of the outcome, this is it." — Hassan, CEO & Founder of Portia Grid*.
5. **Given** a visitor views the Clients section, **When** they look at the Iyat entry, **Then** it shows Iyat as a digital agency client with a link to `https://iyat-site.mohameda-elobaid.workers.dev/portfolio`.
6. **Given** a visitor views the navigation on the main site, **When** they look at the app bar, **Then** the menu item reads "Clients" (not "Customers").

---

### Edge Cases

- What happens when a visitor navigates directly to a branded product URL that doesn't exist yet (e.g., a product added later)? The site should display a proper 404 page with a link back to the main Baseet Studio site.
- What happens when the background animation fails to load or is disabled (e.g., reduced motion preference)? The page should gracefully fall back to a static gradient or solid color matching the product's brand palette.
- What happens when a visitor accesses a "Coming Soon" product page (Matrix, Medical Education App)? The page should clearly indicate the product is not yet available, show relevant information, and not display broken links or empty sections.
- What happens when switching languages (Arabic/English) on a branded product page? The app bar navigation, page content, and "Back to Baseet" link should all correctly update to the selected language while maintaining the product's branding.
- What happens on slow connections? Background effects should not block page content from rendering. Content should be visible before animations fully load.

## Requirements *(mandatory)*

### Functional Requirements

#### Page Structure & Routing

- **FR-001**: Site MUST support three tiers of project presentation: branded landing pages, standard project pages, and client showcase entries.
- **FR-002**: Branded landing pages MUST be accessible at their own paths under `/projects/` (e.g., `/projects/nomu`, `/projects/money-box`, `/projects/deshikitchen`, `/projects/chopshop`, `/projects/matrix`).
- **FR-003**: Each branded landing page MUST function as a self-contained mini-site with its own sections (Home, Features, Download/Demo, Contact) accessible via anchor navigation or separate sub-sections.
- **FR-004**: Standard project pages MUST exist at `/projects/<slug>` for: Photo Restore AI, Medical Education App, BD Railway Timetable, NSS Virtual Education Fair, and Malaysian Corporate Websites.
- **FR-005**: Standard project pages MUST use a consistent project template within the main Baseet Studio framework.

#### Adaptive App Bar

- **FR-006**: The app bar MUST dynamically change its logo and navigation links based on the current page context.
- **FR-007**: On the main Baseet Studio site, the app bar MUST display: Baseet Studio logo, Home, Services, Projects, Clients, Contact, and Language switcher.
- **FR-008**: On branded product pages, the app bar MUST display the respective product logo and product-specific navigation items:
  - **Nomu**: Home, Features, Download, Contact, Back to Baseet
  - **Money Box**: Home, Features, Download, Contact, Back to Baseet
  - **Desi Kitchen**: Home, Features, Demo, Contact, Back to Baseet
  - **ChopShop**: Home, Features, Demo, Contact, Back to Baseet
  - **Matrix**: Home, Features, Demo, Contact, Back to Baseet
- **FR-009**: The app bar MUST maintain a white background across all pages (main site and all product pages).
- **FR-010**: The "Back to Baseet" navigation item MUST link back to the Baseet Studio homepage.
- **FR-011**: The app bar MUST be fully responsive, collapsing into a mobile menu that retains the correct product branding and navigation.

#### Background Effects

- **FR-012**: Each branded product page MUST have a unique animated background effect that reinforces that product's visual identity:
  - **Main Baseet Studio site**: Clouds (existing)
  - **Nomu**: Leaves/nature theme
  - **Money Box**: Paper notes/finance theme
  - **Desi Kitchen**: Food/kitchen/spice theme
  - **ChopShop**: Shopping/marketplace/package theme
  - **Matrix**: Productivity/grid/data theme
- **FR-013**: Background effects MUST respect the user's `prefers-reduced-motion` setting and fall back to a static alternative.
- **FR-014**: Background effects MUST NOT block or delay the rendering of primary page content.

#### Homepage Restructuring

- **FR-015**: The homepage "Our Products" section MUST categorize and link products correctly: branded products link to their landing pages, standard projects link to their project pages.
- **FR-016**: The "Customers" label MUST be renamed to "Clients" across the entire site (navigation, section headings, page titles, URLs where applicable).

#### Client Section Updates

- **FR-017**: Fleet Ops MUST be renamed to "Portia Grid" everywhere it appears on the site.
- **FR-018**: The Portia Grid entry MUST include the testimonial: *"Most devs just build what you tell them; this team actually thinks through the logic with you. Building Portia Grid required a lot of tactical intelligence and complex data handling, and Mohamed, Asad, and Ariyan absolutely nailed it. They've got great energy, they know their tech inside out, and they held my hand through the entire process. If you want a team that takes ownership of the outcome, this is it." — Hassan, CEO & Founder of Portia Grid*.
- **FR-019**: Iyat MUST be added to the Clients section as a digital agency client with a link to `https://iyat-site.mohameda-elobaid.workers.dev/portfolio`.
- **FR-020**: The Clients section MUST display client work as a list/preview showcase format (not full branded landing pages).

#### Content & Status

- **FR-021**: Matrix and Medical Education App pages MUST clearly display a "Coming Soon" status.
- **FR-022**: ChopShop MUST be presented as "Ready to be delivered" for vendors.
- **FR-023**: All branded product pages MUST include a contact section for inquiries.

#### Bilingual Support

- **FR-024**: All new pages (branded landing pages, updated project pages, client entries) MUST support both English and Arabic languages, consistent with the existing site's bilingual setup.

### Key Entities

- **Branded Product**: A flagship Baseet Studio product that gets its own landing page with unique identity (logo, app bar nav, background effect, color scheme). Products: Nomu, Money Box, Desi Kitchen, ChopShop, Matrix.
- **Standard Project**: A project showcased within the main studio framework using a consistent template. Projects: Photo Restore AI, Medical Education App, BD Railway Timetable, NSS Virtual Education Fair, Malaysian Corporate Websites.
- **Client**: An external business or individual for whom Baseet Studio built a solution. Displayed in a list/preview format. Clients: Portia Grid (formerly Fleet Ops), Iyat.
- **Adaptive App Bar**: The site-wide navigation component that changes logo, links, and context based on which page the visitor is viewing.
- **Background Effect**: A unique animated visual tied to a specific product's brand identity, displayed behind page content.

### Assumptions

- Each branded product will have its own logo asset provided or created during implementation.
- The "Download" links for Nomu and Money Box will point to placeholder URLs (e.g., `#`) until app store listings are live, since both are marked "Coming Soon."
- The "Demo" links for Desi Kitchen, ChopShop, and Matrix will either link to a live demo environment or a demo request form.
- Background effects will be lightweight enough to run smoothly on mid-range mobile devices.
- The branded landing page content (feature lists, descriptions, screenshots) for each product will be sourced from existing data files or provided during implementation.
- The URL for Iyat (`https://iyat-site.mohameda-elobaid.workers.dev/portfolio`) is temporary and may be updated when the client's own domain is configured.
- The Portia Grid (Fleet Ops) entry currently exists in the customers data; renaming applies to all references including data files, templates, and content pages.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 branded product pages (Nomu, Money Box, Desi Kitchen, ChopShop, Matrix) are accessible at their designated URLs and display the correct product identity within 3 seconds on a standard connection.
- **SC-002**: The app bar correctly displays product-specific branding and navigation on 100% of branded pages, and reverts to studio branding on all other pages.
- **SC-003**: Each branded product page has a visually distinct background effect that is immediately recognizable as different from the other products.
- **SC-004**: Background animations maintain at least 30fps on mid-range mobile devices and gracefully degrade when reduced motion is preferred.
- **SC-005**: Visitors can navigate from any branded product page back to Baseet Studio in one click via the "Back to Baseet" link.
- **SC-006**: The homepage "Our Products" section correctly categorizes and links all products to the appropriate page type (branded landing page or standard project page).
- **SC-007**: "Customers" is fully replaced by "Clients" across navigation, headings, and content with zero remaining references to the old label.
- **SC-008**: Portia Grid (formerly Fleet Ops) displays with the correct name and updated full testimonial in the Clients section.
- **SC-009**: Iyat appears in the Clients section with a working link to the portfolio preview.
- **SC-010**: All new and updated pages render correctly in both English and Arabic, with proper RTL layout for Arabic.

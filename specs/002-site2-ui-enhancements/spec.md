# Feature Specification: Site 2 UI Enhancements

**Feature Branch**: `002-site2-ui-enhancements`  
**Created**: 2026-05-22  
**Status**: Draft  
**Input**: User description: "Projects should have individual layouts. Bring in the footer and design the contact page. App bar should have a side popup hamburger menu on mobile with glassmorphic style. Use Phosphor Icons from local SVGs in root. Fix duplicate app bar on mobile."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Individual Project Layouts (Priority: P1)

As a visitor browsing the portfolio, I want each project page to have its own unique visual layout, colors, and content structure so that each product feels distinct and showcases its brand identity rather than all projects looking identical.

**Why this priority**: The 12 project pages currently share one generic template. Unique layouts differentiate each product, increase perceived value, and match the reference site where each project has branded sections. This directly impacts the studio's ability to sell its work.

**Independent Test**: Navigate to any two project pages (e.g., /projects/chopshop and /projects/zaryn) and verify they have different hero layouts, content ordering, and visual treatments.

**Acceptance Scenarios**:

1. **Given** I navigate to a branded/in-house project (chopshop, deshikitchen, matrix, medev, moneybox, numu, zaryn), **When** the page loads, **Then** I see a unique hero section, branded color scheme, custom content arrangement, and sections tailored to that product (testimonials, product screenshots, feature breakdowns)
2. **Given** I navigate to a client/standard project (bd-railway, malaysian-business-websites, medical-education-app, nss-virtual-education-fair, photorestore-ai), **When** the page loads, **Then** I see a clean case study layout showing challenge, solution, results, and technology used
3. **Given** I am on any project page, **When** I scroll down, **Then** all project-specific sections (features, gallery, FAQ, CTA) display with the project's unique color and gradient styling

---

### User Story 2 - Footer, Contact Page, and Mobile Navigation (Priority: P1)

As a visitor, I want a professional footer on every page, a well-designed contact page with a working form, and a side popup menu that slides out when I tap the hamburger icon on my phone so that I can navigate the site easily on any device.

**Why this priority**: Without a proper footer users can't access social links or company info. Without a polished contact page, lead conversion is lost. Without a working mobile sidebar, navigation is broken on phones.

**Independent Test**: Open the site on mobile viewport (under 768px), tap the hamburger button, and verify a sidebar panel slides in from the side with navigation links and a glassmorphic backdrop overlay.

**Acceptance Scenarios**:

1. **Given** I scroll to the bottom of any page, **When** I reach the footer, **Then** I see the Baseet Studio logo, navigation links, social media icons (Instagram, LinkedIn, X, GitHub, Dribbble), copyright notice, and contact email/phone — matching the reference site's footer design
2. **Given** I am on the contact page (/contact), **When** the page loads, **Then** I see a "Get in Touch" heading, a contact form (name, email, phone, subject, message) on the left, and contact info sidebar (email, phone, address, social links) on the right
3. **Given** I am on mobile (viewport < 768px) and the hamburger menu is closed, **When** I tap the hamburger icon (three lines), **Then** a glassmorphic sidebar panel slides in from the right edge containing all navigation links (Home, Work, Services, Clients, Contact) with a semi-transparent backdrop that closes the menu when tapped
4. **Given** the mobile sidebar is open, **When** I tap a navigation link, **Then** the sidebar closes and I navigate to that page
5. **Given** the mobile sidebar is open, **When** I press the Escape key, **Then** the sidebar closes

---

### User Story 3 - Phosphor Icons via Local SVGs (Priority: P2)

As a developer maintaining the site, all icons should use locally stored Phosphor SVG files from the project root instead of web-based icon libraries so the site is fully self-contained with no external dependencies for icons.

**Why this priority**: Eliminates dependency on external CDNs or icon libraries, improves page load speed, ensures icons render offline, and gives full control over icon styling.

**Independent Test**: Open the browser Network tab, load any page, and verify no external icon font or CDN requests for icons are made — all icons are served from the local domain as inline SVGs or local SVG files.

**Acceptance Scenarios**:

1. **Given** the site is loaded, **When** I inspect any icon element on the page (app bar social icons, footer, project platform icons, feature icons), **Then** the icon renders from a local SVG file stored in the project's public or assets directory
2. **Given** I check the network requests, **When** the page loads, **Then** no external requests are made to Font Awesome, Phosphor CDNs, or any third-party icon service
3. **Given** I view a project page feature section, **When** I see feature icons (cash register, hospital, utensils, chart, etc.), **Then** each icon uses the correct Phosphor SVG equivalent (e.g., `ph-cash-register` → `CashRegister.svg`) rendered consistently at proper sizing and color

---

### User Story 4 - Fix Duplicate App Bar on Mobile (Priority: P1)

As a mobile visitor, I want to see exactly one app bar at the top of the page so the navigation is clean and unambiguous, without a duplicate bar appearing behind the visible one.

**Why this priority**: A doubled app bar creates visual clutter, wastes screen space, confuses users, and looks unprofessional. This is a visible defect that users encounter immediately on mobile.

**Independent Test**: Open the site on a mobile viewport (375px - 768px), scroll to the top of any page, and verify exactly one app bar is visible with no duplicate rendering behind it.

**Acceptance Scenarios**:

1. **Given** I load any page on mobile (viewport < 768px), **When** I look at the top of the viewport, **Then** exactly one glassmorphic app bar is displayed with no shadow, ghost, or duplicate bar appearing behind it
2. **Given** I navigate between pages on mobile, **When** each page loads, **Then** only one app bar renders consistently with no duplicate instances
3. **Given** I scroll down and back up on mobile, **When** the app bar reappears after being hidden, **Then** still only one app bar is visible at any time

---

### Edge Cases

- What happens when the user switches language (EN/AR)? The mobile sidebar and all project layouts must render correctly with RTL text alignment
- How does the mobile sidebar handle very long navigation link labels? Links should wrap or truncate gracefully within the sidebar panel width (280px / 85vw)
- What happens when a project has zero screenshots, zero features, or zero testimonials? The respective sections should be conditionally hidden, not render empty containers
- What happens when the mobile sidebar is open and the user rotates the device from portrait to landscape? The sidebar should close and revert to the desktop hamburger state
- What happens when an SVG icon file is missing or fails to load? A fallback empty placeholder of the same dimensions should render to preserve layout

## Requirements *(mandatory)*

### Functional Requirements

**Project Layouts**

- **FR-001**: System MUST render each project page (12 total) with a unique layout template rather than a shared generic template
- **FR-002**: Branded/in-house projects (chopshop, deshikitchen, matrix, medev, moneybox, numu, zaryn) MUST include: branded hero with product-specific imagery/design, feature grids, screenshot galleries, testimonial sections, FAQ accordions, and styled CTA sections
- **FR-003**: Client/standard projects (bd-railway, malaysian-business-websites, medical-education-app, nss-virtual-education-fair, photorestore-ai) MUST include: case study summary section, challenge/solution/results layout, technology stack listing, and testimonial or outcome section
- **FR-004**: Each project page MUST apply that project's unique brand color and gradient from the projects data as CSS custom properties throughout its layout
- **FR-005**: Project pages MUST use the shared `Project` layout wrapper to ensure consistent app bar, footer, and page structure across all project pages

**Footer and Contact Page**

- **FR-006**: Footer MUST appear on every page and include: Baseet Studio logo/text, navigation links (Home, Work, Services, Clients, Contact), social media icons (Instagram, LinkedIn, X/Twitter, GitHub, Dribbble), copyright notice, email link, and phone link
- **FR-007**: Contact page MUST display a two-column layout: contact form (name, email, phone, subject, message with validation) on the left/top, and contact information sidebar (email, phone, physical address, social links) on the right/bottom
- **FR-008**: Contact form MUST validate required fields (name, email, message) before submission and provide clear error messaging for invalid inputs

**Mobile Navigation Sidebar**

- **FR-009**: App bar on mobile viewports (< 768px) MUST render a hamburger button (three horizontal lines) that toggles a side popup menu
- **FR-010**: Mobile sidebar MUST slide in from the right edge as a glassmorphic panel (backdrop-filter: blur, semi-transparent background, border) with a width of approximately 280px or 85vw
- **FR-011**: Mobile sidebar MUST be accompanied by a semi-transparent backdrop overlay that closes the menu when tapped
- **FR-012**: Mobile sidebar MUST close when: a navigation link is tapped, the backdrop overlay is tapped, or the Escape key is pressed
- **FR-013**: Mobile sidebar MUST prevent body scroll when open (overflow: hidden) and restore scroll on close
- **FR-014**: Mobile sidebar MUST include an accessible toggle with proper aria-expanded and aria-controls attributes

**Phosphor Icons**

- **FR-015**: All icons throughout the site MUST use Phosphor SVG files stored locally within the project root
- **FR-016**: Icons previously using Font Awesome classes (`fas fa-*`, `fab fa-*`) MUST be replaced with equivalent Phosphor SVGs
- **FR-017**: SVG icons MUST be loaded as inline SVGs or referenced as local static files — no external CDN or web dependency for icons

**Duplicate App Bar Fix**

- **FR-018**: System MUST render exactly one AppBar component per page — no duplicate instances visible on any viewport
- **FR-019**: Any redundant app bar markup, hidden duplicate elements, or layout nesting that causes a second visible app bar on mobile MUST be identified and removed

### Key Entities

- **Project**: Represents a portfolio item with attributes: name, slug, type (branded/standard), tagline, description, color, gradient, status, features (list), platforms (list), nav items, screenshots, testimonials, FAQ entries, CTA links. Source: `projects.json`
- **Phosphor Icon**: SVG graphic file mapped to a concept or feature. Each icon has a name (e.g., `CashRegister`, `Stethoscope`), a variant (regular/bold/fill/etc.), and a file path within the `phosphor-icons/SVGs/` directory
- **Navigation Link**: A labeled anchor with a target URL and an active state. Used in the app bar, mobile sidebar, and footer navigation sections

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 12 project pages display unique layouts distinguishable by content structure, hero design, and section ordering (verified by visual comparison)
- **SC-002**: Footer appears consistently on all pages (home, services, clients, contact, all 12 project pages, 404) with working social links and contact information
- **SC-003**: Contact page presents a fully functional form with client-side validation and clear error states for required fields
- **SC-004**: Mobile sidebar opens and closes on hamburger tap within 200ms with smooth slide animation — no layout shift or jank
- **SC-005**: Zero external icon requests appear in Network tab — all icons served from local SVG files
- **SC-006**: Exactly one app bar visible on mobile viewports (375px - 768px) at all scroll positions — confirmed via visual inspection and DOM inspection
- **SC-007**: Mobile sidebar content is fully accessible via keyboard navigation and screen reader announces menu state changes

## Assumptions

- The `phosphor-icons/` directory at the project root contains all required icon SVG files organized by variant (regular/bold/fill)
- The existing `projects.json` data file contains complete metadata (colors, gradients, features, testimonials, screenshots, FAQ) for all 12 projects
- The existing glassmorphic CSS styles in `glass.css` and `nav.css` can be extended for the mobile sidebar panel
- The duplicate app bar is a rendering issue within the current Astro page/layout structure, not a browser-specific bug
- The `baseetStudioWebSIte` Hugo project serves as a reference for:-footer layout structure, contact page design, project branded page content, and mobile sidebar behavior — to be adapted for the Astro framework used in baseetstudiosite2

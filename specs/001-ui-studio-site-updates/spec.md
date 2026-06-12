# Feature Specification: Studio Site 2 UI Updates

**Feature Branch**: `001-ui-studio-site-updates`
**Created**: 2026-05-20
**Status**: Draft
**Input**: User description: "in studio site 2 change teh light of the color in the clouds for the sight blue sky , another thing the app bar should became smaller and move to the side not stay centred like redact to teh side of the logo and also projects have their own app abr we dont want that change the logo of the actual app bar and change teh links look at the original site to see how its handled previoluy lock in for m"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consistent Navigation Across All Pages (Priority: P1)

As a user browsing the site, I want to see the same navigation bar on all pages so that I can always find my way around regardless of which section I'm in.

**Why this priority**: Ensures consistent user experience across the entire site. Project pages should not have a different app bar than other pages.

**Independent Test**: Can be fully tested by navigating to home, projects, services, clients, and contact pages and verifying the same app bar appears on all with correct logo and links.

**Acceptance Scenarios**:

1. **Given** I am on any page (home, projects, services, clients, contact), **When** I look at the top of the page, **Then** I see the same app bar style with logo and navigation links
2. **Given** I am on a project detail page (e.g., /projects/chopshop), **When** I look at the top, **Then** I see the main app bar (not a separate project-specific header)
3. **Given** I am viewing the site on mobile, **When** I click the hamburger menu, **Then** I see the same navigation links as on desktop

---

### User Story 2 - Light Blue Sky Background (Priority: P2)

As a user viewing the site, I want to see a light blue sky with clouds that feels open and professional, matching a bright daytime aesthetic.

**Why this priority**: Visual improvement to create a more inviting first impression compared to the current dark theme.

**Independent Test**: Can be tested by loading the home page and verifying the Vanta clouds background displays with light blue sky colors.

**Acceptance Scenarios**:

1. **Given** I am on the home page, **When** the page loads, **Then** the background shows a light blue sky (not dark) with visible clouds
2. **Given** the clouds animation is running, **When** I scroll or interact with the page, **Then** the cloud colors remain light blue and the sky remains bright

---

### User Story 3 - Compact Side-Aligned App Bar (Priority: P3)

As a user, I want the navigation bar to be smaller and positioned to the side of the page (not centered) so it feels more like a standard website header.

**Why this priority**: Better aligns with conventional web navigation patterns. The current floating centered pill design is unusual and may confuse users about its purpose.

**Independent Test**: Can be tested by measuring the app bar position and dimensions on desktop and mobile viewports.

**Acceptance Scenarios**:

1. **Given** I am on desktop (viewport > 992px), **When** I look at the app bar, **Then** it is positioned at the left edge of the page (not centered)
2. **Given** I am on desktop, **When** I look at the app bar, **Then** its height is smaller than the current 72px expanded state
3. **Given** the app bar has links, **When** I view them, **Then** they match the styling of the original Hugo site (same colors, hover effects, spacing)

---

### Edge Cases

- What happens when the user switches language (EN/AR)? The app bar should still display correctly with proper RTL handling
- How does the mobile menu behave on project pages when the separate project header is removed?
- What happens when scrolling on project pages - does the app bar still collapse/expand?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a single consistent app bar on all pages including project detail pages
- **FR-002**: System MUST remove the separate project header component (ProjectHeader.astro) from project pages
- **FR-003**: System MUST use light blue sky color (#87CEEB or similar) for the Vanta clouds background
- **FR-004**: System MUST position the app bar at the left side of the viewport (not centered)
- **FR-005**: System MUST reduce the app bar height to be smaller than current 72px expanded state
- **FR-006**: Navigation links MUST match the styling of the original Hugo site (colors: #496bc1 primary, hover states, active indicators)
- **FR-007**: App bar logo MUST display "Baseet Studio" text with gradient styling consistent across all pages

### Key Entities *(not applicable)*

This feature focuses on UI styling changes without data model modifications.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: App bar appears on all pages (home, projects, services, clients, contact, project details) with identical styling
- **SC-002**: Cloud background renders with light blue sky color (verified by CSS variable --vanta-sky being light blue)
- **SC-003**: App bar width is constrained to content area (max-width: 1280px) and aligned to left edge, not centered
- **SC-004**: App bar height is reduced to approximately 48-56px (vs current 72px)
- **SC-005**: Navigation links use primary color #496bc1 with hover state transitions matching original site

## Assumptions

- The Vanta clouds library supports sky color customization via CSS variables as currently implemented
- The original Hugo site's app bar CSS (app-bar.css) provides the reference styling to match
- Project pages do not require separate navigation elements once the main app bar is consistently displayed
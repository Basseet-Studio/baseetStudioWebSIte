# Feature Specification: Fix RTL Mobile Layout

**Feature Branch**: `001-fix-rtl-mobile-layout`  
**Created**: 2026-02-11  
**Status**: Draft  
**Input**: User description: "Standardise how the menu on mobile shows in the right place, fix Arabic localisation pushing content off screen, fix popup menu positioning, and make the top app bar flip direction for RTL."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Arabic Mobile Page Content Stays On-Screen (Priority: P1)

An Arabic-speaking visitor opens any page on a mobile device. All text, images, and interactive elements remain fully visible within the viewport. Nothing is pushed off the right edge of the screen. The visitor can scroll vertically to see all content but never needs to scroll horizontally.

**Why this priority**: Content being pushed off-screen makes the Arabic version of the site effectively unusable on mobile — the most critical user-facing defect.

**Independent Test**: Open the Arabic home page (`/ar/`) on a 375px-wide viewport. Verify that no horizontal scrollbar appears and all visible sections (hero, features, highlights, clients, footer) fit within the screen width.

**Acceptance Scenarios**:

1. **Given** the site is viewed in Arabic on a 375px-wide mobile viewport, **When** the page loads, **Then** no content overflows the viewport horizontally and no horizontal scrollbar is present.
2. **Given** the site is viewed in Arabic on a 375px-wide mobile viewport, **When** the user navigates to /ar/services/, /ar/projects/, /ar/customers/, and /ar/contact/, **Then** each page's content remains fully within the viewport with no horizontal overflow.
3. **Given** the site is viewed in English on the same device, **When** the user navigates the same pages, **Then** the layout remains correct (no regression).

---

### User Story 2 - Mobile Menu Opens in the Correct Position (Priority: P1)

An Arabic-speaking visitor taps the hamburger menu icon on mobile. The slide-out menu panel appears from the correct side of the screen (left side for RTL), is fully visible, and its links are readable and tappable. Tapping a link or the backdrop closes the menu.

**Why this priority**: Tied with US1 — the menu appearing in the wrong position (e.g., centre of screen, off-screen, or from the wrong edge) prevents navigation entirely.

**Independent Test**: On a 375px-wide viewport in Arabic, tap the hamburger icon. Confirm the panel slides in from the left edge, menu items are fully visible and aligned to the right (RTL text), and tapping a link navigates correctly and closes the panel.

**Acceptance Scenarios**:

1. **Given** an Arabic mobile user on any page, **When** they tap the hamburger icon, **Then** the mobile menu panel slides in from the left edge of the screen (RTL convention).
2. **Given** the mobile menu is open in Arabic, **When** the user reads the menu links, **Then** links are right-aligned, fully visible, and none are clipped or off-screen.
3. **Given** the mobile menu is open in Arabic, **When** the user taps any navigation link, **Then** the menu closes and the user is taken to the correct page.
4. **Given** the mobile menu is open in Arabic, **When** the user taps the backdrop or presses Escape, **Then** the menu closes.
5. **Given** an English mobile user on any page, **When** they tap the hamburger icon, **Then** the menu panel still slides in from the right edge (LTR convention, no regression).

---

### User Story 3 - App Bar Mirrors for RTL (Priority: P2)

When an Arabic-speaking visitor views the site on any device (mobile or desktop), the top app bar layout flips to match RTL reading order: the logo appears on the right, navigation links on the left, and so on. Previously the app bar was forced to LTR in both languages by design; this change removes that constraint so the bar respects the page direction.

**Why this priority**: While the site is technically navigable with a non-flipped bar, it creates a jarring UX inconsistency: the rest of the page reads RTL but the bar reads LTR.

**Independent Test**: Open the Arabic version at desktop width (1280px). Confirm the logo is on the right side and the nav links are on the left side of the app bar. Repeat on mobile and confirm the hamburger/controls are on the left.

**Acceptance Scenarios**:

1. **Given** the site is viewed in Arabic on a desktop viewport, **When** the page loads, **Then** the app bar logo is positioned to the right and the navigation links to the left (mirrored from English).
2. **Given** the site is viewed in Arabic on a mobile viewport, **When** the page loads, **Then** the hamburger icon and language toggle appear on the left side of the bar.
3. **Given** the site is viewed in English on any viewport, **When** the page loads, **Then** the app bar layout remains logo-left, nav-right (no regression).

---

### Edge Cases

- What happens when a user switches language (EN → AR) while the mobile menu is open? The menu should close before the page navigates to the Arabic version.
- How does the layout behave on very narrow screens (320px)? Content and menu must still not overflow.
- What happens with long Arabic navigation labels that may wrap? Text should wrap gracefully within the menu item without clipping.
- How does the desktop language-switcher dropdown position itself in RTL? It should anchor to the left instead of the right.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The `<html>` element's `dir` attribute MUST be the single source of truth for layout direction. Hardcoded `dir="ltr"` on the app bar header and mobile menu nav elements MUST be removed.
- **FR-002**: On RTL pages, the app bar container MUST render in reverse order (logo right, controls left) by inheriting the document's `dir="rtl"` attribute.
- **FR-003**: On RTL pages, the mobile slide-out menu MUST enter from the left edge of the viewport and exit to the left edge.
- **FR-004**: On LTR pages, the mobile slide-out menu MUST continue to enter from the right edge (current behaviour preserved).
- **FR-005**: On all pages (LTR and RTL), page content MUST NOT overflow the viewport horizontally at any width from 320px to 1440px.
- **FR-006**: RTL CSS rules MUST use logical properties or `[dir="rtl"]` selectors scoped to the elements that need them — not broad selectors that could cause side-effects.
- **FR-007**: The mobile menu toggle, language switcher, backdrop, and keyboard (Escape) close behaviour MUST function identically in both language directions.
- **FR-008**: The desktop language-switcher dropdown MUST position itself correctly in RTL (anchored left) and LTR (anchored right).

### Assumptions

- The site only has two languages: English (LTR) and Arabic (RTL). No additional language directions need to be planned for at this time.
- The hamburger icon itself does not need to be mirrored (three horizontal lines look the same in both directions).
- The `baseof.html` already correctly sets `dir="rtl"` on the `<html>` element for Arabic pages; this will be relied upon as the cascade source.
- No JavaScript logic changes are needed for the menu open/close mechanism — the issue is purely in CSS positioning and hardcoded `dir` attributes in templates.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zero horizontal overflow on any page in Arabic at viewport widths of 320px, 375px, 768px, and 1280px.
- **SC-002**: The mobile menu is fully visible and correctly positioned (left-edge slide-in for RTL, right-edge slide-in for LTR) within 300ms of tapping the hamburger icon.
- **SC-003**: The app bar visually mirrors between English (logo-left) and Arabic (logo-right) on both mobile and desktop viewports.
- **SC-004**: All existing English-language layout and navigation behaviour remains unchanged (zero regressions).
- **SC-005**: 100% of mobile menu interactions (open, close via link, close via backdrop, close via Escape) work correctly in both language directions.

// iconMappings.ts — Font Awesome → Phosphor SVG name mappings
// Maps old Font Awesome class strings to Phosphor icon filenames (without extension)
// Used by Icon.astro and resolveIcon() helper throughout the site

export const FA_TO_PHOSPHOR: Record<string, string> = {
  // Project card icons (iconClass)
  "fas fa-cash-register": "cash-register",
  "fas fa-hospital": "hospital",
  "fas fa-shopping-bag": "shopping-bag",
  "fas fa-utensils": "fork-knife",
  "fas fa-piggy-bank": "piggy-bank",
  "fas fa-fire": "fire",
  "fas fa-th-large": "squares-four",
  "fas fa-compass": "compass",
  "fas fa-wand-magic-sparkles": "magic-wand",
  "fas fa-stethoscope": "stethoscope",
  "fas fa-graduation-cap": "graduation-cap",
  "fas fa-train": "train",
  "fas fa-building": "building",

  // Feature icons
  "fas fa-boxes-stacked": "stack",
  "fas fa-gift": "gift",
  "fas fa-chart-bar": "chart-bar",
  "fas fa-calculator": "calculator",
  "fas fa-receipt": "receipt",
  "fas fa-file-medical": "first-aid",
  "fas fa-calendar-check": "calendar-check",
  "fas fa-users": "users",
  "fas fa-plug": "plug",
  "fas fa-palette": "palette",
  "fas fa-store": "storefront",
  "fas fa-mobile-alt": "device-mobile",
  "fas fa-mobile-screen": "device-mobile",
  "fas fa-truck": "truck",
  "fas fa-credit-card": "credit-card",
  "fas fa-clipboard-list": "list-checks",
  "fas fa-cube": "cube",
  "fas fa-clock": "clock",
  "fab fa-stripe": "stripe-logo",
  "fas fa-chart-pie": "chart-pie",
  "fas fa-chart-line": "chart-line",
  "fas fa-bell": "bell",
  "fas fa-folder": "folder",
  "fas fa-shield-alt": "shield",
  "fas fa-check-circle": "check-circle",
  "fas fa-layer-group": "stack",
  "fas fa-tasks": "list-checks",
  "fas fa-file-alt": "file-text",
  "fas fa-columns": "columns",
  "fas fa-search": "magnifying-glass",
  "fas fa-bolt": "lightning",
  "fas fa-award": "trophy",
  "fas fa-user-doctor": "stethoscope",
  "fas fa-folder-open": "folder-open",
  "fas fa-pills": "pill",
  "fas fa-notes-medical": "clipboard-text",
  "fas fa-video": "video",
  "fas fa-brain": "brain",
  "fas fa-language": "translate",
  "fas fa-robot": "robot",
  "fas fa-exclamation-triangle": "warning",
  "fas fa-route": "path",
  "fas fa-code-branch": "git-fork",
  "fas fa-edit": "pencil-simple",
  "fas fa-tachometer-alt": "gauge",
  "fas fa-headset": "headset",
  "fas fa-barcode": "barcode",

  // Platform icons
  "fas fa-globe": "globe",
  "fab fa-apple": "apple-logo",
  "fab fa-android": "android-logo",
  "fas fa-desktop": "desktop",
  "fas fa-code": "code",

  // Docker fallback (no Phosphor Docker logo)
  "fab fa-docker": "cube",
  "fas fa-docker": "cube",

  // Social media icons
  "fab fa-instagram": "instagram-logo",
  "fab fa-linkedin-in": "linkedin-logo",
  "fab fa-linkedin": "linkedin-logo",
  "fab fa-x-twitter": "x-logo",
  "fab fa-twitter": "twitter-logo",
  "fab fa-github": "github-logo",
  "fab fa-dribbble": "dribbble-logo",
  "fab fa-facebook": "facebook-logo",
  "fab fa-youtube": "youtube-logo",
  "fab fa-tiktok": "tiktok-logo",
  "fab fa-whatsapp": "whatsapp-logo",

  // Navigation & UI icons
  "fas fa-arrow-left": "arrow-left",
  "fas fa-arrow-right": "arrow-right",
  "fas fa-chevron-down": "caret-down",
  "fas fa-chevron-up": "caret-up",
  "fas fa-envelope": "envelope",
  "fas fa-phone": "phone",
  "fas fa-phone-alt": "phone-call",
  "fas fa-map-marker-alt": "map-pin",
  "fas fa-map-marker": "map-pin",
  "fas fa-play": "play",
  "fas fa-external-link-alt": "arrow-square-out",
  "fas fa-external-link": "arrow-square-out",
  "fas fa-rocket": "rocket",
  "fas fa-times": "x",
  "fas fa-bars": "list",
  "fas fa-check": "check",
  "fas fa-caret-down": "caret-down",
  "fas fa-caret-up": "caret-up",
  "fas fa-info-circle": "info",
  "fas fa-question-circle": "question",
  "fas fa-star": "star",
  "fas fa-heart": "heart",
  "fas fa-share": "share",
  "fas fa-download": "download",
  "fas fa-upload": "upload",
  "fas fa-cog": "gear",
  "fas fa-wrench": "wrench",
  "fas fa-user": "user",
  "fas fa-circle": "circle",

  // Payment/business
  "fas fa-print": "printer",
  "fas fa-file-invoice": "file-text",
  "fas fa-tag": "tag",
  "fas fa-percent": "percent",

  // Missing from build warnings
  "fas fa-tools": "wrench",
  "fas fa-paint-brush": "paint-brush",
  "fas fa-cloud": "cloud",
  "fas fa-lock": "lock",

  // Round 3 additions — language switcher, status badges, section headings
  // (rocket and globe already exist above; paper-plane-tilt and hourglass are new)
  "fas fa-paper-plane": "paper-plane-tilt",
  "fas fa-hourglass": "hourglass",

  // Round 4 additions — theme switcher + services page process icons
  "fas fa-lightbulb": "lightbulb",
  "fas fa-map": "compass",
  "fas fa-pencil-alt": "pencil",
  "fas fa-vial": "test-tube",
  "fas fa-server": "hard-drives",
  "fas fa-cloud-upload-alt": "cloud-arrow-up",
  "fas fa-laptop-code": "code",
  "fas fa-user-friends": "users-three",
  "fas fa-pencil-ruler": "compass-tool",
  "fas fa-pen-fancy": "pen-nib",
  "fas fa-bullseye": "crosshair",
  "fas fa-window-restore": "app-window",
  "fas fa-users-cog": "users-three",
  "fas fa-boxes": "package",
  "fas fa-shopping-cart": "shopping-cart",

  // Round 5 additions — project data + highlights missing Phosphor mappings
  // Database / infrastructure (no Phosphor "database" — hard-drives is the closest)
  "fas fa-database": "hard-drives",
  // Partnership / handshake (Phosphor has no handshake — users-three signals a group commitment)
  "fas fa-handshake": "users-three",
  // Construction / safety (hard-hat is in the regular variant — direct match)
  "fas fa-hard-hat": "hard-hat",
  // Cook / chef role (no chef-hat in Phosphor — fork-knife covers the food context)
  "fas fa-hat-chef": "fork-knife",
  // Health / pulse (no heartbeat in Phosphor — heart is the closest medical/heart icon)
  "fas fa-heartbeat": "heart",
  // Map with marked locations (no exact match — path covers a route, which fits
  // the geeb area-routing context)
  "fas fa-map-marked-alt": "path",
  // Mosque / prayer (no mosque in Phosphor — star is used as a sacred/celestial
  // symbol; numu's Islamic module uses it)
  "fas fa-mosque": "star",
  // Seedling / growth (no seedling — sparkle signals new growth/intent)
  "fas fa-seedling": "sparkle",
  // Sync / refresh (no direct sync — gear is the closest mechanical concept)
  "fas fa-sync-alt": "gear",
  // Ticket / coupon (no ticket — tag covers the same label/marker role)
  "fas fa-ticket-alt": "tag",
  // Admin / user-with-shield (no user-shield — shield carries the protection role)
  "fas fa-user-shield": "shield",
  // X-ray / medical imaging (no x-ray — first-aid is the closest medical symbol)
  "fas fa-x-ray": "first-aid",
  // Invoice with currency (no invoice-with-dollar — file-text covers the document role)
  "fas fa-file-invoice-dollar": "file-text",

  // Round 4 — services expansion. New FA classes used by service data that
  // don't have a direct Phosphor counterpart. Each picks the closest Phosphor
  // glyph (sometimes looser than 1:1) so we can keep using a single icon API.
  // Architecture / structure (no "sitemap" — compass-tool / tree-like git-fork)
  "fas fa-sitemap": "compass-tool",
  // Pen (no plain "pen" — pen-nib is the closest writing-instrument glyph)
  "fas fa-pen": "pen-nib",
  // Book (no "book" — file-text covers documents, note covers a notebook)
  "fas fa-book": "file-text",
  // Open book (no "book-open" — folder-open conveys the same "open reference" feel)
  "fas fa-book-open": "folder-open",
  // Magnifying glass with handle (FA's standalone magnifier is the same as the
  // search mapping already registered, but accept the bare class too)
  "fas fa-magnifying-glass": "magnifying-glass",
  // Calendar (no plain "calendar" — calendar-check is a usable stand-in for a
  // generic date block)
  "fas fa-calendar": "calendar-check",
  // File with lines (no "file-lines" — file-text is the same idea)
  "fas fa-file-lines": "file-text",
  // Pen + ruler combo (we already map fa-pencil-ruler; alias plain pen-ruler)
  "fas fa-pen-ruler": "compass-tool",
  // Shapes / design composition (no "shapes" — palette covers the design role)
  "fas fa-shapes": "palette",
  // Laptop (no laptop — desktop is the closest monitor-on-stand glyph)
  "fas fa-laptop": "desktop",
  // Box (no "box" — package carries the same shipping/container idea)
  "fas fa-box": "package",
  // Mobile device (alias of the mobile-alt mapping)
  "fas fa-mobile": "device-mobile",
};

// Mapping for icons that should use bold variant.
// Values are the BASENAME (no variant suffix). Icon.astro appends `-bold`
// when variant === 'bold', so the on-disk filename is `<name>-bold.svg`.
export const FA_TO_PHOSPHOR_BOLD: Record<string, string> = {
  "fab fa-apple": "apple-logo",
  "fab fa-android": "android-logo",
  "fab fa-github": "github-logo",
  "fab fa-linkedin": "linkedin-logo",
  "fab fa-linkedin-in": "linkedin-logo",
};

// Mapping for social icons that should use fill variant.
// Values are the BASENAME (no variant suffix). Icon.astro appends `-fill`
// when variant === 'fill', so the on-disk filename is `<name>-fill.svg`.
export const FA_TO_PHOSPHOR_FILL: Record<string, string> = {
  "fab fa-instagram": "instagram-logo",
  "fab fa-linkedin-in": "linkedin-logo",
  "fab fa-github": "github-logo",
  "fab fa-dribbble": "dribbble-logo",
  "fab fa-facebook": "facebook-logo",
  "fab fa-youtube": "youtube-logo",
  "fab fa-tiktok": "tiktok-logo",
  "fab fa-whatsapp": "whatsapp-logo",
  "fab fa-x-twitter": "x-logo",
};

/**
 * Resolve a Font Awesome class to a Phosphor icon name and optional variant.
 * Checks fill variants first (for social), then bold (for brand), then regular.
 * Returns { name, variant } — `name` is the BASENAME without the variant
 * suffix; Icon.astro appends `-bold` / `-fill` based on `variant` to form
 * the on-disk filename.
 */
export function resolveIcon(faClass: string | undefined | null): {
  name: string;
  variant?: "regular" | "bold" | "fill";
} {
  // Guard against undefined/null
  if (!faClass) {
    return { name: "circle", variant: "regular" };
  }

  // Check fill variant mappings first
  const fillName = FA_TO_PHOSPHOR_FILL[faClass];
  if (fillName) return { name: fillName, variant: "fill" };

  // Check bold variant mappings
  const boldName = FA_TO_PHOSPHOR_BOLD[faClass];
  if (boldName) return { name: boldName, variant: "bold" };

  // Check regular mappings
  const direct = FA_TO_PHOSPHOR[faClass];
  if (direct) return { name: direct, variant: "regular" };

  // Try stripping bold suffix from FA class
  const baseClass = faClass.replace(" fa-", " ").split(" ").pop() || "";
  const tryName =
    FA_TO_PHOSPHOR[`fas ${baseClass}`] || FA_TO_PHOSPHOR[`fab ${baseClass}`];
  if (tryName) return { name: tryName, variant: "regular" };

  // Fallback
  if (faClass) {
    console.warn(`[iconMappings] No Phosphor mapping for: ${faClass}`);
  }
  return { name: "circle", variant: "regular" };
}

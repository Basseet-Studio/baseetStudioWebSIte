// AppBar.ts — Glassmorphic navigation: scroll hide/show, mobile sidebar, page detection

import { isLowPowerDevice } from "../../lib/scene/device-tier";

const HIDE_THRESHOLD = 100;
const HYSTERESIS = 50;
const MOBILE_BREAKPOINT = 720;

interface NavState {
  visible: boolean;
  lastScrollY: number;
  scrollDirection: "up" | "down" | "none";
  accumulatedDelta: number;
  pageContext: string;
  isProject: boolean;
  reducedMotion: boolean;
}

let state: NavState = {
  visible: true,
  lastScrollY: 0,
  scrollDirection: "none",
  accumulatedDelta: 0,
  pageContext: "home",
  isProject: false,
  reducedMotion: false,
};

let rafId: number | null = null;
let bar: HTMLElement | null = null;
let mobileAbort: AbortController | null = null;
let hoverTriggerInitialized = false;

function applyGlassMode(): void {
  if (!bar) return;
  if (isLowPowerDevice()) {
    bar.classList.remove("app-bar--glass-svg");
    bar.classList.add("app-bar--glass-fallback");
  }
}

function getPageContext(): string {
  return document.body.dataset.page || "home";
}

function normalizePath(path: string): string {
  return path.replace(/\/$/, "") || "/";
}

function updateActiveLink(context: string): void {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    "#app-bar-links .app-bar__link",
  );
  links.forEach((l) => {
    l.classList.remove("active");
    l.removeAttribute("aria-current");
  });

  if (state.isProject) {
    const current = normalizePath(window.location.pathname);
    links.forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const linkPath = normalizePath(
        new URL(href, window.location.origin).pathname,
      );
      if (current === linkPath) {
        link.classList.add("active");
        link.setAttribute("aria-current", "page");
      }
    });
    return;
  }

  const navKey = context === "projects" ? "work" : context;
  const link = document.querySelector<HTMLAnchorElement>(
    `#app-bar-links .app-bar__link[data-page="${navKey}"]`,
  );
  if (link) {
    link.classList.add("active");
    link.setAttribute("aria-current", "page");
  }
}

function updateVisibility(): void {
  if (!bar || state.reducedMotion) return;

  if (state.visible) {
    bar.classList.remove("app-bar--hidden");
    bar.classList.add("app-bar--visible");
  } else {
    bar.classList.add("app-bar--hidden");
    bar.classList.remove("app-bar--visible");
  }
}

// Suppress CSS transitions on the persisted app bar during a view-transition
// swap. The bar carries `transition: transform 300ms ease` (scroll hide/show),
// `transition: all 200ms ease` on each link, and `transition: background 300ms
// ease` for theme changes. Without this guard, every navigation visibly
// animates the bar: destroy() un-hides it before the swap, then
// resetScrollState() re-asserts visibility, then the active link swaps —
// all of which fire their transitions. The vanta-bg is silent for the same
// reason: it has no transitions. Forcing `transition: none` on the bar (and
// its descendants) for the duration of the swap makes it stay in place,
// matching the clouds.
function withNoTransition(fn: () => void): void {
  if (!bar) {
    fn();
    return;
  }
  bar.classList.add("app-bar--no-transition");
  fn();
  // Force a reflow so the style/class changes inside fn() commit while
  // transitions are still disabled. After this point, removing the guard
  // class won't re-trigger an animation because no property is changing.
  void bar.offsetHeight;
  bar.classList.remove("app-bar--no-transition");
}

function showOnHover(): void {
  if (!bar || state.reducedMotion) return;
  if (window.scrollY > HIDE_THRESHOLD && window.innerWidth >= MOBILE_BREAKPOINT) {
    state.visible = true;
    updateVisibility();
  }
}

function setupHoverTrigger(): void {
  if (hoverTriggerInitialized) return;
  hoverTriggerInitialized = true;

  const triggerZone = document.createElement("div");
  triggerZone.id = "app-bar-hover-trigger";
  triggerZone.style.cssText =
    "position:fixed;top:0;left:0;right:0;height:80px;z-index:999;pointer-events:none;";
  document.body.appendChild(triggerZone);

  let hoverTimeout: number | null = null;

  triggerZone.addEventListener("mouseenter", () => {
    if (hoverTimeout) clearTimeout(hoverTimeout);
    showOnHover();
  });

  triggerZone.addEventListener("mouseleave", () => {
    hoverTimeout = window.setTimeout(() => {
      if (window.scrollY > HIDE_THRESHOLD && window.innerWidth >= MOBILE_BREAKPOINT) {
        state.visible = false;
        updateVisibility();
      }
    }, 1500);
  });
}

function handleScroll(): void {
  if (state.reducedMotion) return;

  const currentScrollY = window.scrollY;

  if (currentScrollY <= 0) {
    state.visible = true;
    state.lastScrollY = currentScrollY;
    state.accumulatedDelta = 0;
    state.scrollDirection = "none";
    updateVisibility();
    return;
  }

  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

  const delta = currentScrollY - state.lastScrollY;
  state.lastScrollY = currentScrollY;

  if (delta > 0) {
    if (state.scrollDirection !== "down") {
      state.scrollDirection = "down";
      state.accumulatedDelta = 0;
    }
    state.accumulatedDelta += delta;

    if (
      state.visible &&
      state.accumulatedDelta > HYSTERESIS &&
      currentScrollY > HIDE_THRESHOLD &&
      !isMobile
    ) {
      state.visible = false;
      updateVisibility();
    }
  } else if (delta < 0) {
    if (state.scrollDirection !== "up") {
      state.scrollDirection = "up";
      state.accumulatedDelta = 0;
    }
    state.accumulatedDelta += Math.abs(delta);

    if (!state.visible && state.accumulatedDelta > HYSTERESIS) {
      state.visible = true;
      updateVisibility();
    }
  }
}

function scrollLoop(): void {
  handleScroll();
  rafId = requestAnimationFrame(scrollLoop);
}

function startScrollTracking(): void {
  if (state.reducedMotion) return;
  if (rafId) return;
  rafId = requestAnimationFrame(scrollLoop);
}

function stopScrollTracking(): void {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function resetScrollState(): void {
  state.visible = true;
  state.lastScrollY = window.scrollY;
  state.scrollDirection = "none";
  state.accumulatedDelta = 0;
  updateVisibility();
}

// =========== MOBILE SIDEBAR LOGIC ===========

function setupMobileSidebar(): void {
  mobileAbort?.abort();
  mobileAbort = new AbortController();
  const { signal } = mobileAbort;

  const toggle = document.getElementById("mobile-toggle");

  if (!toggle || !bar) return;

  function openSidebar(): void {
    bar!.classList.add("app-bar--mobile-expanded");
    requestAnimationFrame(() => {
      bar!.classList.add("open");
    });
    toggle!.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeSidebar(): void {
    bar!.classList.remove("open");
    setTimeout(() => {
      bar!.classList.remove("app-bar--mobile-expanded");
    }, 400);
    toggle!.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  toggle.addEventListener(
    "click",
    (e) => {
      e.preventDefault();
      if (bar!.classList.contains("app-bar--mobile-expanded")) {
        closeSidebar();
      } else {
        openSidebar();
      }
    },
    { signal },
  );

  document.addEventListener(
    "keydown",
    (e) => {
      if (
        e.key === "Escape" &&
        bar!.classList.contains("app-bar--mobile-expanded")
      ) {
        closeSidebar();
      }
    },
    { signal },
  );

  window.addEventListener(
    "resize",
    () => {
      if (
        window.innerWidth >= MOBILE_BREAKPOINT &&
        bar!.classList.contains("app-bar--mobile-expanded")
      ) {
        closeSidebar();
      }
    },
    { signal },
  );
}

// =========== DUPLICATE APP BAR FIX ===========

function removeDuplicateAppBars(): void {
  const bars = document.querySelectorAll("#app-bar");
  if (bars.length > 1) {
    for (let i = 0; i < bars.length - 1; i++) {
      bars[i].remove();
    }
  }
}

function checkReducedMotion(): void {
  state.reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (state.reducedMotion) {
    stopScrollTracking();
  }
}

function updatePageContext(): void {
  state.pageContext = getPageContext();
  state.isProject = bar?.dataset.isProject === "true";
  updateActiveLink(state.pageContext);
}

function syncAppBarFromNewDocument(newDocument: Document): void {
  const newBar = newDocument.getElementById("app-bar");
  const oldBar = document.getElementById("app-bar");
  if (!newBar || !oldBar) return;

  oldBar.className = newBar.className;
  oldBar.setAttribute("dir", newBar.getAttribute("dir") || "ltr");
  oldBar.setAttribute(
    "aria-label",
    newBar.getAttribute("aria-label") || "Main navigation",
  );
  oldBar.setAttribute(
    "data-is-project",
    newBar.getAttribute("data-is-project") || "false",
  );
  oldBar.setAttribute("data-slug", newBar.getAttribute("data-slug") || "");

  const projectColor = newBar.getAttribute("data-project-color");
  if (projectColor) {
    oldBar.setAttribute("data-project-color", projectColor);
  } else {
    oldBar.removeAttribute("data-project-color");
  }

  oldBar.style.cssText = newBar.style.cssText;
  oldBar.innerHTML = newBar.innerHTML;
}

function rebindAfterSwap(): void {
  bar = document.getElementById("app-bar");
  if (!bar) return;

  applyGlassMode();
  setupMobileSidebar();
  updatePageContext();
  startScrollTracking();
}

export function init(): void {
  bar = document.getElementById("app-bar");
  if (!bar) return;

  checkReducedMotion();
  applyGlassMode();
  setupMobileSidebar();
  setupHoverTrigger();

  state.lastScrollY = window.scrollY;
  state.visible = window.scrollY < HIDE_THRESHOLD;
  updateVisibility();

  updatePageContext();
  startScrollTracking();

  // Fix duplicate app bar on initial load
  removeDuplicateAppBars();
}

export function destroy(): void {
  stopScrollTracking();
  mobileAbort?.abort();
  mobileAbort = null;
  document.body.style.overflow = "";
  if (bar) {
    bar.classList.remove("app-bar--mobile-expanded");
    bar.classList.remove("app-bar--hidden");
  }
}

// Astro lifecycle hooks
document.addEventListener("astro:page-load", () => {
  withNoTransition(() => {
    updatePageContext();
    resetScrollState();
    removeDuplicateAppBars();
  });
});

document.addEventListener("astro:before-swap", (event) => {
  withNoTransition(() => {
    destroy();
    syncAppBarFromNewDocument(event.newDocument);
    rebindAfterSwap();
  });
});

// Auto-init on first load
init();

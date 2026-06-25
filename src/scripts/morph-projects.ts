// morph-projects.ts
// -----------------------------------------------------------------------------
// Icon → project-name morph on hover, applied to the project grid rendered
// by `src/components/home/ProximityProjects.astro`.
//
// Approach:
//   1. Build-time: scripts/build-project-name-svgs.mjs emits one tiny SVG
//      per project name → /projects/names/{slug}.svg. Each file holds the
//      hand-crafted wordmark geometry from the user's "source svgs/"
//      directory, normalised into a 0..256 viewBox.
//   2. Runtime: per card, we run MorphSVGPlugin.convertToPath() with a
//      SCOPED selector so every <line>/<rect>/<circle>/<polygon>/
//      <polyline> inside that card's icon SVG becomes a <path>. (The
//      icons are already all paths — but we keep the call as a safety
//      net in case a source contains a stray circle/rect.)
//   3. We filter out any near-full-bleed backdrop path (legacy safety
//      net for the old Phosphor icons). Then we pick the primary path
//      using `bbox area × 1000 + d-length` as a score, so the morph
//      starts from the most "icon-like" path of the brand mark (the main
//      stroke), not a tiny detail (like a steam-node circle in the
//      DeshiKitchen mark).
//   4. We fetch each name SVG once (cached) and attach hover/focus/
//      touch listeners.
//   5. On hover: GSAP's morphSVG tweens the primary path into the
//      project name's <path>. The icon's other decoration elements
//      (remaining paths + any non-path shapes) fade to opacity 0 in
//      sync. On leave: reverse.
//   6. Honors `prefers-reduced-motion` (snap, don't animate).
//
// Markup contract (set by ProximityProjects.astro — icon shapes are
// direct children of svg.px__icon, NOT nested inside another <svg>):
//   <a class="px__tile" data-px-card data-name-src="/projects/names/{slug}.svg">
//     <span class="px__art">
//       <svg class="px__icon" viewBox="0 0 256 256" data-px-icon>
//         <path d="…"/> <path d="…"/> …  ← direct children
//       </svg>
//       <span class="px__label">{name}</span>
//     </span>
//   </a>
// -----------------------------------------------------------------------------

import gsap from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";

gsap.registerPlugin(MorphSVGPlugin);

const NAME_CACHE = new Map<string, string>();
const LOG_PREFIX = "[morph]";

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log(LOG_PREFIX, ...args);
}
function warn(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.warn(LOG_PREFIX, ...args);
}

function isReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

async function loadNamePath(url: string): Promise<string | null> {
  log("loadNamePath", url);
  if (NAME_CACHE.has(url)) {
    log("  → cache hit");
    return NAME_CACHE.get(url)!;
  }
  try {
    const res = await fetch(url, { credentials: "same-origin" });
    if (!res.ok) {
      warn(`  → HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    const m = text.match(/<path[^>]*\bd="([^"]+)"/);
    if (!m) {
      warn(`  → no <path d=…> in response`);
      return null;
    }
    log(`  → got path d, length=${m[1].length}`);
    NAME_CACHE.set(url, m[1]);
    return m[1];
  } catch (err) {
    warn(`  → fetch failed`, err);
    return null;
  }
}

interface CardMorph {
  primary: SVGPathElement;
  decor: SVGElement[];
  iconD: string;
  targetD: string;
}

function attachMorph(card: HTMLElement, targetD: string): void {
  if (card.dataset.pxBound === "1") return;
  card.dataset.pxBound = "1";

  const label = card.getAttribute("aria-label") || "(no label)";
  log("attachMorph", label);

  const iconSvg = card.querySelector<SVGSVGElement>("svg.px__icon");
  if (!iconSvg) {
    warn(label, "no svg.px__icon found in card");
    return;
  }

  // Convert non-path shapes to <path> so morphSVG can interpolate them.
  // Scoped to a unique per-card ID so we never affect icons elsewhere.
  const id = `__px-morph-${Math.random().toString(36).slice(2, 9)}`;
  iconSvg.id = id;
  MorphSVGPlugin.convertToPath(
    `#${id} circle, #${id} rect, #${id} polygon, #${id} polyline, #${id} line, #${id} ellipse`,
  );

  const paths = Array.from(iconSvg.querySelectorAll<SVGPathElement>("path"));
  log(label, "paths after convertToPath:", paths.length);
  if (paths.length === 0) {
    warn(label, "no <path> elements after conversion — nothing to morph");
    return;
  }

  // ── Identify any backdrop-like path (legacy Phosphor + safety net) ──
  // Phosphor icons used to ship with a 256x256 <rect fill="none"> that
  // padded the viewBox. We no longer use Phosphor (the icons come from
  // the user's hi-res source SVGs), but keep this filter as a safety net
  // for any source that happens to contain a near-full-bleed path.
  const isBackdrop = (p: SVGPathElement): boolean => {
    try {
      const b = p.getBBox();
      return b.x <= 1 && b.y <= 1 && b.width >= 254 && b.height >= 254;
    } catch {
      return false;
    }
  };
  paths.filter(isBackdrop).forEach((p) => gsap.set(p, { opacity: 0 }));
  const visiblePaths = paths.filter((p) => !isBackdrop(p));
  const pathsForMorph = visiblePaths.length > 0 ? visiblePaths : paths;

  // ── Pick the morph source: choose the most "icon-like" remaining path. ──
  // We score each path by (bbox area × 1000) + d-attribute length. Bbox area
  // wins when paths are short bezier-curve circles (which have inflated d
  // length but tiny geometry), so the morph starts from the main mark of
  // the brand mark rather than a small detail.
  const pool = pathsForMorph;
  const score = (p: SVGPathElement): number => {
    let area = 0;
    try {
      const b = p.getBBox();
      area = b.width * b.height;
    } catch {
      // ignore
    }
    const dLen = (p.getAttribute("d") || "").length;
    return area * 1000 + dLen;
  };
  let primary: SVGPathElement = pool[0];
  let primaryScore = score(primary);
  for (const p of pool) {
    const s = score(p);
    if (s > primaryScore) {
      primary = p;
      primaryScore = s;
    }
  }
  try {
    const b = primary.getBBox();
    log(
      label,
      "primary chosen:",
      "d length =",
      (primary.getAttribute("d") || "").length,
      "· bbox =",
      `(${b.x.toFixed(0)},${b.y.toFixed(0)},${b.width.toFixed(0)},${b.height.toFixed(0)})`,
      "· candidates =",
      pool.length,
    );
  } catch {
    log(
      label,
      "primary chosen: d length =",
      (primary.getAttribute("d") || "").length,
    );
  }

  // Decor = everything that's not the primary path. The remaining paths
  // (including the backdrop) + any surviving non-path shapes all fade
  // to opacity 0 during the morph so the user only sees the primary
  // path transitioning to the name.
  const decor: SVGElement[] = [
    ...(visiblePaths.filter((p) => p !== primary) as SVGElement[]),
    ...Array.from(
      iconSvg.querySelectorAll<SVGElement>(
        "line, rect, circle, polygon, polyline",
      ),
    ),
  ];
  const iconD = primary.getAttribute("d") || "";

  log(
    label,
    "iconD length:",
    iconD.length,
    "· targetD length:",
    targetD.length,
    "· decor:",
    decor.length,
  );

  const morph: CardMorph = { primary, decor, iconD, targetD };

  const onEnter = () => playMorph(morph, "in", label);
  const onLeave = () => playMorph(morph, "out", label);

  card.addEventListener("mouseenter", onEnter);
  card.addEventListener("mouseleave", onLeave);
  card.addEventListener("focusin", onEnter);
  card.addEventListener("focusout", onLeave);
  card.addEventListener("touchstart", onEnter, { passive: true });
  card.addEventListener("touchend", onLeave, { passive: true });
  card.addEventListener("touchcancel", onLeave, { passive: true });

  log(label, "listeners attached ✓");
}

function playMorph(m: CardMorph, dir: "in" | "out", label: string): void {
  const { primary, decor, iconD, targetD } = m;
  const toD = dir === "in" ? targetD : iconD;
  const fadeDecor = dir === "in" ? 0 : 1;

  log(
    label,
    "playMorph",
    dir,
    "→ toD length:",
    toD.length,
    "· decor→",
    fadeDecor,
  );

  if (isReducedMotion()) {
    primary.setAttribute("d", toD);
    decor.forEach((el) => el.setAttribute("opacity", String(fadeDecor)));
    return;
  }

  gsap.killTweensOf([primary, ...decor]);

  if (decor.length > 0) {
    gsap.to(decor, {
      opacity: fadeDecor,
      duration: 0.3,
      ease: "power2.out",
      overwrite: "auto",
    });
  }

  gsap.to(primary, {
    duration: dir === "in" ? 0.55 : 0.45,
    ease: "power3.inOut",
    morphSVG: toD,
    overwrite: "auto",
    onStart: () => log(label, "morph tween", dir, "start"),
    onComplete: () => log(label, "morph tween", dir, "complete"),
  });
}

async function init(): Promise<void> {
  log("init()");
  const stage = document.getElementById("px-stage");
  if (!stage) {
    warn("no #px-stage found in DOM");
    return;
  }

  const cards = Array.from(
    stage.querySelectorAll<HTMLElement>("[data-px-card]"),
  );
  log("found cards:", cards.length);
  if (cards.length === 0) {
    warn("no [data-px-card] inside #px-stage");
    return;
  }

  await Promise.all(
    cards.map(async (card) => {
      const url = card.dataset.nameSrc;
      if (!url) {
        warn("card without data-name-src:", card.outerHTML.slice(0, 120));
        return;
      }
      const d = await loadNamePath(url);
      if (d) attachMorph(card, d);
      else warn(`could not load ${url} for ${card.getAttribute("aria-label")}`);
    }),
  );

  log("init() done — morphs armed for", cards.length, "cards");
}

function destroy(): void {
  log("destroy()");
  document
    .querySelectorAll<HTMLElement>("[data-px-card] svg.px__icon path")
    .forEach((p) => gsap.killTweensOf(p));
  NAME_CACHE.clear();
}

export default { init, destroy };

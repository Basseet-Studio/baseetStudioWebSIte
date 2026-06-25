// src/lib/sourceSvgs.ts
// -----------------------------------------------------------------------------
// Maps each project slug to its hi-res source SVGs (the ones the user provides
// in "source svgs/"). Two files per project:
//   - logo: the brand mark (icon side of the morph)
//   - name: the brand wordmark (target side of the morph)
//
// Both files are processed by:
//   - scripts/build-project-name-svgs.mjs  → emits /public/projects/names/{slug}.svg
//   - src/components/home/ProximityProjects.astro  → reads the logo SVG at
//     build time and injects the shapes into the icon's <svg>.
//
// The mapping is by content/visuals, not by filename — source filenames don't
// match slugs 1:1 (e.g. zaryn's source files are named money-box-*.svg, medev's
// are FarukIMS-*.svg, etc.). When a new project is added, add an entry here.
// -----------------------------------------------------------------------------

export interface SourceSvgSet {
  /** Path to the logo SVG, relative to repo root. */
  logo: string;
  /** Path to the name wordmark SVG, relative to repo root. */
  name: string;
}

export const SOURCE_SVGS: Record<string, SourceSvgSet> = {
  numu: {
    logo: "source svgs/numu-logo.svg",
    name: "source svgs/numu-name.svg",
  },
  matrix: {
    logo: "source svgs/matrix-logo.svg",
    name: "source svgs/matrix-name.svg",
  },
  geeb: {
    logo: "source svgs/geeb-logo.svg",
    name: "source svgs/geeb-name.svg",
  },
  deshikitchen: {
    logo: "source svgs/deshikitchen-logo.svg",
    name: "source svgs/deshikitchen-name.svg",
  },
  moneybox: {
    logo: "source svgs/moneyBox-logo.svg",
    name: "source svgs/moneyBox-name.svg",
  },
  "photorestore-ai": {
    logo: "source svgs/aiphotorestore-logo.svg",
    name: "source svgs/aiphotorestore-name.svg",
  },
};

// -----------------------------------------------------------------------------
// Path geometry helpers
// -----------------------------------------------------------------------------

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function unionBBox(boxes: BBox[]): BBox | null {
  if (boxes.length === 0) return null;
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  for (const b of boxes) {
    if (!isFinite(b.x) || !isFinite(b.y) || !isFinite(b.width) || !isFinite(b.height)) continue;
    if (b.width <= 0 || b.height <= 0) continue;
    xMin = Math.min(xMin, b.x);
    yMin = Math.min(yMin, b.y);
    xMax = Math.max(xMax, b.x + b.width);
    yMax = Math.max(yMax, b.y + b.height);
  }
  if (!isFinite(xMin) || !isFinite(yMin)) return null;
  return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin };
}

/** Parse a viewBox string. Returns [x, y, w, h]. */
export function parseViewBox(svg: string): [number, number, number, number] {
  const m = svg.match(/viewBox\s*=\s*"([^"]+)"/i);
  if (!m) throw new Error("No viewBox found");
  const parts = m[1].trim().split(/[\s,]+/).map(Number);
  if (parts.length !== 4 || parts.some((n) => !isFinite(n))) {
    throw new Error(`Bad viewBox: ${m[1]}`);
  }
  return parts as [number, number, number, number];
}

// -----------------------------------------------------------------------------
// Path tokenizer — converts a path `d` string into a list of typed commands
// with numeric arguments already parsed. Each command is { cmd, args: number[] }
// -----------------------------------------------------------------------------

type PathCmd =
  | { cmd: "M" | "L" | "T"; args: [number, number] }
  | { cmd: "H"; args: [number] }
  | { cmd: "V"; args: [number] }
  | { cmd: "C"; args: [number, number, number, number, number, number] }
  | { cmd: "S" | "Q"; args: [number, number, number, number] }
  | { cmd: "A"; args: [number, number, number, number, number, number, number] }
  | { cmd: "Z"; args: [] };

const CMD_ARG_COUNT: Record<string, number> = {
  M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0,
};

export function tokenizePath(d: string): PathCmd[] {
  // First pass: split into tokens (commands and numbers).
  const tokens: (string | number)[] = [];
  const re = /([MmLlHhVvCcSsQqTtAaZz])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d)) !== null) {
    if (m[1] !== undefined) tokens.push(m[1]);
    else tokens.push(parseFloat(m[2]));
  }

  // Second pass: emit typed commands. Implicit repeat: after an M, additional
  // coord pairs are treated as L's (we just emit M for the first pair then L's).
  const out: PathCmd[] = [];
  let i = 0;
  let lastCmd: keyof typeof CMD_ARG_COUNT | null = null;
  while (i < tokens.length) {
    const t = tokens[i];
    if (typeof t === "string") {
      lastCmd = t.toUpperCase() as keyof typeof CMD_ARG_COUNT;
      i++;
      continue;
    }
    // Implicit repeat of previous command
    if (lastCmd === null || lastCmd === "Z") break;
    const count = CMD_ARG_COUNT[lastCmd];
    const args: number[] = [];
    for (let k = 0; k < count; k++) {
      if (i >= tokens.length) break;
      const v = tokens[i];
      args.push(typeof v === "number" ? v : 0);
      i++;
    }
    // For repeated M's, treat the extra pairs as L's
    const emit = lastCmd === "M" && out.some((c) => c.cmd === "M") ? "L" : lastCmd;
    switch (emit) {
      case "M":
      case "L":
      case "T":
        out.push({ cmd: emit, args: [args[0], args[1]] } as PathCmd);
        break;
      case "H":
        out.push({ cmd: "H", args: [args[0]] } as PathCmd);
        break;
      case "V":
        out.push({ cmd: "V", args: [args[0]] } as PathCmd);
        break;
      case "C":
        out.push({
          cmd: "C",
          args: [args[0], args[1], args[2], args[3], args[4], args[5]],
        } as PathCmd);
        break;
      case "S":
      case "Q":
        out.push({ cmd: emit, args: [args[0], args[1], args[2], args[3]] } as PathCmd);
        break;
      case "A":
        out.push({
          cmd: "A",
          args: [
            args[0], args[1], args[2], args[3], args[4], args[5], args[6],
          ],
        } as PathCmd);
        break;
      case "Z":
        out.push({ cmd: "Z", args: [] } as PathCmd);
        break;
    }
  }
  return out;
}

// -----------------------------------------------------------------------------
// Path bbox — walks tokenized commands and tracks the union bbox.
// We sample curves so quadratic/cubic/arc control points are accounted for
// even if the curve barely deviates from the chord (rare but possible).
// -----------------------------------------------------------------------------

interface Cursor {
  x: number;
  y: number;
  cx: number; // last control point for S/T reflection
  cy: number;
}

function ensureCursor(c: Cursor | null): Cursor {
  return c ?? { x: 0, y: 0, cx: 0, cy: 0 };
}

function expand(b: BBox | null, x: number, y: number): BBox {
  if (!b) return { x, y, width: 0, height: 0 };
  const xMin = Math.min(b.x, x);
  const yMin = Math.min(b.y, y);
  const xMax = Math.max(b.x + b.width, x);
  const yMax = Math.max(b.y + b.height, y);
  return { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin };
}

/** Walk a tokenized path and return its bbox. */
export function pathBBox(d: string): BBox | null {
  const cmds = tokenizePath(d);
  let bbox: BBox | null = null;
  let cursor: Cursor | null = null;
  let startX = 0;
  let startY = 0;
  const record = (x: number, y: number): void => {
    bbox = expand(bbox, x, y);
  };
  for (const { cmd, args } of cmds) {
    const c = ensureCursor(cursor);
    switch (cmd) {
      case "M":
      case "L": {
        const [x, y] = args;
        cursor = { x, y, cx: x, cy: y };
        record(x, y);
        if (cmd === "M") {
          startX = x;
          startY = y;
        }
        break;
      }
      case "H": {
        const [x] = args;
        cursor = { ...c, x, cx: x };
        record(x, c.y);
        break;
      }
      case "V": {
        const [y] = args;
        cursor = { ...c, y, cy: y };
        record(c.x, y);
        break;
      }
      case "C": {
        const [x1, y1, x2, y2, x, y] = args;
        for (const p of sampleCubic(c.x, c.y, x1, y1, x2, y2, x, y, 8)) record(p[0], p[1]);
        cursor = { x, y, cx: x2, cy: y2 };
        break;
      }
      case "Q": {
        const [x1, y1, x, y] = args;
        for (const p of sampleQuad(c.x, c.y, x1, y1, x, y, 8)) record(p[0], p[1]);
        cursor = { x, y, cx: x1, cy: y1 };
        break;
      }
      case "S": {
        const [x2, y2, x, y] = args;
        const c1x = 2 * c.x - c.cx;
        const c1y = 2 * c.y - c.cy;
        for (const p of sampleCubic(c.x, c.y, c1x, c1y, x2, y2, x, y, 8)) record(p[0], p[1]);
        cursor = { x, y, cx: x2, cy: y2 };
        break;
      }
      case "T": {
        const [x, y] = args;
        const c1x = 2 * c.x - c.cx;
        const c1y = 2 * c.y - c.cy;
        for (const p of sampleQuad(c.x, c.y, c1x, c1y, x, y, 8)) record(p[0], p[1]);
        cursor = { x, y, cx: c1x, cy: c1y };
        break;
      }
      case "A": {
        const [rx, ry, xRot, largeArc, sweep, x, y] = args;
        for (const p of sampleArc(c.x, c.y, rx, ry, xRot, largeArc, sweep, x, y, 16)) {
          record(p[0], p[1]);
        }
        cursor = { x, y, cx: x, cy: y };
        break;
      }
      case "Z": {
        cursor = { ...c, x: startX, y: startY, cx: startX, cy: startY };
        record(startX, startY);
        break;
      }
    }
  }
  return bbox;
}

function sampleCubic(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  steps: number,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const u = 1 - t;
    const x = u * u * u * x0 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x3;
    const y = u * u * u * y0 + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y3;
    pts.push([x, y]);
  }
  return pts;
}

function sampleQuad(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  steps: number,
): [number, number][] {
  const pts: [number, number][] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * x1 + t * t * x2;
    const y = u * u * y0 + 2 * u * t * y1 + t * t * y2;
    pts.push([x, y]);
  }
  return pts;
}

/** Sample an SVG arc and return points along it. */
function sampleArc(
  x0: number, y0: number,
  rx: number, ry: number,
  xRotDeg: number,
  largeArc: number,
  sweep: number,
  x: number, y: number,
  steps: number,
): [number, number][] {
  if (rx === 0 || ry === 0) {
    return [[x0, y0], [x, y]];
  }
  const xRot = (xRotDeg * Math.PI) / 180;
  const dx = (x0 - x) / 2;
  const dy = (y0 - y) / 2;
  const cosR = Math.cos(xRot);
  const sinR = Math.sin(xRot);
  const x1p = cosR * dx + sinR * dy;
  const y1p = -sinR * dx + cosR * dy;
  let rxA = Math.abs(rx);
  let ryA = Math.abs(ry);
  const lambda = (x1p * x1p) / (rxA * rxA) + (y1p * y1p) / (ryA * ryA);
  if (lambda > 1) {
    const s = Math.sqrt(lambda);
    rxA *= s;
    ryA *= s;
  }
  const sign = largeArc === sweep ? -1 : 1;
  const denom = rxA * rxA * y1p * y1p + ryA * ryA * x1p * x1p;
  const sq = denom === 0
    ? 0
    : Math.max(
        0,
        (rxA * rxA * ryA * ryA - rxA * rxA * y1p * y1p - ryA * ryA * x1p * x1p) /
          denom,
      );
  const coef = sign * Math.sqrt(sq);
  const cxp = (coef * (rxA * y1p)) / ryA;
  const cyp = (coef * -(ryA * x1p)) / rxA;
  const cx = cosR * cxp - sinR * cyp + (x0 + x) / 2;
  const cy = sinR * cxp + cosR * cyp + (y0 + y) / 2;
  const ang = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    let a = Math.acos(Math.min(1, Math.max(-1, dot / len)));
    if (ux * vy - uy * vx < 0) a = -a;
    return a;
  };
  const theta1 = ang(1, 0, (x1p - cxp) / rxA, (y1p - cyp) / ryA);
  let dTheta = ang(
    (x1p - cxp) / rxA,
    (y1p - cyp) / ryA,
    (-x1p - cxp) / rxA,
    (-y1p - cyp) / ryA,
  );
  if (sweep === 0 && dTheta > 0) dTheta -= 2 * Math.PI;
  if (sweep === 1 && dTheta < 0) dTheta += 2 * Math.PI;
  const pts: [number, number][] = [];
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const angle = theta1 + t * dTheta;
    const ex = rxA * Math.cos(angle);
    const ey = ryA * Math.sin(angle);
    const px = cosR * ex - sinR * ey + cx;
    const py = sinR * ex + cosR * ey + cy;
    pts.push([px, py]);
  }
  return pts;
}

// -----------------------------------------------------------------------------
// Coordinate transformation — bake an affine into a path's `d` string by
// walking its commands and rewriting the numeric arguments.
// -----------------------------------------------------------------------------

const NUM_FMT = (n: number): string => {
  if (Math.abs(n) < 0.005) return "0";
  const s = n.toFixed(2);
  if (s.endsWith(".00")) return s.slice(0, -3);
  if (s.endsWith("0")) return s.slice(0, -1);
  return s;
};

export interface Affine {
  a: number; b: number; c: number; d: number; tx: number; ty: number;
}

const apply = (aff: Affine, x: number, y: number): [number, number] => [
  aff.a * x + aff.b * y + aff.tx,
  aff.c * x + aff.d * y + aff.ty,
];

/** Apply an affine transform to a path `d` string and return the new `d`. */
export function transformPathD(d: string, aff: Affine): string {
  const cmds = tokenizePath(d);
  const parts: string[] = [];
  let cursor: Cursor | null = null;
  let startX = 0;
  let startY = 0;
  for (const { cmd, args } of cmds) {
    const c = ensureCursor(cursor);
    switch (cmd) {
      case "M":
      case "L": {
        const [x, y] = args;
        const [nx, ny] = apply(aff, x, y);
        parts.push(`${cmd === "M" ? "M" : "L"}${NUM_FMT(nx)} ${NUM_FMT(ny)}`);
        cursor = { x: nx, y: ny, cx: nx, cy: ny };
        if (cmd === "M") {
          startX = nx;
          startY = ny;
        }
        break;
      }
      case "H": {
        const [x] = args;
        const [nx] = apply(aff, x, 0);
        parts.push(`H${NUM_FMT(nx)}`);
        cursor = { ...c, x: nx, cx: nx };
        break;
      }
      case "V": {
        const [y] = args;
        const [, ny] = apply(aff, 0, y);
        parts.push(`V${NUM_FMT(ny)}`);
        cursor = { ...c, y: ny, cy: ny };
        break;
      }
      case "C": {
        const [x1, y1, x2, y2, x, y] = args;
        const [nx1, ny1] = apply(aff, x1, y1);
        const [nx2, ny2] = apply(aff, x2, y2);
        const [nx, ny] = apply(aff, x, y);
        parts.push(
          `C${NUM_FMT(nx1)} ${NUM_FMT(ny1)} ${NUM_FMT(nx2)} ${NUM_FMT(ny2)} ${NUM_FMT(nx)} ${NUM_FMT(ny)}`,
        );
        cursor = { x: nx, y: ny, cx: nx2, cy: ny2 };
        break;
      }
      case "Q": {
        const [x1, y1, x, y] = args;
        const [nx1, ny1] = apply(aff, x1, y1);
        const [nx, ny] = apply(aff, x, y);
        parts.push(`Q${NUM_FMT(nx1)} ${NUM_FMT(ny1)} ${NUM_FMT(nx)} ${NUM_FMT(ny)}`);
        cursor = { x: nx, y: ny, cx: nx1, cy: ny1 };
        break;
      }
      case "S": {
        const [x2, y2, x, y] = args;
        const c1x = 2 * c.x - c.cx;
        const c1y = 2 * c.y - c.cy;
        const [nc1x, nc1y] = apply(aff, c1x, c1y);
        const [nx2, ny2] = apply(aff, x2, y2);
        const [nx, ny] = apply(aff, x, y);
        parts.push(
          `C${NUM_FMT(nc1x)} ${NUM_FMT(nc1y)} ${NUM_FMT(nx2)} ${NUM_FMT(ny2)} ${NUM_FMT(nx)} ${NUM_FMT(ny)}`,
        );
        cursor = { x: nx, y: ny, cx: nx2, cy: ny2 };
        break;
      }
      case "T": {
        const [x, y] = args;
        const c1x = 2 * c.x - c.cx;
        const c1y = 2 * c.y - c.cy;
        const [nc1x, nc1y] = apply(aff, c1x, c1y);
        const [nx, ny] = apply(aff, x, y);
        parts.push(`Q${NUM_FMT(nc1x)} ${NUM_FMT(nc1y)} ${NUM_FMT(nx)} ${NUM_FMT(ny)}`);
        cursor = { x: nx, y: ny, cx: nc1x, cy: nc1y };
        break;
      }
      case "A": {
        const [rx, ry, xRot, largeArc, sweep, x, y] = args;
        // Uniform scale: rx and ry are scaled by the same factor. The rotation
        // is preserved because we only ever apply uniform scales here.
        const scale = (aff.a + aff.d) / 2;
        const [nx, ny] = apply(aff, x, y);
        parts.push(
          `A${NUM_FMT(rx * scale)} ${NUM_FMT(ry * scale)} ${NUM_FMT(xRot)} ${NUM_FMT(largeArc)} ${NUM_FMT(sweep)} ${NUM_FMT(nx)} ${NUM_FMT(ny)}`,
        );
        cursor = { ...c, x: nx, y: ny };
        break;
      }
      case "Z":
        parts.push("Z");
        cursor = { ...c, x: startX, y: startY, cx: startX, cy: startY };
        break;
    }
  }
  return parts.join(" ");
}

/**
 * Compute the uniform affine that takes a bbox drawn in source user-space and
 * fits it into `targetSize × targetSize`, centred, with `marginPct` of margin.
 */
export function fitTransform(
  bbox: BBox,
  targetSize: number,
  marginPct: number,
): Affine {
  const w = bbox.width;
  const h = bbox.height;
  const scale = (targetSize / Math.max(w, h)) * (1 - marginPct);
  const cx = bbox.x + w / 2;
  const cy = bbox.y + h / 2;
  const targetCentre = targetSize / 2;
  return {
    a: scale, b: 0, c: 0, d: scale,
    tx: targetCentre - scale * cx,
    ty: targetCentre - scale * cy,
  };
}

/** Non-uniform fit: takes a bbox and fits it into a `targetW × targetH` box,
 *  centered, with `marginPct` of margin on both axes. Allows the icon and
 *  the wordmark to share a non-square viewBox without distorting either. */
export function fitTransformBox(
  bbox: BBox,
  targetW: number,
  targetH: number,
  marginPct: number,
): Affine {
  const w = bbox.width;
  const h = bbox.height;
  const sx = (targetW / w) * (1 - marginPct);
  const sy = (targetH / h) * (1 - marginPct);
  const cx = bbox.x + w / 2;
  const cy = bbox.y + h / 2;
  const targetCx = targetW / 2;
  const targetCy = targetH / 2;
  return {
    a: sx, b: 0, c: 0, d: sy,
    tx: targetCx - sx * cx,
    ty: targetCy - sy * cy,
  };
}

// -----------------------------------------------------------------------------
// Source SVG walker
// -----------------------------------------------------------------------------
// Parses a source SVG file (the kind users get out of Figma/Illustrator with
// gradients, filters, decorative panels) and returns clean `<path>` markup
// suitable for embedding inside our `px__icon` (viewBox 0..256). What it does:
//   1. Walks every element depth-first, tracking the current group transform.
//   2. Skips <defs>, <style>, <title>, <filter>, <clipPath>, <mask>, gradients.
//   3. Skips background `<rect>` elements that span >= 80% of the source
//      viewBox in both dimensions (decorative panels).
//   4. Converts each remaining shape into a `<path d="…">` whose `d` has been
//      rewritten through the cumulative transform + a fit-to-target affine.
//   5. Strips fill (so the px__icon CSS can color them via currentColor).
//
// Output is a string of `<path d="…"/>` elements ready for `set:html`.
// -----------------------------------------------------------------------------

const NUM_FMT2 = (n: number): string => {
  if (Math.abs(n) < 0.005) return "0";
  // Strip trailing zeros — keeps output tidy (e.g. "1" not "1.00")
  const s = n.toFixed(2);
  if (s.endsWith(".00")) return s.slice(0, -3);
  if (s.endsWith("0")) return s.slice(0, -1);
  return s;
};

/** Parse an SVG `transform="…"` attribute into an Affine. Supports translate,
 * scale, rotate, and matrix(...) in any combination, applied right-to-left. */
export function parseTransform(s: string | null): Affine {
  const identity: Affine = { a: 1, b: 0, c: 0, d: 1, tx: 0, ty: 0 };
  if (!s) return identity;
  const mul = (x: Affine, y: Affine): Affine => ({
    a: x.a * y.a + x.b * y.c,
    b: x.a * y.b + x.b * y.d,
    c: x.c * y.a + x.d * y.c,
    d: x.c * y.b + x.d * y.d,
    tx: x.a * y.tx + x.b * y.ty + x.tx,
    ty: x.c * y.tx + x.d * y.ty + x.ty,
  });
  const re = /(matrix|translate|scale|rotate|skewX|skewY)\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  let result = identity;
  while ((m = re.exec(s)) !== null) {
    const fn = m[1];
    const nums = m[2].split(/[\s,]+/).filter(Boolean).map(Number);
    let t: Affine = identity;
    if (fn === "matrix" && nums.length === 6) {
      t = { a: nums[0], b: nums[1], c: nums[2], d: nums[3], tx: nums[4], ty: nums[5] };
    } else if (fn === "translate") {
      t = { a: 1, b: 0, c: 0, d: 1, tx: nums[0] || 0, ty: nums[1] || 0 };
    } else if (fn === "scale") {
      t = { a: nums[0] || 1, b: 0, c: 0, d: nums[1] !== undefined ? nums[1] : nums[0] || 1, tx: 0, ty: 0 };
    } else if (fn === "rotate" && nums.length === 1) {
      const r = (nums[0] * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      t = { a: cos, b: sin, c: -sin, d: cos, tx: 0, ty: 0 };
    } else if (fn === "rotate" && nums.length === 3) {
      const r = (nums[0] * Math.PI) / 180;
      const cos = Math.cos(r);
      const sin = Math.sin(r);
      const cx = nums[1];
      const cy = nums[2];
      // translate(cx,cy) * rotate(r) * translate(-cx,-cy)
      t = mul(
        { a: 1, b: 0, c: 0, d: 1, tx: cx, ty: cy },
        mul(
          { a: cos, b: sin, c: -sin, d: cos, tx: 0, ty: 0 },
          { a: 1, b: 0, c: 0, d: 1, tx: -cx, ty: -cy },
        ),
      );
    } else if (fn === "skewX") {
      t = { a: 1, b: 0, c: Math.tan((nums[0] * Math.PI) / 180), d: 1, tx: 0, ty: 0 };
    } else if (fn === "skewY") {
      t = { a: 1, b: Math.tan((nums[0] * Math.PI) / 180), c: 0, d: 1, tx: 0, ty: 0 };
    }
    result = mul(result, t);
  }
  return result;
}

/** Convert a circle to a closed cubic-bezier path approximating it. */
function circleToPath(cx: number, cy: number, r: number): string {
  const c = 0.5522847498 * r;
  return (
    `M${NUM_FMT2(cx - r)} ${NUM_FMT2(cy)} ` +
    `C${NUM_FMT2(cx - r)} ${NUM_FMT2(cy - c)} ${NUM_FMT2(cx - c)} ${NUM_FMT2(cy - r)} ${NUM_FMT2(cx)} ${NUM_FMT2(cy - r)} ` +
    `C${NUM_FMT2(cx + c)} ${NUM_FMT2(cy - r)} ${NUM_FMT2(cx + r)} ${NUM_FMT2(cy - c)} ${NUM_FMT2(cx + r)} ${NUM_FMT2(cy)} ` +
    `C${NUM_FMT2(cx + r)} ${NUM_FMT2(cy + c)} ${NUM_FMT2(cx + c)} ${NUM_FMT2(cy + r)} ${NUM_FMT2(cx)} ${NUM_FMT2(cy + r)} ` +
    `C${NUM_FMT2(cx - c)} ${NUM_FMT2(cy + r)} ${NUM_FMT2(cx - r)} ${NUM_FMT2(cy + c)} ${NUM_FMT2(cx - r)} ${NUM_FMT2(cy)} Z`
  );
}

/** Convert an ellipse to a closed cubic-bezier path. */
function ellipseToPath(cx: number, cy: number, rx: number, ry: number): string {
  const cxC = 0.5522847498 * rx;
  const cyC = 0.5522847498 * ry;
  return (
    `M${NUM_FMT2(cx - rx)} ${NUM_FMT2(cy)} ` +
    `C${NUM_FMT2(cx - rx)} ${NUM_FMT2(cy - cyC)} ${NUM_FMT2(cx - cxC)} ${NUM_FMT2(cy - ry)} ${NUM_FMT2(cx)} ${NUM_FMT2(cy - ry)} ` +
    `C${NUM_FMT2(cx + cxC)} ${NUM_FMT2(cy - ry)} ${NUM_FMT2(cx + rx)} ${NUM_FMT2(cy - cyC)} ${NUM_FMT2(cx + rx)} ${NUM_FMT2(cy)} ` +
    `C${NUM_FMT2(cx + rx)} ${NUM_FMT2(cy + cyC)} ${NUM_FMT2(cx + cxC)} ${NUM_FMT2(cy + ry)} ${NUM_FMT2(cx)} ${NUM_FMT2(cy + ry)} ` +
    `C${NUM_FMT2(cx - cxC)} ${NUM_FMT2(cy + ry)} ${NUM_FMT2(cx - rx)} ${NUM_FMT2(cy + cyC)} ${NUM_FMT2(cx - rx)} ${NUM_FMT2(cy)} Z`
  );
}

/** Convert a `<rect>` to a closed path. */
function rectToPath(x: number, y: number, w: number, h: number, rx: number, ry: number): string {
  if (!rx && !ry) {
    return `M${NUM_FMT2(x)} ${NUM_FMT2(y)} H${NUM_FMT2(x + w)} V${NUM_FMT2(y + h)} H${NUM_FMT2(x)} Z`;
  }
  const r = Math.max(0, Math.min(rx || 0, w / 2));
  const rt = Math.max(0, Math.min(ry || r, h / 2));
  return (
    `M${NUM_FMT2(x + r)} ${NUM_FMT2(y)} ` +
    `H${NUM_FMT2(x + w - r)} ` +
    `C${NUM_FMT2(x + w)} ${NUM_FMT2(y)} ${NUM_FMT2(x + w)} ${NUM_FMT2(y)} ${NUM_FMT2(x + w)} ${NUM_FMT2(y + rt)} ` +
    `V${NUM_FMT2(y + h - rt)} ` +
    `C${NUM_FMT2(x + w)} ${NUM_FMT2(y + h)} ${NUM_FMT2(x + w)} ${NUM_FMT2(y + h)} ${NUM_FMT2(x + w - r)} ${NUM_FMT2(y + h)} ` +
    `H${NUM_FMT2(x + r)} ` +
    `C${NUM_FMT2(x)} ${NUM_FMT2(y + h)} ${NUM_FMT2(x)} ${NUM_FMT2(y + h)} ${NUM_FMT2(x)} ${NUM_FMT2(y + h - rt)} ` +
    `V${NUM_FMT2(y + rt)} ` +
    `C${NUM_FMT2(x)} ${NUM_FMT2(y)} ${NUM_FMT2(x)} ${NUM_FMT2(y)} ${NUM_FMT2(x + r)} ${NUM_FMT2(y)} Z`
  );
}

/** Convert a `<line>` to a path. */
function lineToPath(x1: number, y1: number, x2: number, y2: number): string {
  return `M${NUM_FMT2(x1)} ${NUM_FMT2(y1)} L${NUM_FMT2(x2)} ${NUM_FMT2(y2)}`;
}

/** Convert a `<polyline>`/`<polygon>` to a path. */
function polylineToPath(points: string, close: boolean): string {
  const pairs = points.trim().split(/[\s,]+/);
  if (pairs.length < 4) return "";
  let out = `M${pairs[0]} ${pairs[1]}`;
  for (let i = 2; i < pairs.length; i += 2) {
    out += ` L${pairs[i]} ${pairs[i + 1] ?? ""}`.trim();
  }
  if (close) out += " Z";
  return out;
}

/** Apply an affine transform to a single (x,y) point. */
function tApply(aff: Affine, x: number, y: number): [number, number] {
  return [aff.a * x + aff.b * y + aff.tx, aff.c * x + aff.d * y + aff.ty];
}

/**
 * Walk a source SVG and return path markup that fits inside a target viewBox.
 *
 * @param svg       The source SVG file's text
 * @param targetSize   The viewBox is 0..targetSize in both axes (typically 256)
 * @param marginPct    Fractional margin (e.g. 0.1 = 10%)
 * @param skipDecorativeRects  If true, drop `<rect>` elements that span >= 80%
 *                              of the source viewBox in both dims (background
 *                              panels). Defaults to true.
 */
export function extractLogoPaths(
  svg: string,
  targetSize = 256,
  marginPct = 0.1,
  skipDecorativeRects = true,
): string {
  // 1) Source viewBox for backdrop detection
  const [, , vbW, vbH] = parseViewBox(svg);

  // 2) Tokenize the SVG body into a flat list of element entries. We parse
  //    manually rather than via DOMParser because we don't want a DOM dep.
  const bodyMatch = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  if (!bodyMatch) return "";
  const body = bodyMatch[1];

  type Entry =
    | { kind: "open"; tag: string; attrs: Record<string, string> }
    | { kind: "self"; tag: string; attrs: Record<string, string> }
    | { kind: "close"; tag: string };

  const SKIP_TAGS = new Set([
    "defs", "style", "title", "desc", "filter", "clipPath", "mask",
    "linearGradient", "radialGradient", "stop", "pattern", "symbol",
    "use", "image", "foreignObject",
  ]);

  const entries: Entry[] = [];
  const tokenRe = /<\/?([A-Za-z][A-Za-z0-9-]*)\b([^>]*?)\/?>/g;
  let tm: RegExpExecArray | null;
  while ((tm = tokenRe.exec(body)) !== null) {
    const fullMatch = tm[0];
    const tag = tm[1];
    const attrText = tm[2] || "";
    const isClose = fullMatch.startsWith("</");
    const isSelf = !isClose && (fullMatch.endsWith("/>") || ["path", "circle", "rect", "line", "polyline", "polygon", "ellipse", "use", "stop", "image"].includes(tag));
    const attrs: Record<string, string> = {};
    if (!isClose) {
      const attrRe = /([A-Za-z_:][\w:-]*)\s*=\s*"([^"]*)"/g;
      let am: RegExpExecArray | null;
      while ((am = attrRe.exec(attrText)) !== null) {
        attrs[am[1]] = am[2];
      }
    }
    if (isClose) entries.push({ kind: "close", tag });
    else if (isSelf) entries.push({ kind: "self", tag, attrs });
    else entries.push({ kind: "open", tag, attrs });
  }

  // 3) Walk entries with a transform stack. Skip SKIP_TAGS bodies. Collect
  //    shapes with their cumulative transform.
  type Shape = { tag: string; attrs: Record<string, string>; m: Affine };
  const shapes: Shape[] = [];
  const stack: { m: Affine }[] = [];
  for (const e of entries) {
    if (e.kind === "open") {
      if (SKIP_TAGS.has(e.tag)) {
        // Push a marker so we know to skip until the matching close.
        stack.push({ m: stack[stack.length - 1]?.m ?? parseTransform(null) });
        continue;
      }
      const parent = stack[stack.length - 1]?.m ?? parseTransform(null);
      const m = mulAffines(parent, parseTransform(e.attrs.transform ?? null));
      stack.push({ m });
      // Also collect if this is a leaf shape that wasn't self-closed
      if (e.tag === "g" || e.tag === "svg") continue;
      // Treat as a shape open (will be matched by a </close>)
      shapes.push({ tag: e.tag, attrs: e.attrs, m });
    } else if (e.kind === "self") {
      if (SKIP_TAGS.has(e.tag)) continue;
      const parent = stack[stack.length - 1]?.m ?? parseTransform(null);
      const m = mulAffines(parent, parseTransform(e.attrs.transform ?? null));
      shapes.push({ tag: e.tag, attrs: e.attrs, m });
    } else {
      // close — pop the stack
      if (SKIP_TAGS.has(e.tag)) {
        // Find and remove the matching marker (the top of the stack)
        stack.pop();
        continue;
      }
      stack.pop();
    }
  }

  // 4) Convert each shape into a `<path d>` in user-space. Compute the union
  //    bbox over all of them so we can fit them into the target viewBox.
  const pathDs: string[] = [];
  const allBoxes: BBox[] = [];
  for (const s of shapes) {
    if (skipDecorativeRects && s.tag === "rect") {
      const x = parseFloat(s.attrs.x ?? "0");
      const y = parseFloat(s.attrs.y ?? "0");
      const w = parseFloat(s.attrs.width ?? "0");
      const h = parseFloat(s.attrs.height ?? "0");
      if (w >= vbW * 0.8 && h >= vbH * 0.8) continue; // backdrop
    }
    const d = shapeToPathD(s);
    if (!d) continue;
    const bbox = pathBBox(d);
    if (!bbox || !isFinite(bbox.x)) continue;
    allBoxes.push(bbox);
    pathDs.push(d);
  }
  if (pathDs.length === 0) return "";

  const union = unionBBox(allBoxes);
  if (!union) return "";
  const fit = fitTransform(union, targetSize, marginPct);

  // 5) Apply the fit transform to each path's d. The shapes already have
  //    their source group transforms baked into their coords (because we used
  //    the cumulative matrix when calling shapeToPathD), so only the fit
  //    transform remains.
  const out: string[] = [];
  for (const d of pathDs) {
    const newD = transformPathD(d, fit);
    out.push(`<path d="${newD}"/>`);
  }
  return out.join("");
}

// -----------------------------------------------------------------------------
// readSourceSvgInner — read a source SVG file and return the inner markup
// (everything between <svg ...> and </svg>), wrapped in a single
// <g transform="matrix(…)"> that fits the union bbox of all paths into a
// 0..targetSize viewBox, centered with marginPct breathing room.
//
// Why this exists: the source SVGs from Figma are flat, hand-crafted brand
// marks (single <path> with fill-rule="evenodd">, no gradients, no defs).
// The previous approach (`extractLogoPaths()`) flattened them all to plain
// line drawings with stroke="currentColor" — which is why the morph grid
// used to look like "random doodles". Injecting the source markup as-is
// preserves the brand mark exactly as designed; the morph script then
// picks the primary path (by bbox area × 1000 + d-length) to morph into
// the outlined wordmark.
//
// We drop <defs>, <style>, <title>, <desc> defensively in case a future
// export contains them. The Figma exports we have today are pure shapes.
// -----------------------------------------------------------------------------

/** Compute the union bbox of every <path d="…"> in the source SVG, in the
 *  source's own coordinate system (before any viewBox-fit). */
function sourcePathsUnionBBox(svg: string): BBox | null {
  const bodyMatch = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  if (!bodyMatch) return null;
  const body = bodyMatch[1];
  const ds = [...body.matchAll(/\bd="([^"]+)"/g)].map((m) => m[1]);
  if (ds.length === 0) return null;
  const boxes = ds.map(pathBBox).filter((b): b is BBox => b !== null);
  return unionBBox(boxes);
}

export function readSourceSvgInner(
  svg: string,
  targetW: number,
  targetH: number,
  marginPct = 0.1,
): string {
  const bodyMatch = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/);
  if (!bodyMatch) return "";
  let body = bodyMatch[1];

  // Defensive: drop <defs>, <style>, <title>, <desc>. Figma exports are flat
  // so this is a no-op for the files we have, but it keeps the function
  // safe against future exports that include metadata.
  body = body
    .replace(/<defs\b[\s\S]*?<\/defs>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/<title\b[\s\S]*?<\/title>/gi, "")
    .replace(/<desc\b[\s\S]*?<\/desc>/gi, "");

  // Recolor: any explicit fill="…" (Figma exports as fill="black") becomes
  // fill="currentColor" so the per-tile --px-color cascades into the brand
  // mark. Strokes are left alone (Figma exports with stroke="black" too —
  // we leave that since the px__icon CSS paints strokes with currentColor).
  body = body.replace(/\bfill="(?!none|url\()[^"]*"/gi, 'fill="currentColor"');

  // Compute the source union bbox and a non-uniform fit into the target
  // viewBox. Non-uniform is important: a square logo into a wide wordmark
  // viewBox would otherwise squish horizontally.
  const union = sourcePathsUnionBBox(svg);
  if (!union) return "";
  const fit = fitTransformBox(union, targetW, targetH, marginPct);
  const m = `${num(fit.a)} ${num(fit.b)} ${num(fit.c)} ${num(fit.d)} ${num(fit.tx)} ${num(fit.ty)}`;

  // Wrap in a group that applies the fit transform. The component's
  // svg.px__icon viewBox is 0..targetW × 0..targetH, so the group lands
  // in the right place automatically.
  return `<g transform="matrix(${m})">${body}</g>`;
}

const num = (n: number): string => {
  if (Math.abs(n) < 0.0005) return "0";
  const s = n.toFixed(4);
  return s.replace(/0+$/, "").replace(/\.$/, "");
};

function mulAffines(x: Affine, y: Affine): Affine {
  return {
    a: x.a * y.a + x.b * y.c,
    b: x.a * y.b + x.b * y.d,
    c: x.c * y.a + x.d * y.c,
    d: x.c * y.b + x.d * y.d,
    tx: x.a * y.tx + x.b * y.ty + x.tx,
    ty: x.c * y.tx + x.d * y.ty + x.ty,
  };
}

/** Convert a single shape (with its cumulative matrix `m`) into a path `d`
 *  with the matrix already applied to its coordinates. */
function shapeToPathD(s: { tag: string; attrs: Record<string, string>; m: Affine }): string {
  const { tag, attrs, m } = s;
  switch (tag) {
    case "path": {
      const d = attrs.d ?? "";
      if (!d) return "";
      return transformPathD(d, m);
    }
    case "circle": {
      const cx = parseFloat(attrs.cx ?? "0");
      const cy = parseFloat(attrs.cy ?? "0");
      const r = parseFloat(attrs.r ?? "0");
      // Apply the affine to the centre + scale the radius.
      const [ncx, ncy] = tApply(m, cx, cy);
      const avgScale = (Math.hypot(m.a, m.b) + Math.hypot(m.c, m.d)) / 2;
      const nr = r * avgScale;
      return circleToPath(ncx, ncy, nr);
    }
    case "ellipse": {
      const cx = parseFloat(attrs.cx ?? "0");
      const cy = parseFloat(attrs.cy ?? "0");
      const rx = parseFloat(attrs.rx ?? "0");
      const ry = parseFloat(attrs.ry ?? "0");
      const [ncx, ncy] = tApply(m, cx, cy);
      const sx = Math.hypot(m.a, m.b);
      const sy = Math.hypot(m.c, m.d);
      return ellipseToPath(ncx, ncy, rx * sx, ry * sy);
    }
    case "rect": {
      const x = parseFloat(attrs.x ?? "0");
      const y = parseFloat(attrs.y ?? "0");
      const w = parseFloat(attrs.width ?? "0");
      const h = parseFloat(attrs.height ?? "0");
      const rx = parseFloat(attrs.rx ?? "0");
      const ry = parseFloat(attrs.ry ?? "0");
      const p0 = tApply(m, x, y);
      const p1 = tApply(m, x + w, y);
      const p2 = tApply(m, x + w, y + h);
      const p3 = tApply(m, x, y + h);
      const sx = Math.hypot(m.a, m.b);
      const sy = Math.hypot(m.c, m.d);
      const newW = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      const newH = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const newRx = rx * ((sx + sy) / 2);
      const newRy = ry * ((sx + sy) / 2);
      return rectToPath(p0[0], p0[1], newW, newH, newRx, newRy);
    }
    case "line": {
      const x1 = parseFloat(attrs.x1 ?? "0");
      const y1 = parseFloat(attrs.y1 ?? "0");
      const x2 = parseFloat(attrs.x2 ?? "0");
      const y2 = parseFloat(attrs.y2 ?? "0");
      const [nx1, ny1] = tApply(m, x1, y1);
      const [nx2, ny2] = tApply(m, x2, y2);
      return lineToPath(nx1, ny1, nx2, ny2);
    }
    case "polyline":
      return transformPathD(polylineToPath(attrs.points ?? "", false), m);
    case "polygon":
      return transformPathD(polylineToPath(attrs.points ?? "", true), m);
    default:
      return "";
  }
}
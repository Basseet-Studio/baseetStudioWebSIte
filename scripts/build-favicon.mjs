// scripts/build-favicon.mjs — Build favicon assets from the Logo Kit mark.
// Source: logo and stuff/LOGO/5_Black Stroks.png (balloon + clouds, no wordmark).
// Writes:
//   public/brand/baseet-logo.png   (CSS mask for the app bar)
//   public/brand/baseet-mark.png   (transparent square mark)
//   public/brand/og-default.png    (1200×630 social share)
//   public/favicon.ico             (16/32/48, light tile)
//   public/favicon.svg             (embedded PNG)
//   public/favicon-32.png
//   public/icon-192.png
//   public/apple-touch-icon.png
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const strokesSrc = path.join(root, "logo and stuff/LOGO/5_Black Stroks.png");
const fullBlackSrc = path.join(root, "logo and stuff/LOGO/1_Black.png");
const whiteBoxSrc = path.join(root, "logo and stuff/LOGO/4_White box.png");

const TILE_BG = { r: 247, g: 246, b: 242 };

function icoFromPngs(pngs, sizes) {
  const ICONDIR_SIZE = 6;
  const ENTRY_SIZE = 16;
  const headerSize = ICONDIR_SIZE + ENTRY_SIZE * sizes.length;
  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  let cursor = headerSize;
  sizes.forEach((size, i) => {
    const entryOffset = ICONDIR_SIZE + ENTRY_SIZE * i;
    const png = pngs[i];
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 0);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2);
    header.writeUInt8(0, entryOffset + 3);
    header.writeUInt16LE(1, entryOffset + 4);
    header.writeUInt16LE(32, entryOffset + 6);
    header.writeUInt32LE(png.length, entryOffset + 8);
    header.writeUInt32LE(cursor, entryOffset + 12);
    cursor += png.length;
  });
  return Buffer.concat([header, ...pngs]);
}

async function tile(markSquare, size) {
  const pad = Math.max(2, Math.round(size * 0.14));
  const inner = size - pad * 2;
  const mark = await sharp(markSquare)
    .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: TILE_BG,
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toBuffer();
}

const markTrim = await sharp(strokesSrc).trim().png().toBuffer();

await sharp(markTrim)
  .resize(640, null, { fit: "inside" })
  .png()
  .toFile(path.join(root, "public/brand/baseet-logo.png"));

const squareSize = 512;
const pad = Math.round(squareSize * 0.12);
const inner = squareSize - pad * 2;
const squareMark = await sharp({
  create: {
    width: squareSize,
    height: squareSize,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    {
      input: await sharp(markTrim)
        .resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
      gravity: "centre",
    },
  ])
  .png()
  .toBuffer();

await fs.writeFile(path.join(root, "public/brand/baseet-mark.png"), squareMark);

const sizes = [16, 32, 48];
const pngs = await Promise.all(sizes.map((size) => tile(squareMark, size)));
await fs.writeFile(path.join(root, "public/favicon.ico"), icoFromPngs(pngs, sizes));
await sharp(await tile(squareMark, 32)).toFile(path.join(root, "public/favicon-32.png"));
await sharp(await tile(squareMark, 192)).toFile(path.join(root, "public/icon-192.png"));

const png128 = await tile(squareMark, 128);
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128">
  <image width="128" height="128" href="data:image/png;base64,${png128.toString("base64")}"/>
</svg>
`;
await fs.writeFile(path.join(root, "public/favicon.svg"), svg);

const boxTrim = await sharp(whiteBoxSrc).trim().png().toBuffer();
await sharp(boxTrim)
  .resize(180, 180, { fit: "cover" })
  .png()
  .toFile(path.join(root, "public/apple-touch-icon.png"));

const fullTrim = await sharp(fullBlackSrc).trim().png().toBuffer();
await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 3,
    background: TILE_BG,
  },
})
  .composite([
    {
      input: await sharp(fullTrim)
        .resize(720, 480, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer(),
      gravity: "centre",
    },
  ])
  .png()
  .toFile(path.join(root, "public/brand/og-default.png"));

console.log("[build-favicon] Wrote brand mark, favicons, apple-touch-icon, and og-default.png");

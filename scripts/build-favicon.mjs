// scripts/build-favicon.mjs — Build favicon.ico from clover-bold.png at 16/32/48
// Writes a multi-size .ico (PNG-embedded, Vista+ format) by hand.
import sharp from "sharp";
import path from "node:path";
import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcPng = path.join(root, "clover-bold.png");
const outIco = path.join(root, "public", "favicon.ico");

const sizes = [16, 32, 48];

// Render each size as a PNG buffer.
const pngs = await Promise.all(
  sizes.map((size) =>
    sharp(srcPng)
      .resize(size, size, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
  ),
);

const ICONDIR_SIZE = 6;
const ENTRY_SIZE = 16;
const headerSize = ICONDIR_SIZE + ENTRY_SIZE * sizes.length;

// Build ICONDIR header
const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = 1 (ICO)
header.writeUInt16LE(sizes.length, 4); // image count

// Compute offsets and fill ICONDIRENTRYs
let cursor = headerSize;
sizes.forEach((size, i) => {
  const entryOffset = ICONDIR_SIZE + ENTRY_SIZE * i;
  const png = pngs[i];
  // 0 means 256 in the ICO spec.
  header.writeUInt8(size === 256 ? 0 : size, entryOffset + 0); // width
  header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1); // height
  header.writeUInt8(0, entryOffset + 2); // color count
  header.writeUInt8(0, entryOffset + 3); // reserved
  header.writeUInt16LE(1, entryOffset + 4); // color planes
  header.writeUInt16LE(32, entryOffset + 6); // bits per pixel
  header.writeUInt32LE(png.length, entryOffset + 8); // bytes in resource
  header.writeUInt32LE(cursor, entryOffset + 12); // image data offset
  cursor += png.length;
});

// Concatenate header + all PNGs into the final .ico file
const ico = Buffer.concat([header, ...pngs]);
await fs.writeFile(outIco, ico);

console.log(
  `[build-favicon] Wrote ${outIco} (${ico.length} bytes) with sizes ${sizes.join(", ")}`,
);

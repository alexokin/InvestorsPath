// Generates public/icons/icon-192.png and public/icons/icon-512.png:
// a solid blue rounded square with a simple white ascending bar-chart glyph,
// built with Node built-ins only (zlib + hand-rolled PNG chunks/CRC32).
//
// Run once with `node scripts/make-icons.mjs` and commit the resulting PNGs.
// The glyph sits inside the center ~70% of the canvas so the image is safe
// to use as a maskable icon (background fills edge-to-edge).

import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "icons");

const BG = [0x25, 0x63, 0xeb]; // #2563eb
const FG = [0xf8, 0xfa, 0xfc]; // #f8fafc (near-white)

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = CRC_TABLE[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, "ascii");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

/** @param {number} size @param {(x:number,y:number)=>[number,number,number,number]} pixelFn */
function writePng(size, pixelFn) {
  const bytesPerPixel = 4;
  const rowBytes = size * bytesPerPixel;
  const raw = Buffer.alloc((rowBytes + 1) * size);
  for (let y = 0; y < size; y++) {
    const rowStart = y * (rowBytes + 1);
    raw[rowStart] = 0; // no filter
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixelFn(x, y);
      const off = rowStart + 1 + x * bytesPerPixel;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Rounded square with an ascending 3-bar chart glyph, centered.
function makeIcon(size) {
  const radius = size * 0.18;
  const barCount = 3;
  const barGap = size * 0.06;
  const barWidth = (size * 0.5 - barGap * (barCount - 1)) / barCount;
  const groupWidth = barWidth * barCount + barGap * (barCount - 1);
  const groupLeft = (size - groupWidth) / 2;
  const baseline = size * 0.68;
  const barHeights = [0.22, 0.34, 0.46].map((f) => size * f);

  function insideRoundedSquare(x, y) {
    const cx = x < radius ? radius : x > size - radius ? size - radius : x;
    const cy = y < radius ? radius : y > size - radius ? size - radius : y;
    const dx = x - cx;
    const dy = y - cy;
    return dx * dx + dy * dy <= radius * radius || (x >= radius && x <= size - radius) || (y >= radius && y <= size - radius);
  }

  function inBar(x, y) {
    for (let i = 0; i < barCount; i++) {
      const left = groupLeft + i * (barWidth + barGap);
      const top = baseline - barHeights[i];
      if (x >= left && x <= left + barWidth && y >= top && y <= baseline) {
        return true;
      }
    }
    return false;
  }

  return writePng(size, (x, y) => {
    if (!insideRoundedSquare(x + 0.5, y + 0.5)) {
      return [0, 0, 0, 0];
    }
    if (inBar(x + 0.5, y + 0.5)) {
      return [FG[0], FG[1], FG[2], 255];
    }
    return [BG[0], BG[1], BG[2], 255];
  });
}

for (const size of [192, 512]) {
  const png = makeIcon(size);
  const outPath = path.join(OUT_DIR, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`[make-icons] wrote ${outPath} (${png.length} bytes)`);
}

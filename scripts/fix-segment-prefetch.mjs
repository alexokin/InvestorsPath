// Workaround for a Next.js static-export bug on Windows.
//
// The client router prefetches per-segment data from flat files such as
// `/tools/__next.tools.__PAGE__.txt`. The exporter builds those names by
// replacing "/" with "." in the segment path, but on Windows the collected
// paths use "\", so the files are written as nested folders
// (`/tools/__next.tools/__PAGE__.txt`) and every prefetch 404s. This script
// flattens them after `next build`. On Linux/macOS there is nothing to do.
import { promises as fs } from "node:fs";
import path from "node:path";

const OUT = path.resolve("out");
let moved = 0;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith("__next.")) {
      await flatten(dir, full, entry.name);
    } else {
      await walk(full);
    }
  }
}

async function flatten(parent, dir, prefix) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await flatten(parent, full, `${prefix}.${entry.name}`);
    } else {
      await fs.rename(full, path.join(parent, `${prefix}.${entry.name}`));
      moved++;
    }
  }
  await fs.rm(dir, { recursive: true, force: true });
}

try {
  await fs.access(OUT);
} catch {
  console.log("[fix-segment-prefetch] no ./out directory, skipping");
  process.exit(0);
}
await walk(OUT);
console.log(`[fix-segment-prefetch] flattened ${moved} segment prefetch file(s)`);

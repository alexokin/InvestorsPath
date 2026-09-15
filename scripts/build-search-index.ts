/**
 * Build-time step (run as part of `prebuild`, after content validation) that
 * writes the search index to public/search-index.json.
 *
 * Why a static JSON file in public/ rather than embedding the index as a
 * <script type="application/json"> tag in the root layout:
 *   - The index doesn't change per-request, so either approach has to
 *     happen at build time regardless.
 *   - Embedding the index in the layout means every single page ships the
 *     entire index inline in its HTML (it can't be deduped across pages the
 *     way a shared script chunk can), which bloats every page's payload for
 *     a feature most visits never use.
 *   - A public/search-index.json file is fetched once, lazily, only when the
 *     visitor actually opens the search dialog (Ctrl/Cmd+K or the search
 *     button), and the browser caches it across navigations since it's a
 *     plain static asset with a stable URL.
 *   - It keeps the search index trivially testable/inspectable on its own
 *     (`cat public/search-index.json`) and decoupled from React rendering.
 */
import fs from "node:fs";
import path from "node:path";
import { buildSearchIndex } from "../lib/content/search-index";

function main() {
  const index = buildSearchIndex();
  const outDir = path.join(process.cwd(), "public");
  const outPath = path.join(outDir, "search-index.json");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(index), "utf8");
  console.log(`[build-search-index] wrote ${index.length} entries to public/search-index.json`);
}

main();

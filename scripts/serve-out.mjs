#!/usr/bin/env node
// Dependency-free static server for the Next.js static export in ./out.
//
// Mirrors the production GitHub Pages layout: the export on disk has no
// prefix folder (out/tools/dcf/index.html) but every link/asset inside it
// references `${NEXT_PUBLIC_BASE_PATH}/...`. This server mounts ./out at
// that base path so a build made with NEXT_PUBLIC_BASE_PATH set can be
// tested locally exactly as it will be served in production, while an
// unprefixed (default) build still works unchanged.
//
// Usage:
//   node scripts/serve-out.mjs
//   PORT=4173 NEXT_PUBLIC_BASE_PATH=/InvestorsPath node scripts/serve-out.mjs
import { createServer } from "node:http";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, normalize, sep } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = Number(process.env.PORT) || 4173;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";
const OUT_DIR = fileURLToPath(new URL("../out/", import.meta.url));

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".webmanifest": "application/manifest+json",
  ".txt": "text/plain; charset=utf-8",
};

function contentTypeFor(filePath) {
  return CONTENT_TYPES[extname(filePath).toLowerCase()] || "application/octet-stream";
}

// Resolve a URL pathname (already stripped of the base path, always
// starting with "/") to a file under OUT_DIR, or null if nothing matches.
// Prevents path traversal by requiring the resolved path to stay inside
// OUT_DIR.
function resolveFile(pathname) {
  const decoded = decodeURIComponent(pathname);
  const safeRelative = normalize(decoded).replace(/^([.][.][/\\])+/, "");
  const base = normalize(OUT_DIR);

  const candidates = [];
  if (safeRelative.endsWith("/") || safeRelative === "") {
    candidates.push(join(base, safeRelative, "index.html"));
  } else {
    candidates.push(join(base, safeRelative));
    candidates.push(join(base, `${safeRelative}.html`));
    candidates.push(join(base, safeRelative, "index.html"));
  }

  for (const candidate of candidates) {
    const resolved = normalize(candidate);
    if (!resolved.startsWith(base)) continue; // traversal guard
    if (existsSync(resolved) && statSync(resolved).isFile()) {
      return resolved;
    }
  }
  return null;
}

function send(res, status, filePath) {
  res.writeHead(status, {
    "Content-Type": contentTypeFor(filePath),
    "Cache-Control": "no-store",
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  let pathname = decodeURIComponent(url.pathname);

  if (BASE_PATH) {
    if (pathname === BASE_PATH) {
      pathname = "/";
    } else if (pathname.startsWith(`${BASE_PATH}/`)) {
      pathname = pathname.slice(BASE_PATH.length) || "/";
    } else {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
      res.end("Not found");
      return;
    }
  }

  const file = resolveFile(pathname);
  if (file) {
    send(res, 200, file);
    return;
  }

  const notFound = join(normalize(OUT_DIR), "404.html");
  if (existsSync(notFound)) {
    send(res, 404, notFound);
    return;
  }

  res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });
  res.end("Not found");
});

server.listen(PORT, () => {
  const base = BASE_PATH || "/";
  console.log(`Serving ${OUT_DIR}${sep} at http://localhost:${PORT}${base === "/" ? "" : base}/`);
});

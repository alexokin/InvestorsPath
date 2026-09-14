"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Shareable, deep-linkable calculator state via the URL query string.
 *
 * Design notes (see AGENTS.md task for the full brief):
 * - Pure helpers (`parseNumberParam`, `encodeState`, `decodeState`) have no
 *   window/DOM dependency and are unit-tested directly.
 * - `useUrlSyncedState` is the only piece that touches `window`/`history`.
 *   It is hydration-safe: the very first render (server and client) always
 *   uses the schema defaults, and the real `window.location.search` is only
 *   read once, in a `useEffect` after mount — so SSR/CSR markup matches and
 *   there is no hydration warning. Static export forbids `useSearchParams`
 *   outside a `<Suspense>` boundary, so we deliberately never use it here;
 *   reading `window.location` in an effect sidesteps that requirement
 *   entirely.
 * - Writes use `history.replaceState` only (never `router.push`, never
 *   affects scroll position or the back-button history stack) and are
 *   debounced by 300ms so that fast typing never fights the URL, and so a
 *   burst of keystrokes produces one URL update instead of one per
 *   keystroke.
 * - Sync is opt-in via the `enabled` flag. When disabled, the hook behaves
 *   like a plain `useState(defaults)` — it never reads or writes the URL.
 *   This is how embedded lesson instances (which pass `syncUrl={false}` or
 *   simply aren't on a `/tools/` route) avoid clobbering the page URL.
 */

/** Per-field description used by both `encodeState`/`decodeState` and the hook. */
export type NumberParamSpec = {
  default: number;
  min?: number;
  max?: number;
};

/** A schema is just a map of short, stable query-param keys to their spec. */
export type UrlStateSchema = Record<string, NumberParamSpec>;

/**
 * Parses a single raw query-string value into a number, falling back to
 * `fallback` for missing/empty/invalid input, and clamping to [min, max]
 * when provided.
 */
export function parseNumberParam(
  value: string | null | undefined,
  { min, max, fallback }: { min?: number; max?: number; fallback: number }
): number {
  if (value == null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  let result = parsed;
  if (min !== undefined) result = Math.max(min, result);
  if (max !== undefined) result = Math.min(max, result);
  return result;
}

/** Formats a number compactly for the URL (no float noise, no trailing zeros). */
function formatNumberParam(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1e6) / 1e6);
}

/**
 * Encodes only the fields that differ from their schema default, keeping
 * shareable URLs as short as possible (e.g. a calculator left entirely at
 * its defaults encodes to an empty string).
 */
export function encodeState(state: Record<string, number>, schema: UrlStateSchema): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(schema)) {
    const value = state[key];
    if (value === undefined || !Number.isFinite(value)) continue;
    if (value === schema[key].default) continue;
    params.set(key, formatNumberParam(value));
  }
  return params.toString();
}

/**
 * Decodes a query string (or `URLSearchParams`) into a full state object
 * covering every key in `schema` — missing/invalid values fall back to
 * their schema default (and are clamped to [min, max]).
 */
export function decodeState(
  search: string | URLSearchParams,
  schema: UrlStateSchema
): Record<string, number> {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const result: Record<string, number> = {};
  for (const [key, spec] of Object.entries(schema)) {
    result[key] = parseNumberParam(params.get(key), {
      min: spec.min,
      max: spec.max,
      fallback: spec.default,
    });
  }
  return result;
}

function defaultsOf(schema: UrlStateSchema): Record<string, number> {
  const result: Record<string, number> = {};
  for (const [key, spec] of Object.entries(schema)) result[key] = spec.default;
  return result;
}

const DEBOUNCE_MS = 300;

/**
 * React hook that keeps a flat numeric state object in sync with the URL
 * query string. Returns a `[state, setState]` pair with the same shape as
 * `useState`.
 *
 * `schema` may be recomputed on every render (e.g. built from props with
 * `useMemo`) — only its keys/defaults are read, and only at the two points
 * described above (initial mount read, and each debounced write).
 */
export function useUrlSyncedState(schema: UrlStateSchema, { enabled }: { enabled: boolean }) {
  const [state, setState] = useState<Record<string, number>>(() => defaultsOf(schema));
  const schemaRef = useRef(schema);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the ref current without touching it during render (refs must only
  // be read/written outside of render — event handlers and effects).
  useEffect(() => {
    schemaRef.current = schema;
  });

  // Read from the URL exactly once, after mount — never again, so it can
  // never clobber in-progress edits. Skipped entirely when sync is disabled.
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    setState(decodeState(window.location.search, schemaRef.current));
  }, [enabled]);

  // Write to the URL, debounced, whenever state changes. Only the keys in
  // this schema are touched; any other query params on the page are left
  // untouched (relevant when a page could host more than one synced widget).
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      const schemaNow = schemaRef.current;
      const current = new URLSearchParams(window.location.search);
      for (const key of Object.keys(schemaNow)) current.delete(key);
      const encoded = new URLSearchParams(encodeState(state, schemaNow));
      for (const [key, value] of encoded) current.set(key, value);
      const query = current.toString();
      const url = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
      window.history.replaceState(window.history.state, "", url);
    }, DEBOUNCE_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [state, enabled]);

  return [state, setState] as const;
}

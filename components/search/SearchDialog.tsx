"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import Fuse from "fuse.js";
import { useRouter } from "next/navigation";
import { Dialog } from "@/components/ui/Dialog";
import { useSearch } from "@/components/search/SearchProvider";
import type { SearchEntryType, SearchIndexEntry } from "@/lib/content/search-index";
import { withBasePath } from "@/lib/base-path";

const TYPE_LABELS: Record<SearchEntryType, string> = {
  lesson: "שיעורים",
  chapter: "פרקים",
  term: "מונחים",
  tool: "כלים",
};

// Lessons and terms surface first: they're what most searches are after.
const TYPE_ORDER: SearchEntryType[] = ["lesson", "term", "chapter", "tool"];

const MAX_RESULTS = 24;
const MAX_DEFAULT_RESULTS = 8;

/**
 * Global Ctrl/Cmd+K search dialog. Fetches the build-time search index
 * (public/search-index.json) lazily on first open, fuzzy-matches with
 * fuse.js, and groups results by type with Hebrew labels. Supports arrow-key
 * navigation, Enter to go, Escape to close, and closes itself on navigation.
 */
export function SearchDialog() {
  const { open, setOpen } = useSearch();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<SearchIndexEntry[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || entries !== null) return;
    let cancelled = false;
    fetch(withBasePath("/search-index.json"))
      .then((res) => (res.ok ? (res.json() as Promise<SearchIndexEntry[]>) : []))
      .then((data) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open, entries]);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  const fuse = useMemo(() => {
    if (!entries) return null;
    return new Fuse(entries, {
      keys: ["title", "subtitle", "keywords"],
      ignoreLocation: true,
      threshold: 0.35,
    });
  }, [entries]);

  const results = useMemo<SearchIndexEntry[]>(() => {
    if (!entries) return [];
    if (!query.trim()) return entries.slice(0, MAX_DEFAULT_RESULTS);
    if (!fuse) return [];
    return fuse
      .search(query.trim())
      .slice(0, MAX_RESULTS)
      .map((result) => result.item);
  }, [fuse, entries, query]);

  const groups = useMemo(() => {
    const byType = new Map<SearchEntryType, SearchIndexEntry[]>();
    for (const entry of results) {
      const list = byType.get(entry.type) ?? [];
      list.push(entry);
      byType.set(entry.type, list);
    }
    return TYPE_ORDER.map((type) => ({ type, items: byType.get(type) ?? [] })).filter(
      (group) => group.items.length > 0
    );
  }, [results]);

  const flatResults = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    if (flatResults.length === 0) return;
    const el = listRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flatResults.length]);

  function close() {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }

  function goTo(entry: SearchIndexEntry) {
    close();
    router.push(entry.href);
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flatResults.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const entry = flatResults[activeIndex];
      if (entry) goTo(entry);
    }
    // Escape is handled by the Dialog primitive itself.
  }

  return (
    <Dialog open={open} onClose={close} title="חיפוש בקורס">
      <div dir="rtl" onKeyDown={onKeyDown}>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }}
          placeholder="חפשו שיעור, מונח, פרק או כלי..."
          aria-label="חיפוש בקורס"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-start text-sm text-foreground outline-none focus-visible:border-primary"
        />

        <div ref={listRef} role="listbox" aria-label="תוצאות חיפוש" className="mt-3 max-h-80 overflow-y-auto">
          {entries === null ? (
            <p className="px-2 py-6 text-center text-sm text-muted">טוען אינדקס חיפוש...</p>
          ) : flatResults.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">לא נמצאו תוצאות.</p>
          ) : (
            groups.map((group) => (
              <div key={group.type} className="mb-3 last:mb-0">
                <p className="mb-1 px-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {TYPE_LABELS[group.type]}
                </p>
                <ul className="space-y-0.5">
                  {group.items.map((entry) => {
                    const idx = flatResults.indexOf(entry);
                    const active = idx === activeIndex;
                    return (
                      <li key={`${entry.type}-${entry.href}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          data-active={active}
                          onMouseEnter={() => setActiveIndex(idx)}
                          onClick={() => goTo(entry)}
                          className={[
                            "flex w-full flex-col items-start rounded-lg px-3 py-2 text-start transition-colors",
                            active ? "bg-accent text-primary" : "text-foreground hover:bg-accent",
                          ].join(" ")}
                        >
                          <span className="font-medium">{entry.title}</span>
                          {entry.subtitle && (
                            <span className="text-xs text-muted">{entry.subtitle}</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
}

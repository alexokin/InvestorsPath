"use client";

import { Search } from "lucide-react";
import { useSearch } from "@/components/search/SearchProvider";

export function SearchTrigger({ className, fullWidth = false }: { className?: string; fullWidth?: boolean }) {
  const { setOpen } = useSearch();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="חיפוש בקורס"
      className={
        className ??
        [
          "flex items-center gap-2 rounded-lg border border-border bg-surface px-3 h-9 text-sm text-muted transition-colors hover:border-primary hover:text-primary",
          fullWidth ? "w-full" : "",
        ]
          .filter(Boolean)
          .join(" ")
      }
    >
      <Search className="size-4 shrink-0" />
      <span className="hidden sm:inline">חיפוש בקורס</span>
      <kbd
        dir="ltr"
        aria-hidden="true"
        className="ms-auto hidden shrink-0 rounded border border-border bg-background px-1.5 py-0.5 font-mono text-xs text-muted md:inline"
      >
        Ctrl K
      </kbd>
    </button>
  );
}

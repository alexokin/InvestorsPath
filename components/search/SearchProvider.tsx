"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type SearchContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * Owns the open/closed state of the global search dialog and wires up the
 * Ctrl/Cmd+K shortcut. Rendered once near the root of the app so both the
 * Header's SearchTrigger and the MobileDrawer's SearchTrigger can open the
 * same dialog instance.
 */
export function SearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const isModK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (!isModK) return;
      event.preventDefault();
      setOpen((prev) => !prev);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return <SearchContext.Provider value={{ open, setOpen }}>{children}</SearchContext.Provider>;
}

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}

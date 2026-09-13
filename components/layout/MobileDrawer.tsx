"use client";

import { useState, type ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { SearchTrigger } from "@/components/search/SearchTrigger";

export function MobileDrawer({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground"
      >
        <Menu className="size-4" />
        תפריט הפרק
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] overflow-y-auto bg-surface p-4 shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mb-4 flex items-center gap-2 text-sm text-muted"
            >
              <X className="size-4" />
              סגירה
            </button>
            <div className="mb-4" onClickCapture={() => setOpen(false)}>
              <SearchTrigger fullWidth />
            </div>
            {children}
          </div>
          <div className="flex-1 bg-slate-900/40" onClick={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}

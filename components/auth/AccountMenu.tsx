"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { AuthStatus, AuthUser } from "@/lib/auth/types";

type AccountMenuProps = {
  status: AuthStatus;
  user: AuthUser | null;
  onSignOut: () => Promise<void>;
};

export function AccountMenu({ status, user, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (status === "loading") {
    return <div className="w-24 h-9" aria-hidden />;
  }

  if (status === "signed-out" || !user) {
    return (
      <Link
        href="/login/"
        className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
      >
        התחברות
      </Link>
    );
  }

  const initial = (user.name ?? user.email ?? "?").trim().charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={user.email ?? undefined}
        className="flex h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" className="size-7 rounded-full" />
        ) : (
          <span className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {initial}
          </span>
        )}
        {/* Hidden on narrow viewports so the header (search, theme toggle,
            nav menu, account button) fits without horizontal overflow; the
            email stays the button's accessible name via aria-label above. */}
        <span className="hidden max-w-32 truncate sm:inline" dir="ltr" aria-hidden="true">
          {user.email}
        </span>
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-50 mt-1 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          <Link
            href="/progress/"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
          >
            ההתקדמות שלי
          </Link>
          <button
            type="button"
            role="menuitem"
            disabled={isPending}
            onClick={() => {
              setOpen(false);
              startTransition(async () => {
                await onSignOut();
              });
            }}
            className="block w-full rounded-md px-3 py-2 text-start text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-primary disabled:opacity-50"
          >
            התנתקות
          </button>
        </div>
      )}
    </div>
  );
}

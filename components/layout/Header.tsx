"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BookOpen, ChevronDown, Menu } from "lucide-react";
import { SearchTrigger } from "@/components/search/SearchTrigger";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { useAuth } from "@/components/auth/AuthProvider";

const links = [
  { href: "/curriculum/", label: "תוכנית הלימודים" },
  { href: "/glossary/", label: "מילון מונחים" },
  { href: "/flashcards/", label: "כרטיסיות" },
  { href: "/cheatsheets/", label: "דפי סיכום" },
  { href: "/tools/", label: "כלים" },
  { href: "/progress/", label: "ההתקדמות שלי" },
];

function NavDropdown() {
  const [open, setOpen] = useState(false);
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

  return (
    <div ref={rootRef} className="relative lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
      >
        <Menu className="size-4" />
        תפריט
        <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full z-50 mt-1 min-w-48 rounded-lg border border-border bg-surface p-1 shadow-lg start-0"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { status, user, signOut } = useAuth();

  return (
    <header
      data-print-hide
      className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-foreground">
          <BookOpen className="size-5 text-primary" />
          <span>מסלול המשקיע</span>
        </Link>
        <nav className="hidden flex-wrap items-center gap-1 text-sm lg:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-1.5 font-medium text-muted transition-colors hover:bg-accent hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <NavDropdown />
          <ThemeToggle />
          <SearchTrigger className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 h-9 text-sm text-muted transition-colors hover:border-primary hover:text-primary" />
          <AccountMenu status={status} user={user} onSignOut={signOut} />
        </div>
      </div>
    </header>
  );
}

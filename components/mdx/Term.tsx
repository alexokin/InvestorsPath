"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

type TermProps = {
  slug: string;
  en: string;
  definition: string;
  children: ReactNode;
};

function hoverCapable(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
}

/**
 * Inline glossary term inside a lesson body. Rendered by the rehype-terms
 * plugin (lib/content/rehype-terms.ts) around the first occurrence of each
 * key term. Hover opens the popover on pointer devices; tap/click toggles it
 * (and "pins" it so it survives the pointer leaving); Escape or an outside
 * click closes it.
 *
 * Everything is a <span> because the term lives inside a <p>, where block
 * elements would be invalid HTML.
 */
export function Term({ slug, en, definition, children }: TermProps) {
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const rootRef = useRef<HTMLSpanElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      setPinned(false);
      buttonRef.current?.focus();
    }
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  const toggle = () => {
    if (open && pinned) {
      setOpen(false);
      setPinned(false);
    } else {
      setOpen(true);
      setPinned(true);
    }
  };

  return (
    <span ref={rootRef} className="relative inline">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={toggle}
        onMouseEnter={() => {
          if (hoverCapable()) setOpen(true);
        }}
        onMouseLeave={() => {
          if (hoverCapable() && !pinned) setOpen(false);
        }}
        onFocus={() => setOpen(true)}
        onBlur={(e) => {
          // Keep open while focus moves into the popover (e.g. to the glossary link).
          if (pinned) return;
          if (rootRef.current?.contains(e.relatedTarget as Node | null)) return;
          setOpen(false);
        }}
        className="cursor-help rounded-sm border-b border-dotted border-primary/70 bg-transparent p-0 text-inherit underline-offset-2 hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
      >
        {children}
      </button>
      {open && (
        <span
          id={popoverId}
          role="tooltip"
          onMouseEnter={() => {
            if (hoverCapable()) setOpen(true);
          }}
          onMouseLeave={() => {
            if (hoverCapable() && !pinned) setOpen(false);
          }}
          className="absolute start-0 top-full z-30 mt-1.5 block w-72 max-w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-border bg-surface p-3 text-start text-sm font-normal leading-relaxed text-foreground shadow-lg"
        >
          <span className="block font-semibold text-foreground">
            {children}{" "}
            <span dir="ltr" className="text-xs font-normal text-muted">
              {en}
            </span>
          </span>
          <span className="mt-1 block text-muted">{definition}</span>
          <Link
            href={`/glossary/#${slug}`}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            למילון ←
          </Link>
        </span>
      )}
    </span>
  );
}

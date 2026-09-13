"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type LessonKeyboardNavProps = {
  prevHref: string | null;
  nextHref: string | null;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

/**
 * Arrow-key navigation between lessons. The site is RTL, so "forward" is to
 * the left: ArrowLeft goes to the next lesson, ArrowRight to the previous one.
 * Ignored while typing in a form control or while a dialog is open. Renders
 * nothing; it only receives the hrefs so no lesson body is serialized to the
 * client.
 */
export function LessonKeyboardNav({ prevHref, nextHref }: LessonKeyboardNavProps) {
  const router = useRouter();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isEditableTarget(e.target)) return;
      if (document.querySelector('[role="dialog"]')) return;

      const href = e.key === "ArrowLeft" ? nextHref : prevHref;
      if (!href) return;
      e.preventDefault();
      router.push(href);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [router, prevHref, nextHref]);

  return null;
}

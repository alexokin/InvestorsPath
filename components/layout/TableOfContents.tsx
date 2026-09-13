"use client";

import { useEffect, useState } from "react";
import type { Heading } from "@/lib/content/mdx";

export function TableOfContents({ headings }: { headings: Heading[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;
    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav aria-label="תוכן העניינים" className="space-y-1 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">בעמוד זה</p>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={[
            "block rounded-md px-2 py-1 transition-colors",
            h.level === 3 ? "ps-4" : "",
            activeId === h.id ? "font-medium text-primary" : "text-muted hover:text-primary",
          ].join(" ")}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}

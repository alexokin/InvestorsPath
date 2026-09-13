import type { ReactNode } from "react";

const HEBREW_RE = /[֐-׿]/;

function containsHebrew(children: ReactNode): boolean {
  if (typeof children === "string") return HEBREW_RE.test(children);
  if (Array.isArray(children)) return children.some(containsHebrew);
  return false;
}

export function Ltr({ children }: { children: ReactNode }) {
  if (containsHebrew(children)) {
    // Defensive fallback: Ltr is only for Latin/numeric content (P/E, tickers,
    // formulas). If Hebrew text ends up here, render it as plain text instead
    // of forcing dir="ltr" + font-mono, which would otherwise garble it.
    return <span>{children}</span>;
  }

  return (
    <span dir="ltr" className="inline-block font-mono text-[0.95em]">
      {children}
    </span>
  );
}

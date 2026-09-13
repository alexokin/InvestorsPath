const HEBREW_RE = /[֐-׿]/;

export function Ticker({ children }: { children: string }) {
  if (typeof children === "string" && HEBREW_RE.test(children)) {
    // Defensive fallback: Ticker is only for Latin ticker symbols. If Hebrew
    // text ends up here, render it as plain text instead of forcing
    // dir="ltr" + font-mono, which would otherwise garble it.
    return <span>{children}</span>;
  }

  return (
    <span
      dir="ltr"
      className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[0.85em] font-semibold text-slate-700"
    >
      {children}
    </span>
  );
}

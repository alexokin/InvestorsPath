import { getFormula } from "@/lib/content/formulas";
import type { Cheatsheet } from "@/lib/content/schema";

export function CheatSheet({
  cheatsheet,
  title = "דף סיכום",
  variant = "inline",
}: {
  cheatsheet: Cheatsheet;
  title?: string;
  variant?: "inline" | "print";
}) {
  return (
    <div
      className={[
        "cheat-card rounded-xl border border-border bg-background p-5",
        variant === "print" ? "print:border-slate-300" : "",
      ].join(" ")}
    >
      {title && <h3 className="mb-3 text-base font-bold text-foreground">{title}</h3>}

      {cheatsheet.formulas.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">נוסחאות</p>
          <ul className="space-y-1 text-sm">
            {cheatsheet.formulas.map((id) => {
              const formula = getFormula(id);
              return (
                <li key={id} className="flex flex-wrap items-baseline gap-2">
                  <span className="font-medium text-foreground">
                    {formula?.name_he ?? id}
                  </span>
                  {formula && (
                    <span dir="ltr" className="font-mono text-xs text-muted">
                      {formula.expression}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {cheatsheet.rules.length > 0 && (
        <div className="mb-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            כללי אצבע
          </p>
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {cheatsheet.rules.map((rule, i) => (
              <li key={i}>{rule}</li>
            ))}
          </ul>
        </div>
      )}

      {cheatsheet.checklist.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
            צ&apos;קליסט
          </p>
          <ul className="space-y-1.5 text-sm">
            {cheatsheet.checklist.map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-1 size-3.5 shrink-0 rounded border border-slate-400 dark:border-slate-500" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

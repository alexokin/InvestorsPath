import type { ReactNode } from "react";
import { Info, AlertTriangle, Lightbulb } from "lucide-react";

type Kind = "info" | "warning" | "tip";

const styles: Record<Kind, { wrap: string; icon: ReactNode }> = {
  info: { wrap: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-200", icon: <Info className="size-4" /> },
  warning: {
    wrap: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200",
    icon: <AlertTriangle className="size-4" />,
  },
  tip: {
    wrap: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200",
    icon: <Lightbulb className="size-4" />,
  },
};

export function Callout({ kind = "info", children }: { kind?: Kind; children: ReactNode }) {
  const style = styles[kind];
  return (
    <div className={`my-4 flex gap-2 rounded-lg border p-4 text-sm leading-relaxed ${style.wrap}`}>
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div>{children}</div>
    </div>
  );
}

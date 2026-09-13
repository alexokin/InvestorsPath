import type { HTMLAttributes } from "react";

type Tone = "default" | "primary" | "success" | "warning";

const tones: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  primary: "bg-accent text-primary",
  success: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export function Badge({
  tone = "default",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={["inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

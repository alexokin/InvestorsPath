import type { HTMLAttributes } from "react";

type Tone = "default" | "primary" | "success" | "warning";

const tones: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700",
  primary: "bg-accent text-primary",
  success: "bg-emerald-50 text-emerald-700",
  warning: "bg-amber-50 text-amber-700",
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

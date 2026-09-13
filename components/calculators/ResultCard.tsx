import type { ReactNode } from "react";

type Tone = "default" | "primary" | "success" | "warning";

const tones: Record<Tone, string> = {
  default: "border-border bg-slate-50",
  primary: "border-primary/30 bg-accent",
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
};

/**
 * A labeled result tile used to surface a single computed value inside a
 * calculator (e.g. "שווי הוגן למניה" -> "₪47.43").
 */
export function ResultCard({
  label,
  value,
  helpText,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  helpText?: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-lg border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p dir="ltr" className="mt-1 text-start text-xl font-bold text-foreground">
        {value}
      </p>
      {helpText && <p className="mt-1 text-xs text-muted">{helpText}</p>}
    </div>
  );
}

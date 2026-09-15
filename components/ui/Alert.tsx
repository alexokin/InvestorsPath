import type { ReactNode } from "react";

type Variant = "info" | "error" | "success";

const variants: Record<Variant, string> = {
  info: "border-border bg-accent text-foreground",
  error:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
  success:
    "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/40 dark:text-green-300",
};

type AlertProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
};

export function Alert({ variant = "info", className, children }: AlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={["rounded-lg border p-3 text-sm", variants[variant], className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

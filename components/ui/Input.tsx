import type { InputHTMLAttributes } from "react";

type InputProps = {
  label: string;
  id: string;
  error?: string;
  dir?: "ltr" | "rtl";
} & Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "dir">;

export function Input({ label, id, error, dir, className, ...props }: InputProps) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        dir={dir}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        className={[
          "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

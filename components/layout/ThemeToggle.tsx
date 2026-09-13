"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { applyTheme, readThemeChoice, writeThemeChoice, type ThemeChoice } from "@/lib/theme";

const ORDER: ThemeChoice[] = ["light", "dark", "system"];

const LABELS: Record<ThemeChoice, string> = {
  light: "מצב בהיר",
  dark: "מצב כהה",
  system: "לפי המערכת",
};

const ICONS = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

function nextOf(choice: ThemeChoice): ThemeChoice {
  return ORDER[(ORDER.indexOf(choice) + 1) % ORDER.length];
}

/**
 * Cycles light → dark → system. Renders a neutral icon until mounted so the
 * server HTML (which cannot know the stored choice) hydrates cleanly.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [choice, setChoice] = useState<ThemeChoice | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setChoice(readThemeChoice());
  }, []);

  // Follow OS changes live while the user has chosen "system".
  useEffect(() => {
    if (choice !== "system" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [choice]);

  function cycle() {
    const next = nextOf(choice ?? "system");
    writeThemeChoice(next);
    applyTheme(next);
    setChoice(next);
  }

  const Icon = choice ? ICONS[choice] : Monitor;
  const label = choice ? LABELS[choice] : "ערכת צבעים";
  const hint = choice ? `${label} — לחיצה: ${LABELS[nextOf(choice)]}` : label;

  return (
    <button
      type="button"
      onClick={cycle}
      disabled={!choice}
      aria-label={hint}
      title={hint}
      className={[
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted transition-colors hover:border-primary hover:text-primary disabled:opacity-70",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <Icon className="size-4" aria-hidden="true" />
    </button>
  );
}

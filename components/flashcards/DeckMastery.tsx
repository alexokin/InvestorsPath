"use client";

import { useEffect, useState } from "react";
import { deckStats, masteryPercent } from "@/lib/flashcards/scheduler";
import { readFlashcards } from "@/lib/flashcards/storage";

/**
 * Per-deck mastery bar for the /flashcards/ index. Reads localStorage after
 * mount, so the server render and first client render both show 0%.
 */
export function DeckMastery({ slugs }: { slugs: string[] }) {
  const [percent, setPercent] = useState<number | null>(null);
  const key = slugs.join("|");

  useEffect(() => {
    const store = readFlashcards();
    const cards = key ? key.split("|").map((slug) => ({ slug })) : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setPercent(masteryPercent(deckStats(cards, store)));
  }, [key]);

  const value = percent ?? 0;

  return (
    <div className="flex items-center gap-2">
      <div
        role="progressbar"
        aria-label="אחוז שליטה"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="shrink-0 text-xs font-medium tabular-nums text-muted">
        {percent === null ? "—" : `${value}%`}
      </span>
    </div>
  );
}

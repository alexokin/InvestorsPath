"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, StickyNote } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

const SAVE_DELAY_MS = 400;
const SAVED_INDICATOR_MS = 2000;

export function LessonNotes({
  chapterSlug,
  lessonSlug,
}: {
  chapterSlug: string;
  lessonSlug: string;
}) {
  const { hydrated, getNote, setNote } = useProgress();
  const stored = getNote(chapterSlug, lessonSlug);

  // `draft` is null until the user types; before that we show the stored note,
  // so no effect is needed to sync from storage after hydration.
  const [draft, setDraft] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const panelId = useId();

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const indicatorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<string | null>(null);
  const setNoteRef = useRef(setNote);
  useEffect(() => {
    setNoteRef.current = setNote;
  }, [setNote]);

  // Flush a pending save and clear timers on unmount / lesson change.
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
      if (pending.current !== null) {
        setNoteRef.current(chapterSlug, lessonSlug, pending.current);
        pending.current = null;
      }
    };
  }, [chapterSlug, lessonSlug]);

  const value = draft ?? stored;
  const hasNote = value.trim().length > 0;

  function onChange(text: string) {
    setDraft(text);
    setSaved(false);
    pending.current = text;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      setNoteRef.current(chapterSlug, lessonSlug, text);
      pending.current = null;
      setSaved(true);
      if (indicatorTimer.current) clearTimeout(indicatorTimer.current);
      indicatorTimer.current = setTimeout(() => setSaved(false), SAVED_INDICATOR_MS);
    }, SAVE_DELAY_MS);
  }

  return (
    <section
      data-print-hide
      className="rounded-xl border border-border bg-surface shadow-sm"
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-start text-sm font-semibold text-foreground transition-colors hover:bg-accent"
      >
        <StickyNote className="size-4 text-primary" />
        <span className="flex-1">ההערות שלי</span>
        {hydrated && hasNote && !open && (
          <span className="text-xs font-normal text-muted">יש הערה שמורה</span>
        )}
        <ChevronDown
          className={["size-4 text-muted transition-transform", open ? "rotate-180" : ""].join(" ")}
        />
      </button>

      {open && (
        <div id={panelId} className="border-t border-border px-4 pb-4 pt-3">
          <label htmlFor={`${panelId}-text`} className="sr-only">
            הערות אישיות לשיעור
          </label>
          <textarea
            id={`${panelId}-text`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={!hydrated}
            rows={5}
            placeholder="כתבו כאן תובנות, שאלות או נקודות לחזרה. ההערות נשמרות רק בדפדפן שלכם."
            className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
          <div className="mt-2 flex items-center justify-between text-xs text-muted">
            <span aria-live="polite">{saved ? "נשמר" : " "}</span>
            <span>{value.length.toLocaleString("he-IL")} תווים</span>
          </div>
        </div>
      )}
    </section>
  );
}

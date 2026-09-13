"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  Shuffle,
  X,
} from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  deckStats,
  grade,
  masteryPercent,
  orderDeck,
  type Flashcard,
} from "@/lib/flashcards/scheduler";
import {
  readFlashcards,
  writeFlashcards,
  type FlashcardStore,
} from "@/lib/flashcards/storage";

type Props = {
  cards: Flashcard[];
  /** Used to scope element ids and the shuffle seed; storage is keyed per card slug. */
  deckId: string;
  title: string;
};

const FRONT_HINT = "לחיצה או רווח להפיכת הכרטיס";
const KEY_HINTS = "רווח: הפיכה · 1: ידעתי · 2: לא ידעתי · חצים: ניווט";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable
  );
}

function isNativeControl(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("button, a, input, textarea, select") !== null;
}

export function FlashcardDeck({ cards, deckId, title }: Props) {
  // `null` until mounted: localStorage is only read on the client, so the
  // server render and the first client render both show the placeholder.
  const [store, setStore] = useState<FlashcardStore | null>(null);
  const [queue, setQueue] = useState<Flashcard[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [results, setResults] = useState<Record<string, boolean>>({});

  const startRound = useCallback(
    (pool: Flashcard[], currentStore: FlashcardStore, shuffle: boolean) => {
      const seed = shuffle ? Date.now() % 2_147_483_647 : undefined;
      setQueue(orderDeck(pool, currentStore, Date.now(), seed));
      setIndex(0);
      setFlipped(false);
      setResults({});
    },
    []
  );

  useEffect(() => {
    const loaded = readFlashcards();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setStore(loaded);
    startRound(cards, loaded, false);
  }, [cards, startRound]);

  const total = queue.length;
  const finished = store !== null && total > 0 && index >= total;
  const current = !finished ? queue[index] : undefined;

  const flip = useCallback(() => {
    if (!current) return;
    setFlipped((f) => !f);
  }, [current]);

  const goPrev = useCallback(() => {
    if (finished) return;
    setIndex((i) => Math.max(0, i - 1));
    setFlipped(false);
  }, [finished]);

  const goNext = useCallback(() => {
    if (finished) return;
    setIndex((i) => Math.min(total - 1, i + 1));
    setFlipped(false);
  }, [finished, total]);

  const gradeCurrent = useCallback(
    (knew: boolean) => {
      if (!current || !store) return;
      const next: FlashcardStore = {
        ...store,
        [current.slug]: grade(store[current.slug], knew, Date.now()),
      };
      setStore(next);
      writeFlashcards(next);
      setResults((prev) => ({ ...prev, [current.slug]: knew }));
      setFlipped(false);
      setIndex((i) => i + 1);
    },
    [current, store]
  );

  const toggleShuffle = useCallback(() => {
    if (!store) return;
    const nextShuffled = !shuffled;
    setShuffled(nextShuffled);
    if (finished) return;
    // Reorder only the cards not yet reached, so graded cards keep their place.
    const remainingSlugs = new Set(queue.slice(index).map((c) => c.slug));
    const remaining = cards.filter((c) => remainingSlugs.has(c.slug));
    const seed = nextShuffled ? Date.now() % 2_147_483_647 : undefined;
    setQueue([...queue.slice(0, index), ...orderDeck(remaining, store, Date.now(), seed)]);
    setFlipped(false);
  }, [cards, finished, index, queue, shuffled, store]);

  useEffect(() => {
    if (!store) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      switch (event.key) {
        case " ":
          // Let native buttons/links handle their own Space key.
          if (isNativeControl(event.target)) return;
          event.preventDefault();
          flip();
          break;
        case "1":
          gradeCurrent(true);
          break;
        case "2":
          gradeCurrent(false);
          break;
        // RTL: "forward" is to the left.
        case "ArrowLeft":
          event.preventDefault();
          goNext();
          break;
        case "ArrowRight":
          event.preventDefault();
          goPrev();
          break;
        default:
          return;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store, flip, gradeCurrent, goNext, goPrev]);

  const stats = useMemo(() => deckStats(cards, store ?? {}), [cards, store]);
  const roundKnew = useMemo(() => Object.values(results).filter(Boolean).length, [results]);
  const roundMissed = useMemo(
    () => Object.values(results).filter((v) => !v).length,
    [results]
  );

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <p className="font-medium text-foreground">אין עדיין מונחים בחפיסה הזו.</p>
        <p className="mt-1 text-sm text-muted">
          כרטיסיות נוצרות אוטומטית ממונחי המפתח של השיעורים — הן יופיעו כאן כשיתווספו.
        </p>
        <LinkButton href="/flashcards/" variant="secondary" size="sm" className="mt-4">
          חזרה לכל החפיסות
        </LinkButton>
      </div>
    );
  }

  if (!store) {
    return (
      <div aria-busy="true" aria-label="טוען כרטיסיות">
        <div className="h-5 w-32 animate-pulse rounded bg-accent" />
        <div className="mt-4 min-h-72 animate-pulse rounded-2xl border border-border bg-surface" />
      </div>
    );
  }

  if (finished) {
    const missedCards = cards.filter((c) => results[c.slug] === false);
    return (
      <section
        aria-labelledby={`${deckId}-summary-title`}
        className="rounded-2xl border border-border bg-surface p-6 sm:p-8"
      >
        <h2 id={`${deckId}-summary-title`} className="text-xl font-bold text-foreground">
          סיימת את הסבב!
        </h2>
        <p className="mt-1 text-sm text-muted">{title}</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryStat label="ידעתי" value={roundKnew} tone="success" />
          <SummaryStat label="לא ידעתי" value={roundMissed} tone="warning" />
          <SummaryStat label="נשלטו בחפיסה" value={stats.mastered} tone="primary" />
          <SummaryStat label="שליטה כוללת" value={`${masteryPercent(stats)}%`} tone="default" />
        </dl>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button onClick={() => startRound(cards, store, shuffled)}>
            <RotateCcw className="size-4" />
            סבב נוסף
          </Button>
          {missedCards.length > 0 && (
            <Button variant="secondary" onClick={() => startRound(missedCards, store, shuffled)}>
              רק מה שלא ידעתי ({missedCards.length})
            </Button>
          )}
          <LinkButton href="/flashcards/" variant="ghost">
            לכל החפיסות
          </LinkButton>
        </div>

        <p className="mt-6 text-xs text-muted">
          כרטיסים שידעת עולים תיבה (חוזרים אחרי יום, ואז אחרי ארבעה ימים). כרטיסים שלא ידעת
          חוזרים לתיבה הראשונה ויופיעו שוב בסבב הבא.
        </p>
      </section>
    );
  }

  const card = current!;
  const gradedCount = Object.keys(results).length;

  return (
    <section aria-label={`כרטיסיות: ${title}`} className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-foreground" aria-live="polite">
            כרטיס{" "}
            <span dir="ltr" className="tabular-nums">
              {index + 1} / {total}
            </span>
          </span>
          <Badge tone="success">{stats.mastered} נשלטו</Badge>
          <Badge tone="warning">{stats.learning} בלמידה</Badge>
          <Badge>{stats.new} חדשים</Badge>
        </div>
        <button
          type="button"
          aria-pressed={shuffled}
          onClick={toggleShuffle}
          className={[
            "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors",
            shuffled
              ? "border-primary bg-accent text-primary"
              : "border-border text-muted hover:border-primary hover:text-primary",
          ].join(" ")}
        >
          <Shuffle className="size-4" />
          ערבוב
        </button>
      </div>

      <div
        role="progressbar"
        aria-label="התקדמות בסבב"
        aria-valuenow={gradedCount}
        aria-valuemin={0}
        aria-valuemax={total}
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100"
      >
        <div
          className="h-full rounded-full bg-primary transition-all motion-reduce:transition-none"
          style={{ width: `${total ? (gradedCount / total) * 100 : 0}%` }}
        />
      </div>

      <div className="[perspective:1200px]">
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? "הצגת המונח" : "הצגת ההגדרה"}
          onClick={flip}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              flip();
            }
          }}
          className={[
            "grid min-h-72 cursor-pointer select-none rounded-2xl outline-none transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            flipped ? "[transform:rotateY(180deg)]" : "",
          ].join(" ")}
        >
          {/* Front: the term */}
          <div
            inert={flipped}
            aria-hidden={flipped}
            className="flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-6 text-center shadow-sm [backface-visibility:hidden] [grid-area:1/1]"
          >
            <span className="text-xs font-medium text-muted">מונח</span>
            <p className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{card.term}</p>
            <span className="mt-6 text-xs text-muted">{FRONT_HINT}</span>
          </div>

          {/* Back: definition, English name and lesson links */}
          <div
            inert={!flipped}
            aria-hidden={!flipped}
            className="flex flex-col rounded-2xl border border-primary bg-accent p-6 shadow-sm [backface-visibility:hidden] [grid-area:1/1] [transform:rotateY(180deg)]"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-lg font-bold text-foreground">{card.term}</p>
              <span dir="ltr" className="text-sm text-muted">
                {card.en}
              </span>
            </div>
            <p className="mt-3 flex-1 leading-relaxed text-foreground">{card.definition}</p>
            {card.lessons.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-primary/20 pt-3">
                {card.lessons.map((lesson) => (
                  <Link
                    key={lesson.href}
                    href={lesson.href}
                    onClick={(event) => event.stopPropagation()}
                    className="text-xs text-primary hover:underline"
                  >
                    מופיע בשיעור: {lesson.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goPrev}
          disabled={index === 0}
          aria-label="הכרטיס הקודם"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowRight className="size-5" />
        </button>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => gradeCurrent(false)}
            className="border-red-200 text-red-700 hover:bg-red-50"
          >
            <X className="size-4" />
            לא ידעתי
            <kbd className="ms-1 rounded border border-border px-1 text-[10px] text-muted">2</kbd>
          </Button>
          <Button
            onClick={() => gradeCurrent(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Check className="size-4" />
            ידעתי
            <kbd className="ms-1 rounded border border-white/40 px-1 text-[10px] text-white/90">
              1
            </kbd>
          </Button>
        </div>

        <button
          type="button"
          onClick={goNext}
          disabled={index >= total - 1}
          aria-label="הכרטיס הבא"
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40"
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>

      <p className="hidden text-center text-xs text-muted sm:block">{KEY_HINTS}</p>
    </section>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone: "default" | "primary" | "success" | "warning";
}) {
  const toneClass = {
    default: "bg-slate-50 text-slate-700",
    primary: "bg-accent text-primary",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
  }[tone];
  return (
    <div className={`rounded-lg p-3 ${toneClass}`}>
      <dt className="text-xs font-medium opacity-80">{label}</dt>
      <dd className="mt-1 text-2xl font-bold tabular-nums">{value}</dd>
    </div>
  );
}

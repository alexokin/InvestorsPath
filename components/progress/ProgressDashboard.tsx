"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Bookmark, Download, RotateCcw, Trophy, Upload } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Certificate } from "@/components/progress/Certificate";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button, LinkButton } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  exportProgress,
  lessonKey,
  parseImportedProgress,
  type ProgressState,
} from "@/lib/progress/storage";

export type DashboardLesson = {
  slug: string;
  title: string;
  href: string;
  estimatedMinutes: number;
};

export type DashboardChapter = {
  slug: string;
  title: string;
  href: string;
  lessons: DashboardLesson[];
};

type FlatLesson = DashboardLesson & { key: string; chapterSlug: string; chapterTitle: string };

const NOTE_EXCERPT_LENGTH = 120;
const WEAKEST_COUNT = 5;

function excerpt(text: string, max = NOTE_EXCERPT_LENGTH): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length > max ? `${oneLine.slice(0, max).trimEnd()}…` : oneLine;
}

function todayStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function countOf(state: ProgressState) {
  return {
    completed: Object.values(state.completedLessons).filter(Boolean).length,
    quizzes: Object.keys(state.quizScores).length,
    bookmarks: Object.keys(state.bookmarks).length,
    notes: Object.keys(state.notes).length,
  };
}

export function ProgressDashboard({ chapters }: { chapters: DashboardChapter[] }) {
  const { hydrated, state, chapterPercent, replaceState, resetProgress } = useProgress();

  const [importCandidate, setImportCandidate] = useState<ProgressState | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [resetOpen, setResetOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const allLessons = useMemo<FlatLesson[]>(
    () =>
      chapters.flatMap((c) =>
        c.lessons.map((l) => ({
          ...l,
          key: lessonKey(c.slug, l.slug),
          chapterSlug: c.slug,
          chapterTitle: c.title,
        }))
      ),
    [chapters]
  );
  const byKey = useMemo(() => new Map(allLessons.map((l) => [l.key, l])), [allLessons]);

  const stats = useMemo(() => {
    const totalLessons = allLessons.length;
    const totalMinutes = allLessons.reduce((n, l) => n + l.estimatedMinutes, 0);
    const doneLessons = allLessons.filter((l) => state.completedLessons[l.key]);
    const doneMinutes = doneLessons.reduce((n, l) => n + l.estimatedMinutes, 0);
    const percent = totalLessons > 0 ? Math.round((doneLessons.length / totalLessons) * 100) : 0;

    const quizEntries = Object.entries(state.quizScores)
      .filter(([key, s]) => s.total > 0 && byKey.has(key))
      .map(([key, s]) => ({ lesson: byKey.get(key)!, ratio: s.correct / s.total, ...s }));
    const quizAverage =
      quizEntries.length > 0
        ? Math.round(
            (quizEntries.reduce((n, e) => n + e.ratio, 0) / quizEntries.length) * 100
          )
        : null;
    const weakest = [...quizEntries]
      .filter((e) => e.ratio < 1)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, WEAKEST_COUNT);

    const bookmarked = Object.keys(state.bookmarks)
      .map((key) => byKey.get(key))
      .filter((l): l is FlatLesson => Boolean(l));

    const lv = state.lastVisited;
    const resume = lv ? byKey.get(lessonKey(lv.chapterSlug, lv.lessonSlug)) : undefined;

    return {
      totalLessons,
      totalMinutes,
      doneCount: doneLessons.length,
      doneMinutes,
      percent,
      quizCount: quizEntries.length,
      quizAverage,
      weakest,
      bookmarked,
      resume,
      allDone: totalLessons > 0 && doneLessons.length === totalLessons,
    };
  }, [allLessons, byKey, state]);

  if (!hydrated) return <DashboardSkeleton />;

  function onExport() {
    downloadJson(exportProgress(state), `maslul-progress-${todayStamp()}.json`);
  }

  async function onFileChosen(file: File | undefined) {
    if (!file) return;
    setImportError(null);
    try {
      const text = await file.text();
      setImportCandidate(parseImportedProgress(text));
    } catch (err) {
      setImportError(err instanceof Error ? err.message : "לא ניתן לקרוא את הקובץ.");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const importCounts = importCandidate ? countOf(importCandidate) : null;
  const currentCounts = countOf(state);

  return (
    <div className="space-y-8">
      {stats.allDone && (
        <Card className="border-primary bg-accent">
          <div className="flex items-center gap-2 text-primary">
            <Trophy className="size-5" />
            <h2 className="text-lg font-bold">כל הכבוד! סיימתם את כל הקורס</h2>
          </div>
          <p className="mt-1 text-sm text-muted">התעודה שלכם מוכנה להדפסה או לשמירה כ-PDF.</p>
          <div className="mt-5">
            <Certificate chapterTitles={chapters.map((c) => c.title)} />
          </div>
        </Card>
      )}

      {/* Overview */}
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold text-foreground">סיכום כללי</h2>
          <span className="text-2xl font-bold text-primary">{stats.percent}%</span>
        </div>
        <div className="mt-3">
          <ProgressBar percent={stats.percent} />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-muted">שיעורים שהושלמו</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {stats.doneCount} מתוך {stats.totalLessons}
            </dd>
          </div>
          <div>
            <dt className="text-muted">דקות לימוד</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {stats.doneMinutes.toLocaleString("he-IL")} מתוך{" "}
              {stats.totalMinutes.toLocaleString("he-IL")}
            </dd>
          </div>
          <div>
            <dt className="text-muted">ממוצע בחנים</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {stats.quizAverage === null ? "עדיין אין" : `${stats.quizAverage}%`}
              {stats.quizCount > 0 && (
                <span className="ms-1 font-normal text-muted">({stats.quizCount} בחנים)</span>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      {/* Resume */}
      {stats.resume && (
        <Card className="bg-accent">
          <p className="text-sm font-medium text-muted">המשך מהמקום שעצרת</p>
          <Link
            href={stats.resume.href}
            className="mt-1 block text-lg font-semibold text-primary hover:underline"
          >
            {stats.resume.title}
          </Link>
          <p className="mt-0.5 text-xs text-muted">{stats.resume.chapterTitle}</p>
        </Card>
      )}

      {/* Per chapter */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">התקדמות לפי פרק</h2>
        <ul className="space-y-2">
          {chapters.map((chapter, i) => {
            const slugs = chapter.lessons.map((l) => l.slug);
            const percent = chapterPercent(chapter.slug, slugs);
            const done = slugs.filter(
              (s) => state.completedLessons[lessonKey(chapter.slug, s)]
            ).length;
            return (
              <li key={chapter.slug}>
                <Link
                  href={chapter.href}
                  className="block rounded-lg border border-border bg-surface p-3 transition-colors hover:border-primary hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {i + 1}. {chapter.title}
                    </span>
                    <span className="shrink-0 text-xs text-muted">
                      {done}/{slugs.length} · {percent}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar percent={percent} />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Weakest quizzes */}
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">שיעורים לחיזוק</h2>
        {stats.weakest.length === 0 ? (
          <p className="text-sm text-muted">
            {stats.quizCount === 0
              ? "עדיין לא פתרתם בחנים. הציונים הנמוכים ביותר יופיעו כאן."
              : "מצוין — בכל הבחנים שפתרתם קיבלתם ציון מלא."}
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.weakest.map((e) => (
              <li key={e.lesson.key}>
                <Link
                  href={e.lesson.href}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface p-3 text-sm transition-colors hover:border-primary hover:bg-accent"
                >
                  <span>
                    <span className="font-medium text-foreground">{e.lesson.title}</span>
                    <span className="ms-2 text-xs text-muted">{e.lesson.chapterTitle}</span>
                  </span>
                  <Badge tone={e.ratio < 0.5 ? "warning" : "default"}>
                    {e.correct}/{e.total}
                  </Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bookmarks */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-foreground">
          <Bookmark className="size-5 text-primary" />
          סימניות
        </h2>
        {stats.bookmarked.length === 0 ? (
          <p className="text-sm text-muted">
            עדיין אין סימניות. לחצו על &quot;שמור לסימניות&quot; בתוך שיעור כדי לחזור אליו בקלות.
          </p>
        ) : (
          <ul className="space-y-2">
            {stats.bookmarked.map((l) => {
              const note = state.notes[l.key];
              return (
                <li key={l.key}>
                  <Link
                    href={l.href}
                    className="block rounded-lg border border-border bg-surface p-3 text-sm transition-colors hover:border-primary hover:bg-accent"
                  >
                    <span className="font-medium text-foreground">{l.title}</span>
                    <span className="ms-2 text-xs text-muted">{l.chapterTitle}</span>
                    {note && <p className="mt-1 text-xs text-muted">{excerpt(note)}</p>}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Actions */}
      <section data-print-hide>
        <h2 className="mb-3 text-lg font-bold text-foreground">גיבוי ושחזור</h2>
        <p className="mb-3 text-sm text-muted">
          ייצאו את ההתקדמות לקובץ כדי לגבות אותה או להעביר אותה למכשיר אחר.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onExport}>
            <Download className="size-4" />
            ייצוא לקובץ
          </Button>
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            <Upload className="size-4" />
            ייבוא מקובץ
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="בחירת קובץ התקדמות לייבוא"
            onChange={(e) => onFileChosen(e.target.files?.[0])}
          />
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            <RotateCcw className="size-4" />
            איפוס ההתקדמות
          </Button>
        </div>
        {importError && (
          <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">
            {importError}
          </p>
        )}
      </section>

      <Dialog
        open={importCandidate !== null}
        onClose={() => setImportCandidate(null)}
        title="אישור ייבוא"
      >
        <p className="text-sm text-foreground">
          הייבוא יחליף את כל ההתקדמות הנוכחית בנתונים מהקובץ:
        </p>
        {importCounts && (
          <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <CountRow label="שיעורים שהושלמו" next={importCounts.completed} current={currentCounts.completed} />
            <CountRow label="תוצאות בחנים" next={importCounts.quizzes} current={currentCounts.quizzes} />
            <CountRow label="סימניות" next={importCounts.bookmarks} current={currentCounts.bookmarks} />
            <CountRow label="הערות" next={importCounts.notes} current={currentCounts.notes} />
          </dl>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={() => setImportCandidate(null)}>
            ביטול
          </Button>
          <Button
            size="sm"
            onClick={() => {
              if (importCandidate) replaceState(importCandidate);
              setImportCandidate(null);
            }}
          >
            ייבוא והחלפה
          </Button>
        </div>
      </Dialog>

      <Dialog open={resetOpen} onClose={() => setResetOpen(false)} title="איפוס ההתקדמות">
        <p className="text-sm text-foreground">
          כל השיעורים שסומנו, תוצאות הבחנים, הסימניות וההערות יימחקו לצמיתות מהדפדפן הזה. אי אפשר
          לבטל את הפעולה.
        </p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onExport}>
            <Download className="size-4" />
            ייצוא לפני האיפוס
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setResetOpen(false)}>
            ביטול
          </Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700"
            onClick={() => {
              resetProgress();
              setResetOpen(false);
            }}
          >
            איפוס
          </Button>
        </div>
      </Dialog>

      {stats.doneCount === 0 && !stats.resume && (
        <div className="text-center">
          <LinkButton href="/curriculum/" variant="secondary">
            לתוכנית הלימודים
          </LinkButton>
        </div>
      )}
    </div>
  );
}

function CountRow({ label, next, current }: { label: string; next: number; current: number }) {
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="font-medium text-foreground">
        {next}
        <span className="ms-1 text-xs font-normal text-muted">(כיום: {current})</span>
      </dd>
    </>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="טוען את ההתקדמות">
      <Card>
        <div className="h-5 w-32 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
        <div className="mt-4 h-2 w-full animate-pulse rounded-full bg-slate-100 dark:bg-slate-800" />
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
      </Card>
      <div className="space-y-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-lg border border-border bg-surface" />
        ))}
      </div>
    </div>
  );
}

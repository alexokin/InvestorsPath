import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { Lesson } from "@/lib/content/schema";
import { LessonKeyboardNav } from "@/components/lesson/LessonKeyboardNav";

export function LessonNav({ prev, next }: { prev: Lesson | null; next: Lesson | null }) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="ניווט בין שיעורים" className="mt-10 border-t border-border pt-6">
      <LessonKeyboardNav prevHref={prev?.href ?? null} nextHref={next?.href ?? null} />
      <div className="flex items-stretch justify-between gap-4">
        {prev ? (
          <Link
            href={prev.href}
            className="flex flex-1 flex-col items-end rounded-lg border border-border bg-surface px-4 py-3 text-end hover:border-primary"
          >
            <span className="flex items-center gap-1 text-xs text-muted">
              <ArrowRight className="size-3.5" />
              שיעור קודם
            </span>
            <span className="mt-1 text-sm font-medium text-foreground">{prev.title}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {next ? (
          <Link
            href={next.href}
            className="flex flex-1 flex-col items-start rounded-lg border border-border bg-surface px-4 py-3 text-start hover:border-primary"
          >
            <span className="flex items-center gap-1 text-xs text-muted">
              שיעור הבא
              <ArrowLeft className="size-3.5" />
            </span>
            <span className="mt-1 text-sm font-medium text-foreground">{next.title}</span>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </div>
      <p className="mt-3 hidden text-center text-xs text-muted [@media(hover:hover)]:block">
        טיפ: <kbd className="rounded border border-border px-1 font-mono">←</kbd> /{" "}
        <kbd className="rounded border border-border px-1 font-mono">→</kbd> למעבר בין שיעורים
      </p>
    </nav>
  );
}

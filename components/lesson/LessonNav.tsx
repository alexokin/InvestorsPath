import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import type { Lesson } from "@/lib/content/schema";

export function LessonNav({ prev, next }: { prev: Lesson | null; next: Lesson | null }) {
  if (!prev && !next) return null;
  return (
    <div className="mt-10 flex items-stretch justify-between gap-4 border-t border-border pt-6">
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
  );
}

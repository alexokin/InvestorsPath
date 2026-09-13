"use client";

import Link from "next/link";
import { useProgress } from "@/components/progress/ProgressProvider";
import { ProgressBar } from "@/components/progress/ProgressBar";
import { Card } from "@/components/ui/Card";
import { LinkButton } from "@/components/ui/Button";

export type ResumeLessonRef = { chapterSlug: string; slug: string; title: string };

function AllProgressLink() {
  return (
    <Link
      href="/progress/"
      className="mt-3 inline-block text-xs font-medium text-primary hover:underline"
    >
      לכל ההתקדמות שלי ←
    </Link>
  );
}

export function ResumeCard({ lessons }: { lessons: ResumeLessonRef[] }) {
  const { hydrated, lastVisited, isComplete } = useProgress();

  if (!hydrated || !lastVisited) {
    return (
      <Card className="bg-accent text-start">
        <p className="text-sm text-muted">
          עדיין לא התחלת ללמוד. הצטרפו לפרק הראשון כדי להתחיל את המסע.
        </p>
        <div className="mt-3">
          <LinkButton href="/chapters/before-you-start/" size="sm">
            להתחלת הקורס
          </LinkButton>
        </div>
      </Card>
    );
  }

  const lesson = lessons.find(
    (l) => l.chapterSlug === lastVisited.chapterSlug && l.slug === lastVisited.lessonSlug
  );
  const href = `/lessons/${lastVisited.chapterSlug}/${lastVisited.lessonSlug}/`;
  const completedCount = lessons.filter((l) => isComplete(l.chapterSlug, l.slug)).length;
  const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <Card className="bg-accent text-start">
      <p className="text-sm font-medium text-muted">המשך מאיפה שעצרת</p>
      <Link href={href} className="mt-1 block text-lg font-semibold text-primary hover:underline">
        {lesson?.title ?? "חזרה לשיעור האחרון"}
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <ProgressBar percent={percent} />
        <span className="shrink-0 text-xs font-medium text-muted">{percent}% מהקורס הושלם</span>
      </div>
      <AllProgressLink />
    </Card>
  );
}

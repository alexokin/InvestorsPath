import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Layers } from "lucide-react";
import { getChapters, getChapter } from "@/lib/content/loader";
import { ChapterHeader } from "@/components/chapter/ChapterHeader";
import { LessonList } from "@/components/chapter/LessonList";
import { RemainingTime } from "@/components/chapter/RemainingTime";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().map((c) => ({ chapter: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  return { title: chapter?.title ?? "פרק לא נמצא" };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  if (!chapter) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "תוכנית הלימודים", href: "/curriculum/" },
          { label: chapter.title },
        ]}
      />
      <div className="mt-4">
        <ChapterHeader chapter={chapter} />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-lg font-bold text-foreground">שיעורי הפרק</h2>
          <RemainingTime
            chapterSlug={chapter.slug}
            lessons={chapter.lessons.map((l) => ({ slug: l.slug, estimatedMinutes: l.estimatedMinutes }))}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/flashcards/${chapter.slug}/`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
          >
            <Layers className="size-4" />
            כרטיסיות לחזרה
          </Link>
          <Link
            href={`/chapters/${chapter.slug}/cheatsheet/`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
          >
            <FileText className="size-4" />
            דף סיכום להדפסה
          </Link>
        </div>
      </div>
      <div className="mt-3">
        <LessonList chapter={chapter} />
      </div>
    </div>
  );
}

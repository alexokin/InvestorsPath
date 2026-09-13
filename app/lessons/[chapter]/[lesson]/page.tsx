import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, BarChart3, Calculator, ArrowLeft } from "lucide-react";
import {
  getChapters,
  getChapter,
  getLesson,
  getAdjacentLessons,
} from "@/lib/content/loader";
import { renderLessonBody, extractHeadings } from "@/lib/content/mdx";
import { LessonLayout } from "@/components/lesson/LessonLayout";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { YouTubeEmbed } from "@/components/lesson/YouTubeEmbed";
import { KeyTerms } from "@/components/lesson/KeyTerms";
import { CheatSheet } from "@/components/lesson/CheatSheet";
import { Quiz } from "@/components/lesson/Quiz";
import { LessonNav } from "@/components/lesson/LessonNav";
import { MarkCompleteButton } from "@/components/lesson/MarkCompleteButton";
import { LastVisitedTracker } from "@/components/lesson/LastVisitedTracker";
import { Badge } from "@/components/ui/Badge";
import { getToolMeta } from "@/lib/finance/tools";

export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({ chapter: chapter.slug, lesson: lesson.slug }))
  );
}

const difficultyLabel = {
  beginner: "מתחילים",
  intermediate: "בינוני",
  advanced: "מתקדם",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}): Promise<Metadata> {
  const { chapter, lesson } = await params;
  const l = getLesson(chapter, lesson);
  return { title: l?.title ?? "שיעור לא נמצא", description: l?.description };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;
  const chapter = getChapter(chapterSlug);
  const lesson = getLesson(chapterSlug, lessonSlug);
  if (!chapter || !lesson) notFound();

  const [body, headings] = await Promise.all([
    renderLessonBody(lesson.body),
    Promise.resolve(extractHeadings(lesson.body)),
  ]);
  const { prev, next } = getAdjacentLessons(chapterSlug, lessonSlug);

  return (
    <LessonLayout chapter={chapter} headings={headings}>
      <LastVisitedTracker chapterSlug={chapterSlug} lessonSlug={lessonSlug} />
      <Breadcrumbs
        items={[
          { label: "תוכנית הלימודים", href: "/curriculum/" },
          { label: chapter.title, href: chapter.href },
          { label: lesson.title },
        ]}
      />
      <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{lesson.title}</h1>
      <p className="mt-2 text-muted">{lesson.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge tone="primary">
          <Clock className="me-1 inline size-3" />
          {lesson.estimatedMinutes} דק&apos;
        </Badge>
        <Badge>
          <BarChart3 className="me-1 inline size-3" />
          {difficultyLabel[lesson.difficulty]}
        </Badge>
      </div>

      <div className="mt-6">
        {lesson.videos.length > 0 ? (
          <YouTubeEmbed videos={lesson.videos} />
        ) : (
          <p className="rounded-lg border border-border bg-surface p-3 text-sm text-muted">
            לשיעור זה אין סרטון מצורף — הסיכום הכתוב מכסה את החומר במלואו.
          </p>
        )}
      </div>

      <div className="prose-lesson mt-6">{body}</div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">מונחי מפתח</h2>
        <KeyTerms terms={lesson.terms} />
      </section>

      <section className="mt-8">
        <CheatSheet cheatsheet={lesson.cheatsheet} />
      </section>

      {lesson.tools.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">כלים קשורים</h2>
          <ul className="space-y-2">
            {lesson.tools.map((toolId) => {
              const tool = getToolMeta(toolId);
              if (!tool) return null;
              return (
                <li key={toolId}>
                  <Link
                    href={`/tools/${tool.id}/`}
                    className="flex items-center gap-2 rounded-lg border border-border bg-surface p-3 text-sm text-foreground transition-colors hover:border-primary hover:bg-accent"
                  >
                    <Calculator className="size-4 shrink-0 text-primary" />
                    <span className="flex-1">{tool.name_he}</span>
                    <ArrowLeft className="size-4 shrink-0 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-foreground">בחן את עצמך</h2>
        <Quiz chapterSlug={chapterSlug} lessonSlug={lessonSlug} questions={lesson.quiz} />
      </section>

      <div className="mt-8">
        <MarkCompleteButton chapterSlug={chapterSlug} lessonSlug={lessonSlug} />
      </div>

      <LessonNav prev={prev} next={next} />
    </LessonLayout>
  );
}

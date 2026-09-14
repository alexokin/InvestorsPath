import { ImageResponse } from "next/og";
import { getChapter, getChapters, getLesson } from "@/lib/content/loader";
import { OG_CONTENT_TYPE, OG_SIZE, loadHeeboFonts, ogImageOptions, renderOgCard } from "@/lib/seo/og";

export const alt = "תמונת שיתוף לשיעור";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Mirrors app/lessons/[chapter]/[lesson]/page.tsx: every lesson is rendered
// at build time and unknown params 404 (required for output: "export").
export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().flatMap((chapter) =>
    chapter.lessons.map((lesson) => ({ chapter: chapter.slug, lesson: lesson.slug }))
  );
}

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: "מתחילים",
  intermediate: "בינוני",
  advanced: "מתקדם",
};

function truncate(text: string, max = 120): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ chapter: string; lesson: string }>;
}) {
  const { chapter: chapterSlug, lesson: lessonSlug } = await params;
  const chapter = getChapter(chapterSlug);
  const lesson = getLesson(chapterSlug, lessonSlug);
  const fonts = await loadHeeboFonts();

  return new ImageResponse(
    renderOgCard({
      eyebrow: chapter?.title,
      title: lesson?.title ?? "שיעור",
      subtitle: lesson ? truncate(lesson.description) : undefined,
      footer: lesson
        ? `${lesson.estimatedMinutes} דק' · ${DIFFICULTY_LABEL[lesson.difficulty]}`
        : undefined,
    }),
    ogImageOptions(fonts)
  );
}

import { ImageResponse } from "next/og";
import { getChapter, getChapters } from "@/lib/content/loader";
import { OG_CONTENT_TYPE, OG_SIZE, loadHeeboFonts, ogImageOptions, renderOgCard } from "@/lib/seo/og";

export const alt = "תמונת שיתוף לפרק";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Mirrors app/chapters/[chapter]/page.tsx.
export const dynamicParams = false;

export function generateStaticParams() {
  return getChapters().map((c) => ({ chapter: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  const fonts = await loadHeeboFonts();

  return new ImageResponse(
    renderOgCard({
      eyebrow: "פרק בקורס",
      title: chapter?.title ?? "פרק",
      subtitle: chapter
        ? `${chapter.objectives.length} מטרות למידה · ${chapter.lessons.length} שיעורים`
        : undefined,
      footer: chapter ? `${chapter.estimatedMinutes} דק'` : undefined,
    }),
    ogImageOptions(fonts)
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getChapters, getChapter } from "@/lib/content/loader";
import { ChapterCheatSheet } from "@/components/chapter/ChapterCheatSheet";
import { PrintButton } from "@/components/chapter/PrintButton";

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
  return { title: chapter ? `דף סיכום — ${chapter.title}` : "פרק לא נמצא" };
}

export default async function ChapterCheatSheetPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: chapterSlug } = await params;
  const chapter = getChapter(chapterSlug);
  if (!chapter) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div data-print-hide className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">דף סיכום — {chapter.title}</h1>
        <PrintButton />
      </div>
      <ChapterCheatSheet chapter={chapter} />
    </div>
  );
}

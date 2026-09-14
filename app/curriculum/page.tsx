import type { Metadata } from "next";
import Link from "next/link";
import { getChapters } from "@/lib/content/loader";
import { LessonList } from "@/components/chapter/LessonList";
import { JsonLd } from "@/components/seo/JsonLd";
import { chapterListJsonLd } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "תוכנית הלימודים",
  alternates: { canonical: "/curriculum/" },
};

export default function CurriculumPage() {
  const chapters = getChapters();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <JsonLd data={chapterListJsonLd(chapters)} />
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">תוכנית הלימודים המלאה</h1>
      <p className="mt-2 text-muted">
        {chapters.length} פרקים ו-{chapters.reduce((n, c) => n + c.lessons.length, 0)} שיעורים,
        מהיסודות ועד ליישום מעשי.
      </p>

      <div className="mt-8 space-y-10">
        {chapters.map((chapter, i) => (
          <section key={chapter.slug}>
            <div className="mb-3 flex items-baseline justify-between gap-2">
              <h2 className="text-lg font-bold text-foreground">
                {i + 1}. {chapter.title}
              </h2>
              <Link href={chapter.href} className="text-sm text-primary hover:underline">
                לדף הפרק
              </Link>
            </div>
            <LessonList chapter={chapter} />
          </section>
        ))}
      </div>
    </div>
  );
}

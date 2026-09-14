import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getAllLessons, getChapters } from "@/lib/content/loader";
import { ResumeCard } from "@/components/progress/ResumeCard";
import { ChapterProgress } from "@/components/progress/ChapterProgress";
import { LinkButton } from "@/components/ui/Button";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseJsonLd } from "@/lib/seo/jsonld";

const SITE_TITLE = "מסלול המשקיע — המדריך המלא להשקעות ערך, בעברית";
const SITE_DESCRIPTION = "המדריך המלא להשקעות ערך, בעברית";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "he_IL",
  },
  twitter: { card: "summary_large_image" },
};

export default function HomePage() {
  const chapters = getChapters();
  const lessons = getAllLessons().map((lesson) => ({
    chapterSlug: lesson.chapterSlug,
    slug: lesson.slug,
    title: lesson.title,
  }));

  return (
    <div>
      <JsonLd data={courseJsonLd(chapters)} />
      <section className="border-b border-border bg-gradient-to-b from-accent to-background">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <h1 className="mx-auto max-w-2xl text-3xl font-bold text-foreground sm:text-5xl">
            מסלול המשקיע
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
            המדריך המלא להשקעות ערך, בעברית — מהיסודות ועד בניית תיק השקעות אמיתי, עם סיכומים,
            נוסחאות ומבחני הבנה בכל שיעור.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <LinkButton href="/chapters/before-you-start/">
              התחלת הקורס
              <ArrowLeft className="size-4" />
            </LinkButton>
            <LinkButton href="/curriculum/" variant="secondary">
              תוכנית הלימודים המלאה
            </LinkButton>
          </div>
          <div className="mx-auto mt-8 max-w-md">
            <ResumeCard lessons={lessons} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-xl font-bold text-foreground">פרקי הקורס</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {chapters.map((chapter, i) => (
            <Link
              key={chapter.slug}
              href={chapter.href}
              className="rounded-xl border border-border bg-surface p-5 transition-colors hover:border-primary"
            >
              <p className="text-xs font-semibold text-primary">פרק {i + 1}</p>
              <h3 className="mt-1 font-bold text-foreground">{chapter.title}</h3>
              <p className="mt-2 text-sm text-muted line-clamp-3">{chapter.description}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted">
                <Clock className="size-3.5" />
                {chapter.estimatedMinutes} דק&apos; · {chapter.lessons.length} שיעורים
              </p>
              <ChapterProgress
                chapterSlug={chapter.slug}
                lessonSlugs={chapter.lessons.map((lesson) => lesson.slug)}
              />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

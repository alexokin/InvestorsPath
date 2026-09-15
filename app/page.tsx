import type { Metadata } from "next";
import { getAllLessons, getChapters } from "@/lib/content/loader";
import { JsonLd } from "@/components/seo/JsonLd";
import { courseJsonLd } from "@/lib/seo/jsonld";
import { HomeHero } from "@/components/home/HomeHero";
import { LandingPage } from "@/components/home/LandingPage";
import { LinkButton } from "@/components/ui/Button";

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
  const totalLessons = getAllLessons().length;
  const totalMinutes = chapters.reduce((sum, chapter) => sum + chapter.estimatedMinutes, 0);
  const chapterTitles = chapters.map((chapter) => chapter.title);

  return (
    <div>
      <JsonLd data={courseJsonLd(chapters)} />
      <HomeHero>
        <LinkButton href="/login/">התחברות והתחלת הקורס</LinkButton>
      </HomeHero>
      <LandingPage
        chapterTitles={chapterTitles}
        totalLessons={totalLessons}
        totalMinutes={totalMinutes}
      />
    </div>
  );
}

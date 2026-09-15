import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { getAllLessons, getChapters } from "@/lib/content/loader";
import { HomeHero } from "@/components/home/HomeHero";
import { CourseDashboard } from "@/components/home/CourseDashboard";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "לוח הבקרה",
  robots: { index: false },
};

export default function DashboardPage() {
  const chapters = getChapters();
  const lessons = getAllLessons().map((lesson) => ({
    chapterSlug: lesson.chapterSlug,
    slug: lesson.slug,
    title: lesson.title,
  }));

  return (
    <div>
      <HomeHero>
        <LinkButton href="/chapters/before-you-start/">
          התחלת הקורס
          <ArrowLeft className="size-4" />
        </LinkButton>
        <LinkButton href="/curriculum/" variant="secondary">
          תוכנית הלימודים המלאה
        </LinkButton>
      </HomeHero>
      <CourseDashboard chapters={chapters} lessons={lessons} />
    </div>
  );
}

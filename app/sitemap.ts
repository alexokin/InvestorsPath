import type { MetadataRoute } from "next";
import { getAllLessons, getChapters } from "@/lib/content/loader";
import { SITE_URL } from "@/lib/site";

// Static export has no server to compute this per-request; force-static
// makes `next build` emit sitemap.xml as a plain static file in out/.
export const dynamic = "force-static";

const STATIC_ROUTES: { path: string; priority: number }[] = [
  { path: "/", priority: 1 },
  { path: "/curriculum/", priority: 0.8 },
  { path: "/glossary/", priority: 0.7 },
  { path: "/cheatsheets/", priority: 0.7 },
  { path: "/tools/", priority: 0.7 },
  { path: "/flashcards/", priority: 0.7 },
  { path: "/flashcards/all/", priority: 0.5 },
  { path: "/progress/", priority: 0.5 },
  { path: "/changelog/", priority: 0.5 },
  // Created by another agent; listed here regardless since the route will
  // exist by the time the site is built.
  { path: "/tools/checklist/", priority: 0.6 },
  { path: "/offline/", priority: 0.1 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const chapters = getChapters();
  const lessons = getAllLessons();

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map(({ path, priority }) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly",
    priority,
  }));

  for (const chapter of chapters) {
    entries.push({
      url: `${SITE_URL}${chapter.href}`,
      changeFrequency: "monthly",
      priority: 0.6,
    });
    entries.push({
      url: `${SITE_URL}/chapters/${chapter.slug}/cheatsheet/`,
      changeFrequency: "monthly",
      priority: 0.4,
    });
    entries.push({
      url: `${SITE_URL}/flashcards/${chapter.slug}/`,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  for (const lesson of lessons) {
    entries.push({
      url: `${SITE_URL}${lesson.href}`,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  return entries;
}

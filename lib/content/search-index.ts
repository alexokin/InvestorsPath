import { getAllLessons, getChapters } from "./loader";
import { slugifyTerm } from "./glossary";
import { TOOLS } from "../finance/tools";

export type SearchEntryType = "lesson" | "chapter" | "term" | "tool";

export type SearchIndexEntry = {
  type: SearchEntryType;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
};

/**
 * Builds the full-site search index from content/chapters (via lib/content/
 * loader.ts, which reads the filesystem) plus the calculator tools declared
 * in lib/finance/tools.ts. This runs only in Node — at build time, via
 * scripts/build-search-index.ts — never in the browser bundle.
 */
export function buildSearchIndex(): SearchIndexEntry[] {
  const chapters = getChapters();
  const lessons = getAllLessons();
  const entries: SearchIndexEntry[] = [];

  for (const chapter of chapters) {
    entries.push({
      type: "chapter",
      title: chapter.title,
      subtitle: chapter.description,
      href: chapter.href,
      keywords: chapter.objectives,
    });
  }

  for (const lesson of lessons) {
    entries.push({
      type: "lesson",
      title: lesson.title,
      subtitle: lesson.description,
      href: lesson.href,
      keywords: lesson.terms.flatMap((term) => [term.term, term.en]),
    });
  }

  const seenTermSlugs = new Set<string>();
  for (const lesson of lessons) {
    for (const term of lesson.terms) {
      const slug = slugifyTerm(term.term);
      if (seenTermSlugs.has(slug)) continue;
      seenTermSlugs.add(slug);
      entries.push({
        type: "term",
        title: term.term,
        subtitle: term.en,
        href: `/glossary/#${slug}`,
        keywords: [term.term, term.en, term.definition],
      });
    }
  }

  for (const tool of TOOLS) {
    entries.push({
      type: "tool",
      title: tool.name_he,
      subtitle: tool.tagline_he,
      href: `/tools/${tool.id}/`,
      keywords: [tool.name_he, tool.tagline_he, tool.id],
    });
  }

  return entries;
}

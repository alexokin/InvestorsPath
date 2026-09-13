import { getAllLessons, getChapters } from "./loader";
import { slugifyTerm } from "./glossary";

export type SearchEntryType = "lesson" | "chapter" | "term" | "tool";

export type SearchIndexEntry = {
  type: SearchEntryType;
  title: string;
  subtitle: string;
  href: string;
  keywords: string[];
};

/**
 * The five calculator tools live under app/tools/<id>/ and are being built by
 * another workstream in parallel with this one, so the ids/titles here are
 * duplicated rather than imported from that in-progress code. Keep in sync
 * with the tool ids referenced by `relatedTool` in content/formulas.yaml.
 */
const TOOLS: { id: string; title: string; subtitle: string }[] = [
  {
    id: "compound",
    title: "מחשבון ריבית דריבית",
    subtitle: "כיצד הון צומח לאורך זמן בריבית דריבית",
  },
  {
    id: "dcf",
    title: "מחשבון DCF",
    subtitle: "היוון תזרימי מזומנים עתידיים לשווי נוכחי",
  },
  {
    id: "graham",
    title: "מחשבון נוסחת גרהאם",
    subtitle: "אומדן שווי הוגן שמרני לפי נוסחת גרהאם",
  },
  {
    id: "multiples",
    title: "השוואת מכפילים",
    subtitle: "השוואת חברות לפי מכפילי שוק מקובלים",
  },
  {
    id: "margin-of-safety",
    title: "מרווח ביטחון",
    subtitle: "בדיקת מרווח הביטחון בין מחיר לשווי פנימי",
  },
];

/**
 * Builds the full-site search index from content/chapters (via lib/content/
 * loader.ts, which reads the filesystem) plus a static list of calculator
 * tools. This runs only in Node — at build time, via
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
      title: tool.title,
      subtitle: tool.subtitle,
      href: `/tools/${tool.id}/`,
      keywords: [tool.title, tool.subtitle, tool.id],
    });
  }

  return entries;
}

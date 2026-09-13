import { getAllLessons } from "./loader";

/**
 * Derives a stable, URL-safe anchor id from a Hebrew term. This is the single
 * source of truth for glossary anchor ids: components/lesson/KeyTerms.tsx
 * links to `/glossary/#${slugifyTerm(term.term)}` and the glossary page
 * renders each entry with that same id, so the two must stay in sync.
 */
export function slugifyTerm(term: string): string {
  return term
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

export type GlossaryLessonRef = { href: string; title: string };

export type GlossaryEntry = {
  slug: string;
  term: string;
  en: string;
  definition: string;
  lessons: GlossaryLessonRef[];
};

const collator = new Intl.Collator("he");

/**
 * Aggregates every lesson's key terms into a deduplicated glossary, keyed by
 * the same slug KeyTerms uses for its links. When the same term is defined in
 * more than one lesson, all of those lessons are kept (in curriculum order)
 * so the glossary can list every place a term "appears".
 */
export function getGlossaryEntries(): GlossaryEntry[] {
  const lessons = getAllLessons();
  const bySlug = new Map<string, GlossaryEntry>();

  for (const lesson of lessons) {
    for (const term of lesson.terms) {
      const slug = slugifyTerm(term.term);
      const lessonRef: GlossaryLessonRef = { href: lesson.href, title: lesson.title };
      const existing = bySlug.get(slug);
      if (existing) {
        if (!existing.lessons.some((l) => l.href === lessonRef.href)) {
          existing.lessons.push(lessonRef);
        }
        continue;
      }
      bySlug.set(slug, {
        slug,
        term: term.term,
        en: term.en,
        definition: term.definition,
        lessons: [lessonRef],
      });
    }
  }

  return Array.from(bySlug.values()).sort((a, b) => collator.compare(a.term, b.term));
}

import { getChapter, getChapters } from "@/lib/content/loader";
import { getGlossaryEntries, slugifyTerm } from "@/lib/content/glossary";
import type { Chapter } from "@/lib/content/schema";
import type { Flashcard } from "./scheduler";

/** Reserved `[chapter]` param for the deck containing every glossary term. */
export const ALL_DECK_SLUG = "all";
export const ALL_DECK_TITLE = "כל המונחים";

export type Deck = {
  id: string;
  title: string;
  href: string;
  cards: Flashcard[];
};

export function deckHref(id: string): string {
  return `/flashcards/${id}/`;
}

/**
 * Builds the flashcards of one chapter, deduplicated by glossary slug across
 * its lessons. When the same term is defined in more than one lesson, every
 * lesson it appears in is kept as a link on the back of the card.
 */
export function buildChapterCards(chapter: Chapter): Flashcard[] {
  const bySlug = new Map<string, Flashcard>();
  for (const lesson of chapter.lessons) {
    for (const term of lesson.terms) {
      const slug = slugifyTerm(term.term);
      const ref = { href: lesson.href, title: lesson.title };
      const existing = bySlug.get(slug);
      if (existing) {
        if (!existing.lessons.some((l) => l.href === ref.href)) existing.lessons.push(ref);
        continue;
      }
      bySlug.set(slug, {
        slug,
        term: term.term,
        en: term.en,
        definition: term.definition,
        lessons: [ref],
      });
    }
  }
  return Array.from(bySlug.values());
}

export function buildAllCards(): Flashcard[] {
  return getGlossaryEntries().map((entry) => ({
    slug: entry.slug,
    term: entry.term,
    en: entry.en,
    definition: entry.definition,
    lessons: entry.lessons.map((l) => ({ href: l.href, title: l.title })),
  }));
}

/** Resolves a `[chapter]` param (a chapter slug or "all") to a deck. */
export function getDeck(id: string): Deck | undefined {
  if (id === ALL_DECK_SLUG) {
    return { id, title: ALL_DECK_TITLE, href: deckHref(id), cards: buildAllCards() };
  }
  const chapter = getChapter(id);
  if (!chapter) return undefined;
  return { id, title: chapter.title, href: deckHref(id), cards: buildChapterCards(chapter) };
}

/** Chapter decks in curriculum order (the "all" deck is not included). */
export function getChapterDecks(): Deck[] {
  return getChapters().map((chapter) => ({
    id: chapter.slug,
    title: chapter.title,
    href: deckHref(chapter.slug),
    cards: buildChapterCards(chapter),
  }));
}

export function getDeckParams(): { chapter: string }[] {
  return [...getChapters().map((c) => ({ chapter: c.slug })), { chapter: ALL_DECK_SLUG }];
}

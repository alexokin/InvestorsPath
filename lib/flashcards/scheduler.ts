/**
 * Pure Leitner scheduling for glossary flashcards. No I/O here — persistence
 * lives in ./storage.ts and the UI in components/flashcards/.
 *
 * Every card sits in one of three boxes. Knowing a card promotes it one box,
 * missing it drops it back to box 1. Each box has a review interval:
 * box 1 = again this session, box 2 = one day, box 3 = four days.
 */

export type Box = 1 | 2 | 3;

export type CardState = {
  box: Box;
  /** Epoch ms after which the card is due for review again. */
  due: number;
  /** How many times the card has been graded. */
  seen: number;
};

export type FlashcardLessonRef = { href: string; title: string };

export type Flashcard = {
  slug: string;
  term: string;
  en: string;
  definition: string;
  lessons: FlashcardLessonRef[];
};

export type DeckStats = {
  total: number;
  /** Cards in box 3. */
  mastered: number;
  /** Cards graded at least once but not yet in box 3. */
  learning: number;
  /** Cards never graded. */
  new: number;
};

export const DAY_MS = 24 * 60 * 60 * 1000;

export const BOX_INTERVALS_MS: Record<Box, number> = {
  1: 0,
  2: DAY_MS,
  3: 4 * DAY_MS,
};

export const MAX_BOX: Box = 3;

export function newCardState(now: number): CardState {
  return { box: 1, due: now, seen: 0 };
}

export function isCardState(value: unknown): value is CardState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.box === 1 || v.box === 2 || v.box === 3) &&
    typeof v.due === "number" &&
    Number.isFinite(v.due) &&
    typeof v.seen === "number" &&
    Number.isFinite(v.seen) &&
    v.seen >= 0
  );
}

/**
 * Grades a card. A "knew" promotes it one box (capped at box 3) and schedules
 * it after that box's interval; a miss sends it back to box 1, due now.
 */
export function grade(state: CardState | undefined, knew: boolean, now: number): CardState {
  const current = state ?? newCardState(now);
  const box: Box = knew ? (Math.min(current.box + 1, MAX_BOX) as Box) : 1;
  return {
    box,
    due: now + BOX_INTERVALS_MS[box],
    seen: current.seen + 1,
  };
}

export function isDue(state: CardState | undefined, now: number): boolean {
  return !state || state.due <= now;
}

/**
 * Small deterministic PRNG (mulberry32) so a shuffled deck order is stable
 * for a given seed — handy for tests and for keeping the order fixed within
 * a session across re-renders.
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const result = items.slice();
  const random = mulberry32(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Orders a deck for a study session: due cards first (lowest box first, so
 * the shakiest cards come up early), then cards that are not due yet (again
 * lowest box first). Within each group the incoming order is kept, unless a
 * `seed` is given — then the deck is shuffled deterministically before
 * grouping, so the cards inside each group come out in a shuffled order.
 */
export function orderDeck<T extends { slug: string }>(
  cards: readonly T[],
  states: Readonly<Record<string, CardState | undefined>>,
  now: number,
  seed?: number
): T[] {
  const base = seed === undefined ? cards.slice() : seededShuffle(cards, seed);
  const rank = (card: T): number => {
    const state = states[card.slug];
    const box = state?.box ?? 1;
    // due cards rank 1..3, not-yet-due cards rank 11..13
    return (isDue(state, now) ? 0 : 10) + box;
  };
  return base
    .map((card, index) => ({ card, index, rank: rank(card) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.card);
}

export function deckStats(
  cards: readonly { slug: string }[],
  states: Readonly<Record<string, CardState | undefined>>
): DeckStats {
  let mastered = 0;
  let learning = 0;
  let fresh = 0;
  for (const card of cards) {
    const state = states[card.slug];
    if (!state || state.seen === 0) fresh++;
    else if (state.box === MAX_BOX) mastered++;
    else learning++;
  }
  return { total: cards.length, mastered, learning, new: fresh };
}

export function masteryPercent(stats: Pick<DeckStats, "total" | "mastered">): number {
  if (stats.total === 0) return 0;
  return Math.round((stats.mastered / stats.total) * 100);
}

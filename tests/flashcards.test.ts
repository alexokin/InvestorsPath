import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BOX_INTERVALS_MS,
  DAY_MS,
  deckStats,
  grade,
  isCardState,
  isDue,
  masteryPercent,
  newCardState,
  orderDeck,
  seededShuffle,
  type CardState,
} from "@/lib/flashcards/scheduler";
import {
  FLASHCARDS_STORAGE_KEY,
  readFlashcards,
  writeFlashcards,
} from "@/lib/flashcards/storage";
import {
  ALL_DECK_SLUG,
  buildAllCards,
  buildChapterCards,
  getChapterDecks,
  getDeck,
  getDeckParams,
} from "@/lib/flashcards/cards";
import { getChapters } from "@/lib/content/loader";
import { getGlossaryEntries, slugifyTerm } from "@/lib/content/glossary";

const NOW = 1_700_000_000_000;

describe("grade", () => {
  it("promotes a new card to box 2, due in one day", () => {
    const state = grade(undefined, true, NOW);
    expect(state).toEqual({ box: 2, due: NOW + DAY_MS, seen: 1 });
  });

  it("promotes box 2 to box 3, due in four days", () => {
    const state = grade({ box: 2, due: NOW, seen: 1 }, true, NOW);
    expect(state).toEqual({ box: 3, due: NOW + 4 * DAY_MS, seen: 2 });
  });

  it("caps at box 3", () => {
    const state = grade({ box: 3, due: NOW, seen: 5 }, true, NOW);
    expect(state.box).toBe(3);
    expect(state.due).toBe(NOW + BOX_INTERVALS_MS[3]);
    expect(state.seen).toBe(6);
  });

  it("drops a missed card back to box 1, due immediately", () => {
    const state = grade({ box: 3, due: NOW + DAY_MS, seen: 4 }, false, NOW);
    expect(state).toEqual({ box: 1, due: NOW, seen: 5 });
  });

  it("does not mutate the input state", () => {
    const input: CardState = { box: 2, due: NOW, seen: 1 };
    grade(input, true, NOW);
    expect(input).toEqual({ box: 2, due: NOW, seen: 1 });
  });

  it("uses the documented intervals", () => {
    expect(BOX_INTERVALS_MS[1]).toBe(0);
    expect(BOX_INTERVALS_MS[2]).toBe(DAY_MS);
    expect(BOX_INTERVALS_MS[3]).toBe(4 * DAY_MS);
  });
});

describe("isDue / newCardState / isCardState", () => {
  it("treats unknown cards as due", () => {
    expect(isDue(undefined, NOW)).toBe(true);
  });

  it("compares the due timestamp inclusively", () => {
    expect(isDue({ box: 2, due: NOW, seen: 1 }, NOW)).toBe(true);
    expect(isDue({ box: 2, due: NOW + 1, seen: 1 }, NOW)).toBe(false);
  });

  it("creates a fresh box-1 state", () => {
    expect(newCardState(NOW)).toEqual({ box: 1, due: NOW, seen: 0 });
  });

  it("validates persisted shapes", () => {
    expect(isCardState({ box: 1, due: NOW, seen: 0 })).toBe(true);
    expect(isCardState({ box: 4, due: NOW, seen: 0 })).toBe(false);
    expect(isCardState({ box: 2, due: "x", seen: 0 })).toBe(false);
    expect(isCardState({ box: 2, due: NOW, seen: -1 })).toBe(false);
    expect(isCardState(null)).toBe(false);
    expect(isCardState("nope")).toBe(false);
  });
});

describe("orderDeck", () => {
  const cards = [
    { slug: "a" },
    { slug: "b" },
    { slug: "c" },
    { slug: "d" },
    { slug: "e" },
  ];

  it("puts due cards first, lowest box first, then not-yet-due cards", () => {
    const states: Record<string, CardState> = {
      a: { box: 3, due: NOW + DAY_MS, seen: 2 }, // not due, box 3
      b: { box: 2, due: NOW - 1, seen: 1 }, // due, box 2
      c: { box: 1, due: NOW, seen: 1 }, // due, box 1
      d: { box: 2, due: NOW + 1, seen: 1 }, // not due, box 2
      // e: new -> due, box 1
    };
    const ordered = orderDeck(cards, states, NOW).map((c) => c.slug);
    expect(ordered).toEqual(["c", "e", "b", "d", "a"]);
  });

  it("is stable within a group", () => {
    const ordered = orderDeck(cards, {}, NOW).map((c) => c.slug);
    expect(ordered).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("does not mutate the input array", () => {
    const input = cards.slice();
    orderDeck(input, { a: { box: 3, due: NOW + 1, seen: 1 } }, NOW);
    expect(input).toEqual(cards);
  });

  it("shuffles deterministically for a seed while keeping due cards first", () => {
    const states: Record<string, CardState> = {
      a: { box: 3, due: NOW + DAY_MS, seen: 2 },
      b: { box: 3, due: NOW + DAY_MS, seen: 2 },
    };
    const first = orderDeck(cards, states, NOW, 42).map((c) => c.slug);
    const second = orderDeck(cards, states, NOW, 42).map((c) => c.slug);
    expect(first).toEqual(second);
    expect(first.slice(0, 3).sort()).toEqual(["c", "d", "e"]);
    expect(first.slice(3).sort()).toEqual(["a", "b"]);
  });

  it("produces a different order for a different seed (on a large deck)", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ slug: `s${i}` }));
    const one = seededShuffle(many, 1).map((c) => c.slug);
    const two = seededShuffle(many, 2).map((c) => c.slug);
    expect(one).not.toEqual(two);
    expect(one.slice().sort()).toEqual(two.slice().sort());
  });
});

describe("deckStats / masteryPercent", () => {
  it("counts new, learning and mastered cards", () => {
    const cards = [{ slug: "a" }, { slug: "b" }, { slug: "c" }, { slug: "d" }];
    const states: Record<string, CardState> = {
      a: { box: 3, due: NOW, seen: 2 },
      b: { box: 2, due: NOW, seen: 1 },
      c: { box: 1, due: NOW, seen: 0 }, // seen 0 still counts as new
    };
    expect(deckStats(cards, states)).toEqual({ total: 4, mastered: 1, learning: 1, new: 2 });
  });

  it("ignores states for cards outside the deck", () => {
    const stats = deckStats([{ slug: "a" }], { z: { box: 3, due: NOW, seen: 1 } });
    expect(stats).toEqual({ total: 1, mastered: 0, learning: 0, new: 1 });
  });

  it("rounds mastery to a whole percent and handles empty decks", () => {
    expect(masteryPercent({ total: 3, mastered: 1 })).toBe(33);
    expect(masteryPercent({ total: 0, mastered: 0 })).toBe(0);
    expect(masteryPercent({ total: 4, mastered: 4 })).toBe(100);
  });
});

describe("storage", () => {
  let backing: Record<string, string>;

  beforeEach(() => {
    backing = {};
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) => (key in backing ? backing[key] : null),
        setItem: (key: string, value: string) => {
          backing[key] = value;
        },
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty store when nothing is saved", () => {
    expect(readFlashcards()).toEqual({});
  });

  it("round-trips a store under the versioned key", () => {
    const store = { a: { box: 2 as const, due: NOW, seen: 1 } };
    writeFlashcards(store);
    expect(backing[FLASHCARDS_STORAGE_KEY]).toBeDefined();
    expect(readFlashcards()).toEqual(store);
  });

  it("drops malformed entries and survives invalid JSON", () => {
    backing[FLASHCARDS_STORAGE_KEY] = JSON.stringify({
      good: { box: 3, due: NOW, seen: 2 },
      bad: { box: 9, due: "soon" },
    });
    expect(readFlashcards()).toEqual({ good: { box: 3, due: NOW, seen: 2 } });

    backing[FLASHCARDS_STORAGE_KEY] = "{not json";
    expect(readFlashcards()).toEqual({});

    backing[FLASHCARDS_STORAGE_KEY] = "[1,2]";
    expect(readFlashcards()).toEqual({});
  });

  it("fails silently when localStorage throws", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("blocked");
        },
        setItem: () => {
          throw new Error("quota");
        },
      },
    });
    expect(readFlashcards()).toEqual({});
    expect(() => writeFlashcards({})).not.toThrow();
  });
});

describe("cards (deck building from content)", () => {
  it("generates a static param for every chapter plus the reserved 'all' deck", () => {
    const params = getDeckParams().map((p) => p.chapter);
    const chapterSlugs = getChapters().map((c) => c.slug);
    expect(params).toEqual([...chapterSlugs, ALL_DECK_SLUG]);
    expect(chapterSlugs).not.toContain(ALL_DECK_SLUG);
  });

  it("dedupes chapter cards by glossary slug and keeps every lesson reference", () => {
    for (const chapter of getChapters()) {
      const cards = buildChapterCards(chapter);
      const slugs = cards.map((c) => c.slug);
      expect(new Set(slugs).size).toBe(slugs.length);
      const expected = new Set(
        chapter.lessons.flatMap((l) => l.terms.map((t) => slugifyTerm(t.term)))
      );
      expect(new Set(slugs)).toEqual(expected);
      for (const card of cards) {
        expect(card.lessons.length).toBeGreaterThan(0);
        for (const ref of card.lessons) {
          expect(chapter.lessons.some((l) => l.href === ref.href)).toBe(true);
        }
      }
    }
  });

  it("builds the 'all' deck from the glossary", () => {
    const all = buildAllCards();
    expect(all.map((c) => c.slug)).toEqual(getGlossaryEntries().map((e) => e.slug));
    expect(getDeck(ALL_DECK_SLUG)?.cards.length).toBe(all.length);
  });

  it("resolves chapter decks and rejects unknown ids", () => {
    const decks = getChapterDecks();
    expect(decks.length).toBe(getChapters().length);
    for (const deck of decks) {
      expect(deck.href).toBe(`/flashcards/${deck.id}/`);
      expect(getDeck(deck.id)?.cards.length).toBe(deck.cards.length);
    }
    expect(getDeck("does-not-exist")).toBeUndefined();
  });
});

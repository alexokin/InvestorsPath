import { describe, expect, it } from "vitest";
import { lessonFrontmatterSchema, chapterFrontmatterSchema, videoSchema } from "@/lib/content/schema";
import { getChapters, getChapter, getLesson, getAllLessons, getAdjacentLessons } from "@/lib/content/loader";

describe("schema", () => {
  it("accepts a valid lesson frontmatter", () => {
    const result = lessonFrontmatterSchema.safeParse({
      title: "שיעור לדוגמה",
      description: "תיאור",
      estimatedMinutes: 10,
      difficulty: "beginner",
      videos: [
        {
          youtubeId: "dQw4w9WgXcQ",
          title: "סרטון",
          channel: "ערוץ",
          language: "he",
          timestamps: [],
        },
      ],
      terms: [
        { term: "א", en: "a", definition: "def" },
        { term: "ב", en: "b", definition: "def" },
        { term: "ג", en: "c", definition: "def" },
      ],
      cheatsheet: { formulas: [], rules: ["כלל"], checklist: [] },
      quiz: [
        { question: "q1", options: ["a", "b", "c"], answer: 0, explanation: "e" },
        { question: "q2", options: ["a", "b", "c"], answer: 1, explanation: "e" },
        { question: "q3", options: ["a", "b", "c"], answer: 2, explanation: "e" },
      ],
      related: [],
      tools: [],
    });
    expect(result.success).toBe(true);
  });

  it("accepts a lesson with no videos", () => {
    const result = lessonFrontmatterSchema.safeParse({
      title: "שיעור ללא סרטון",
      description: "תיאור",
      estimatedMinutes: 10,
      difficulty: "beginner",
      videos: [],
      terms: [
        { term: "א", en: "a", definition: "def" },
        { term: "ב", en: "b", definition: "def" },
        { term: "ג", en: "c", definition: "def" },
      ],
      cheatsheet: { formulas: [], rules: ["כלל"], checklist: [] },
      quiz: [
        { question: "q1", options: ["a", "b", "c"], answer: 0, explanation: "e" },
        { question: "q2", options: ["a", "b", "c"], answer: 1, explanation: "e" },
        { question: "q3", options: ["a", "b", "c"], answer: 2, explanation: "e" },
      ],
      related: [],
      tools: [],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.videos).toEqual([]);
    }
  });

  it("rejects an invalid youtubeId", () => {
    const result = videoSchema.safeParse({
      youtubeId: "too-short",
      title: "t",
      channel: "c",
      language: "he",
      timestamps: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 3 quiz questions", () => {
    const base = {
      title: "t",
      description: "d",
      estimatedMinutes: 5,
      difficulty: "beginner" as const,
      videos: [
        { youtubeId: "dQw4w9WgXcQ", title: "t", channel: "c", language: "he" as const, timestamps: [] },
      ],
      terms: [
        { term: "א", en: "a", definition: "def" },
        { term: "ב", en: "b", definition: "def" },
        { term: "ג", en: "c", definition: "def" },
      ],
      cheatsheet: { formulas: [], rules: [], checklist: [] },
      related: [],
      tools: [],
    };
    const result = lessonFrontmatterSchema.safeParse({
      ...base,
      quiz: [{ question: "q", options: ["a", "b", "c"], answer: 0, explanation: "e" }],
    });
    expect(result.success).toBe(false);
  });

  it("validates chapter frontmatter", () => {
    const result = chapterFrontmatterSchema.safeParse({
      title: "פרק",
      description: "תיאור",
      objectives: ["מטרה"],
      estimatedMinutes: 30,
      cheatsheet: { formulas: [], rules: [], checklist: [] },
    });
    expect(result.success).toBe(true);
  });
});

describe("loader", () => {
  it("loads chapters sorted by numeric prefix", () => {
    const chapters = getChapters();
    expect(chapters.length).toBeGreaterThan(0);
    const orders = chapters.map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("loads lessons for the first chapter in order", () => {
    const chapters = getChapters();
    const first = chapters[0];
    expect(first.lessons.length).toBeGreaterThan(0);
    const orders = first.lessons.map((l) => l.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it("resolves a chapter and lesson by slug", () => {
    const chapters = getChapters();
    const chapter = getChapter(chapters[0].slug);
    expect(chapter).toBeDefined();
    const lesson = getLesson(chapters[0].slug, chapters[0].lessons[0].slug);
    expect(lesson).toBeDefined();
    expect(lesson?.href).toContain(chapters[0].slug);
  });

  it("computes adjacent lessons across the whole course", () => {
    const all = getAllLessons();
    expect(all.length).toBeGreaterThan(0);
    const { prev, next } = getAdjacentLessons(all[0].chapterSlug, all[0].slug);
    expect(prev).toBeNull();
    expect(next).not.toBeNull();
  });
});

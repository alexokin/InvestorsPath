import { z } from "zod";

export const timestampSchema = z.object({
  at: z.union([z.string().regex(/^\d{1,3}:\d{2}$/), z.number().nonnegative()]),
  label: z.string().min(1),
});

export const videoSchema = z.object({
  youtubeId: z.string().regex(/^[\w-]{11}$/, "youtubeId must be exactly 11 url-safe characters"),
  title: z.string().min(1),
  channel: z.string().min(1),
  language: z.enum(["he", "en"]),
  timestamps: z.array(timestampSchema).default([]),
});

export const termSchema = z.object({
  term: z.string().min(1),
  en: z.string().min(1),
  definition: z.string().min(1),
});

export const cheatsheetSchema = z.object({
  formulas: z.array(z.string()).default([]),
  rules: z.array(z.string()).default([]),
  checklist: z.array(z.string()).default([]),
});

export const quizQuestionSchema = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(3).max(5),
    answer: z.number().int().nonnegative(),
    explanation: z.string().min(1),
  })
  .refine((q) => q.answer < q.options.length, {
    message: "answer index must be within options range",
    path: ["answer"],
  });

export const difficultySchema = z.enum(["beginner", "intermediate", "advanced"]);

export const lessonFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  estimatedMinutes: z.number().int().positive(),
  difficulty: difficultySchema,
  videos: z.array(videoSchema).default([]),
  terms: z.array(termSchema).min(3).max(8),
  cheatsheet: cheatsheetSchema,
  quiz: z.array(quizQuestionSchema).min(3).max(5),
  related: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
});

export const chapterFrontmatterSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  objectives: z.array(z.string().min(1)).min(1),
  estimatedMinutes: z.number().int().positive(),
  cheatsheet: cheatsheetSchema,
});

export type Timestamp = z.infer<typeof timestampSchema>;
export type Video = z.infer<typeof videoSchema>;
export type Term = z.infer<typeof termSchema>;
export type Cheatsheet = z.infer<typeof cheatsheetSchema>;
export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type Difficulty = z.infer<typeof difficultySchema>;
export type LessonFrontmatter = z.infer<typeof lessonFrontmatterSchema>;
export type ChapterFrontmatter = z.infer<typeof chapterFrontmatterSchema>;

export type Lesson = LessonFrontmatter & {
  slug: string;
  chapterSlug: string;
  order: number;
  href: string;
  body: string;
};

export type Chapter = ChapterFrontmatter & {
  slug: string;
  order: number;
  href: string;
  body: string;
  lessons: Lesson[];
};

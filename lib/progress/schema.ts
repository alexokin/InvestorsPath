import { z } from "zod";

const quizScoreSchema = z.object({
  correct: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

const lastVisitedSchema = z.object({
  chapterSlug: z.string(),
  lessonSlug: z.string(),
  at: z.number(),
});

/** Shape stored under "vip:progress:v1" (no version field). */
export const progressV1Schema = z.object({
  completedLessons: z.record(z.string(), z.boolean()),
  quizScores: z.record(z.string(), quizScoreSchema),
  lastVisited: lastVisitedSchema.optional(),
});

/** Shape stored under "vip:progress:v2". */
export const progressV2Schema = progressV1Schema.extend({
  version: z.literal(2),
  bookmarks: z.record(z.string(), z.literal(true)),
  notes: z.record(z.string(), z.string()),
  certificateName: z.string().optional(),
});

export type ProgressV1 = z.infer<typeof progressV1Schema>;
export type ProgressV2 = z.infer<typeof progressV2Schema>;

export const IMPORT_ERRORS = {
  notJson: "הקובץ אינו קובץ JSON תקין.",
  notObject: "הקובץ אינו מכיל נתוני התקדמות.",
  badShape: "מבנה הקובץ אינו תואם לקובץ התקדמות של מסלול המשקיע.",
} as const;

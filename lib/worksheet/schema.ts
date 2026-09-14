import { z } from "zod";

export const itemStatusSchema = z.union([
  z.literal("yes"),
  z.literal("no"),
  z.literal("unsure"),
  z.literal(""),
]);

export type ItemStatus = z.infer<typeof itemStatusSchema>;

export const worksheetItemStateSchema = z.object({
  status: itemStatusSchema,
  note: z.string(),
});

export const verdictSchema = z.union([
  z.literal("buy"),
  z.literal("watch"),
  z.literal("pass"),
  z.literal(""),
]);

export type Verdict = z.infer<typeof verdictSchema>;

export const worksheetSchema = z.object({
  id: z.string(),
  ticker: z.string(),
  company: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  thesis: z.string(),
  items: z.record(z.string(), worksheetItemStateSchema),
  verdict: verdictSchema,
});

export type Worksheet = z.infer<typeof worksheetSchema>;

export const worksheetStoreSchema = z.record(z.string(), worksheetSchema);

export type WorksheetStore = z.infer<typeof worksheetStoreSchema>;

export const WORKSHEET_IMPORT_ERRORS = {
  notJson: "הקובץ אינו קובץ JSON תקין.",
  notObject: "הקובץ אינו מכיל דף עבודה תקין.",
  badShape: "מבנה הקובץ אינו תואם לדף עבודה של ניתוח חברה.",
} as const;

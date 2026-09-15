import { notifyStoreChange, type StoreChangeSource } from "@/lib/storage/bus";
import { WORKSHEET_SECTIONS, type WorksheetSection } from "./template";
import {
  WORKSHEET_IMPORT_ERRORS,
  worksheetSchema,
  worksheetStoreSchema,
  type Worksheet,
  type WorksheetStore,
} from "./schema";

export type { Worksheet, WorksheetStore, ItemStatus, Verdict } from "./schema";

export const KEY_V1 = "vip:worksheets:v1";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readWorksheets(): WorksheetStore {
  const storage = getStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(KEY_V1);
    if (!raw) return {};
    const parsed = worksheetStoreSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}

export function writeWorksheets(store: WorksheetStore, source: StoreChangeSource = "local"): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(KEY_V1, JSON.stringify(store));
    notifyStoreChange("worksheets", source);
  } catch {
    // localStorage unavailable (private mode, quota) — fail silently.
  }
}

export function clearWorksheets(source: StoreChangeSource = "local"): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(KEY_V1);
    notifyStoreChange("worksheets", source);
  } catch {
    // ignore
  }
}

export function saveWorksheet(ws: Worksheet): WorksheetStore {
  const store = readWorksheets();
  const next = { ...store, [ws.id]: ws };
  writeWorksheets(next);
  return next;
}

export function deleteWorksheet(id: string): WorksheetStore {
  const store = readWorksheets();
  const next = { ...store };
  delete next[id];
  writeWorksheets(next);
  return next;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** A fresh, empty worksheet with no items filled in. */
export function newWorksheet(): Worksheet {
  const now = Date.now();
  return {
    id: makeId(),
    ticker: "",
    company: "",
    createdAt: now,
    updatedAt: now,
    thesis: "",
    items: {},
    verdict: "",
  };
}

export type SectionScore = {
  section: WorksheetSection;
  yes: number;
  no: number;
  unsure: number;
  blank: number;
  total: number;
  percentYes: number;
};

export type WorksheetScore = {
  yes: number;
  no: number;
  unsure: number;
  blank: number;
  total: number;
  percentYes: number;
  sections: SectionScore[];
};

/**
 * Percentage of "yes" answers overall and per section, plus counts of
 * "unsure"/"no" answers used for the live section summaries.
 */
export function worksheetScore(
  ws: Worksheet,
  sections: WorksheetSection[] = WORKSHEET_SECTIONS
): WorksheetScore {
  const sectionScores: SectionScore[] = sections.map((section) => {
    let yes = 0;
    let no = 0;
    let unsure = 0;
    let blank = 0;
    for (const item of section.items) {
      const status = ws.items[item.id]?.status ?? "";
      if (status === "yes") yes++;
      else if (status === "no") no++;
      else if (status === "unsure") unsure++;
      else blank++;
    }
    const total = section.items.length;
    return { section, yes, no, unsure, blank, total, percentYes: total > 0 ? yes / total : 0 };
  });

  const totals = sectionScores.reduce(
    (acc, s) => ({
      yes: acc.yes + s.yes,
      no: acc.no + s.no,
      unsure: acc.unsure + s.unsure,
      blank: acc.blank + s.blank,
      total: acc.total + s.total,
    }),
    { yes: 0, no: 0, unsure: 0, blank: 0, total: 0 }
  );

  return {
    ...totals,
    percentYes: totals.total > 0 ? totals.yes / totals.total : 0,
    sections: sectionScores,
  };
}

/** Pretty JSON of a single worksheet plus an export timestamp. */
export function exportWorksheetJson(ws: Worksheet): string {
  return JSON.stringify({ ...ws, exportedAt: new Date().toISOString() }, null, 2);
}

/**
 * Validate a user-supplied JSON string as a worksheet export.
 * Throws an Error with a Hebrew message on anything else.
 */
export function parseImportedWorksheet(raw: string): Worksheet {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new Error(WORKSHEET_IMPORT_ERRORS.notJson);
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error(WORKSHEET_IMPORT_ERRORS.notObject);
  }
  const result = worksheetSchema.safeParse(data);
  if (!result.success) throw new Error(WORKSHEET_IMPORT_ERRORS.badShape);
  return result.data;
}

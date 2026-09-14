import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  KEY_V1,
  deleteWorksheet,
  exportWorksheetJson,
  newWorksheet,
  parseImportedWorksheet,
  readWorksheets,
  saveWorksheet,
  worksheetScore,
  writeWorksheets,
  type Worksheet,
} from "@/lib/worksheet/storage";
import { WORKSHEET_IMPORT_ERRORS } from "@/lib/worksheet/schema";
import { WORKSHEET_SECTIONS } from "@/lib/worksheet/template";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => Array.from(map.keys())[i] ?? null,
    removeItem: (k) => {
      map.delete(k);
    },
    setItem: (k, v) => {
      map.set(k, String(v));
    },
  };
}

function sampleWorksheet(overrides: Partial<Worksheet> = {}): Worksheet {
  return {
    id: "ws-1",
    ticker: "AAPL",
    company: "Apple",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    thesis: "עסק איכותי עם חפיר חזק",
    items: {},
    verdict: "",
    ...overrides,
  };
}

describe("worksheet storage", () => {
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    vi.stubGlobal("window", { localStorage: storage });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns an empty store when nothing is saved", () => {
    expect(readWorksheets()).toEqual({});
  });

  it("saves and reads a worksheet", () => {
    const ws = sampleWorksheet();
    saveWorksheet(ws);
    expect(readWorksheets()).toEqual({ [ws.id]: ws });
    expect(JSON.parse(storage.getItem(KEY_V1) ?? "null")).toEqual({ [ws.id]: ws });
  });

  it("deletes a worksheet by id", () => {
    const a = sampleWorksheet({ id: "a" });
    const b = sampleWorksheet({ id: "b" });
    saveWorksheet(a);
    saveWorksheet(b);
    deleteWorksheet("a");
    expect(readWorksheets()).toEqual({ b });
  });

  it("falls back to an empty store on corrupt storage", () => {
    storage.setItem(KEY_V1, "{not json");
    expect(readWorksheets()).toEqual({});
  });

  it("falls back to an empty store when the stored shape is invalid", () => {
    storage.setItem(KEY_V1, JSON.stringify({ x: { id: "x" } }));
    expect(readWorksheets()).toEqual({});
  });

  it("writeWorksheets fails silently when localStorage is unavailable", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("blocked");
      },
    });
    expect(() => writeWorksheets({ a: sampleWorksheet() })).not.toThrow();
  });
});

describe("newWorksheet", () => {
  it("creates an empty worksheet with a unique id and matching timestamps", () => {
    const ws = newWorksheet();
    expect(ws.ticker).toBe("");
    expect(ws.company).toBe("");
    expect(ws.thesis).toBe("");
    expect(ws.items).toEqual({});
    expect(ws.verdict).toBe("");
    expect(ws.createdAt).toBe(ws.updatedAt);

    const other = newWorksheet();
    expect(other.id).not.toBe(ws.id);
  });
});

describe("worksheetScore", () => {
  it("scores an empty worksheet as all-blank with zero percent", () => {
    const score = worksheetScore(sampleWorksheet());
    const totalItems = WORKSHEET_SECTIONS.reduce((n, s) => n + s.items.length, 0);
    expect(score.total).toBe(totalItems);
    expect(score.yes).toBe(0);
    expect(score.blank).toBe(totalItems);
    expect(score.percentYes).toBe(0);
    expect(score.sections).toHaveLength(WORKSHEET_SECTIONS.length);
  });

  it("computes percent-yes and per-status counts across sections", () => {
    const firstSection = WORKSHEET_SECTIONS[0];
    const secondSection = WORKSHEET_SECTIONS[1];
    const ws = sampleWorksheet({
      items: {
        [firstSection.items[0].id]: { status: "yes", note: "" },
        [firstSection.items[1].id]: { status: "no", note: "חשש" },
        [secondSection.items[0].id]: { status: "unsure", note: "" },
      },
    });

    const score = worksheetScore(ws);
    expect(score.yes).toBe(1);
    expect(score.no).toBe(1);
    expect(score.unsure).toBe(1);

    const firstScore = score.sections.find((s) => s.section.id === firstSection.id)!;
    expect(firstScore.yes).toBe(1);
    expect(firstScore.no).toBe(1);
    expect(firstScore.total).toBe(firstSection.items.length);
    expect(firstScore.percentYes).toBeCloseTo(1 / firstSection.items.length);

    const secondScore = score.sections.find((s) => s.section.id === secondSection.id)!;
    expect(secondScore.unsure).toBe(1);
  });

  it("scores a fully-yes worksheet as 100 percent", () => {
    const items: Worksheet["items"] = {};
    for (const section of WORKSHEET_SECTIONS) {
      for (const item of section.items) {
        items[item.id] = { status: "yes", note: "" };
      }
    }
    const score = worksheetScore(sampleWorksheet({ items }));
    expect(score.percentYes).toBe(1);
    for (const s of score.sections) {
      expect(s.percentYes).toBe(1);
    }
  });
});

describe("exportWorksheetJson / parseImportedWorksheet", () => {
  it("round-trips a worksheet through export and import", () => {
    const ws = sampleWorksheet({
      items: { [WORKSHEET_SECTIONS[0].items[0].id]: { status: "yes", note: "טוב" } },
      verdict: "buy",
    });
    const json = exportWorksheetJson(ws);
    expect(json).toContain("\n"); // pretty printed
    const parsed = JSON.parse(json);
    expect(typeof parsed.exportedAt).toBe("string");

    expect(parseImportedWorksheet(json)).toEqual(ws);
  });

  it("rejects invalid JSON with a Hebrew message", () => {
    expect(() => parseImportedWorksheet("{oops")).toThrow(WORKSHEET_IMPORT_ERRORS.notJson);
  });

  it("rejects non-object JSON", () => {
    expect(() => parseImportedWorksheet("[]")).toThrow(WORKSHEET_IMPORT_ERRORS.notObject);
    expect(() => parseImportedWorksheet("null")).toThrow(WORKSHEET_IMPORT_ERRORS.notObject);
  });

  it("rejects objects with the wrong shape", () => {
    expect(() => parseImportedWorksheet(JSON.stringify({ id: "x" }))).toThrow(
      WORKSHEET_IMPORT_ERRORS.badShape
    );
  });
});

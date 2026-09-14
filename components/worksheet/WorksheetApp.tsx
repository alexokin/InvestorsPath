"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Download,
  FileQuestion,
  Minus,
  Plus,
  ThumbsDown,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PrintButton } from "@/components/chapter/PrintButton";
import { WORKSHEET_SECTIONS } from "@/lib/worksheet/template";
import {
  deleteWorksheet,
  exportWorksheetJson,
  newWorksheet,
  readWorksheets,
  saveWorksheet,
  worksheetScore,
  type ItemStatus,
  type Verdict,
  type Worksheet,
  type WorksheetStore,
} from "@/lib/worksheet/storage";

const AUTOSAVE_DELAY_MS = 400;

const VERDICT_OPTIONS: { value: Exclude<Verdict, "">; label: string }[] = [
  { value: "buy", label: "קנייה" },
  { value: "watch", label: "מעקב" },
  { value: "pass", label: "לא רלוונטי" },
];

const VERDICT_LABEL: Record<Exclude<Verdict, "">, string> = {
  buy: "קנייה",
  watch: "מעקב",
  pass: "לא רלוונטי",
};

const VERDICT_TONE: Record<Exclude<Verdict, "">, "success" | "primary" | "default"> = {
  buy: "success",
  watch: "primary",
  pass: "default",
};

const STATUS_OPTIONS: { value: Exclude<ItemStatus, "">; label: string; icon: typeof ThumbsUp }[] = [
  { value: "yes", label: "כן", icon: ThumbsUp },
  { value: "no", label: "לא", icon: ThumbsDown },
  { value: "unsure", label: "לא בטוח", icon: FileQuestion },
];

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(ts));
}

function formatPercent(value: number): string {
  return new Intl.NumberFormat("he-IL", { style: "percent", maximumFractionDigits: 0 }).format(value);
}

function downloadJson(json: string, filename: string) {
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function statusButtonClasses(active: boolean, value: Exclude<ItemStatus, "">): string {
  const base =
    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors";
  if (!active) {
    return `${base} border-border bg-surface text-muted hover:bg-accent hover:text-foreground`;
  }
  if (value === "yes") {
    return `${base} border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200`;
  }
  if (value === "no") {
    return `${base} border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-200`;
  }
  return `${base} border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200`;
}

function SectionSummary({
  yes,
  no,
  unsure,
  total,
}: {
  yes: number;
  no: number;
  unsure: number;
  total: number;
}) {
  return (
    <span className="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span className="font-medium text-foreground">
        {yes}/{total} כן
      </span>
      {unsure > 0 && <span className="text-amber-700 dark:text-amber-300">{unsure} לא בטוח</span>}
      {no > 0 && <span className="text-rose-700 dark:text-rose-300">{no} לא</span>}
    </span>
  );
}

function WorksheetList({
  worksheets,
  onOpen,
  onCreate,
  onDelete,
}: {
  worksheets: Worksheet[];
  onOpen: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div data-print-hide>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">דפי עבודה שמורים</h2>
        <Button onClick={onCreate}>
          <Plus className="size-4" />
          חברה חדשה
        </Button>
      </div>

      {worksheets.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-muted">
          עדיין לא נוצרו דפי עבודה. לחצו על &quot;חברה חדשה&quot; כדי להתחיל לנתח את החברה הראשונה.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {worksheets.map((ws) => {
            const score = worksheetScore(ws);
            return (
              <li
                key={ws.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <button
                  type="button"
                  onClick={() => onOpen(ws.id)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-1 text-start"
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span dir="ltr" className="font-semibold text-foreground">
                      {ws.ticker || "ללא סימול"}
                    </span>
                    <span className="truncate text-sm text-muted">{ws.company || "ללא שם חברה"}</span>
                    {ws.verdict && (
                      <Badge tone={VERDICT_TONE[ws.verdict]}>{VERDICT_LABEL[ws.verdict]}</Badge>
                    )}
                  </span>
                  <span className="text-xs text-muted">
                    עודכן {formatDate(ws.updatedAt)} · {formatPercent(score.percentYes)} מהתשובות &quot;כן&quot;
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(ws.id)}
                  aria-label={`מחיקת דף העבודה של ${ws.company || ws.ticker || "חברה ללא שם"}`}
                  className="rounded-lg p-2 text-muted hover:bg-accent hover:text-rose-700 dark:hover:text-rose-300"
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function WorksheetEditor({
  worksheet,
  saved,
  onChange,
  onBack,
  onDelete,
}: {
  worksheet: Worksheet;
  saved: boolean;
  onChange: (patch: Partial<Worksheet>) => void;
  onBack: () => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const score = useMemo(() => worksheetScore(worksheet), [worksheet]);

  function toggleSection(id: string) {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function setItemStatus(itemId: string, status: Exclude<ItemStatus, "">) {
    const current = worksheet.items[itemId]?.status ?? "";
    const nextStatus: ItemStatus = current === status ? "" : status;
    onChange({
      items: {
        ...worksheet.items,
        [itemId]: { note: worksheet.items[itemId]?.note ?? "", status: nextStatus },
      },
    });
  }

  function setItemNote(itemId: string, note: string) {
    onChange({
      items: {
        ...worksheet.items,
        [itemId]: { status: worksheet.items[itemId]?.status ?? "", note },
      },
    });
  }

  function setVerdict(value: Exclude<Verdict, "">) {
    onChange({ verdict: worksheet.verdict === value ? "" : value });
  }

  function handleExport() {
    const tickerPart = worksheet.ticker ? worksheet.ticker.toLowerCase() : "worksheet";
    downloadJson(exportWorksheetJson(worksheet), `worksheet-${tickerPart}.json`);
  }

  return (
    <div>
      <div data-print-hide className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-muted hover:text-primary hover:underline"
        >
          חזרה לכל דפי העבודה
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{saved ? "נשמר" : "שומר..."}</span>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            ייצוא JSON
          </Button>
          <PrintButton />
          <button
            type="button"
            onClick={onDelete}
            aria-label="מחיקת דף העבודה"
            className="rounded-lg p-2 text-muted hover:bg-accent hover:text-rose-700 dark:hover:text-rose-300"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground">סימול (טיקר)</span>
          <input
            dir="ltr"
            type="text"
            value={worksheet.ticker}
            onChange={(e) => onChange({ ticker: e.target.value })}
            placeholder="AAPL"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-start text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-foreground">שם החברה</span>
          <input
            type="text"
            value={worksheet.company}
            onChange={(e) => onChange({ company: e.target.value })}
            placeholder="שם החברה"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-start text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="mb-1 block text-sm font-medium text-foreground">
          תזה ההשקעה בשלוש שורות
        </span>
        <textarea
          value={worksheet.thesis}
          onChange={(e) => onChange({ thesis: e.target.value })}
          rows={3}
          placeholder="למה קונים, מה הציפיות, ומה יגרום לשנות את הדעה"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        />
      </label>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <span className="text-sm font-medium text-foreground">
          ציון כולל: {formatPercent(score.percentYes)} תשובות &quot;כן&quot;
        </span>
        <span className="text-xs text-muted">
          {score.yes}/{score.total} כן · {score.unsure} לא בטוח · {score.no} לא
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {WORKSHEET_SECTIONS.map((section) => {
          const sectionScore = score.sections.find((s) => s.section.id === section.id)!;
          const isCollapsed = !!collapsed[section.id];
          return (
            <div key={section.id} className="rounded-xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="flex w-full items-center justify-between gap-3 p-4 text-start"
                aria-expanded={!isCollapsed}
              >
                <span className="flex items-center gap-2">
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted transition-transform ${
                      isCollapsed ? "-rotate-90" : ""
                    }`}
                  />
                  <span className="font-semibold text-foreground">{section.title_he}</span>
                </span>
                <SectionSummary
                  yes={sectionScore.yes}
                  no={sectionScore.no}
                  unsure={sectionScore.unsure}
                  total={sectionScore.total}
                />
              </button>

              {!isCollapsed && (
                <div className="space-y-4 border-t border-border p-4 pt-4">
                  {section.items.map((item) => {
                    const state = worksheet.items[item.id] ?? { status: "" as ItemStatus, note: "" };
                    return (
                      <div key={item.id} className="space-y-2">
                        <p className="text-sm font-medium text-foreground">{item.label_he}</p>
                        <p className="text-xs text-muted">{item.hint_he}</p>
                        <div className="flex flex-wrap gap-2">
                          {STATUS_OPTIONS.map((opt) => {
                            const Icon = opt.icon;
                            const active = state.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                type="button"
                                onClick={() => setItemStatus(item.id, opt.value)}
                                aria-pressed={active}
                                className={statusButtonClasses(active, opt.value)}
                              >
                                <Icon className="size-3.5" />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                        <input
                          type="text"
                          value={state.note}
                          onChange={(e) => setItemNote(item.id, e.target.value)}
                          placeholder="הערה (אופציונלי)"
                          className="w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <span className="mb-2 block text-sm font-medium text-foreground">מסקנה</span>
        <div className="flex flex-wrap gap-2">
          {VERDICT_OPTIONS.map((opt) => {
            const active = worksheet.verdict === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setVerdict(opt.value)}
                aria-pressed={active}
                className={
                  active
                    ? `flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                        opt.value === "buy"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                          : opt.value === "watch"
                            ? "border-primary bg-accent text-primary"
                            : "border-border bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`
                    : "flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition-colors hover:bg-accent hover:text-foreground"
                }
              >
                {opt.label}
              </button>
            );
          })}
          {worksheet.verdict && (
            <button
              type="button"
              onClick={() => onChange({ verdict: "" })}
              className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground"
            >
              <Minus className="size-3.5" />
              איפוס
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function WorksheetApp() {
  const [hydrated, setHydrated] = useState(false);
  const [store, setStore] = useState<WorksheetStore>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
    setStore(readWorksheets());
    setHydrated(true);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const worksheets = useMemo(
    () => Object.values(store).sort((a, b) => b.updatedAt - a.updatedAt),
    [store]
  );

  function handleCreate() {
    const ws = newWorksheet();
    setStore(saveWorksheet(ws));
    setOpenId(ws.id);
    setSaved(true);
  }

  function requestDelete(id: string) {
    setConfirmDeleteId(id);
  }

  function confirmDelete() {
    if (!confirmDeleteId) return;
    const next = deleteWorksheet(confirmDeleteId);
    setStore(next);
    if (openId === confirmDeleteId) setOpenId(null);
    setConfirmDeleteId(null);
  }

  function updateOpenWorksheet(patch: Partial<Worksheet>) {
    if (!openId) return;
    setSaved(false);
    setStore((prev) => {
      const current = prev[openId];
      if (!current) return prev;
      const updated: Worksheet = { ...current, ...patch, updatedAt: Date.now() };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveWorksheet(updated);
        setSaved(true);
      }, AUTOSAVE_DELAY_MS);
      return { ...prev, [openId]: updated };
    });
  }

  if (!hydrated) {
    return <div className="mt-6 h-40 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  const openWorksheet = openId ? store[openId] : undefined;

  const deleteTarget = confirmDeleteId ? store[confirmDeleteId] : undefined;

  return (
    <div className="mt-6">
      {openWorksheet ? (
        <WorksheetEditor
          worksheet={openWorksheet}
          saved={saved}
          onChange={updateOpenWorksheet}
          onBack={() => setOpenId(null)}
          onDelete={() => requestDelete(openWorksheet.id)}
        />
      ) : (
        <WorksheetList
          worksheets={worksheets}
          onOpen={setOpenId}
          onCreate={handleCreate}
          onDelete={requestDelete}
        />
      )}

      <Dialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        title="מחיקת דף עבודה"
      >
        <p className="text-sm text-foreground">
          למחוק את דף העבודה של{" "}
          <strong>{deleteTarget?.company || deleteTarget?.ticker || "החברה"}</strong>? פעולה זו אינה
          ניתנת לביטול.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDeleteId(null)}>
            ביטול
          </Button>
          <button
            type="button"
            onClick={confirmDelete}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            מחיקה
          </button>
        </div>
      </Dialog>
    </div>
  );
}

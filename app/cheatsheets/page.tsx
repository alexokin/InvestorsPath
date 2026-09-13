import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { getChapters } from "@/lib/content/loader";
import { getFormulas } from "@/lib/content/formulas";
import { CheatSheet } from "@/components/lesson/CheatSheet";
import type { Cheatsheet } from "@/lib/content/schema";

export const metadata: Metadata = { title: "דפי סיכום" };

function mergeCheatsheets(sheets: Cheatsheet[]): Cheatsheet {
  const formulas: string[] = [];
  const rules: string[] = [];
  const checklist: string[] = [];

  for (const sheet of sheets) {
    for (const id of sheet.formulas) if (!formulas.includes(id)) formulas.push(id);
    for (const rule of sheet.rules) if (!rules.includes(rule)) rules.push(rule);
    for (const item of sheet.checklist) if (!checklist.includes(item)) checklist.push(item);
  }

  return { formulas, rules, checklist };
}

export default function CheatsheetsPage() {
  const chapters = getChapters();
  const formulas = getFormulas();

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">ספריית דפי הסיכום</h1>
      <p className="mt-2 text-muted">
        דף סיכום לכל פרק, עם כל הנוסחאות, כללי האצבע והצ&apos;קליסטים שנאספו משיעורי הפרק — ובנוסח
        מודפס ומצומצם ללחיצה אחת.
      </p>

      <div className="mt-8 space-y-6">
        {chapters.map((chapter, i) => {
          const merged = mergeCheatsheets([
            chapter.cheatsheet,
            ...chapter.lessons.map((lesson) => lesson.cheatsheet),
          ]);
          const isEmpty =
            merged.formulas.length === 0 && merged.rules.length === 0 && merged.checklist.length === 0;

          return (
            <div key={chapter.slug} className="rounded-xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-foreground">
                  {i + 1}. {chapter.title}
                </h2>
                <Link
                  href={`/chapters/${chapter.slug}/cheatsheet/`}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary"
                >
                  <FileText className="size-4" />
                  הדפסה
                </Link>
              </div>
              {isEmpty ? (
                <p className="mt-3 text-sm text-muted">אין עדיין תוכן סיכום לפרק זה.</p>
              ) : (
                <div className="mt-4">
                  <CheatSheet cheatsheet={merged} variant="inline" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <section className="mt-12">
        <h2 className="text-xl font-bold text-foreground">כל הנוסחאות</h2>
        <p className="mt-1 text-sm text-muted">כל נוסחה שנלמדת בקורס, במקום אחד.</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {formulas.map((formula) => (
            <div key={formula.id} className="rounded-xl border border-border bg-surface p-4">
              <h3 className="font-bold text-foreground">{formula.name_he}</h3>
              <p
                dir="ltr"
                className="mt-2 overflow-x-auto rounded bg-slate-50 px-3 py-2 text-start font-mono text-sm text-foreground"
              >
                {formula.expression}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted">
                {formula.variables.map((variable) => (
                  <li key={variable.symbol}>
                    <span dir="ltr" className="font-mono">
                      {variable.symbol}
                    </span>{" "}
                    — {variable.name_he}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted">{formula.notes_he}</p>
              {formula.relatedTool && (
                <Link
                  href={`/tools/${formula.relatedTool}/`}
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  לכלי המחשבון
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

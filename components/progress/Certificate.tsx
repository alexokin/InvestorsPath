"use client";

import { useState } from "react";
import { Award, Printer } from "lucide-react";
import { useProgress } from "@/components/progress/ProgressProvider";

const COURSE_TITLE = "מסלול המשקיע";

/** Toggles a body class so globals.css can print only the certificate (see integrator notes). */
function printCertificate() {
  const cls = "printing-certificate";
  document.body.classList.add(cls);
  const cleanup = () => {
    document.body.classList.remove(cls);
    window.removeEventListener("afterprint", cleanup);
  };
  window.addEventListener("afterprint", cleanup);
  window.print();
}

export function Certificate({ chapterTitles }: { chapterTitles: string[] }) {
  const { state, setCertificateName } = useProgress();
  const [draft, setDraft] = useState<string | null>(null);
  const name = (draft ?? state.certificateName ?? "").trim();

  const completionDate = new Date().toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <section aria-labelledby="certificate-heading">
      <div
        data-print-hide
        className="mb-4 flex flex-wrap items-end justify-between gap-3"
      >
        <div className="flex-1 basis-64">
          <label htmlFor="certificate-name" className="block text-sm font-medium text-foreground">
            השם שיופיע על התעודה
          </label>
          <input
            id="certificate-name"
            type="text"
            value={draft ?? state.certificateName ?? ""}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              if (draft !== null) setCertificateName(draft);
            }}
            placeholder="שם מלא"
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          />
        </div>
        <button
          type="button"
          onClick={printCertificate}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Printer className="size-4" />
          הדפסת התעודה
        </button>
      </div>

      <div className="certificate-print rounded-2xl border-4 border-double border-primary bg-surface p-8 text-center shadow-sm sm:p-12">
        <Award className="mx-auto size-12 text-primary" aria-hidden />
        <p className="mt-4 text-sm font-medium uppercase tracking-widest text-muted">תעודת סיום</p>
        <h2 id="certificate-heading" className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          {COURSE_TITLE}
        </h2>
        <p className="mt-6 text-muted">מוענקת בזאת ל־</p>
        <p className="mt-2 min-h-10 text-2xl font-bold text-primary sm:text-3xl">
          {name || "________________"}
        </p>
        <p className="mx-auto mt-6 max-w-prose text-sm leading-relaxed text-foreground">
          על השלמת כל {chapterTitles.length} פרקי הקורס בהצלחה, לרבות סיכומי השיעורים והבחנים,
          והנחת יסודות איתנים להשקעות ערך.
        </p>

        <ol className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-1 text-start text-sm text-muted sm:grid-cols-2">
          {chapterTitles.map((title, i) => (
            <li key={title} className="flex gap-2">
              <span className="w-5 shrink-0 tabular-nums text-primary">{i + 1}.</span>
              <span>{title}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted">
          <span>תאריך סיום: {completionDate}</span>
          <span>{COURSE_TITLE} · תעודה עצמית, ללא הכרה רשמית</span>
        </div>
      </div>
    </section>
  );
}

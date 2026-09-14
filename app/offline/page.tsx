import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "אין חיבור לאינטרנט",
};

export default function OfflinePage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <p className="text-sm font-semibold text-primary">לא מקוון</p>
      <h1 className="mt-2 text-2xl font-bold text-foreground">אין חיבור לאינטרנט</h1>
      <p className="mt-2 text-muted">
        הדף המבוקש לא נשמר במטמון המכשיר. הקישורים הבאים נשמרים מראש ולרוב יעבדו גם בלי
        חיבור:
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          עמוד הבית
        </Link>
        <Link
          href="/curriculum/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          תוכנית הלימודים
        </Link>
        <Link
          href="/progress/"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground"
        >
          ההתקדמות שלי
        </Link>
      </div>
    </div>
  );
}

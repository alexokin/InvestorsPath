import type { Metadata } from "next";
import { getChangelogEntries } from "@/lib/content/changelog";

export const metadata: Metadata = {
  title: "מה חדש",
  description: "עדכונים ותכונות חדשות באתר מסלול המשקיע.",
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
};

function formatHebrewDate(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return new Intl.DateTimeFormat("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function ChangelogPage() {
  const entries = getChangelogEntries();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">מה חדש</h1>
        <a
          href="/feed.xml"
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:border-primary hover:text-primary"
        >
          RSS
        </a>
      </div>
      <p className="mt-2 text-muted">עדכונים ותכונות חדשות באתר, מהחדש לישן.</p>

      <ol className="mt-8 space-y-8 border-e-2 border-border pe-6">
        {entries.map((entry) => (
          <li key={entry.date} id={entry.date} className="relative scroll-mt-24">
            <span className="absolute top-1.5 -end-[1.65rem] size-3 rounded-full border-2 border-background bg-primary" />
            <time dateTime={entry.date} className="text-sm font-medium text-primary">
              {formatHebrewDate(entry.date)}
            </time>
            <h2 className="mt-1 text-lg font-semibold text-foreground">{entry.title_he}</h2>
            <ul className="mt-2 list-disc space-y-1 ps-5 text-muted">
              {entry.items_he.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}

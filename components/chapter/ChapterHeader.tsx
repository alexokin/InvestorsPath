import { CheckCircle2 } from "lucide-react";
import type { Chapter } from "@/lib/content/schema";

export function ChapterHeader({ chapter }: { chapter: Chapter }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{chapter.title}</h1>
      <p className="mt-2 max-w-2xl text-muted">{chapter.description}</p>
      <div className="mt-5 rounded-xl border border-border bg-accent p-4">
        <p className="mb-2 text-sm font-semibold text-foreground">מטרות הפרק</p>
        <ul className="space-y-1.5 text-sm text-muted">
          {chapter.objectives.map((obj, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{obj}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

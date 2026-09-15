import type { ReactNode } from "react";

export function HomeHero({ children }: { children?: ReactNode }) {
  return (
    <section className="border-b border-border bg-gradient-to-b from-accent to-background">
      <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
        <h1 className="mx-auto max-w-2xl text-3xl font-bold text-foreground sm:text-5xl">
          מסלול המשקיע
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted">
          המדריך המלא להשקעות ערך, בעברית — מהיסודות ועד בניית תיק השקעות אמיתי, עם סיכומים,
          נוסחאות ומבחני הבנה בכל שיעור.
        </p>
        {children && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{children}</div>
        )}
      </div>
    </section>
  );
}

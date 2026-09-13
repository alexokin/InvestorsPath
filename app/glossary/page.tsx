import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { getGlossaryEntries, type GlossaryEntry } from "@/lib/content/glossary";

export const metadata: Metadata = { title: "מילון מונחים" };

const HEBREW_ALPHABET = [
  "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י", "כ", "ל",
  "מ", "נ", "ס", "ע", "פ", "צ", "ק", "ר", "ש", "ת",
];

// Hebrew final letter forms (סופיות) fold onto their base letter for grouping.
const FINAL_TO_BASE: Record<string, string> = {
  ך: "כ",
  ם: "מ",
  ן: "נ",
  ף: "פ",
  ץ: "צ",
};

function groupLetter(term: string): string {
  const first = term.trim().charAt(0);
  return FINAL_TO_BASE[first] ?? first;
}

function groupByLetter(entries: GlossaryEntry[]): Map<string, GlossaryEntry[]> {
  const groups = new Map<string, GlossaryEntry[]>();
  for (const entry of entries) {
    const letter = groupLetter(entry.term);
    const list = groups.get(letter) ?? [];
    list.push(entry);
    groups.set(letter, list);
  }
  return groups;
}

export default function GlossaryPage() {
  const entries = getGlossaryEntries();
  const groups = groupByLetter(entries);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">מילון מונחים</h1>
      <p className="mt-2 text-muted">כל המונחים שנלמדים לאורך הקורס, לפי סדר אלפביתי.</p>
      <LinkButton href="/flashcards/all/" variant="secondary" size="sm" className="mt-4">
        <Layers className="size-4" />
        תרגול כל המונחים בכרטיסיות
      </LinkButton>

      {entries.length === 0 ? (
        <p className="mt-8 text-muted">המילון יתמלא ככל שיתווספו פרקים ושיעורים נוספים.</p>
      ) : (
        <>
          <nav
            aria-label="דילוג לפי אות"
            className="sticky top-16 z-10 -mx-4 mt-8 flex flex-wrap gap-1 border-b border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
          >
            {HEBREW_ALPHABET.map((letter) => {
              const hasEntries = groups.has(letter);
              return hasEntries ? (
                <a
                  key={letter}
                  href={`#letter-${letter}`}
                  className="flex size-8 items-center justify-center rounded-md text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-primary"
                >
                  {letter}
                </a>
              ) : (
                <span
                  key={letter}
                  aria-hidden="true"
                  className="flex size-8 items-center justify-center rounded-md text-sm font-medium text-border"
                >
                  {letter}
                </span>
              );
            })}
          </nav>

          <div className="mt-6 space-y-10">
            {HEBREW_ALPHABET.filter((letter) => groups.has(letter)).map((letter) => (
              <section key={letter} id={`letter-${letter}`} className="scroll-mt-32">
                <h2 className="mb-3 text-lg font-bold text-primary">{letter}</h2>
                <dl className="space-y-4">
                  {groups.get(letter)!.map((entry) => (
                    <div
                      key={entry.slug}
                      id={entry.slug}
                      className="scroll-mt-32 rounded-lg border border-border bg-surface p-4"
                    >
                      <dt className="font-bold text-foreground">
                        {entry.term}{" "}
                        <span dir="ltr" className="text-sm font-normal text-muted">
                          {entry.en}
                        </span>
                      </dt>
                      <dd className="mt-1 text-sm text-muted">{entry.definition}</dd>
                      <dd className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                        {entry.lessons.map((lesson) => (
                          <Link
                            key={lesson.href}
                            href={lesson.href}
                            className="text-xs text-primary hover:underline"
                          >
                            מופיע בשיעור: {lesson.title}
                          </Link>
                        ))}
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

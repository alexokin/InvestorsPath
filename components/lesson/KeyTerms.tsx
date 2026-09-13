import Link from "next/link";
import type { Term } from "@/lib/content/schema";
import { slugifyTerm } from "@/lib/content/glossary";

export function KeyTerms({ terms }: { terms: Term[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {terms.map((term) => (
        <Link
          key={term.term}
          href={`/glossary/#${slugifyTerm(term.term)}`}
          className="rounded-lg border border-border bg-surface p-3 hover:border-primary"
        >
          <p className="font-medium text-foreground">
            {term.term}{" "}
            <span dir="ltr" className="text-xs font-normal text-muted">
              {term.en}
            </span>
          </p>
          <p className="mt-1 text-sm text-muted">{term.definition}</p>
        </Link>
      ))}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Layers } from "lucide-react";
import { ALL_DECK_SLUG, getChapterDecks, getDeck, type Deck } from "@/lib/flashcards/cards";
import { DeckMastery } from "@/components/flashcards/DeckMastery";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = {
  title: "כרטיסיות לימוד",
  description:
    "חזרה על מונחי המפתח של הקורס בעזרת כרטיסיות עם חזרה מרווחת — לפי פרק או על כל המילון.",
};

function DeckCard({ deck, index, highlight }: { deck: Deck; index?: number; highlight?: boolean }) {
  const count = deck.cards.length;
  return (
    <Link
      href={deck.href}
      className={[
        "group flex flex-col rounded-xl border p-5 shadow-sm transition-colors hover:border-primary",
        highlight ? "border-primary bg-accent" : "border-border bg-surface",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        {index !== undefined ? (
          <Badge tone="primary">פרק {index}</Badge>
        ) : (
          <Badge tone="primary">
            <Layers className="me-1 size-3" />
            חפיסה מלאה
          </Badge>
        )}
        <span className="text-xs text-muted">
          {count === 0 ? "אין מונחים" : `${count} מונחים`}
        </span>
      </div>
      <h2 className="mt-3 flex-1 font-bold text-foreground group-hover:text-primary">
        {deck.title}
      </h2>
      <div className="mt-4">
        <DeckMastery slugs={deck.cards.map((c) => c.slug)} />
      </div>
    </Link>
  );
}

export default function FlashcardsPage() {
  const chapterDecks = getChapterDecks();
  const allDeck = getDeck(ALL_DECK_SLUG)!;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">כרטיסיות לימוד</h1>
      <p className="mt-2 max-w-2xl text-muted">
        כל מונח מפתח בקורס הפך לכרטיסייה: בצד אחד המונח, בצד השני ההגדרה, השם באנגלית והשיעור
        שבו הוא מופיע. סמנו אם ידעתם — כרטיסים שאתם שולטים בהם יחזרו לעתים רחוקות יותר, וכרטיסים
        שפספסתם יחזרו בסבב הבא. ההתקדמות נשמרת בחשבון שלכם ומסתנכרנת בין המכשירים.
      </p>

      {chapterDecks.length === 0 ? (
        <p className="mt-8 text-muted">החפיסות ייווצרו אוטומטית ככל שיתווספו פרקים ושיעורים.</p>
      ) : (
        <>
          <div className="mt-8">
            <DeckCard deck={allDeck} highlight />
          </div>

          <h2 className="mt-10 text-lg font-bold text-foreground">לפי פרק</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapterDecks.map((deck, i) => (
              <DeckCard key={deck.id} deck={deck} index={i + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

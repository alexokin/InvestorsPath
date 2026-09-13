import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ALL_DECK_SLUG, getDeck, getDeckParams } from "@/lib/flashcards/cards";
import { getChapter } from "@/lib/content/loader";
import { FlashcardDeck } from "@/components/flashcards/FlashcardDeck";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { LinkButton } from "@/components/ui/Button";

export const dynamicParams = false;

// 12 chapter slugs + the reserved "all" deck.
export function generateStaticParams() {
  return getDeckParams();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter } = await params;
  const deck = getDeck(chapter);
  return {
    title: deck ? `כרטיסיות: ${deck.title}` : "חפיסה לא נמצאה",
    description: deck ? `${deck.cards.length} כרטיסיות לחזרה על מונחי ${deck.title}.` : undefined,
  };
}

export default async function FlashcardDeckPage({
  params,
}: {
  params: Promise<{ chapter: string }>;
}) {
  const { chapter: deckId } = await params;
  const deck = getDeck(deckId);
  if (!deck) notFound();

  const chapter = deckId === ALL_DECK_SLUG ? undefined : getChapter(deckId);
  const count = deck.cards.length;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Breadcrumbs items={[{ label: "כרטיסיות לימוד", href: "/flashcards/" }, { label: deck.title }]} />

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{deck.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {count === 0
              ? "אין עדיין מונחים בחפיסה זו"
              : `${count} מונחים · המונח מלפנים, ההגדרה מאחור`}
          </p>
        </div>
        {chapter && (
          <LinkButton href={chapter.href} variant="ghost" size="sm">
            לעמוד הפרק
          </LinkButton>
        )}
      </div>

      <div className="mt-6">
        {count === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
            <p className="font-medium text-foreground">אין עדיין מונחים בחפיסה הזו.</p>
            <p className="mt-1 text-sm text-muted">
              כרטיסיות נוצרות אוטומטית ממונחי המפתח של השיעורים — הן יופיעו כאן כשיתווספו.
            </p>
            <LinkButton href="/flashcards/" variant="secondary" size="sm" className="mt-4">
              חזרה לכל החפיסות
            </LinkButton>
          </div>
        ) : (
          <FlashcardDeck cards={deck.cards} deckId={deck.id} title={deck.title} />
        )}
      </div>
    </div>
  );
}

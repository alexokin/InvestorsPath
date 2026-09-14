import { ImageResponse } from "next/og";
import { getDeck, getDeckParams } from "@/lib/flashcards/cards";
import { OG_CONTENT_TYPE, OG_SIZE, loadHeeboFonts, ogImageOptions, renderOgCard } from "@/lib/seo/og";

export const alt = "תמונת שיתוף לחפיסת כרטיסיות";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Mirrors app/flashcards/[chapter]/page.tsx (12 chapter decks + "all").
export const dynamicParams = false;

export function generateStaticParams() {
  return getDeckParams();
}

export default async function Image({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: deckId } = await params;
  const deck = getDeck(deckId);
  const fonts = await loadHeeboFonts();

  return new ImageResponse(
    renderOgCard({
      eyebrow: "כרטיסיות לימוד",
      title: deck?.title ?? "חפיסת כרטיסיות",
      subtitle: deck ? `${deck.cards.length} מונחים לחזרה` : undefined,
    }),
    ogImageOptions(fonts)
  );
}

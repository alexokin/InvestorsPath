// force-static generates this OG image once at build time instead of per-request.
export const dynamic = "force-static";

import { ImageResponse } from "next/og";
import { OG_CONTENT_TYPE, OG_SIZE, loadHeeboFonts, ogImageOptions, renderOgCard } from "@/lib/seo/og";

export const alt = "מסלול המשקיע — המדריך המלא להשקעות ערך, בעברית";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const fonts = await loadHeeboFonts();

  return new ImageResponse(
    renderOgCard({
      title: "מסלול המשקיע",
      subtitle: "המדריך המלא להשקעות ערך, בעברית",
    }),
    ogImageOptions(fonts)
  );
}

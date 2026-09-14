import { ImageResponse } from "next/og";
import { TOOLS, getToolMeta } from "@/lib/finance/tools";
import { OG_CONTENT_TYPE, OG_SIZE, loadHeeboFonts, ogImageOptions, renderOgCard } from "@/lib/seo/og";

export const alt = "תמונת שיתוף לכלי";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

// Mirrors app/tools/[tool]/page.tsx. Iterates TOOLS (not hardcoded ids) so
// new tools appended to that array are picked up automatically.
export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ tool: tool.id }));
}

export default async function Image({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  const fonts = await loadHeeboFonts();

  return new ImageResponse(
    renderOgCard({
      eyebrow: "כלים ומחשבונים",
      title: meta?.name_he ?? "כלי",
      subtitle: meta?.tagline_he,
    }),
    ogImageOptions(fonts)
  );
}

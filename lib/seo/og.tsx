/**
 * Shared 1200x630 Open Graph card renderer used by every `opengraph-image.tsx`
 * route (root, lesson, chapter, tool, flashcards). Kept in `lib/seo` (not
 * colocated with a single route) because several route segments render the
 * same visual card with different text.
 *
 * `opengraph-image.tsx` files are statically optimized under
 * `output: "export"` — see the "Generate images using code" section of the
 * Next.js opengraph-image docs (node_modules/next/dist/docs/01-app/03-api-reference/
 * 03-file-conventions/01-metadata/opengraph-image.md): "By default, generated
 * images are statically optimized (generated at build time and cached)".
 * Dynamic segments need `generateStaticParams` + `dynamicParams = false`,
 * exactly like a page (see static-exports.md: "Dynamic Routes without
 * generateStaticParams()" is unsupported) — each route file sets that up
 * itself, mirroring its sibling `page.tsx`.
 */
import type { CSSProperties, ReactElement } from "react";
import { toVisualRtl, wrapRtlLines } from "@/lib/seo/bidi";

export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = "image/png" as const;

const BG = "#f8fafc";
const FG = "#0f172a";
const ACCENT = "#2563eb";
const MUTED = "#475569";
const SITE_NAME = "מסלול המשקיע";

export interface OgCardProps {
  /** Small label above the title (e.g. the chapter title, for a lesson card). */
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /** Left-aligned (in RTL: start-aligned) meta line next to the site name. */
  footer?: string;
}

// Wrap widths tuned per role for the font sizes below (62px title, 30px
// subtitle) at the card's 1200px width minus its 72px side padding.
const TITLE_MAX_CHARS_PER_LINE = 28;
const SUBTITLE_MAX_CHARS_PER_LINE = 55;
const SINGLE_LINE_MAX_CHARS = 46;

/** Truncates a single-line logical string with an ellipsis, then reorders it
 * for Satori. Used for the eyebrow/footer/site-name fields, which never
 * wrap. */
function toVisualSingleLine(text: string, maxChars = SINGLE_LINE_MAX_CHARS): string {
  const trimmed = text.trim();
  const clipped =
    trimmed.length > maxChars ? `${trimmed.slice(0, maxChars - 1).trimEnd()}…` : trimmed;
  return toVisualRtl(clipped);
}

/**
 * Renders one logical text field as a column of right-aligned lines: the
 * text is word-wrapped in logical order first, then each line is
 * individually reordered into Satori-drawable visual order. `direction:
 * "ltr"` on each line container stops Satori from re-mirroring the
 * already-reordered string; `justifyContent: "flex-end"` keeps every line
 * flush with the right edge (the card's RTL reading edge) regardless of its
 * length.
 */
function RtlTextBlock({
  text,
  maxCharsPerLine,
  style,
}: {
  text: string;
  maxCharsPerLine: number;
  style: CSSProperties;
}): ReactElement {
  const lines = wrapRtlLines(text, maxCharsPerLine);
  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
      {lines.map((line, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            width: "100%",
            direction: "ltr",
            justifyContent: "flex-end",
            ...style,
          }}
        >
          {toVisualRtl(line)}
        </div>
      ))}
    </div>
  );
}

/**
 * Renders the JSX for a 1200x630 Open Graph card. Pure and synchronous so it
 * can be reused by every route; callers wrap the result in `new
 * ImageResponse(...)`.
 */
export function renderOgCard({ eyebrow, title, subtitle, footer }: OgCardProps): ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        width: "100%",
        height: "100%",
        backgroundColor: BG,
        padding: "64px 72px",
        fontFamily: "Heebo, sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", width: "100%" }}>
        <div style={{ display: "flex", width: 96, height: 10, borderRadius: 6, backgroundColor: ACCENT }} />
        {eyebrow ? (
          <div
            style={{
              display: "flex",
              width: "100%",
              direction: "ltr",
              justifyContent: "flex-end",
              marginTop: 28,
              fontSize: 28,
              fontWeight: 700,
              color: ACCENT,
            }}
          >
            {toVisualSingleLine(eyebrow)}
          </div>
        ) : null}
        <div style={{ display: "flex", marginTop: 16, width: "100%" }}>
          <RtlTextBlock
            text={title}
            maxCharsPerLine={TITLE_MAX_CHARS_PER_LINE}
            style={{ fontSize: 62, fontWeight: 700, color: FG, lineHeight: 1.2 }}
          />
        </div>
        {subtitle ? (
          <div style={{ display: "flex", marginTop: 22, width: "100%" }}>
            <RtlTextBlock
              text={subtitle}
              maxCharsPerLine={SUBTITLE_MAX_CHARS_PER_LINE}
              style={{ fontSize: 30, fontWeight: 400, color: MUTED, lineHeight: 1.4 }}
            />
          </div>
        ) : null}
      </div>

      <div
        style={{
          display: "flex",
          width: "100%",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, color: MUTED }}>
          {footer ? toVisualSingleLine(footer) : ""}
        </div>
        <div style={{ display: "flex", fontSize: 26, fontWeight: 700, color: FG }}>
          {toVisualSingleLine(SITE_NAME)}
        </div>
      </div>
    </div>
  );
}

export type OgFont = { name: "Heebo"; data: ArrayBuffer; weight: 400 | 700; style: "normal" };

// Legacy desktop-browser UA predating WOFF2 support: Google's `css2` endpoint
// serves plain TTF (rather than WOFF2) to clients that report as too old to
// understand WOFF2, and `ImageResponse` (Satori/Resvg) only accepts
// ttf/otf/woff — see the ImageResponse docs' font limits ("Only ttf, otf, and
// woff font formats are supported").
const LEGACY_USER_AGENT =
  "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.34 (KHTML, like Gecko) Chrome/9.1.0.0 Safari/534.34";

async function fetchHeeboWeight(weight: 400 | 700): Promise<ArrayBuffer | null> {
  try {
    const cssRes = await fetch(
      `https://fonts.googleapis.com/css2?family=Heebo:wght@${weight}&subset=hebrew`,
      { headers: { "User-Agent": LEGACY_USER_AGENT } }
    );
    if (!cssRes.ok) return null;
    const css = await cssRes.text();
    const match = css.match(/src: url\(([^)]+)\) format\('truetype'\)/);
    const fontUrl = match?.[1];
    if (!fontUrl) return null;
    const fontRes = await fetch(fontUrl);
    if (!fontRes.ok) return null;
    return await fontRes.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * Loads Heebo (regular + bold) as TTF bytes for use as `ImageResponse`
 * `fonts`. Runs at request/build time inside each `opengraph-image.tsx`
 * route (per-route, since `ImageResponse` fonts aren't shared across route
 * modules) rather than at module scope, but every call is wrapped so a
 * network failure never crashes an offline build — see the ImageResponse
 * docs "Custom fonts" example, which loads font bytes for exactly this
 * purpose. On any failure this resolves to `[]` and the route falls back to
 * Satori's built-in default font.
 */
export async function loadHeeboFonts(): Promise<OgFont[]> {
  try {
    const [regular, bold] = await Promise.all([fetchHeeboWeight(400), fetchHeeboWeight(700)]);
    const fonts: OgFont[] = [];
    if (regular) fonts.push({ name: "Heebo", data: regular, weight: 400, style: "normal" });
    if (bold) fonts.push({ name: "Heebo", data: bold, weight: 700, style: "normal" });
    return fonts;
  } catch {
    return [];
  }
}

/** Builds the `ImageResponse` options object: size + contentType + (optional) fonts. */
export function ogImageOptions(fonts: OgFont[]) {
  return {
    ...OG_SIZE,
    ...(fonts.length > 0 ? { fonts } : {}),
  };
}

import { getChangelogEntries } from "@/lib/content/changelog";
import { SITE_URL } from "@/lib/site";

// Static export has no server to compute this per-request; force-static
// makes `next build` emit /feed.xml as a plain static file in out/ (route
// handlers are supported in `output: "export"` when marked force-static —
// see app/sitemap.ts for the same pattern applied to a metadata route).
export const dynamic = "force-static";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(dateIso: string): string {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).toUTCString();
}

export async function GET() {
  const entries = getChangelogEntries();
  const siteTitle = "מסלול המשקיע — מה חדש";
  const siteDescription = "עדכונים ותכונות חדשות באתר מסלול המשקיע.";
  const changelogUrl = `${SITE_URL}/changelog/`;

  const items = entries
    .map((entry) => {
      const link = `${changelogUrl}#${entry.date}`;
      const description = entry.items_he.map((item) => `<li>${escapeXml(item)}</li>`).join("");
      return `    <item>
      <title>${escapeXml(entry.title_he)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${toRfc822(entry.date)}</pubDate>
      <description><![CDATA[<ul>${description}</ul>]]></description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(siteTitle)}</title>
    <link>${changelogUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>he</language>
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}

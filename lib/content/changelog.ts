import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";
import { z } from "zod";

const changelogEntrySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
  title_he: z.string().min(1),
  items_he: z.array(z.string().min(1)).min(1),
});

export type ChangelogEntry = z.infer<typeof changelogEntrySchema>;

const CHANGELOG_PATH = path.join(process.cwd(), "content", "changelog.yaml");

let cache: ChangelogEntry[] | null = null;

function sortDesc(entries: ChangelogEntry[]): ChangelogEntry[] {
  return [...entries].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function getChangelogEntries(): ChangelogEntry[] {
  if (cache) return cache;
  const raw = fs.readFileSync(CHANGELOG_PATH, "utf8");
  const parsed = loadYaml(raw);
  const entries = z.array(changelogEntrySchema).parse(parsed);
  cache = sortDesc(entries);
  return cache;
}

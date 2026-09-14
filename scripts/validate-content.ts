import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  chapterFrontmatterSchema,
  lessonFrontmatterSchema,
} from "../lib/content/schema";
import { getFormulas } from "../lib/content/formulas";
import { TOOL_IDS } from "../lib/finance/tools";

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "content", "chapters");
const ONLINE = process.argv.includes("--online");

// Single source of truth for tool ids lives in lib/finance/tools.ts.
const KNOWN_TOOL_IDS = new Set<string>(TOOL_IDS);

// Static routes that exist regardless of content.
const STATIC_ROUTES = new Set([
  "/",
  "/curriculum/",
  "/glossary/",
  "/cheatsheets/",
  "/tools/",
  "/tools/checklist/",
  "/progress/",
  "/flashcards/",
  "/flashcards/all/",
  "/changelog/",
]);

const errors: string[] = [];
const warnings: string[] = [];

function fail(msg: string) {
  errors.push(msg);
}
function warn(msg: string) {
  warnings.push(msg);
}

function countHebrewWords(markdown: string): number {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  const withoutJsx = withoutCode.replace(/<[^>]+>/g, " ");
  const words = withoutJsx
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
  return words.length;
}

const HEBREW_CHAR_RE = /[֐-׿]/;
const LTR_TICKER_TAG_RE = /<(Ltr|Ticker)>([\s\S]*?)<\/\1>/g;

function findHebrewInLtrTags(markdown: string): string[] {
  const offenders: string[] = [];
  let m: RegExpExecArray | null;
  LTR_TICKER_TAG_RE.lastIndex = 0;
  while ((m = LTR_TICKER_TAG_RE.exec(markdown))) {
    if (HEBREW_CHAR_RE.test(m[2])) {
      offenders.push(m[0]);
    }
  }
  return offenders;
}

function extractMarkdownLinks(markdown: string): string[] {
  const links: string[] = [];
  const re = /\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown))) {
    links.push(m[1]);
  }
  return links;
}

const FORBIDDEN_CLASS_RE = /\b(?:ml|mr|pl|pr|left|right)-\[?[\w.\/%-]/g;

function scanForbiddenClasses(dir: string) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      scanForbiddenClasses(full);
    } else if (/\.(tsx|ts|jsx|js|mdx)$/.test(entry.name)) {
      const content = fs.readFileSync(full, "utf8");
      const matches = content.match(FORBIDDEN_CLASS_RE);
      if (matches) {
        for (const match of matches) {
          fail(
            `Forbidden non-logical Tailwind class "${match}" in ${path.relative(ROOT, full)}`
          );
        }
      }
    }
  }
}

async function checkYoutubeId(id: string): Promise<boolean> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SITE_URL) {
    warn(
      "NEXT_PUBLIC_SITE_URL is not set - sitemap/robots/Open Graph URLs will use the https://example.com placeholder (see .env.example)."
    );
  }

  if (!fs.existsSync(CONTENT_ROOT)) {
    fail(`Content root not found: ${CONTENT_ROOT}`);
    report();
    return;
  }

  const chapterDirs = fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();

  const chapterSlugs = new Set<string>();
  const chapterOrders: number[] = [];
  const allLessonKeys = new Set<string>(); // `${chapterSlug}/${lessonSlug}`
  const allRoutes = new Set<string>(STATIC_ROUTES);
  const formulaIds = new Set(getFormulas().map((f) => f.id));

  type LoadedLesson = {
    chapterSlug: string;
    slug: string;
    body: string;
    frontmatter: ReturnType<typeof lessonFrontmatterSchema.parse>;
  };
  const loadedLessons: LoadedLesson[] = [];

  for (const dirName of chapterDirs) {
    const prefixMatch = /^(\d+)-(.+)$/.exec(dirName);
    if (!prefixMatch) {
      fail(`Chapter directory "${dirName}" missing numeric NN- prefix`);
      continue;
    }
    const order = Number(prefixMatch[1]);
    const slug = prefixMatch[2];
    chapterOrders.push(order);

    if (chapterSlugs.has(slug)) fail(`Duplicate chapter slug: ${slug}`);
    chapterSlugs.add(slug);

    const chapterFile = path.join(CONTENT_ROOT, dirName, "_chapter.mdx");
    if (!fs.existsSync(chapterFile)) {
      fail(`Missing _chapter.mdx for ${dirName}`);
      continue;
    }
    const chapterRaw = fs.readFileSync(chapterFile, "utf8");
    const { data: chapterData } = matter(chapterRaw);
    const chapterParsed = chapterFrontmatterSchema.safeParse(chapterData);
    if (!chapterParsed.success) {
      fail(`Invalid chapter frontmatter in ${dirName}: ${chapterParsed.error.message}`);
      continue;
    }
    for (const formulaId of chapterParsed.data.cheatsheet.formulas) {
      if (!formulaIds.has(formulaId)) {
        fail(`Chapter ${slug} cheatsheet references unknown formula "${formulaId}"`);
      }
    }

    allRoutes.add(`/chapters/${slug}/`);
    allRoutes.add(`/chapters/${slug}/cheatsheet/`);

    const lessonFiles = fs
      .readdirSync(path.join(CONTENT_ROOT, dirName))
      .filter((f) => f.endsWith(".mdx") && f !== "_chapter.mdx")
      .sort();

    const lessonOrders: number[] = [];
    const lessonSlugsInChapter = new Set<string>();

    for (const fileName of lessonFiles) {
      const lessonPrefixMatch = /^(\d+)-(.+)\.mdx$/.exec(fileName);
      if (!lessonPrefixMatch) {
        fail(`Lesson file "${dirName}/${fileName}" missing numeric NN- prefix`);
        continue;
      }
      const lessonOrder = Number(lessonPrefixMatch[1]);
      const lessonSlug = lessonPrefixMatch[2];
      lessonOrders.push(lessonOrder);

      if (lessonSlugsInChapter.has(lessonSlug)) {
        fail(`Duplicate lesson slug "${lessonSlug}" in chapter ${slug}`);
      }
      lessonSlugsInChapter.add(lessonSlug);

      const lessonPath = path.join(CONTENT_ROOT, dirName, fileName);
      const raw = fs.readFileSync(lessonPath, "utf8");
      const { data, content } = matter(raw);
      const parsed = lessonFrontmatterSchema.safeParse(data);
      if (!parsed.success) {
        fail(`Invalid lesson frontmatter in ${dirName}/${fileName}: ${parsed.error.message}`);
        continue;
      }

      allRoutes.add(`/lessons/${slug}/${lessonSlug}/`);
      allLessonKeys.add(`${slug}/${lessonSlug}`);
      loadedLessons.push({ chapterSlug: slug, slug: lessonSlug, body: content, frontmatter: parsed.data });

      const wordCount = countHebrewWords(content);
      if (wordCount < 300 || wordCount > 1000) {
        fail(
          `Lesson ${dirName}/${fileName} body word count ${wordCount} outside 300-1000 range`
        );
      }

      for (const offender of findHebrewInLtrTags(content)) {
        fail(
          `Lesson ${dirName}/${fileName} contains Hebrew text inside ${offender} - <Ltr>/<Ticker> are for Latin/numeric content only`
        );
      }

      if (parsed.data.quiz.length < 3 || parsed.data.quiz.length > 5) {
        fail(`Lesson ${dirName}/${fileName} must have 3-5 quiz questions`);
      }

      for (const formulaId of parsed.data.cheatsheet.formulas) {
        if (!formulaIds.has(formulaId)) {
          fail(
            `Lesson ${dirName}/${fileName} cheatsheet references unknown formula "${formulaId}"`
          );
        }
      }
      for (const toolId of parsed.data.tools) {
        if (!KNOWN_TOOL_IDS.has(toolId)) {
          fail(`Lesson ${dirName}/${fileName} references unknown tool "${toolId}"`);
        }
      }

      for (const link of extractMarkdownLinks(content)) {
        if (link.startsWith("/")) {
          const normalized = link.split("#")[0];
          if (normalized && !allRoutes.has(normalized) && !normalized.startsWith("/lessons/")) {
            // Some routes (other chapters/lessons) may not be loaded yet in this pass;
            // deferred check happens after the full scan below.
          }
        }
      }
    }

    const sortedLessonOrders = [...lessonOrders].sort((a, b) => a - b);
    for (let i = 0; i < sortedLessonOrders.length; i++) {
      if (sortedLessonOrders[i] !== i + 1) {
        fail(
          `Chapter ${slug} lesson prefixes are not contiguous starting at 01 (got: ${sortedLessonOrders.join(", ")})`
        );
        break;
      }
    }
  }

  const sortedChapterOrders = [...chapterOrders].sort((a, b) => a - b);
  for (let i = 0; i < sortedChapterOrders.length; i++) {
    if (sortedChapterOrders[i] !== i + 1) {
      fail(
        `Chapter prefixes are not contiguous starting at 01 (got: ${sortedChapterOrders.join(", ")})`
      );
      break;
    }
  }

  // Second pass: resolve related/tools and internal markdown links now that all routes are known.
  for (const lesson of loadedLessons) {
    for (const relatedKey of lesson.frontmatter.related) {
      if (!allLessonKeys.has(relatedKey)) {
        fail(
          `Lesson ${lesson.chapterSlug}/${lesson.slug} related reference "${relatedKey}" does not resolve to a lesson`
        );
      }
    }
    for (const link of extractMarkdownLinks(lesson.body)) {
      if (!link.startsWith("/")) continue;
      const normalized = link.split("#")[0];
      if (normalized && !allRoutes.has(normalized)) {
        fail(
          `Lesson ${lesson.chapterSlug}/${lesson.slug} links to unresolved internal path "${link}"`
        );
      }
    }
  }

  scanForbiddenClasses(path.join(ROOT, "components"));
  scanForbiddenClasses(path.join(ROOT, "app"));

  if (ONLINE) {
    const allVideoIds = loadedLessons.flatMap((l) => l.frontmatter.videos.map((v) => v.youtubeId));
    for (const id of allVideoIds) {
      const ok = await checkYoutubeId(id);
      if (!ok) fail(`YouTube video "${id}" failed oEmbed check (removed or private?)`);
    }
  } else {
    warn("Skipped online YouTube oEmbed checks (pass --online to enable).");
  }

  report();
}

function report() {
  for (const w of warnings) console.warn(`[warn] ${w}`);
  if (errors.length > 0) {
    console.error(`\nContent validation failed with ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  } else {
    console.log("Content validation passed.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

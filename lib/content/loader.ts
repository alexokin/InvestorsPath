import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  chapterFrontmatterSchema,
  lessonFrontmatterSchema,
  type Chapter,
  type Lesson,
} from "./schema";

const CONTENT_ROOT = path.join(process.cwd(), "content", "chapters");
const PREFIX_RE = /^(\d+)-(.+)$/;

function splitPrefix(name: string): { order: number; slug: string } {
  const match = PREFIX_RE.exec(name);
  if (!match) {
    throw new Error(`Content entry "${name}" is missing a numeric "NN-" prefix`);
  }
  return { order: Number(match[1]), slug: match[2] };
}

function chapterDirs(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function lessonFiles(chapterDirName: string): string[] {
  const dir = path.join(CONTENT_ROOT, chapterDirName);
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && f !== "_chapter.mdx")
    .sort();
}

function loadChapterRaw(chapterDirName: string): Chapter {
  const { order, slug } = splitPrefix(chapterDirName);
  const filePath = path.join(CONTENT_ROOT, chapterDirName, "_chapter.mdx");
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = chapterFrontmatterSchema.parse(data);

  const lessons = lessonFiles(chapterDirName).map((file) =>
    loadLessonRaw(chapterDirName, slug, file)
  );

  return {
    ...frontmatter,
    slug,
    order,
    href: `/chapters/${slug}/`,
    body: content,
    lessons,
  };
}

function loadLessonRaw(chapterDirName: string, chapterSlug: string, fileName: string): Lesson {
  const { order, slug: rawSlug } = splitPrefix(fileName.replace(/\.mdx$/, ""));
  const slug = rawSlug;
  const filePath = path.join(CONTENT_ROOT, chapterDirName, fileName);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const frontmatter = lessonFrontmatterSchema.parse(data);

  return {
    ...frontmatter,
    slug,
    chapterSlug,
    order,
    href: `/lessons/${chapterSlug}/${slug}/`,
    body: content,
  };
}

let cache: Chapter[] | null = null;

export function getChapters(): Chapter[] {
  if (cache) return cache;
  cache = chapterDirs()
    .map(loadChapterRaw)
    .sort((a, b) => a.order - b.order);
  return cache;
}

export function getChapter(slug: string): Chapter | undefined {
  return getChapters().find((c) => c.slug === slug);
}

export function getLesson(chapterSlug: string, lessonSlug: string): Lesson | undefined {
  return getChapter(chapterSlug)?.lessons.find((l) => l.slug === lessonSlug);
}

export function getAllLessons(): Lesson[] {
  return getChapters().flatMap((c) => c.lessons);
}

export function getAdjacentLessons(
  chapterSlug: string,
  lessonSlug: string
): { prev: Lesson | null; next: Lesson | null } {
  const all = getAllLessons();
  const idx = all.findIndex((l) => l.chapterSlug === chapterSlug && l.slug === lessonSlug);
  if (idx === -1) return { prev: null, next: null };
  return {
    prev: idx > 0 ? all[idx - 1] : null,
    next: idx < all.length - 1 ? all[idx + 1] : null,
  };
}

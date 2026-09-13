import { getAllLessons } from "./loader";

/**
 * Lessons that reference a calculator tool via their `tools:` frontmatter,
 * in curriculum order. Server/Node only (reads the content filesystem).
 */
export function getToolRelatedLessons(toolId: string): { label: string; href: string }[] {
  return getAllLessons()
    .filter((lesson) => lesson.tools.includes(toolId))
    .map((lesson) => ({ label: lesson.title, href: lesson.href }));
}

export const PROTECTED_PREFIXES = [
  "/dashboard/",
  "/chapters/",
  "/lessons/",
  "/flashcards/",
  "/progress/",
  "/tools/",
  "/cheatsheets/",
  "/glossary/",
  "/curriculum/",
] as const;

function withTrailingSlash(pathname: string): string {
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function isProtectedPath(pathname: string): boolean {
  if (pathname.includes("/opengraph-image")) return false;
  const normalised = withTrailingSlash(pathname);
  return PROTECTED_PREFIXES.some((prefix) => normalised.startsWith(prefix));
}

export function isPublicAuthEntry(pathname: string): boolean {
  const normalised = withTrailingSlash(pathname);
  return normalised === "/" || normalised === "/login/";
}

export function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/dashboard/";
  if (!raw.startsWith("/")) return "/dashboard/";
  if (raw.startsWith("//")) return "/dashboard/";
  const firstSlashIndex = raw.indexOf("/", 1);
  const firstSegment = firstSlashIndex === -1 ? raw : raw.slice(0, firstSlashIndex);
  if (firstSegment.includes("\\") || firstSegment.includes(":")) return "/dashboard/";
  return raw;
}

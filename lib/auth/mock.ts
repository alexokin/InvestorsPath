import type { AuthUser } from "./types";

type MockUserRecord = {
  id: string;
  email?: string | null;
  name?: string | null;
};

export const MOCK_USERS: Record<"google", MockUserRecord> = {
  google: {
    id: "mock-google-user",
    email: "demo@example.com",
    name: "משתמש הדגמה",
  },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "user";
}

export function mockUserForEmail(email: string): MockUserRecord {
  return {
    id: `mock-${slugify(email)}`,
    email,
    name: null,
  };
}

export function parseMockUser(raw: string | undefined | null): AuthUser | null {
  if (!raw) return null;
  try {
    const decoded = decodeURIComponent(raw);
    const parsed: unknown = JSON.parse(decoded);
    if (typeof parsed !== "object" || parsed === null) return null;
    const record = parsed as Record<string, unknown>;
    if (typeof record.id !== "string" || record.id.length === 0) return null;
    const email = typeof record.email === "string" ? record.email : null;
    const name = typeof record.name === "string" ? record.name : null;
    return { id: record.id, email, name, avatarUrl: null };
  } catch {
    return null;
  }
}

/**
 * Returns the plain (not URI-encoded) JSON. `cookieStore.set()` (the
 * `cookie` package under `next/headers`) URI-encodes the value itself when
 * serializing the `Set-Cookie` header, so pre-encoding here would produce a
 * double-encoded cookie that `parseMockUser`'s single `decodeURIComponent`
 * can't parse back.
 */
export function serializeMockUser(user: MockUserRecord): string {
  return JSON.stringify({ id: user.id, email: user.email ?? null, name: user.name ?? null });
}

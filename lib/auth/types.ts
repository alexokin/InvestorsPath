export type AuthUser = {
  id: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
};

export type AuthStatus = "loading" | "signed-out" | "signed-in";

export type EmailSignInResult =
  | { kind: "email-sent" }
  | { kind: "signed-in" }
  | { kind: "error"; message: string };

type SupabaseLikeUser = {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
};

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function toAuthUser(user: SupabaseLikeUser | null | undefined): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata ?? {};
  const name = stringOrNull(metadata.full_name) ?? stringOrNull(metadata.name);
  const avatarUrl = stringOrNull(metadata.avatar_url) ?? stringOrNull(metadata.picture);
  return {
    id: user.id,
    email: user.email ?? null,
    name,
    avatarUrl,
  };
}

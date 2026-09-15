import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_ANON_KEY, SUPABASE_URL, MOCK_COOKIE } from "./mode";
import { parseMockUser } from "./mock";
import { safeNext } from "./protected-paths";
import type { AuthUser, EmailSignInResult } from "./types";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

/** Lazy singleton browser Supabase client (cookie-backed session). */
export function getBrowserSupabase() {
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return browserClient;
}

const GENERIC_ERROR = "אירעה שגיאה. נסו שוב.";
const RATE_LIMIT_ERROR = "נשלחו יותר מדי בקשות, נסו שוב בעוד כמה דקות";
const CODE_ERROR = "הקוד שגוי או פג תוקפו";

export async function signInWithGoogle(next: string): Promise<void> {
  const redirectTo = `${window.location.origin}/auth/callback/?next=${encodeURIComponent(
    safeNext(next),
  )}`;

  await getBrowserSupabase().auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: { prompt: "select_account" },
    },
  });
}

export async function signInWithEmail(email: string): Promise<EmailSignInResult> {
  const { error } = await getBrowserSupabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });

  if (error) {
    if (error.status === 429) {
      return { kind: "error", message: RATE_LIMIT_ERROR };
    }
    return { kind: "error", message: GENERIC_ERROR };
  }

  return { kind: "email-sent" };
}

export async function verifyEmailCode(
  email: string,
  code: string,
): Promise<EmailSignInResult> {
  const { error } = await getBrowserSupabase().auth.verifyOtp({
    email,
    token: code,
    type: "email",
  });

  if (error) {
    return { kind: "error", message: CODE_ERROR };
  }

  return { kind: "signed-in" };
}

export function readMockUserFromDocument(): AuthUser | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${MOCK_COOKIE}=`));
  if (!match) return null;
  const value = match.slice(MOCK_COOKIE.length + 1);
  return parseMockUser(value);
}

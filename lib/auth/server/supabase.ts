import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { cookies } from "next/headers";

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../mode";

type CookieStore = Awaited<ReturnType<typeof cookies>>;

/**
 * Supabase client for Server Components, Server Functions and Route
 * Handlers, backed by `next/headers` `cookies()`.
 *
 * `setAll` is wrapped in try/catch: it throws when called from a Server
 * Component (cookies can't be written during rendering there), which is
 * fine as long as a proxy/route handler refreshes the session elsewhere.
 */
export function createServerSupabase(cookieStore: CookieStore) {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component; a proxy or Server Function
          // elsewhere is responsible for refreshing the session cookies.
        }
      },
    },
  });
}

/**
 * Supabase client for the proxy (`proxy.ts`). `setAll` mirrors the refreshed
 * cookies onto both the request (so downstream rendering sees them) and a
 * freshly-built response, per the standard `@supabase/ssr` proxy pattern.
 */
export function createProxySupabase(request: NextRequest): {
  supabase: ReturnType<typeof createServerClient>;
  getResponse: () => NextResponse;
} {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  return {
    supabase,
    getResponse: () => response,
  };
}

/** Carries refreshed auth cookies from a proxy response onto a redirect. */
export function copyCookies(from: NextResponse, to: NextResponse): NextResponse {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie);
  });
  return to;
}

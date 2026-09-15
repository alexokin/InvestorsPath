import { NextResponse, type NextRequest } from "next/server";

import { toAuthUser, type AuthUser } from "../types";
import { AUTH_MODE, MOCK_COOKIE } from "../mode";
import { parseMockUser } from "../mock";
import { createProxySupabase } from "./supabase";

/**
 * Resolves the signed-in user (if any) for an incoming proxy request.
 * Never throws: any failure (network, malformed cookie, missing method on
 * the installed supabase-js version) resolves to `user: null` so the caller
 * can fall back to the signed-out path.
 */
export async function getRequestUser(
  request: NextRequest,
): Promise<{ user: AuthUser | null; response: NextResponse }> {
  if (AUTH_MODE === "mock") {
    const user = parseMockUser(request.cookies.get(MOCK_COOKIE)?.value);
    return { user, response: NextResponse.next() };
  }

  const { supabase, getResponse } = createProxySupabase(request);

  try {
    if (typeof supabase.auth.getClaims === "function") {
      const { data, error } = await supabase.auth.getClaims();
      if (error || !data?.claims) {
        return { user: null, response: getResponse() };
      }
      const claims = data.claims as {
        sub: string;
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      };
      const user = toAuthUser({
        id: claims.sub,
        email: claims.email ?? null,
        user_metadata: claims.user_metadata,
      });
      return { user, response: getResponse() };
    }

    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return { user: null, response: getResponse() };
    }
    return { user: toAuthUser(data.user), response: getResponse() };
  } catch {
    return { user: null, response: getResponse() };
  }
}

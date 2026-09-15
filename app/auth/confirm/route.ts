import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";

import { AUTH_MODE, NEXT_COOKIE } from "@/lib/auth/mode";
import { safeNext } from "@/lib/auth/protected-paths";
import { createServerSupabase } from "@/lib/auth/server/supabase";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") ?? "email") as EmailOtpType;

  if (AUTH_MODE === "mock") {
    return NextResponse.redirect(new URL("/login/", request.url));
  }

  const cookieStore = await cookies();

  if (tokenHash) {
    const supabase = createServerSupabase(cookieStore);
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const next = safeNext(cookieStore.get(NEXT_COOKIE)?.value ?? null);
      const response = NextResponse.redirect(new URL(next, request.url));
      response.cookies.delete(NEXT_COOKIE);
      return response;
    }
  }

  return NextResponse.redirect(new URL("/login/?error=link", request.url));
}

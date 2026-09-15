import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

import { AUTH_MODE } from "@/lib/auth/mode";
import { safeNext } from "@/lib/auth/protected-paths";
import { createServerSupabase } from "@/lib/auth/server/supabase";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (AUTH_MODE === "mock") {
    return NextResponse.redirect(new URL("/login/", request.url));
  }

  if (code) {
    const supabase = createServerSupabase(await cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  return NextResponse.redirect(new URL("/login/?error=oauth", request.url));
}

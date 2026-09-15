import { NextResponse, type NextRequest } from "next/server";

import { isProtectedPath, isPublicAuthEntry } from "@/lib/auth/protected-paths";
import { getRequestUser } from "@/lib/auth/server/session";
import { copyCookies } from "@/lib/auth/server/supabase";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { user, response } = await getRequestUser(request);
  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login/";
    url.search = "";
    url.searchParams.set("next", pathname + request.nextUrl.search);
    return copyCookies(response, NextResponse.redirect(url));
  }

  if (user && isPublicAuthEntry(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/";
    url.search = "";
    return copyCookies(response, NextResponse.redirect(url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|robots.txt|sitemap.xml|feed.xml|search-index.json|.*opengraph-image.*|.*\\..*).*)",
  ],
};

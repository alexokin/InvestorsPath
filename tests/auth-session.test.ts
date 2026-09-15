import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { MOCK_USERS, serializeMockUser } from "@/lib/auth/mock";

async function importGetRequestUser() {
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  vi.resetModules();
  const mod = await import("@/lib/auth/server/session");
  return mod.getRequestUser;
}

describe("getRequestUser (mock mode)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("resolves the mock user from the cookie", async () => {
    const getRequestUser = await importGetRequestUser();
    // Mirrors what a browser actually sends: the cookie serializer
    // URI-encodes the value once when it's set (see lib/auth/mock.ts), so a
    // raw `Cookie` header carries the already-percent-encoded form.
    const cookieValue = encodeURIComponent(serializeMockUser(MOCK_USERS.google));
    const request = new NextRequest("http://localhost/dashboard/", {
      headers: { cookie: `vip-mock-user=${cookieValue}` },
    });

    const { user } = await getRequestUser(request);

    expect(user).toEqual({
      id: MOCK_USERS.google.id,
      email: MOCK_USERS.google.email,
      name: MOCK_USERS.google.name,
      avatarUrl: null,
    });
  });

  it("resolves null when no cookie is present", async () => {
    const getRequestUser = await importGetRequestUser();
    const request = new NextRequest("http://localhost/dashboard/");

    const { user } = await getRequestUser(request);

    expect(user).toBeNull();
  });
});

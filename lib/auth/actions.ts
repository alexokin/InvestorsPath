"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_MODE, MOCK_COOKIE, NEXT_COOKIE } from "./mode";
import { MOCK_USERS, mockUserForEmail, serializeMockUser } from "./mock";
import { safeNext } from "./protected-paths";
import { createServerSupabase } from "./server/supabase";

export async function signOutAction(): Promise<void> {
  const cookieStore = await cookies();

  if (AUTH_MODE === "mock") {
    cookieStore.delete(MOCK_COOKIE);
  } else {
    await createServerSupabase(cookieStore).auth.signOut({ scope: "local" });
  }

  redirect("/");
}

export async function mockSignInAction(formData: FormData): Promise<void> {
  if (AUTH_MODE !== "mock") {
    throw new Error("mockSignInAction is only available in mock auth mode");
  }

  const kind = formData.get("kind");
  const email = formData.get("email");
  const next = formData.get("next");

  const user =
    kind === "google"
      ? MOCK_USERS.google
      : mockUserForEmail(typeof email === "string" ? email : "demo@example.com");

  const cookieStore = await cookies();
  cookieStore.set(MOCK_COOKIE, serializeMockUser(user), {
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(safeNext(typeof next === "string" ? next : null));
}

export async function rememberNextAction(next: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(NEXT_COOKIE, safeNext(next), {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
    maxAge: 900,
  });
}

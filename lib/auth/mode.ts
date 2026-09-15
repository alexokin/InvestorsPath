// Auth mode is decided at build/runtime from the public Supabase env vars.
// Read as literal `process.env.X` accesses (not through a wrapper) so
// Next.js can inline them for both server and client bundles.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const AUTH_MODE: "supabase" | "mock" =
  SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "" ? "supabase" : "mock";

// Holds a JSON-encoded mock user in mock mode (readable by client code, so
// not httpOnly).
export const MOCK_COOKIE = "vip-mock-user";

// Holds the `next` path to return to after an email magic-link/OTP round
// trip, set right before the email is sent.
export const NEXT_COOKIE = "vip-auth-next";

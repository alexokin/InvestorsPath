// Fails a production build when the Supabase public config is missing.
// Locally and in CI (VERCEL_ENV unset) the app falls back to mock auth, so
// nothing is required there.
const required = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"];
const isProduction = process.env.VERCEL_ENV === "production";
const missing = required.filter((name) => !process.env[name]?.trim());

if (isProduction && missing.length > 0) {
  console.error(`[check-env] production build is missing: ${missing.join(", ")}`);
  console.error("[check-env] set them in Vercel -> Project -> Settings -> Environment Variables");
  process.exit(1);
}

if (missing.length > 0) {
  console.log(`[check-env] ${missing.join(", ")} not set -> mock auth mode`);
} else {
  console.log("[check-env] Supabase auth configured");
}

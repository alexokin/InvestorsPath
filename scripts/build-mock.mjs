// Builds the app in mock auth mode regardless of what .env.local contains.
// The Playwright suite signs in with a mock cookie, so a build compiled with
// real Supabase keys (inlined at build time) makes every signed-in spec fail
// by redirecting to accounts.google.com. Next only reads .env files for keys
// that are undefined in process.env, so setting them to "" here wins.
import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "", NEXT_PUBLIC_SUPABASE_ANON_KEY: "" },
});
process.exit(result.status ?? 1);

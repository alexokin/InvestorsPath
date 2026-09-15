// Fails fast, with one clear message, when the server under test was built
// with real Supabase keys (e.g. from .env.local). Every signed-in spec relies
// on mock auth mode; without this check they fail one by one on Google's
// sign-in page. Build with `npm run build:e2e` to force mock mode.
export default async function globalSetup(): Promise<void> {
  const res = await fetch("http://localhost:4173/login/");
  const html = await res.text();
  if (!html.includes('name="kind"')) {
    throw new Error(
      "The app on :4173 is not in mock auth mode (no mock sign-in form on /login/). " +
        "Rebuild with `npm run build:e2e` (forces empty NEXT_PUBLIC_SUPABASE_* vars) and rerun."
    );
  }
}

# מסלול המשקיע

Hebrew, RTL Next.js learning platform for value investing.

## Development

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_SITE_URL to the production domain
npm run dev
```

## Features

- 12 chapters / 69 lessons (`content/chapters/`), each with videos, key terms, cheat sheet, quiz, related lessons and tools.
- Calculators under `/tools/` (also embedded inside the relevant lessons via MDX).
- Search (Ctrl/Cmd+K), glossary with in-lesson term tooltips, printable cheat sheets.
- Flashcards (`/flashcards/`, `/flashcards/<chapter>/`, `/flashcards/all/`) with a Leitner scheduler.
- Progress dashboard (`/progress/`): completion, quiz scores, bookmarks, notes, JSON export/import, completion certificate.
- Light / dark / system theme.
- Nine calculators: compound interest, DCF, reverse DCF, Graham, multiples, margin of safety, bond price/YTM/duration, CAGR + Rule of 72, DDM. Calculator state on `/tools/*` is mirrored to the URL, so results can be shared by link.
- Company analysis worksheet (`/tools/checklist/`), saved per company, printable, JSON export.
- SEO: Open Graph images generated at build time, JSON-LD (Course / LearningResource / FAQ / Breadcrumb), `sitemap.xml`, `robots.txt`, `feed.xml` (RSS of `/changelog/`).
- PWA: web manifest + hand-written service worker (`public/sw.js`, bump `CACHE_VERSION` when changing caching) with an `/offline/` fallback.
- Optional cookie-less analytics: set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, or `NEXT_PUBLIC_UMAMI_WEBSITE_ID` + `NEXT_PUBLIC_UMAMI_SRC` (see `.env.example`).

Learner state is stored per account and synced across devices (see "Auth & sync" below); theme and
currency stay device-local. `localStorage` keys: `vip:progress:v2` (progress, bookmarks, notes; `v1`
is migrated automatically), `vip:flashcards:v1`, `vip:worksheets:v1`, `vip:theme:v1`, `vip:currency:v1`.

## Auth & sync

Sign-in is required for the course itself; `/` is a public landing page and everything under
`/dashboard/`, `/chapters/`, `/lessons/`, `/flashcards/`, `/progress/`, `/tools/`, `/cheatsheets/`,
`/glossary/` and `/curriculum/` is gated (see `PROTECTED_PREFIXES` in `lib/auth/protected-paths.ts`).

- **Auth provider**: Supabase Auth, with Google OAuth and passwordless email magic links (no
  passwords). Sessions are cookie-based via `@supabase/ssr`, so the server and the browser share
  one session.
- **`proxy.ts`** (repo root, Next's server-side gate in front of every request): reads the session
  from cookies, redirects signed-out visitors hitting a protected path to `/login/?next=<path>`,
  and redirects signed-in visitors away from `/` or `/login/` to `/dashboard/`.
- **Routes**: `/login/` (Google button + email form), `/dashboard/` (the signed-in home — chapter
  grid, resume card, progress), `/auth/callback/` (OAuth PKCE code exchange), `/auth/confirm/`
  (magic-link `token_hash` verification — this indirection, rather than the PKCE flow, is what lets
  a link requested on desktop be opened on a phone).
- **Data**: a single Postgres table, `learner_state(user_id, key, data jsonb, updated_at)` with one
  row per user per store (`progress` / `flashcards` / `worksheets`), row-level security restricting
  every row to its owner. See `supabase/migrations/0001_learner_state.sql`.
- **Sync engine** (`lib/sync/`): `localStorage` remains the working cache the app reads/writes
  instantly. On sign-in the engine pulls the three rows and overwrites local state (or, if there's
  no remote data yet and no "owner" marker, uploads whatever is already in local storage once,
  covering the first sign-in after using the app anonymously). Local writes go through a storage
  event bus and are pushed to Supabase on a ~1.5s debounce, flushed immediately on tab hide/close.
  An owner marker (`vip:sync:owner:v1`) stops one account's leftover local data from being uploaded
  as another account's on a shared browser. Signing out flushes pending writes, clears the local
  stores, and redirects home.
- **Mock auth mode**: when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are empty at
  build time, the app builds against an in-memory mock instead of Supabase — this is what local dev,
  CI and the Playwright suite run under, with no secrets required. The login buttons set a
  `vip-mock-user` cookie directly; `proxy.ts` and `AuthProvider` trust that cookie the same way they'd
  trust a Supabase session. In e2e specs, `signIn(page)` from `e2e/helpers.ts` sets that cookie
  before the first `page.goto`.
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`;
  both public, RLS protects the data — leave empty for mock auth). `scripts/check-env.mjs` (run via
  `vercel.json`'s `buildCommand`) fails a **production** Vercel build if either is missing; it's a
  no-op locally and in CI, where the app just falls back to mock mode.

<details>
<summary>Manual Supabase/Vercel setup (one-time, not needed for local dev/CI)</summary>

1. Create a Supabase project (region close to Vercel, e.g. `eu-central-1`). Copy the Project URL +
   anon key. Run `supabase/migrations/0001_learner_state.sql` in the SQL editor.
2. Authentication → URL Configuration: Site URL = the production URL; add redirect URLs for local
   dev, the production domain and Vercel preview deployments, all ending in `/auth/callback/`.
3. Google Cloud Console: OAuth consent screen (External) → Web OAuth client with redirect URI
   `https://<project-ref>.supabase.co/auth/v1/callback` → paste the Client ID/Secret into Supabase
   → Authentication → Providers → Google.
4. Authentication → Providers → Email: enabled. Email Templates (Magic Link and Confirm signup):
   Hebrew, `<div dir="rtl">`, and the link **must** point at
   `{{ .SiteURL }}/auth/confirm/?token_hash={{ .TokenHash }}&type=email` (not the default template,
   which uses the PKCE `{{ .ConfirmationURL }}`) and should include `{{ .Token }}` for the six-digit
   code fallback.
5. Configure custom SMTP (e.g. Resend/Brevo/Postmark) — Supabase's built-in sender is rate-limited
   and English-branded.
6. Vercel: import the repo, framework Next.js, defaults. Set `NEXT_PUBLIC_SITE_URL`,
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` for both Production and Preview, then
   deploy. `vercel.json` pins the build region and runs `check:env` before `next build`.
7. If the site previously lived on GitHub Pages, retire it: GitHub repo → Settings → Pages →
   Source → "None".
8. For real-auth testing locally, put the two Supabase vars in `.env.local`; leave them empty to
   stay in mock mode.

</details>

## Verification

```bash
npm run validate:content   # content schema + link + word-count checks (also runs before build)
npm run typecheck
npm run lint
npm test
npm run build                # outputs .next/
```

## End-to-end tests

```bash
npm run build:e2e                              # production build forced into mock auth mode (ignores Supabase keys in .env.local)
npx playwright install --with-deps chromium    # one-time
npm run e2e                                    # headless smoke suite (desktop + mobile viewport)
npm run e2e:ui                                 # interactive mode
PW_CHANNEL=chrome npm run e2e                  # use the installed Chrome/Edge ("msedge") instead of downloading Chromium
```

`playwright.config.ts`'s `webServer` runs `npm run start -- -p 4173` automatically, so `npm run e2e` normally
doesn't need a server started by hand.

The suite builds and runs in mock auth mode (no Supabase secrets in CI or a local checkout by
default); most specs start with `signIn(page)` from `e2e/helpers.ts` to set the mock session
cookie before navigating to a protected path. `e2e/helpers.ts` also exports `BASE_PATH` (always
`""`), `p()` and `rx()`, kept only so specs can build URLs/selectors without every spec needing an
edit.

## Deploy

Vercel (GitHub integration): import the repo, framework Next.js, defaults. `vercel.json` sets the
build region and runs `check:env` before `next build` so a production deploy fails fast if the
Supabase env vars are missing. Env vars for Production + Preview: `NEXT_PUBLIC_SITE_URL` (production
domain), `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — see "Auth & sync" above for
the one-time Supabase/Google setup.

A server proxy (`proxy.ts`) gates the course, so the app is served by Vercel rather than as a
static export on GitHub Pages.

## CI

`.github/workflows/ci.yml` runs validate / typecheck / lint / unit tests / build / e2e and a Lighthouse CI pass
(`lighthouserc.json`; accessibility, best-practices and SEO regressions fail, performance warns), against a
production `next start` server on port 4173.

## Adding a new chapter or lesson

1. Create `content/chapters/NN-slug/` (two-digit prefix, contiguous, unique).
2. Add `_chapter.mdx` with frontmatter matching `chapterFrontmatterSchema` in `lib/content/schema.ts`.
3. Add one `NN-lesson-slug.mdx` per lesson, frontmatter matching `lessonFrontmatterSchema`.
4. Reference formula ids from `content/formulas.yaml` in `cheatsheet.formulas`.
5. Run `npm run validate:content` — it enforces frontmatter shape, contiguous numbering, unique
   slugs, resolvable `related`/`tools`/formula references, resolvable internal links, word counts
   (300-1000 Hebrew words), and 3-5 quiz questions. Videos are optional (`videos: []` is valid when
   no matching video exists). Pass `--online` to additionally verify every `youtubeId` against the
   YouTube oEmbed endpoint.

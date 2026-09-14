# מסלול המשקיע

Hebrew, RTL, statically-exported Next.js learning platform for value investing.

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

All learner state lives in `localStorage`: `vip:progress:v2` (progress, bookmarks, notes; `v1` is migrated automatically),
`vip:flashcards:v1`, `vip:worksheets:v1`, `vip:theme:v1`, `vip:currency:v1`.

## Verification

```bash
npm run validate:content   # content schema + link + word-count checks (also runs before build)
npm run typecheck
npm run lint
npm test
npm run build               # outputs static site to ./out
```

## End-to-end tests

```bash
npm run build                                  # e2e runs against the static export in ./out
npx playwright install --with-deps chromium    # one-time
npm run e2e                                    # headless smoke suite (desktop + mobile viewport)
npm run e2e:ui                                 # interactive mode
PW_CHANNEL=chrome npm run e2e                  # use the installed Chrome/Edge ("msedge") instead of downloading Chromium
```

`npm run build` runs `scripts/fix-segment-prefetch.mjs` afterwards. It works around a Next.js static-export bug on
Windows where the client router's segment prefetch files are written into nested folders and 404 at runtime; on
Linux/macOS it is a no-op.

`npm run serve:out` (`scripts/serve-out.mjs`) serves `./out` on port 4173 (`PORT` to override); it mounts the export
at `NEXT_PUBLIC_BASE_PATH` (empty by default), matching whatever base path the build in `./out` was made with. This
is what `playwright test`'s `webServer` runs automatically, so `npm run e2e` normally doesn't need it directly.

To test the exact configuration that deploys to GitHub Pages (built and served under `/InvestorsPath`, matching
`deploy-pages.yml`), build and run e2e with the same base path:

```bash
NEXT_PUBLIC_BASE_PATH=/InvestorsPath npm run build
NEXT_PUBLIC_BASE_PATH=/InvestorsPath npm run e2e
```

`e2e/helpers.ts` exports `BASE_PATH`, `p()` and `rx()`, which every spec uses to build URLs/selectors relative to
whatever base path the current run is testing.

## CI and deploy

`.github/workflows/ci.yml` runs validate / typecheck / lint / unit tests / build / e2e and a Lighthouse CI pass
(`lighthouserc.json`; accessibility, best-practices and SEO regressions fail, performance warns). The build, e2e and
Lighthouse steps all set `NEXT_PUBLIC_BASE_PATH` from the `BASE_PATH` repo variable, so CI tests the same prefixed
build that `deploy-pages.yml` ships; Lighthouse runs against `npm run serve:out` (rather than `staticDistDir`, which
can't mount a base path) so its URLs can include the prefix.
`.github/workflows/deploy-pages.yml` deploys `./out` to GitHub Pages after CI succeeds on `main`; set the `SITE_URL`
repository variable. Project-pages sites (`user.github.io/repo`) need `basePath`/`assetPrefix` in `next.config.ts`;
see the comment at the top of that workflow.

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

# מסלול המשקיע

Hebrew, RTL, statically-exported Next.js learning platform for value investing.

## Development

```bash
npm run dev
```

## Verification

```bash
npm run validate:content   # content schema + link + word-count checks (also runs before build)
npm run typecheck
npm run lint
npm test
npm run build               # outputs static site to ./out
```

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

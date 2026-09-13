import "server-only";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { mdxComponents } from "@/components/mdx/MdxComponents";
import { slugifyTerm } from "@/lib/content/glossary";
import rehypeTerms, { type RehypeTerm, type RehypeTermsOptions } from "@/lib/content/rehype-terms";
import type { Term } from "@/lib/content/schema";

/**
 * Compiles a lesson body to React. When `terms` (the lesson's frontmatter key
 * terms) are passed, the first plain-text occurrence of each term in the body
 * is wrapped in an inline <Term> tooltip linking to the glossary. Without
 * `terms` the body renders exactly as before.
 */
export async function renderLessonBody(source: string, terms: Term[] = []) {
  const rehypeTermList: RehypeTerm[] = terms.map((t) => ({
    term: t.term,
    en: t.en,
    definition: t.definition,
    slug: slugifyTerm(t.term),
  }));

  const { content } = await compileMDX({
    source,
    components: mdxComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            { behavior: "wrap", properties: { className: ["heading-anchor"] } },
          ],
          // Runs after autolink so heading text is already inside <a> and skipped.
          ...(rehypeTermList.length > 0
            ? [[rehypeTerms, { terms: rehypeTermList }] as [typeof rehypeTerms, RehypeTermsOptions]]
            : []),
        ],
      },
    },
  });
  return content;
}

export type Heading = { id: string; text: string; level: 2 | 3 };

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  const lines = markdown.split("\n");
  for (const line of lines) {
    const match = /^(#{2,3})\s+(.*)$/.exec(line.trim());
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].trim();
    const id = slugify(text);
    headings.push({ id, text, level });
  }
  return headings;
}

function slugify(text: string): string {
  return text
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

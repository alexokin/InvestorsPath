import type { Element, Parent, Root, RootContent, Text } from "hast";

/**
 * rehype plugin that wraps the first plain-text occurrence of each glossary
 * term in a lesson body with a `<Term>` MDX element, so the `Term` component
 * (components/mdx/Term.tsx) can render an inline tooltip.
 *
 * The plugin emits `mdxJsxTextElement` nodes — the same node type MDX itself
 * produces for inline JSX like `<Ltr>…</Ltr>` — so the MDX compiler turns them
 * into `_components.Term` calls and resolves them through the `components`
 * registry passed to compileMDX.
 */

export type RehypeTerm = {
  term: string;
  en: string;
  definition: string;
  slug: string;
};

export type RehypeTermsOptions = {
  terms: RehypeTerm[];
};

/** Minimal shape of the MDX JSX nodes that appear in a rehype tree. */
type MdxJsxAttribute = { type: "mdxJsxAttribute"; name: string; value: string };
type MdxJsxTextElement = {
  type: "mdxJsxTextElement";
  name: string | null;
  attributes: MdxJsxAttribute[];
  children: RootContent[];
};

const SKIP_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "a", "code", "pre"]);
/**
 * Every MDX JSX element (`<Ltr>`, `<Ticker>`, `<Formula>`, `<Callout>`, a
 * previously inserted `<Term>`, calculators, …) is skipped as a whole: in the
 * rehype tree these are `mdxJsxFlowElement` / `mdxJsxTextElement` nodes.
 */
const MDX_JSX_TYPES = new Set(["mdxJsxFlowElement", "mdxJsxTextElement"]);

/**
 * Hebrew single-letter prefixes (ו/ה/ב/ל/מ/ש/כ) that may be glued to a word.
 * A term is allowed to match right after one of these as long as the prefix
 * itself starts the word (i.e. is preceded by a non-letter or the start).
 */
const PREFIXES = "והבלמשכ";
const LETTER_RE = /\p{L}/u;

function isLetter(ch: string | undefined): boolean {
  return ch !== undefined && LETTER_RE.test(ch);
}

/**
 * Finds the index of the first "whole-word-ish" occurrence of `term` in `text`,
 * or -1. A match is accepted when the character before it is not a letter, or
 * is a Hebrew prefix letter that itself follows a non-letter, and the character
 * after it is not a letter.
 */
export function findTermIndex(text: string, term: string): number {
  let from = 0;
  while (from <= text.length - term.length) {
    const idx = text.indexOf(term, from);
    if (idx === -1) return -1;
    const before = idx > 0 ? text[idx - 1] : undefined;
    const beforeBefore = idx > 1 ? text[idx - 2] : undefined;
    const after = text[idx + term.length];
    const startOk =
      !isLetter(before) || (PREFIXES.includes(before as string) && !isLetter(beforeBefore));
    const endOk = !isLetter(after);
    if (startOk && endOk) return idx;
    from = idx + 1;
  }
  return -1;
}

function isSkippedNode(node: RootContent): boolean {
  if (node.type === "element") return SKIP_TAGS.has((node as Element).tagName);
  return MDX_JSX_TYPES.has((node as { type: string }).type);
}

function makeTermNode(term: RehypeTerm, text: string): MdxJsxTextElement {
  return {
    type: "mdxJsxTextElement",
    name: "Term",
    attributes: [
      { type: "mdxJsxAttribute", name: "slug", value: term.slug },
      { type: "mdxJsxAttribute", name: "en", value: term.en },
      { type: "mdxJsxAttribute", name: "definition", value: term.definition },
    ],
    children: [{ type: "text", value: text } as Text],
  };
}

/**
 * Walks `parent` in document order looking for the first text node matching
 * `term`; when found, splits that node around a `<Term>` element and returns
 * true so the caller stops. Subtrees of skipped nodes are never entered.
 */
function wrapFirst(parent: Parent, term: RehypeTerm): boolean {
  const children = parent.children as RootContent[];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === "text") {
      const idx = findTermIndex(child.value, term.term);
      if (idx === -1) continue;
      const before = child.value.slice(0, idx);
      const after = child.value.slice(idx + term.term.length);
      const replacement: RootContent[] = [];
      if (before) replacement.push({ type: "text", value: before });
      replacement.push(makeTermNode(term, term.term) as unknown as RootContent);
      if (after) replacement.push({ type: "text", value: after });
      children.splice(i, 1, ...replacement);
      return true;
    }
    if (isSkippedNode(child)) continue;
    if ("children" in child && Array.isArray((child as Parent).children)) {
      if (wrapFirst(child as Parent, term)) return true;
    }
  }
  return false;
}

export default function rehypeTerms(options: RehypeTermsOptions) {
  const terms = [...(options?.terms ?? [])]
    .filter((t) => t.term.trim().length > 0)
    // Longest first so a longer term is never split by a shorter one nested in it.
    .sort((a, b) => b.term.length - a.term.length);

  return (tree: Root) => {
    for (const term of terms) {
      wrapFirst(tree, term);
    }
  };
}

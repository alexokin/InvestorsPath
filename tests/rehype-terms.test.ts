import { describe, expect, it } from "vitest";
import type { Element, Root, RootContent, Text } from "hast";
import rehypeTerms, { findTermIndex, type RehypeTerm } from "@/lib/content/rehype-terms";

// ---------- tiny hast builders ----------

const text = (value: string): Text => ({ type: "text", value });

const el = (tagName: string, children: RootContent[], properties = {}): Element => ({
  type: "element",
  tagName,
  properties,
  children: children as Element["children"],
});

const mdxText = (name: string, children: RootContent[]) =>
  ({ type: "mdxJsxTextElement", name, attributes: [], children }) as unknown as RootContent;

const mdxFlow = (name: string, children: RootContent[]) =>
  ({ type: "mdxJsxFlowElement", name, attributes: [], children }) as unknown as RootContent;

const root = (...children: RootContent[]): Root => ({ type: "root", children });

const term = (t: string, slug = t): RehypeTerm => ({
  term: t,
  en: `${t}-en`,
  definition: `def:${t}`,
  slug,
});

function run(tree: Root, terms: RehypeTerm[]): Root {
  rehypeTerms({ terms })(tree);
  return tree;
}

type TermNode = {
  type: "mdxJsxTextElement";
  name: string;
  attributes: { name: string; value: string }[];
  children: Text[];
};

/** Collects every emitted <Term> node in document order. */
function collectTerms(node: { children?: unknown[] }): TermNode[] {
  const out: TermNode[] = [];
  for (const child of (node.children ?? []) as Array<Record<string, unknown>>) {
    if (child.type === "mdxJsxTextElement" && child.name === "Term") {
      out.push(child as unknown as TermNode);
    }
    if (Array.isArray(child.children)) out.push(...collectTerms(child as { children: unknown[] }));
  }
  return out;
}

/** Serializes the tree back to plain text, marking Term wrappers with [ ]. */
function toText(node: { children?: unknown[] }): string {
  let s = "";
  for (const child of (node.children ?? []) as Array<Record<string, unknown>>) {
    if (child.type === "text") s += child.value as string;
    else if (child.type === "mdxJsxTextElement" && child.name === "Term")
      s += `[${toText(child as { children: unknown[] })}]`;
    else if (Array.isArray(child.children)) s += toText(child as { children: unknown[] });
  }
  return s;
}

// ---------- findTermIndex ----------

describe("findTermIndex", () => {
  it("matches at the start and after non-letters", () => {
    expect(findTermIndex("אינפלציה היא", "אינפלציה")).toBe(0);
    // "זו בדיוק " is 9 chars, the ה prefix is at 9, the term starts at 10.
    expect(findTermIndex("זו בדיוק האינפלציה: כן", "אינפלציה")).toBe(10);
    expect(findTermIndex("(אינפלציה)", "אינפלציה")).toBe(1);
  });

  it("allows a single Hebrew prefix letter glued to the term", () => {
    for (const p of ["ו", "ה", "ב", "ל", "מ", "ש", "כ"]) {
      expect(findTermIndex(`טקסט ${p}אינפלציה כאן`, "אינפלציה")).toBe(6);
    }
  });

  it("rejects a match preceded by a non-prefix letter or a two-letter run", () => {
    expect(findTermIndex("תאינפלציה", "אינפלציה")).toBe(-1);
    // "שה" is two letters glued in front; only a single prefix is accepted.
    expect(findTermIndex("שהאינפלציה", "אינפלציה")).toBe(-1);
  });

  it("rejects a match followed by a letter", () => {
    expect(findTermIndex("אינפלציהת", "אינפלציה")).toBe(-1);
    expect(findTermIndex("מכפיל רווחים", "מכפיל רווח")).toBe(-1);
    expect(findTermIndex("מכפיל רווח.", "מכפיל רווח")).toBe(0);
  });

  it("skips a bad occurrence and finds a later good one", () => {
    expect(findTermIndex("תאינפלציה ואז אינפלציה", "אינפלציה")).toBe(14);
  });
});

// ---------- plugin ----------

describe("rehypeTerms", () => {
  it("wraps only the first occurrence and carries the attributes", () => {
    const tree = root(
      el("p", [text("קודם אינפלציה ואחר כך שוב אינפלציה.")]),
      el("p", [text("ועוד אינפלציה בפסקה אחרת.")])
    );
    run(tree, [term("אינפלציה", "inflation-slug")]);

    const found = collectTerms(tree);
    expect(found).toHaveLength(1);
    expect(found[0].children[0].value).toBe("אינפלציה");
    expect(Object.fromEntries(found[0].attributes.map((a) => [a.name, a.value]))).toEqual({
      slug: "inflation-slug",
      en: "אינפלציה-en",
      definition: "def:אינפלציה",
    });
    expect(toText(tree)).toBe(
      "קודם [אינפלציה] ואחר כך שוב אינפלציה.ועוד אינפלציה בפסקה אחרת."
    );
  });

  it("splits the text node into before / Term / after", () => {
    const tree = root(el("p", [text("א אינפלציה ב")]));
    run(tree, [term("אינפלציה")]);
    const p = tree.children[0] as Element;
    expect(p.children.map((c) => c.type)).toEqual(["text", "mdxJsxTextElement", "text"]);
    expect((p.children[0] as Text).value).toBe("א ");
    expect((p.children[2] as Text).value).toBe(" ב");
  });

  it("does not create empty text nodes at the edges", () => {
    const tree = root(el("p", [text("אינפלציה")]));
    run(tree, [term("אינפלציה")]);
    const p = tree.children[0] as Element;
    expect(p.children).toHaveLength(1);
    expect(p.children[0].type).toBe("mdxJsxTextElement");
  });

  it("skips headings, links, code and pre, and picks the next plain occurrence", () => {
    const tree = root(
      el("h2", [text("אינפלציה בכותרת")]),
      el("h3", [el("a", [text("אינפלציה בקישור בכותרת")])]),
      el("p", [el("a", [text("אינפלציה בקישור")], { href: "/x" })]),
      el("p", [el("code", [text("אינפלציה בקוד")])]),
      el("pre", [el("code", [text("אינפלציה בבלוק")])]),
      el("p", [text("הנה אינפלציה רגילה.")])
    );
    run(tree, [term("אינפלציה")]);
    expect(collectTerms(tree)).toHaveLength(1);
    expect(toText(tree)).toContain("הנה [אינפלציה] רגילה.");
  });

  it("does not descend into MDX JSX elements (Ltr, Ticker, Formula, Callout, Term)", () => {
    const tree = root(
      el("p", [mdxText("Ltr", [text("אינפלציה")]), text(" ואז "), mdxText("Ticker", [text("אינפלציה")])]),
      mdxFlow("Callout", [el("p", [text("אינפלציה בתוך callout")])]),
      el("p", [mdxText("Formula", [text("אינפלציה")])]),
      el("p", [mdxText("Term", [text("אינפלציה")])]),
      el("p", [text("סוף סוף אינפלציה.")])
    );
    run(tree, [term("אינפלציה")]);
    const found = collectTerms(tree).filter((t) => t.attributes.length > 0);
    expect(found).toHaveLength(1);
    expect(toText(tree)).toContain("סוף סוף [אינפלציה].");
  });

  it("respects Hebrew prefixes when wrapping", () => {
    const tree = root(el("p", [text("מדברים על האינפלציה ועל שחיקה.")])) ;
    run(tree, [term("אינפלציה")]);
    expect(toText(tree)).toBe("מדברים על ה[אינפלציה] ועל שחיקה.");
  });

  it("handles longer terms first so a shorter term is not matched inside them", () => {
    const tree = root(
      el("p", [text("ריבית ריאלית חשובה. ריבית סתם פחות.")])
    );
    // Deliberately pass the shorter term first; the plugin must sort.
    run(tree, [term("ריבית"), term("ריבית ריאלית")]);
    expect(toText(tree)).toBe("[ריבית ריאלית] חשובה. [ריבית] סתם פחות.");
    const found = collectTerms(tree);
    expect(found.map((t) => t.children[0].value)).toEqual(["ריבית ריאלית", "ריבית"]);
  });

  it("wraps each of several terms once, in the right places", () => {
    const tree = root(
      el("p", [text("אינפלציה שוחקת כוח קנייה.")]),
      el("ul", [el("li", [text("ריבית ריאלית = נומינלית פחות אינפלציה")])])
    );
    run(tree, [term("אינפלציה"), term("כוח קנייה"), term("ריבית ריאלית")]);
    expect(toText(tree)).toBe(
      "[אינפלציה] שוחקת [כוח קנייה].[ריבית ריאלית] = נומינלית פחות אינפלציה"
    );
  });

  it("leaves the tree untouched when no term matches or no terms are given", () => {
    const tree = root(el("p", [text("טקסט בלי מונחים")]));
    run(tree, [term("אינפלציה")]);
    run(tree, []);
    expect(tree.children).toHaveLength(1);
    expect((tree.children[0] as Element).children).toEqual([text("טקסט בלי מונחים")]);
  });
});

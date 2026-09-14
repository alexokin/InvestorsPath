/**
 * Minimal, rule-of-thumb bidi (bidirectional text) support for `ImageResponse`
 * (Satori) cards.
 *
 * Satori has no Unicode Bidirectional Algorithm (UAX #9) implementation: it
 * draws whatever string it is given left-to-right, glyph by glyph. Feeding it
 * a logical-order Hebrew string therefore renders every RTL run mirrored
 * (letters and word order both come out backwards), and any embedded LTR run
 * (a Latin word, a number, "(DCF)") ends up on the wrong side once naive
 * full-string reversal is applied.
 *
 * This module implements a simplified version of the "reorder for an LTR
 * renderer" trick real bidi engines use internally: split the logical text
 * into runs of Hebrew / Latin-or-digit / bracket / other-neutral characters,
 * merge neutrals that are clearly *inside* an LTR phrase (a space in "Rule
 * 72", a slash in "P/E", a dot in "1.5", a trailing "%" or ":" stuck to a
 * number) so that phrase reorders as one atomic unit, then reverse the
 * top-level run order and reverse the characters within each Hebrew run
 * while mirroring paired brackets. The result is a string that, when drawn
 * naively left-to-right, reads correctly to a Hebrew reader scanning
 * right-to-left.
 *
 * This is intentionally NOT a full UAX #9 implementation (no embedding
 * levels, no weak/neutral resolution beyond the rules above) — it covers the
 * patterns that actually show up in this site's OG card copy (Hebrew prose,
 * the occasional Latin acronym/number, "%", ":", and parentheses).
 */

const HEBREW_RE = /[֐-׿]/;
const LATIN_OR_DIGIT_RE = /[A-Za-z0-9]/;
const BRACKET_RE = /[()[\]{}<>]/;

/** Neutral characters that attach to a *preceding* Latin/digit run (e.g. the
 * "%" in "20%", the ":" in "1:", the "." in "3." at line/sentence end). */
const TRAILING_ATTACH_CHARS = new Set(["%"]);

const BRACKET_MIRROR: Record<string, string> = {
  "(": ")",
  ")": "(",
  "[": "]",
  "]": "[",
  "{": "}",
  "}": "{",
  "<": ">",
  ">": "<",
};

type RunType = "hebrew" | "latin" | "bracket" | "neutral";

interface Run {
  type: RunType;
  text: string;
}

function classify(ch: string): RunType {
  if (HEBREW_RE.test(ch)) return "hebrew";
  if (LATIN_OR_DIGIT_RE.test(ch)) return "latin";
  if (BRACKET_RE.test(ch)) return "bracket";
  return "neutral";
}

/**
 * Splits `text` into runs. Hebrew and Latin/digit characters are grouped
 * into maximal runs; brackets and other neutrals are kept as single-char
 * runs so later merge passes can attach them precisely (a run of ": " must
 * not be treated as one indivisible token — only the ":" attaches to a
 * preceding number, the space stays a separate neutral).
 */
function tokenize(text: string): Run[] {
  const runs: Run[] = [];
  for (const ch of text) {
    const type = classify(ch);
    const last = runs[runs.length - 1];
    if (last && last.type === type && (type === "hebrew" || type === "latin")) {
      last.text += ch;
    } else {
      runs.push({ type, text: ch });
    }
  }
  return runs;
}

/**
 * Merges neutrals that belong *inside* an LTR phrase so the phrase reorders
 * as a single atomic run: a neutral sandwiched between two Latin/digit runs
 * ("Rule 72", "P/E", "1.5") and a single "clitic" neutral trailing a
 * Latin/digit run ("20%", "1:").
 */
function mergeLatinPhrases(runs: Run[]): Run[] {
  const out = [...runs];

  // Pass 1: latin, neutral, latin -> single latin run (repeat until stable,
  // so "1.5.6" or "Rule 72 hours" collapse fully).
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i + 2 < out.length; i++) {
      if (out[i].type === "latin" && out[i + 1].type === "neutral" && out[i + 2].type === "latin") {
        out.splice(i, 3, { type: "latin", text: out[i].text + out[i + 1].text + out[i + 2].text });
        changed = true;
        break;
      }
    }
  }

  // Pass 2: latin followed by a single trailing "clitic" neutral -> attach.
  for (let i = 0; i + 1 < out.length; i++) {
    if (
      out[i].type === "latin" &&
      out[i + 1].type === "neutral" &&
      out[i + 1].text.length === 1 &&
      TRAILING_ATTACH_CHARS.has(out[i + 1].text)
    ) {
      out.splice(i, 2, { type: "latin", text: out[i].text + out[i + 1].text });
    }
  }

  return out;
}

/**
 * Converts a logical-order RTL (Hebrew-base-direction) paragraph into the
 * visual order a non-bidi-aware left-to-right renderer (Satori) must be
 * given to display it correctly.
 *
 * Algorithm: tokenize into Hebrew / Latin-or-digit / bracket / neutral runs,
 * merge neutrals that are internal to an LTR phrase, reverse the top-level
 * run order, reverse the characters inside each Hebrew run, and mirror
 * paired brackets. Latin/neutral run text is otherwise left untouched so
 * embedded English/numeric phrases keep reading left-to-right.
 */
export function toVisualRtl(text: string): string {
  if (!text) return text;

  const runs = mergeLatinPhrases(tokenize(text));

  return runs
    .slice()
    .reverse()
    .map((run) => {
      if (run.type === "hebrew") return [...run.text].reverse().join("");
      if (run.type === "bracket") return BRACKET_MIRROR[run.text] ?? run.text;
      return run.text;
    })
    .join("");
}

/**
 * Greedy word-wraps `text` at `maxCharsPerLine`, operating on the LOGICAL
 * string (before any bidi reordering) so word boundaries are correct.
 * Callers must run each returned line through `toVisualRtl` before handing
 * it to Satori — reordering a already-wrapped multi-line block as one string
 * would interleave lines incorrectly.
 */
export function wrapRtlLines(text: string, maxCharsPerLine: number): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const words = trimmed.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (current && candidate.length > maxCharsPerLine) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);

  return lines;
}

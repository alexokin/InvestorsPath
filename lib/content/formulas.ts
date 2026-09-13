import fs from "node:fs";
import path from "node:path";
import { load as loadYaml } from "js-yaml";
import { z } from "zod";

const formulaSchema = z.object({
  id: z.string().min(1),
  name_he: z.string().min(1),
  expression: z.string().min(1),
  variables: z.array(
    z.object({
      symbol: z.string().min(1),
      name_he: z.string().min(1),
    })
  ),
  notes_he: z.string().min(1),
  relatedTool: z.string().optional(),
});

export type Formula = z.infer<typeof formulaSchema>;

const FORMULAS_PATH = path.join(process.cwd(), "content", "formulas.yaml");

let cache: Formula[] | null = null;

export function getFormulas(): Formula[] {
  if (cache) return cache;
  const raw = fs.readFileSync(FORMULAS_PATH, "utf8");
  const parsed = loadYaml(raw);
  cache = z.array(formulaSchema).parse(parsed);
  return cache;
}

export function getFormula(id: string): Formula | undefined {
  return getFormulas().find((f) => f.id === id);
}

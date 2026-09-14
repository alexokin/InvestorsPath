import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  TrendingUp,
  Scale,
  BarChart3,
  ShieldCheck,
  ClipboardCheck,
  Landmark,
  Undo2,
  Coins,
  Percent,
} from "lucide-react";
import { TOOLS } from "@/lib/finance/tools";

export const metadata: Metadata = { title: "כלים ומחשבונים" };

const icons: Record<string, typeof Calculator> = {
  compound: TrendingUp,
  dcf: BarChart3,
  graham: Calculator,
  multiples: Scale,
  "margin-of-safety": ShieldCheck,
  bond: Landmark,
  "reverse-dcf": Undo2,
  cagr: Percent,
  ddm: Coins,
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">כלים ומחשבונים</h1>
      <p className="mt-2 text-muted">
        מחשבוני השקעות אינטראקטיביים שמלווים את השיעורים העיוניים, לצד דף עבודה לניתוח חברה
        לפני קנייה. הכניסו נתונים משלכם וראו איך הנוסחאות מתורגמות למספרים בפועל.
      </p>

      <Link
        href="/tools/checklist/"
        className="mt-6 flex items-start gap-3 rounded-xl border-2 border-primary bg-accent p-4 transition-colors hover:bg-primary/10"
      >
        <ClipboardCheck className="mt-0.5 size-5 shrink-0 text-primary" />
        <span>
          <span className="block font-semibold text-foreground">דף עבודה לניתוח חברה</span>
          <span className="mt-1 block text-sm text-muted">
            צ&apos;קליסט אינטראקטיבי שממלאים לכל חברה שבודקים — נשמר אוטומטית, ניתן לייצוא
            ולהדפסה.
          </span>
        </span>
      </Link>

      <ul className="mt-8 space-y-3">
        {TOOLS.map((tool) => {
          const Icon = icons[tool.id] ?? Calculator;
          return (
            <li key={tool.id}>
              <Link
                href={`/tools/${tool.id}/`}
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary hover:bg-accent"
              >
                <Icon className="mt-0.5 size-5 shrink-0 text-primary" />
                <span>
                  <span className="block font-semibold text-foreground">{tool.name_he}</span>
                  <span className="mt-1 block text-sm text-muted">{tool.tagline_he}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

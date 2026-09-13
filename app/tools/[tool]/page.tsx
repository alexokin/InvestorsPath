import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { TOOLS, getToolMeta, CURRENCY_GUIDANCE_HE, type ToolId } from "@/lib/finance/tools";
import { getToolRelatedLessons } from "@/lib/content/tool-lessons";
import { CompoundInterestCalculator } from "@/components/calculators/CompoundInterestCalculator";
import { DcfCalculator } from "@/components/calculators/DcfCalculator";
import { GrahamCalculator } from "@/components/calculators/GrahamCalculator";
import { MultiplesComparison } from "@/components/calculators/MultiplesComparison";
import { MarginOfSafetyCalculator } from "@/components/calculators/MarginOfSafetyCalculator";

export const dynamicParams = false;

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ tool: tool.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tool: string }>;
}): Promise<Metadata> {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  return { title: meta?.name_he ?? "כלי לא נמצא", description: meta?.tagline_he };
}

function CalculatorFor({ id }: { id: ToolId }) {
  switch (id) {
    case "compound":
      return <CompoundInterestCalculator />;
    case "dcf":
      return <DcfCalculator />;
    case "graham":
      return <GrahamCalculator />;
    case "multiples":
      return <MultiplesComparison />;
    case "margin-of-safety":
      return <MarginOfSafetyCalculator />;
  }
}

export default async function ToolPage({ params }: { params: Promise<{ tool: string }> }) {
  const { tool } = await params;
  const meta = getToolMeta(tool);
  if (!meta) notFound();
  const relatedLessons = getToolRelatedLessons(meta.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Breadcrumbs
        items={[
          { label: "כלים ומחשבונים", href: "/tools/" },
          { label: meta.name_he },
        ]}
      />
      <h1 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">{meta.name_he}</h1>
      <p className="mt-2 text-muted">{meta.tagline_he}</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-slate-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">השיטה</p>
          <p className="text-sm leading-relaxed text-foreground">{meta.method_he}</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
            מגבלות
          </p>
          <p className="text-sm leading-relaxed text-amber-900">{meta.limits_he}</p>
        </div>
        <div className="rounded-lg border border-border bg-accent p-4 sm:col-span-2">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            מטבע: ₪ או $
          </p>
          <p className="text-sm leading-relaxed text-foreground">{CURRENCY_GUIDANCE_HE}</p>
        </div>
      </div>

      <div className="mt-8">
        <CalculatorFor id={meta.id} />
      </div>

      {relatedLessons.length > 0 && (
        <div className="mt-8">
          <p className="mb-2 text-sm font-semibold text-foreground">שיעורים רלוונטיים</p>
          <ul className="space-y-2">
            {relatedLessons.map((lesson) => (
              <li key={lesson.href}>
                <Link
                  href={lesson.href}
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowRight className="size-3.5 rotate-180" />
                  {lesson.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8">
        <Link href="/tools/" className="text-sm text-muted hover:text-primary hover:underline">
          חזרה לכל הכלים
        </Link>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { calculateCompoundInterest } from "@/lib/finance/compound";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   p = principal, m = monthlyContribution, r = rate, y = years
 */

/** Simple inline SVG line chart of the year-end balance — no chart library. */
function GrowthChart({ rows }: { rows: { year: number; endBalance: number }[] }) {
  const width = 520;
  const height = 180;
  const padding = 8;

  if (rows.length === 0) return null;

  const maxBalance = Math.max(...rows.map((r) => r.endBalance), 1);
  const stepX = rows.length > 1 ? (width - padding * 2) / (rows.length - 1) : 0;

  const points = rows.map((r, i) => {
    const x = padding + i * stepX;
    const y = height - padding - (r.endBalance / maxBalance) * (height - padding * 2);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${height - padding} L${points[0].x.toFixed(1)},${height - padding} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      role="img"
      aria-label="גרף צמיחת הסכום לאורך זמן"
    >
      <path d={areaPath} fill="var(--accent)" opacity={0.7} />
      <path d={linePath} fill="none" stroke="var(--primary)" strokeWidth={2} />
    </svg>
  );
}

export function CompoundInterestCalculator({
  defaultPrincipal = 10000,
  defaultMonthlyContribution = 0,
  defaultRate = 8,
  defaultYears = 20,
  defaultCurrency,
  syncUrl,
}: {
  defaultPrincipal?: number;
  defaultMonthlyContribution?: number;
  defaultRate?: number;
  defaultYears?: number;
  defaultCurrency?: Currency;
  /**
   * Whether numeric inputs are synced to the URL query string (shareable
   * deep link). Defaults to `true` only when this instance is rendered on
   * a `/tools/` route (detected via `usePathname`); embedded lesson
   * instances default to `false` so they never write to the URL. Pass
   * explicitly to override either way.
   */
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const effectiveSyncUrl = syncUrl ?? (pathname?.startsWith("/tools/") ?? false);

  const schema: UrlStateSchema = useMemo(
    () => ({
      p: { default: defaultPrincipal, min: 0 },
      m: { default: defaultMonthlyContribution, min: 0 },
      r: { default: defaultRate },
      y: { default: defaultYears, min: 1, max: 60 },
    }),
    [defaultPrincipal, defaultMonthlyContribution, defaultRate, defaultYears]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const principal = urlState.p;
  const monthlyContribution = urlState.m;
  const rate = urlState.r;
  const years = urlState.y;
  const setPrincipal = (v: number) => setUrlState((prev) => ({ ...prev, p: v }));
  const setMonthlyContribution = (v: number) => setUrlState((prev) => ({ ...prev, m: v }));
  const setRate = (v: number) => setUrlState((prev) => ({ ...prev, r: v }));
  const setYears = (v: number) => setUrlState((prev) => ({ ...prev, y: v }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const result = useMemo(
    () =>
      calculateCompoundInterest({
        principal,
        monthlyContribution,
        annualRatePercent: rate,
        years: Math.max(1, Math.round(years)),
      }),
    [principal, monthlyContribution, rate, years]
  );

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <NumberField
            label="סכום התחלתי"
            value={principal}
            onChange={setPrincipal}
            suffix={currencySymbol(currency)}
            min={0}
          />
          <NumberField
            label="הפקדה חודשית"
            value={monthlyContribution}
            onChange={setMonthlyContribution}
            suffix={currencySymbol(currency)}
            min={0}
          />
          <NumberField label="תשואה שנתית ממוצעת" value={rate} onChange={setRate} suffix="%" step={0.1} />
          <NumberField label="מספר שנים" value={years} onChange={setYears} suffix="שנים" min={1} max={60} step={1} />
        </>
      }
      results={
        <>
          <ResultCard
            label="ערך עתידי"
            value={formatMoney(result.finalBalance, currency)}
            tone="primary"
            helpText="הסכום הצפוי בסוף התקופה"
          />
          <ResultCard label="סך הפקדות" value={formatMoney(result.totalContributions, currency)} />
          <ResultCard
            label="סך רווח מריבית דריבית"
            value={formatMoney(result.totalInterest, currency)}
            tone="success"
          />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              צמיחת הסכום לאורך זמן
            </p>
            <GrowthChart rows={result.rows} />
          </div>
        </>
      }
      footer={
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-start text-sm">
            <thead>
              <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                <th className="p-2 text-start">שנה</th>
                <th className="p-2 text-start">הפקדות בשנה</th>
                <th className="p-2 text-start">ריבית בשנה</th>
                <th className="p-2 text-start">יתרה בסוף השנה</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.year} className="border-t border-border">
                  <td className="p-2" dir="ltr">
                    {row.year}
                  </td>
                  <td className="p-2" dir="ltr">
                    {formatMoney(row.contributions, currency)}
                  </td>
                  <td className="p-2" dir="ltr">
                    {formatMoney(row.interest, currency)}
                  </td>
                  <td className="p-2 font-medium" dir="ltr">
                    {formatMoney(row.endBalance, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted">
            תשואה אפקטיבית מצטברת: {formatPercent(result.totalContributions > 0 ? result.totalInterest / result.totalContributions : 0, 0)}
            {" "}מעל סך ההפקדות (לא כולל אינפלציה ומיסוי).
          </p>
        </div>
      }
    />
  );
}

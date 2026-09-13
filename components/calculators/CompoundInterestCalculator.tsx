"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateCompoundInterest } from "@/lib/finance/compound";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";

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
}: {
  defaultPrincipal?: number;
  defaultMonthlyContribution?: number;
  defaultRate?: number;
  defaultYears?: number;
  defaultCurrency?: Currency;
}) {
  const [principal, setPrincipal] = useState(defaultPrincipal);
  const [monthlyContribution, setMonthlyContribution] = useState(defaultMonthlyContribution);
  const [rate, setRate] = useState(defaultRate);
  const [years, setYears] = useState(defaultYears);
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

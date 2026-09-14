"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { ddmFairValue, nextDividendFromCurrent, ddmSensitivityGrid } from "@/lib/finance/ddm";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

type DividendMode = "next" | "current";

const GROWTH_DELTAS = [-0.01, 0, 0.01];
const RETURN_DELTAS = [-0.01, 0, 0.01];

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   d = dividend, r = requiredReturn, g = growthRate, mode = dividendMode
 *   (0 = current, 1 = next)
 */

export function DdmCalculator({
  defaultDividendMode = "current",
  defaultDividend = 2,
  defaultRequiredReturn = 9,
  defaultGrowthRate = 4,
  defaultCurrency,
  syncUrl,
}: {
  defaultDividendMode?: DividendMode;
  defaultDividend?: number;
  defaultRequiredReturn?: number;
  defaultGrowthRate?: number;
  defaultCurrency?: Currency;
  /**
   * Whether numeric inputs are synced to the URL query string. Defaults to
   * `true` only when this instance is rendered on a `/tools/` route
   * (detected via `usePathname`); embedded lesson instances default to
   * `false`. Pass explicitly to override either way.
   */
  syncUrl?: boolean;
}) {
  const pathname = usePathname();
  const effectiveSyncUrl = syncUrl ?? (pathname?.startsWith("/tools/") ?? false);

  const schema: UrlStateSchema = useMemo(
    () => ({
      d: { default: defaultDividend },
      r: { default: defaultRequiredReturn },
      g: { default: defaultGrowthRate },
      mode: { default: defaultDividendMode === "next" ? 1 : 0, min: 0, max: 1 },
    }),
    [defaultDividend, defaultRequiredReturn, defaultGrowthRate, defaultDividendMode]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const dividend = urlState.d;
  const requiredReturn = urlState.r;
  const growthRate = urlState.g;
  const dividendMode: DividendMode = urlState.mode === 1 ? "next" : "current";
  const setDividend = (v: number) => setUrlState((prev) => ({ ...prev, d: v }));
  const setRequiredReturn = (v: number) => setUrlState((prev) => ({ ...prev, r: v }));
  const setGrowthRate = (v: number) => setUrlState((prev) => ({ ...prev, g: v }));
  const setDividendMode = (v: DividendMode) =>
    setUrlState((prev) => ({ ...prev, mode: v === "next" ? 1 : 0 }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const nextDividend = useMemo(
    () => (dividendMode === "next" ? dividend : nextDividendFromCurrent(dividend, growthRate / 100)),
    [dividendMode, dividend, growthRate]
  );

  const result = useMemo(
    () => ddmFairValue({ nextDividend, requiredReturn: requiredReturn / 100, growthRate: growthRate / 100 }),
    [nextDividend, requiredReturn, growthRate]
  );

  const growthRates = useMemo(
    () => GROWTH_DELTAS.map((d) => growthRate / 100 + d),
    [growthRate]
  );
  const requiredReturns = useMemo(
    () => RETURN_DELTAS.map((d) => requiredReturn / 100 + d),
    [requiredReturn]
  );
  const grid = useMemo(
    () => ddmSensitivityGrid(nextDividend, growthRates, requiredReturns),
    [nextDividend, growthRates, requiredReturns]
  );

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <div>
            <span className="mb-1 block text-sm font-medium text-foreground">אופן הזנת הדיבידנד</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDividendMode("current")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  dividendMode === "current" ? "border-primary bg-accent text-primary" : "border-border text-muted"
                }`}
              >
                דיבידנד נוכחי (D0)
              </button>
              <button
                type="button"
                onClick={() => setDividendMode("next")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  dividendMode === "next" ? "border-primary bg-accent text-primary" : "border-border text-muted"
                }`}
              >
                דיבידנד צפוי לשנה הבאה (D1)
              </button>
            </div>
          </div>
          <NumberField
            label={dividendMode === "current" ? "דיבידנד למניה (שנה אחרונה)" : "דיבידנד צפוי למניה (שנה הבאה)"}
            value={dividend}
            onChange={setDividend}
            suffix={currencySymbol(currency)}
            step={0.05}
          />
          <NumberField label="תשואה נדרשת (r)" value={requiredReturn} onChange={setRequiredReturn} suffix="%" step={0.5} />
          <NumberField label="קצב צמיחה קבוע של הדיבידנד (g)" value={growthRate} onChange={setGrowthRate} suffix="%" step={0.5} />
        </>
      }
      results={
        <>
          <ResultCard
            label="דיבידנד צפוי לשנה הבאה (D1)"
            value={formatMoney(nextDividend, currency, { maximumFractionDigits: 2 })}
          />
          {result.warning ? (
            <p className="text-sm text-red-700 dark:text-red-300">
              קצב הצמיחה גבוה או שווה לתשואה הנדרשת — מודל DDM אינו מתכנס ואינו נותן שווי הוגן
              סופי במקרה כזה. יש להניח קצב צמיחה נמוך יותר או תשואה נדרשת גבוהה יותר.
            </p>
          ) : (
            <>
              <ResultCard
                label="שווי הוגן למניה (מודל גורדון)"
                value={formatMoney(result.fairValue ?? 0, currency, { maximumFractionDigits: 2 })}
                tone="primary"
              />
              <ResultCard
                label="תשואת דיבידנד בשווי הוגן"
                value={result.dividendYieldAtFairValue !== null ? formatPercent(result.dividendYieldAtFairValue, 2) : "—"}
              />
            </>
          )}
        </>
      }
      footer={
        <div className="overflow-x-auto">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            רגישות: שווי הוגן לפי צמיחה (שורות) ותשואה נדרשת (עמודות)
          </p>
          <table className="w-full min-w-[420px] text-center text-sm">
            <thead>
              <tr>
                <th className="p-2" />
                {requiredReturns.map((r) => (
                  <th key={r} className="p-2 text-xs font-semibold text-muted" dir="ltr">
                    {formatPercent(r, 1)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.map((row, ri) => (
                <tr key={growthRates[ri]} className="border-t border-border">
                  <th className="p-2 text-xs font-semibold text-muted" dir="ltr">
                    {formatPercent(growthRates[ri], 1)}
                  </th>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      dir="ltr"
                      className={[
                        "p-2",
                        GROWTH_DELTAS[ri] === 0 && RETURN_DELTAS[ci] === 0 ? "bg-accent font-bold text-primary" : "",
                      ].join(" ")}
                    >
                      {cell.fairValue !== null ? formatMoney(cell.fairValue, currency, { maximumFractionDigits: 1 }) : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    />
  );
}

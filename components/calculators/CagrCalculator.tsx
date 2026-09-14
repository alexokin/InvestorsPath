"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { cagr, yearsToDouble, rateToDouble } from "@/lib/finance/cagr";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   sv = startValue, ev = endValue, y = years, r72 = ruleRate,
 *   y72 = ruleYears
 */

export function CagrCalculator({
  defaultStartValue = 100,
  defaultEndValue = 250,
  defaultYears = 8,
  defaultRuleRate = 8,
  defaultRuleYears = 9,
  defaultCurrency,
  syncUrl,
}: {
  defaultStartValue?: number;
  defaultEndValue?: number;
  defaultYears?: number;
  defaultRuleRate?: number;
  defaultRuleYears?: number;
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
      sv: { default: defaultStartValue, min: 0.01 },
      ev: { default: defaultEndValue, min: 0 },
      y: { default: defaultYears, min: 0.1 },
      r72: { default: defaultRuleRate },
      y72: { default: defaultRuleYears, min: 0.1 },
    }),
    [defaultStartValue, defaultEndValue, defaultYears, defaultRuleRate, defaultRuleYears]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const startValue = urlState.sv;
  const endValue = urlState.ev;
  const years = urlState.y;
  const ruleRate = urlState.r72;
  const ruleYears = urlState.y72;
  const setStartValue = (v: number) => setUrlState((prev) => ({ ...prev, sv: v }));
  const setEndValue = (v: number) => setUrlState((prev) => ({ ...prev, ev: v }));
  const setYears = (v: number) => setUrlState((prev) => ({ ...prev, y: v }));
  const setRuleRate = (v: number) => setUrlState((prev) => ({ ...prev, r72: v }));
  const setRuleYears = (v: number) => setUrlState((prev) => ({ ...prev, y72: v }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const cagrResult = useMemo(() => {
    try {
      return cagr({ startValue, endValue, years: Math.max(years, 0.1) });
    } catch {
      return null;
    }
  }, [startValue, endValue, years]);

  const doubling = useMemo(() => {
    try {
      return yearsToDouble(ruleRate / 100);
    } catch {
      return null;
    }
  }, [ruleRate]);

  const requiredRate = useMemo(() => {
    try {
      return rateToDouble(Math.max(ruleYears, 0.1));
    } catch {
      return null;
    }
  }, [ruleYears]);

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <NumberField
            label="ערך התחלתי"
            value={startValue}
            onChange={setStartValue}
            suffix={currencySymbol(currency)}
            min={0.01}
          />
          <NumberField
            label="ערך סופי"
            value={endValue}
            onChange={setEndValue}
            suffix={currencySymbol(currency)}
            min={0}
          />
          <NumberField label="מספר שנים" value={years} onChange={setYears} suffix="שנים" min={0.1} step={1} />
        </>
      }
      results={
        <>
          {cagrResult !== null ? (
            <ResultCard label="קצב צמיחה שנתי ממוצע (CAGR)" value={formatPercent(cagrResult, 2)} tone="primary" />
          ) : (
            <p className="text-sm text-red-700 dark:text-red-300">
              ערך התחלתי ומספר שנים חייבים להיות חיוביים.
            </p>
          )}
          <ResultCard
            label="סיכום"
            value={`${formatMoney(startValue, currency)} → ${formatMoney(endValue, currency)}`}
            helpText={`לאורך ${years} שנים`}
          />
        </>
      }
      footer={
        <div className="space-y-6">
          <div>
            <p className="mb-3 text-sm font-semibold text-foreground">כלל ה-72: הערכה מהירה של הכפלת השקעה</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-3 rounded-lg border border-border p-4">
                <NumberField label="תשואה שנתית קבועה" value={ruleRate} onChange={setRuleRate} suffix="%" step={0.5} />
                {doubling && (
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground">
                      קירוב (72 / תשואה):{" "}
                      <span dir="ltr" className="font-semibold">
                        {Number.isFinite(doubling.approxYears) ? `${doubling.approxYears.toFixed(1)} שנים` : "לעולם לא"}
                      </span>
                    </p>
                    <p className="text-muted">
                      מדויק (ln2 / ln(1+r)):{" "}
                      <span dir="ltr">
                        {Number.isFinite(doubling.exactYears) ? `${doubling.exactYears.toFixed(2)} שנים` : "לעולם לא"}
                      </span>
                    </p>
                  </div>
                )}
              </div>
              <div className="space-y-3 rounded-lg border border-border p-4">
                <NumberField label="מספר שנים עד הכפלה רצוי" value={ruleYears} onChange={setRuleYears} suffix="שנים" min={0.1} step={1} />
                {requiredRate && (
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground">
                      קירוב (72 / שנים):{" "}
                      <span dir="ltr" className="font-semibold">
                        {formatPercent(requiredRate.approxRate, 2)}
                      </span>
                    </p>
                    <p className="text-muted">
                      מדויק (2^(1/n) - 1): <span dir="ltr">{formatPercent(requiredRate.exactRate, 2)}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <p className="text-sm text-muted">
            כלל ה-72 הוא קירוב שימושי ולא נוסחה מדויקת — הוא מדויק יותר סביב תשואות של
            6%-10% בשנה, ומאבד דיוק בקצוות (תשואות נמוכות מאוד או גבוהות מאוד).
          </p>
        </div>
      }
    />
  );
}

"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { impliedGrowthRate, reverseDcfSensitivity } from "@/lib/finance/reverseDcf";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

const DISCOUNT_DELTAS = [-0.01, 0, 0.01];

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   px = price, sh = shares, nd = netDebt, fcf0 = fcf0, r = discountRate,
 *   tg = terminalGrowthRate, n = years
 */

export function ReverseDcfCalculator({
  defaultPrice = 120,
  defaultShares = 10,
  defaultNetDebt = 0,
  defaultFcf0 = 50,
  defaultDiscountRate = 10,
  defaultTerminalGrowthRate = 3,
  defaultYears = 5,
  defaultCurrency,
  syncUrl,
}: {
  defaultPrice?: number;
  defaultShares?: number;
  defaultNetDebt?: number;
  defaultFcf0?: number;
  defaultDiscountRate?: number;
  defaultTerminalGrowthRate?: number;
  defaultYears?: number;
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
      px: { default: defaultPrice },
      sh: { default: defaultShares, min: 0.01 },
      nd: { default: defaultNetDebt },
      fcf0: { default: defaultFcf0 },
      r: { default: defaultDiscountRate },
      tg: { default: defaultTerminalGrowthRate },
      n: { default: defaultYears, min: 1, max: 15 },
    }),
    [
      defaultPrice,
      defaultShares,
      defaultNetDebt,
      defaultFcf0,
      defaultDiscountRate,
      defaultTerminalGrowthRate,
      defaultYears,
    ]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const price = urlState.px;
  const shares = urlState.sh;
  const netDebt = urlState.nd;
  const fcf0 = urlState.fcf0;
  const discountRate = urlState.r;
  const terminalGrowthRate = urlState.tg;
  const years = urlState.n;
  const setPrice = (v: number) => setUrlState((prev) => ({ ...prev, px: v }));
  const setShares = (v: number) => setUrlState((prev) => ({ ...prev, sh: v }));
  const setNetDebt = (v: number) => setUrlState((prev) => ({ ...prev, nd: v }));
  const setFcf0 = (v: number) => setUrlState((prev) => ({ ...prev, fcf0: v }));
  const setDiscountRate = (v: number) => setUrlState((prev) => ({ ...prev, r: v }));
  const setTerminalGrowthRate = (v: number) => setUrlState((prev) => ({ ...prev, tg: v }));
  const setYears = (v: number) => setUrlState((prev) => ({ ...prev, n: v }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const inputs = useMemo(
    () => ({
      price,
      sharesOutstanding: Math.max(shares, 1e-6),
      netDebt,
      fcf0,
      discountRate: discountRate / 100,
      terminalGrowthRate: terminalGrowthRate / 100,
      years: Math.max(1, Math.round(years)),
    }),
    [price, shares, netDebt, fcf0, discountRate, terminalGrowthRate, years]
  );

  const result = useMemo(() => impliedGrowthRate(inputs), [inputs]);
  const sensitivity = useMemo(() => reverseDcfSensitivity(inputs, DISCOUNT_DELTAS), [inputs]);

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <NumberField label="מחיר מניה נוכחי" value={price} onChange={setPrice} suffix={currencySymbol(currency)} step={0.5} />
          <NumberField label="מספר מניות" value={shares} onChange={setShares} suffix="מיליון" min={0.01} />
          <NumberField
            label="חוב נטו"
            value={netDebt}
            onChange={setNetDebt}
            suffix={`${currencySymbol(currency)} מיליון`}
          />
          <NumberField
            label="תזרים מזומנים חופשי נוכחי (FCF)"
            value={fcf0}
            onChange={setFcf0}
            suffix={`${currencySymbol(currency)} מיליון`}
          />
          <NumberField label="שיעור היוון (WACC)" value={discountRate} onChange={setDiscountRate} suffix="%" step={0.5} />
          <NumberField
            label="שיעור צמיחה טרמינלי"
            value={terminalGrowthRate}
            onChange={setTerminalGrowthRate}
            suffix="%"
            step={0.1}
          />
          <NumberField label="מספר שנות תחזית" value={years} onChange={setYears} suffix="שנים" min={1} max={15} step={1} />
        </>
      }
      results={
        <>
          <ResultCard
            label="שווי שוק (Market Cap)"
            value={formatMoney(result.marketCap, currency, { maximumFractionDigits: 0 })}
          />
          {result.converged && result.impliedGrowthRate !== null ? (
            <ResultCard
              label="קצב צמיחה גלום במחיר"
              value={formatPercent(result.impliedGrowthRate, 1)}
              tone="primary"
              helpText="קצב הצמיחה השנתי הקבוע בתקופת התחזית שמצדיק את המחיר הנוכחי"
            />
          ) : (
            <p className="text-sm text-red-700 dark:text-red-300">
              לא ניתן למצוא קצב צמיחה בטווח הסביר (-50% עד 100%) שמצדיק את המחיר הזה — ייתכן
              שהמחיר קיצוני ביחס לתזרים הנוכחי, או ששיעור ההיוון אינו גבוה משיעור הצמיחה
              הטרמינלי.
            </p>
          )}
        </>
      }
      footer={
        <div className="space-y-6">
          {result.converged && result.impliedGrowthRate !== null && (
            <p className="text-sm text-foreground">
              כדי להצדיק את המחיר הנוכחי, החברה צריכה לצמוח בכ-{formatPercent(result.impliedGrowthRate, 1)} בשנה
              במשך {inputs.years} השנים הקרובות.
            </p>
          )}
          <div className="overflow-x-auto">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              רגישות: צמיחה גלומה לפי שיעור היוון
            </p>
            <table className="w-full min-w-[360px] text-start text-sm">
              <thead>
                <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                  <th className="p-2 text-start">שיעור היוון</th>
                  <th className="p-2 text-start">צמיחה גלומה</th>
                </tr>
              </thead>
              <tbody>
                {sensitivity.map((row) => (
                  <tr
                    key={row.discountRateDelta}
                    className={`border-t border-border ${row.discountRateDelta === 0 ? "bg-accent font-bold text-primary" : ""}`}
                  >
                    <td className="p-2" dir="ltr">
                      {formatPercent(row.discountRate, 1)}
                    </td>
                    <td className="p-2" dir="ltr">
                      {row.impliedGrowthRate !== null ? formatPercent(row.impliedGrowthRate, 1) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      }
    />
  );
}

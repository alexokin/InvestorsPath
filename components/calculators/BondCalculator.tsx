"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { bondPrice, bondYtm, bondDurations, bondRateSensitivity } from "@/lib/finance/bond";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

type Mode = "price" | "yield";

const SENSITIVITY_DELTAS = [-0.02, -0.01, 0, 0.01, 0.02];

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   fv = faceValue, c = couponRate, n = yearsToMaturity, f = frequency
 *   (1 or 2), px = price, y = yieldToMaturity, mode = mode (0 = price,
 *   1 = yield)
 */

export function BondCalculator({
  defaultFaceValue = 1000,
  defaultCouponRate = 5,
  defaultYearsToMaturity = 10,
  defaultFrequency = 2,
  defaultMode = "price",
  defaultPrice = 950,
  defaultYieldToMaturity = 5.8,
  defaultCurrency,
  syncUrl,
}: {
  defaultFaceValue?: number;
  defaultCouponRate?: number;
  defaultYearsToMaturity?: number;
  defaultFrequency?: 1 | 2;
  defaultMode?: Mode;
  defaultPrice?: number;
  defaultYieldToMaturity?: number;
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
      fv: { default: defaultFaceValue, min: 0 },
      c: { default: defaultCouponRate },
      n: { default: defaultYearsToMaturity, min: 0.5 },
      f: { default: defaultFrequency, min: 1, max: 2 },
      px: { default: defaultPrice },
      y: { default: defaultYieldToMaturity },
      mode: { default: defaultMode === "yield" ? 1 : 0, min: 0, max: 1 },
    }),
    [
      defaultFaceValue,
      defaultCouponRate,
      defaultYearsToMaturity,
      defaultFrequency,
      defaultPrice,
      defaultYieldToMaturity,
      defaultMode,
    ]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const faceValue = urlState.fv;
  const couponRate = urlState.c;
  const yearsToMaturity = urlState.n;
  const frequency: 1 | 2 = urlState.f === 1 ? 1 : 2;
  const price = urlState.px;
  const yieldToMaturity = urlState.y;
  const mode: Mode = urlState.mode === 1 ? "yield" : "price";
  const setFaceValue = (v: number) => setUrlState((prev) => ({ ...prev, fv: v }));
  const setCouponRate = (v: number) => setUrlState((prev) => ({ ...prev, c: v }));
  const setYearsToMaturity = (v: number) => setUrlState((prev) => ({ ...prev, n: v }));
  const setFrequency = (v: 1 | 2) => setUrlState((prev) => ({ ...prev, f: v }));
  const setPrice = (v: number) => setUrlState((prev) => ({ ...prev, px: v }));
  const setYieldToMaturity = (v: number) => setUrlState((prev) => ({ ...prev, y: v }));
  const setMode = (v: Mode) => setUrlState((prev) => ({ ...prev, mode: v === "yield" ? 1 : 0 }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const bondBase = useMemo(
    () => ({
      faceValue: Math.max(faceValue, 0),
      couponRate: couponRate / 100,
      yearsToMaturity: Math.max(yearsToMaturity, 0.5),
      frequency,
    }),
    [faceValue, couponRate, yearsToMaturity, frequency]
  );

  const resolved = useMemo(() => {
    if (mode === "yield") {
      const y = yieldToMaturity / 100;
      try {
        const resolvedPrice = bondPrice({ ...bondBase, yieldToMaturity: y });
        return { yieldToMaturity: y, price: resolvedPrice, error: false };
      } catch {
        return { yieldToMaturity: y, price: null, error: true };
      }
    }
    const ytmResult = bondYtm({ ...bondBase, price });
    if (!ytmResult.converged || ytmResult.yieldToMaturity === null) {
      return { yieldToMaturity: null, price, error: true };
    }
    return { yieldToMaturity: ytmResult.yieldToMaturity, price, error: false };
  }, [mode, bondBase, price, yieldToMaturity]);

  const durations = useMemo(() => {
    if (resolved.error || resolved.yieldToMaturity === null) return null;
    try {
      return bondDurations({ ...bondBase, yieldToMaturity: resolved.yieldToMaturity });
    } catch {
      return null;
    }
  }, [bondBase, resolved]);

  const sensitivity = useMemo(() => {
    if (resolved.error || resolved.yieldToMaturity === null) return [];
    return bondRateSensitivity({ ...bondBase, yieldToMaturity: resolved.yieldToMaturity }, SENSITIVITY_DELTAS);
  }, [bondBase, resolved]);

  const annualCoupon = bondBase.faceValue * bondBase.couponRate;
  const currentYield = resolved.price && resolved.price > 0 ? annualCoupon / resolved.price : null;

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <div>
            <span className="mb-1 block text-sm font-medium text-foreground">אופן החישוב</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setMode("price")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  mode === "price" ? "border-primary bg-accent text-primary" : "border-border text-muted"
                }`}
              >
                לפי מחיר שוק
              </button>
              <button
                type="button"
                onClick={() => setMode("yield")}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  mode === "yield" ? "border-primary bg-accent text-primary" : "border-border text-muted"
                }`}
              >
                לפי תשואה לפדיון
              </button>
            </div>
          </div>
          <NumberField label="ערך נקוב" value={faceValue} onChange={setFaceValue} suffix={currencySymbol(currency)} />
          <NumberField label="קופון שנתי" value={couponRate} onChange={setCouponRate} suffix="%" step={0.1} />
          <NumberField
            label="שנים לפדיון"
            value={yearsToMaturity}
            onChange={setYearsToMaturity}
            suffix="שנים"
            min={0.5}
            step={0.5}
          />
          <div>
            <span className="mb-1 block text-sm font-medium text-foreground">תדירות תשלום קופון</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setFrequency(1)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  frequency === 1 ? "border-primary bg-accent text-primary" : "border-border text-muted"
                }`}
              >
                שנתי
              </button>
              <button
                type="button"
                onClick={() => setFrequency(2)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  frequency === 2 ? "border-primary bg-accent text-primary" : "border-border text-muted"
                }`}
              >
                חצי-שנתי
              </button>
            </div>
          </div>
          {mode === "price" ? (
            <NumberField label="מחיר שוק נוכחי" value={price} onChange={setPrice} suffix={currencySymbol(currency)} />
          ) : (
            <NumberField
              label="תשואה לפדיון (נקובה שנתית)"
              value={yieldToMaturity}
              onChange={setYieldToMaturity}
              suffix="%"
              step={0.1}
            />
          )}
        </>
      }
      results={
        resolved.error ? (
          <p className="text-sm text-red-700 dark:text-red-300">
            לא ניתן לחשב עבור הנתונים שהוזנו — בדקו שהמחיר וערך הנקוב חיוביים והתשואה סבירה.
          </p>
        ) : (
          <>
            {mode === "price" ? (
              <ResultCard
                label="תשואה לפדיון מחושבת"
                value={resolved.yieldToMaturity !== null ? formatPercent(resolved.yieldToMaturity, 2) : "—"}
                tone="primary"
              />
            ) : (
              <ResultCard
                label="מחיר מחושב"
                value={resolved.price !== null ? formatMoney(resolved.price, currency, { maximumFractionDigits: 2 }) : "—"}
                tone="primary"
              />
            )}
            <ResultCard
              label="תשואה שוטפת (Current Yield)"
              value={currentYield !== null ? formatPercent(currentYield, 2) : "—"}
              helpText="קופון שנתי חלקי מחיר שוק"
            />
            {durations && (
              <>
                <ResultCard
                  label="מח&quot;מ מקולי (Macaulay Duration)"
                  value={`${durations.macaulayDuration.toFixed(2)} שנים`}
                />
                <ResultCard
                  label="מח&quot;מ מותאם (Modified Duration)"
                  value={durations.modifiedDuration.toFixed(2)}
                  helpText="אחוז שינוי מחיר משוער לכל 1% שינוי בתשואה"
                />
              </>
            )}
          </>
        )
      }
      footer={
        !resolved.error && sensitivity.length > 0 ? (
          <div className="space-y-6">
            <div className="overflow-x-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                רגישות מחיר לשינויי תשואה
              </p>
              <table className="w-full min-w-[420px] text-start text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="p-2 text-start">שינוי תשואה</th>
                    <th className="p-2 text-start">תשואה לפדיון</th>
                    <th className="p-2 text-start">מחיר</th>
                  </tr>
                </thead>
                <tbody>
                  {sensitivity.map((row) => (
                    <tr
                      key={row.yieldDelta}
                      className={`border-t border-border ${row.yieldDelta === 0 ? "bg-accent font-bold text-primary" : ""}`}
                    >
                      <td className="p-2" dir="ltr">
                        {row.yieldDelta === 0 ? "0" : formatPercent(row.yieldDelta, 0)}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatPercent(row.yieldToMaturity, 2)}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatMoney(row.price, currency, { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-muted">
              הטבלה ממחישה את עיקרון היסוד של אג&quot;ח: ככל שהתשואה הנדרשת עולה, מחיר האג&quot;ח יורד —
              ולהפך. ככל שהמח&quot;מ ארוך יותר, השינוי במחיר לכל שינוי תשואה יהיה חד יותר.
            </p>
          </div>
        ) : undefined
      }
    />
  );
}

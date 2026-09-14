"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { marginOfSafety, buyBelowPrice } from "@/lib/finance/marginOfSafety";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   iv = intrinsicValue, px = price, tm = targetMargin
 */

export function MarginOfSafetyCalculator({
  defaultIntrinsicValue = 100,
  defaultPrice = 75,
  defaultTargetMargin = 30,
  defaultCurrency,
  syncUrl,
}: {
  defaultIntrinsicValue?: number;
  defaultPrice?: number;
  defaultTargetMargin?: number;
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
      iv: { default: defaultIntrinsicValue, min: 0 },
      px: { default: defaultPrice, min: 0 },
      tm: { default: defaultTargetMargin },
    }),
    [defaultIntrinsicValue, defaultPrice, defaultTargetMargin]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const intrinsicValue = urlState.iv;
  const price = urlState.px;
  const targetMargin = urlState.tm;
  const setIntrinsicValue = (v: number) => setUrlState((prev) => ({ ...prev, iv: v }));
  const setPrice = (v: number) => setUrlState((prev) => ({ ...prev, px: v }));
  const setTargetMargin = (v: number) => setUrlState((prev) => ({ ...prev, tm: v }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const mos = useMemo(() => marginOfSafety({ intrinsicValue, price }), [intrinsicValue, price]);
  const buyBelow = useMemo(
    () => buyBelowPrice(intrinsicValue, targetMargin / 100),
    [intrinsicValue, targetMargin]
  );

  const tone = mos >= targetMargin / 100 ? "success" : mos >= 0 ? "warning" : "warning";

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <NumberField
            label="שווי פנימי מוערך למניה"
            value={intrinsicValue}
            onChange={setIntrinsicValue}
            suffix={currencySymbol(currency)}
            min={0}
          />
          <NumberField
            label="מחיר שוק נוכחי"
            value={price}
            onChange={setPrice}
            suffix={currencySymbol(currency)}
            min={0}
          />
          <NumberField
            label="מרווח ביטחון יעד"
            value={targetMargin}
            onChange={setTargetMargin}
            suffix="%"
            step={1}
          />
        </>
      }
      results={
        <>
          <ResultCard
            label="מרווח ביטחון בפועל"
            value={formatPercent(mos, 1)}
            tone={tone}
            helpText={mos >= 0 ? "המחיר נמוך מהשווי הפנימי" : "המחיר גבוה מהשווי הפנימי"}
          />
          <ResultCard
            label={`מחיר קנייה מומלץ (מרווח ${targetMargin}%)`}
            value={formatMoney(buyBelow, currency, { maximumFractionDigits: 2 })}
            tone="primary"
          />
        </>
      }
      footer={
        <p className="text-sm text-muted">
          מרווח הביטחון הוא הכרית שמפצה על טעויות אפשריות בהערכת השווי הפנימי, אי-ודאות
          עתידית ותנודתיות בשוק. ככל שהשווי הפנימי פחות ודאי (למשל בחברות צמיחה או מחזוריות),
          כדאי לדרוש מרווח ביטחון גבוה יותר.
        </p>
      }
    />
  );
}

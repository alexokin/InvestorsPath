"use client";

import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { grahamNumber, grahamGrowthValue } from "@/lib/finance/graham";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

/**
 * URL query keys (only written when `syncUrl` is on — see below):
 *   eps = eps, bvps = bookValuePerShare, g = growthRate, aaa = aaaBondYield,
 *   px = price
 */

export function GrahamCalculator({
  defaultEps = 5,
  defaultBookValuePerShare = 20,
  defaultGrowthRate = 8,
  defaultAaaBondYield = 4.4,
  defaultPrice,
  defaultCurrency,
  syncUrl,
}: {
  defaultEps?: number;
  defaultBookValuePerShare?: number;
  defaultGrowthRate?: number;
  defaultAaaBondYield?: number;
  defaultPrice?: number;
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
      eps: { default: defaultEps },
      bvps: { default: defaultBookValuePerShare },
      g: { default: defaultGrowthRate },
      aaa: { default: defaultAaaBondYield },
      px: { default: defaultPrice ?? 0, min: 0 },
    }),
    [defaultEps, defaultBookValuePerShare, defaultGrowthRate, defaultAaaBondYield, defaultPrice]
  );
  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const eps = urlState.eps;
  const bookValuePerShare = urlState.bvps;
  const growthRate = urlState.g;
  const aaaBondYield = urlState.aaa;
  const price = urlState.px;
  const setEps = (v: number) => setUrlState((prev) => ({ ...prev, eps: v }));
  const setBookValuePerShare = (v: number) => setUrlState((prev) => ({ ...prev, bvps: v }));
  const setGrowthRate = (v: number) => setUrlState((prev) => ({ ...prev, g: v }));
  const setAaaBondYield = (v: number) => setUrlState((prev) => ({ ...prev, aaa: v }));
  const setPrice = (v: number) => setUrlState((prev) => ({ ...prev, px: v }));
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const number = useMemo(() => grahamNumber({ eps, bookValuePerShare }), [eps, bookValuePerShare]);
  const growthValue = useMemo(
    () => grahamGrowthValue({ eps, growthRatePercent: growthRate, aaaBondYieldPercent: aaaBondYield }),
    [eps, growthRate, aaaBondYield]
  );

  const discountVsNumber = price > 0 && number > 0 ? (number - price) / number : null;

  return (
    <CalculatorShell
      shareable={effectiveSyncUrl}
      inputs={
        <>
          <NumberField
            label="רווח למניה (EPS)"
            value={eps}
            onChange={setEps}
            suffix={currencySymbol(currency)}
            step={0.1}
          />
          <NumberField
            label="הון עצמי למניה (BVPS)"
            value={bookValuePerShare}
            onChange={setBookValuePerShare}
            suffix={currencySymbol(currency)}
            step={0.1}
          />
          <NumberField
            label="קצב צמיחה צפוי לטווח ארוך"
            value={growthRate}
            onChange={setGrowthRate}
            suffix="%"
            step={0.5}
          />
          <NumberField
            label="תשואת אג&quot;ח קונצרני AAA נוכחית"
            value={aaaBondYield}
            onChange={setAaaBondYield}
            suffix="%"
            step={0.1}
          />
          <NumberField
            label="מחיר מניה נוכחי (אופציונלי, להשוואה)"
            value={price}
            onChange={setPrice}
            suffix={currencySymbol(currency)}
            step={0.1}
          />
        </>
      }
      results={
        <>
          <ResultCard
            label="נוסחת גרהאם (שווי שמרני)"
            value={formatMoney(number, currency, { maximumFractionDigits: 2 })}
            tone="primary"
            helpText="√(22.5 × EPS × הון עצמי למניה)"
          />
          <ResultCard
            label="נוסחת גרהאם לצמיחה"
            value={formatMoney(growthValue, currency, { maximumFractionDigits: 2 })}
            helpText="EPS × (8.5 + 2g) × 4.4 / Y"
          />
          {discountVsNumber !== null && (
            <ResultCard
              label="מרווח מול נוסחת גרהאם"
              value={`${(discountVsNumber * 100).toFixed(1)}%`}
              tone={discountVsNumber > 0 ? "success" : "warning"}
              helpText={
                discountVsNumber > 0
                  ? "המחיר נמוך מנוסחת גרהאם"
                  : "המחיר גבוה מנוסחת גרהאם"
              }
            />
          )}
        </>
      }
      footer={
        <p className="text-sm text-muted">
          שתי הנוסחאות הן קיצורי דרך שמרנים משנות ה-30–70 ולא תחליף להערכת שווי מלאה. הן
          מתאימות בעיקר לחברות יציבות ורווחיות, ופחות לחברות צמיחה מהירה, חברות הפסדיות
          או חברות עם מבנה הון מורכב.
        </p>
      }
    />
  );
}

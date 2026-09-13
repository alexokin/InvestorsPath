"use client";

import { useEffect, useMemo, useState } from "react";
import { grahamNumber, grahamGrowthValue } from "@/lib/finance/graham";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";

export function GrahamCalculator({
  defaultEps = 5,
  defaultBookValuePerShare = 20,
  defaultGrowthRate = 8,
  defaultAaaBondYield = 4.4,
  defaultPrice,
  defaultCurrency,
}: {
  defaultEps?: number;
  defaultBookValuePerShare?: number;
  defaultGrowthRate?: number;
  defaultAaaBondYield?: number;
  defaultPrice?: number;
  defaultCurrency?: Currency;
}) {
  const [eps, setEps] = useState(defaultEps);
  const [bookValuePerShare, setBookValuePerShare] = useState(defaultBookValuePerShare);
  const [growthRate, setGrowthRate] = useState(defaultGrowthRate);
  const [aaaBondYield, setAaaBondYield] = useState(defaultAaaBondYield);
  const [price, setPrice] = useState(defaultPrice ?? 0);
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

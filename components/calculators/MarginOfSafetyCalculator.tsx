"use client";

import { useEffect, useMemo, useState } from "react";
import { marginOfSafety, buyBelowPrice } from "@/lib/finance/marginOfSafety";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";

export function MarginOfSafetyCalculator({
  defaultIntrinsicValue = 100,
  defaultPrice = 75,
  defaultTargetMargin = 30,
  defaultCurrency,
}: {
  defaultIntrinsicValue?: number;
  defaultPrice?: number;
  defaultTargetMargin?: number;
  defaultCurrency?: Currency;
}) {
  const [intrinsicValue, setIntrinsicValue] = useState(defaultIntrinsicValue);
  const [price, setPrice] = useState(defaultPrice);
  const [targetMargin, setTargetMargin] = useState(defaultTargetMargin);
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

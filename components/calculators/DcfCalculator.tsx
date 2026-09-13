"use client";

import { useEffect, useMemo, useState } from "react";
import { calculateDcf, dcfSensitivityGrid } from "@/lib/finance/dcf";
import { formatPercent } from "@/lib/format";
import { formatMoney, currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CalculatorShell } from "@/components/calculators/CalculatorShell";
import { NumberField } from "@/components/calculators/NumberField";
import { ResultCard } from "@/components/calculators/ResultCard";

const DISCOUNT_STEPS = [-0.02, -0.01, 0, 0.01, 0.02];
const TERMINAL_STEPS = [-0.01, -0.005, 0, 0.005, 0.01];

export function DcfCalculator({
  defaultFcf0 = 100,
  defaultGrowthRate = 8,
  defaultYears = 5,
  defaultDiscountRate = 10,
  defaultTerminalGrowthRate = 2.5,
  defaultNetDebt = 0,
  defaultShares = 100,
  defaultCurrency,
}: {
  defaultFcf0?: number;
  defaultGrowthRate?: number;
  defaultYears?: number;
  defaultDiscountRate?: number;
  defaultTerminalGrowthRate?: number;
  defaultNetDebt?: number;
  defaultShares?: number;
  defaultCurrency?: Currency;
}) {
  const [fcf0, setFcf0] = useState(defaultFcf0);
  const [growthRate, setGrowthRate] = useState(defaultGrowthRate);
  const [years, setYears] = useState(defaultYears);
  const [discountRate, setDiscountRate] = useState(defaultDiscountRate);
  const [terminalGrowthRate, setTerminalGrowthRate] = useState(defaultTerminalGrowthRate);
  const [netDebt, setNetDebt] = useState(defaultNetDebt);
  const [shares, setShares] = useState(defaultShares);
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const inputs = useMemo(
    () => ({
      fcf0,
      growthRate: growthRate / 100,
      years: Math.max(1, Math.round(years)),
      discountRate: discountRate / 100,
      terminalGrowthRate: terminalGrowthRate / 100,
      netDebt,
      sharesOutstanding: Math.max(1, shares),
    }),
    [fcf0, growthRate, years, discountRate, terminalGrowthRate, netDebt, shares]
  );

  const result = useMemo(() => {
    try {
      return calculateDcf(inputs);
    } catch {
      return null;
    }
  }, [inputs]);

  const grid = useMemo(() => {
    const discountRates = DISCOUNT_STEPS.map((d) => inputs.discountRate + d);
    const terminalRates = TERMINAL_STEPS.map((t) => inputs.terminalGrowthRate + t);
    return { discountRates, terminalRates, cells: dcfSensitivityGrid(inputs, discountRates, terminalRates) };
  }, [inputs]);

  return (
    <CalculatorShell
      inputs={
        <>
          <NumberField
            label="תזרים מזומנים חופשי נוכחי (FCF)"
            value={fcf0}
            onChange={setFcf0}
            suffix={`${currencySymbol(currency)} מיליון`}
          />
          <NumberField label="קצב צמיחה שנתי (שנות התחזית)" value={growthRate} onChange={setGrowthRate} suffix="%" step={0.5} />
          <NumberField label="מספר שנות תחזית" value={years} onChange={setYears} suffix="שנים" min={1} max={15} step={1} />
          <NumberField label="שיעור היוון (WACC)" value={discountRate} onChange={setDiscountRate} suffix="%" step={0.5} />
          <NumberField
            label="שיעור צמיחה טרמינלי"
            value={terminalGrowthRate}
            onChange={setTerminalGrowthRate}
            suffix="%"
            step={0.1}
          />
          <NumberField
            label="חוב נטו"
            value={netDebt}
            onChange={setNetDebt}
            suffix={`${currencySymbol(currency)} מיליון`}
          />
          <NumberField label="מספר מניות" value={shares} onChange={setShares} suffix="מיליון" min={1} />
        </>
      }
      results={
        result ? (
          <>
            <ResultCard
              label="שווי הוגן למניה"
              value={formatMoney(result.perShareValue, currency, { maximumFractionDigits: 2 })}
              tone="primary"
            />
            <ResultCard label="שווי פעילות (EV)" value={formatMoney(result.enterpriseValue, currency)} />
            <ResultCard label="שווי הון עצמי" value={formatMoney(result.equityValue, currency)} />
            <ResultCard
              label="ערך טרמינלי מהוון"
              value={formatMoney(result.pvTerminalValue, currency)}
              helpText={`${formatPercent(result.pvTerminalValue / result.enterpriseValue, 0)} מהשווי`}
            />
          </>
        ) : (
          <p className="text-sm text-red-700 dark:text-red-300">
            שיעור ההיוון חייב להיות גבוה משיעור הצמיחה הטרמינלי כדי לקבל תוצאה תקפה.
          </p>
        )
      }
      footer={
        <div className="space-y-6">
          {result && (
            <div className="overflow-x-auto">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                תזרימים לפי שנה
              </p>
              <table className="w-full min-w-[420px] text-start text-sm">
                <thead>
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="p-2 text-start">שנה</th>
                    <th className="p-2 text-start">FCF חזוי</th>
                    <th className="p-2 text-start">ערך נוכחי</th>
                  </tr>
                </thead>
                <tbody>
                  {result.projections.map((p) => (
                    <tr key={p.year} className="border-t border-border">
                      <td className="p-2" dir="ltr">
                        {p.year}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatMoney(p.fcf, currency, { maximumFractionDigits: 1 })}
                      </td>
                      <td className="p-2" dir="ltr">
                        {formatMoney(p.presentValue, currency, { maximumFractionDigits: 1 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="overflow-x-auto">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              ניתוח רגישות: שווי למניה לפי שיעור היוון (שורות) וצמיחה טרמינלית (עמודות)
            </p>
            <table className="w-full min-w-[420px] text-center text-sm">
              <thead>
                <tr>
                  <th className="p-2" />
                  {grid.terminalRates.map((t) => (
                    <th key={t} className="p-2 text-xs font-semibold text-muted" dir="ltr">
                      {formatPercent(t, 1)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {grid.discountRates.map((d, ri) => (
                  <tr key={d} className="border-t border-border">
                    <th className="p-2 text-xs font-semibold text-muted" dir="ltr">
                      {formatPercent(d, 1)}
                    </th>
                    {grid.cells[ri].map((cell, ci) => (
                      <td
                        key={ci}
                        dir="ltr"
                        className={[
                          "p-2",
                          DISCOUNT_STEPS[ri] === 0 && TERMINAL_STEPS[ci] === 0
                            ? "bg-accent font-bold text-primary"
                            : "",
                        ].join(" ")}
                      >
                        {cell ? formatMoney(cell.perShareValue, currency, { maximumFractionDigits: 1 }) : "—"}
                      </td>
                    ))}
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

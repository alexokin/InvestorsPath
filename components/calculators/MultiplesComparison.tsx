"use client";

import { useEffect, useMemo, useState } from "react";
import { compareMultiples, type MultiplesInputs, type MultiplesResult } from "@/lib/finance/multiples";
import { formatNumber } from "@/lib/format";
import { currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CurrencyToggle } from "@/components/calculators/CurrencyToggle";
import { NumberField } from "@/components/calculators/NumberField";

type Row = {
  key: keyof MultiplesResult;
  label: string;
  lowerIsBetter: boolean;
  format: (v: number) => string;
};

const ROWS: Row[] = [
  { key: "pe", label: "מכפיל רווח (P/E)", lowerIsBetter: true, format: (v) => formatNumber(v, 1) },
  { key: "pb", label: "מכפיל הון (P/B)", lowerIsBetter: true, format: (v) => formatNumber(v, 1) },
  { key: "ps", label: "מכפיל מכירות (P/S)", lowerIsBetter: true, format: (v) => formatNumber(v, 1) },
  { key: "evEbitda", label: "EV/EBITDA", lowerIsBetter: true, format: (v) => formatNumber(v, 1) },
  { key: "pFcf", label: "מכפיל תזרים חופשי (P/FCF)", lowerIsBetter: true, format: (v) => formatNumber(v, 1) },
  { key: "earningsYield", label: "תשואת רווח", lowerIsBetter: false, format: (v) => `${(v * 100).toFixed(1)}%` },
];

const DEFAULT_COMPANY: MultiplesInputs = {
  price: 100,
  sharesOutstanding: 10,
  netDebt: 50,
  earnings: 80,
  ebitda: 150,
  revenue: 600,
  fcf: 70,
  bookValue: 400,
};

function CompanyForm({
  index,
  company,
  currency,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  company: MultiplesInputs;
  currency: Currency;
  onChange: (next: MultiplesInputs) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  function set<K extends keyof MultiplesInputs>(key: K, value: MultiplesInputs[K]) {
    onChange({ ...company, [key]: value });
  }

  const moneySuffix = currencySymbol(currency);
  const moneySuffixMillion = `${moneySuffix} מיליון`;

  return (
    <div className="rounded-lg border border-border bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <input
          value={company.name ?? `חברה ${index + 1}`}
          onChange={(e) => set("name", e.target.value)}
          className="w-full rounded-md border border-border bg-surface px-2 py-1 text-sm font-semibold text-foreground"
        />
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-red-700"
          >
            הסרה
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <NumberField label="מחיר מניה" value={company.price} onChange={(v) => set("price", v)} suffix={moneySuffix} />
        <NumberField
          label="מניות (מיליון)"
          value={company.sharesOutstanding}
          onChange={(v) => set("sharesOutstanding", v)}
        />
        <NumberField
          label="חוב נטו"
          value={company.netDebt}
          onChange={(v) => set("netDebt", v)}
          suffix={moneySuffixMillion}
        />
        <NumberField
          label="רווח נקי"
          value={company.earnings}
          onChange={(v) => set("earnings", v)}
          suffix={moneySuffixMillion}
        />
        <NumberField
          label="EBITDA"
          value={company.ebitda}
          onChange={(v) => set("ebitda", v)}
          suffix={moneySuffixMillion}
        />
        <NumberField
          label="הכנסות"
          value={company.revenue}
          onChange={(v) => set("revenue", v)}
          suffix={moneySuffixMillion}
        />
        <NumberField
          label="תזרים חופשי"
          value={company.fcf}
          onChange={(v) => set("fcf", v)}
          suffix={moneySuffixMillion}
        />
        <NumberField
          label="הון עצמי"
          value={company.bookValue}
          onChange={(v) => set("bookValue", v)}
          suffix={moneySuffixMillion}
        />
      </div>
    </div>
  );
}

export function MultiplesComparison({
  defaultCompanies,
  defaultCurrency,
}: {
  defaultCompanies?: MultiplesInputs[];
  defaultCurrency?: Currency;
}) {
  const [companies, setCompanies] = useState<MultiplesInputs[]>(
    defaultCompanies && defaultCompanies.length >= 2
      ? defaultCompanies.slice(0, 4)
      : [
          { ...DEFAULT_COMPANY, name: "חברה א" },
          { ...DEFAULT_COMPANY, name: "חברה ב", price: 60, earnings: 50, ebitda: 90, revenue: 400 },
        ]
  );
  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const results = useMemo(() => compareMultiples(companies), [companies]);

  function updateCompany(index: number, next: MultiplesInputs) {
    setCompanies((prev) => prev.map((c, i) => (i === index ? next : c)));
  }

  function addCompany() {
    if (companies.length >= 4) return;
    setCompanies((prev) => [...prev, { ...DEFAULT_COMPANY, name: `חברה ${prev.length + 1}` }]);
  }

  function removeCompany(index: number) {
    setCompanies((prev) => (prev.length > 2 ? prev.filter((_, i) => i !== index) : prev));
  }

  return (
    <div className="space-y-6">
      <CurrencyToggle />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {companies.map((company, i) => (
          <CompanyForm
            key={i}
            index={i}
            company={company}
            currency={currency}
            onChange={(next) => updateCompany(i, next)}
            onRemove={() => removeCompany(i)}
            removable={companies.length > 2}
          />
        ))}
      </div>

      {companies.length < 4 && (
        <button
          type="button"
          onClick={addCompany}
          className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-muted hover:border-primary hover:text-primary"
        >
          + הוספת חברה להשוואה
        </button>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <table className="w-full min-w-[420px] text-start text-sm">
          <thead>
            <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="p-3 text-start">מדד</th>
              {results.map((r, i) => (
                <th key={i} className="p-3 text-start">
                  {r.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => {
              const values = results.map((r) => r[row.key] as number | null);
              const numericValues = values.filter((v): v is number => v !== null);
              const max = numericValues.length > 0 ? Math.max(...numericValues) : 0;
              const best = numericValues.length > 0
                ? row.lowerIsBetter
                  ? Math.min(...numericValues)
                  : Math.max(...numericValues)
                : null;

              return (
                <tr key={row.key} className="border-b border-border last:border-0">
                  <td className="p-3 font-medium text-foreground">{row.label}</td>
                  {values.map((v, i) => (
                    <td key={i} className="p-3" dir="ltr">
                      {v === null ? (
                        <span className="text-xs text-muted">—</span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-200">
                            <span
                              className={`block h-full rounded-full ${v === best ? "bg-primary" : "bg-slate-400"}`}
                              style={{ width: `${Math.max(4, Math.min(100, (v / (max || 1)) * 100))}%` }}
                            />
                          </span>
                          <span className={v === best ? "font-semibold text-foreground" : ""}>
                            {row.format(v)}
                          </span>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted">
        הפס המודגש מציין את הערך הכי אטרקטיבי בכל שורה (מכפיל נמוך יותר, או תשואת רווח גבוהה
        יותר). מכפילים אינם משווים לבד — יש להביא בחשבון גם צמיחה, איכות רווחים וסיכון.
      </p>
    </div>
  );
}

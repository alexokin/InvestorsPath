"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { compareMultiples, type MultiplesInputs, type MultiplesResult } from "@/lib/finance/multiples";
import { formatNumber } from "@/lib/format";
import { currencySymbol, type Currency } from "@/lib/currency";
import { useCurrency } from "@/components/calculators/CurrencyProvider";
import { CurrencyToggle } from "@/components/calculators/CurrencyToggle";
import { ShareLinkButton } from "@/components/calculators/ShareLinkButton";
import { NumberField } from "@/components/calculators/NumberField";
import { useUrlSyncedState, type UrlStateSchema } from "@/lib/calculators/url-state";

/**
 * URL query keys (only written when `syncUrl` is on — see below). Company
 * names are intentionally NOT synced (the schema is numeric-only); only
 * the numeric fields and the company count are:
 *   cnt = number of companies shown (2-4)
 *   for company slot i (1-4): c{i}p = price, c{i}sh = sharesOutstanding,
 *     c{i}nd = netDebt, c{i}e = earnings, c{i}eb = ebitda,
 *     c{i}rev = revenue, c{i}fcf = fcf, c{i}bv = bookValue
 *   e.g. c2p=45&c2sh=8 sets the second company's price and share count.
 */

const MAX_COMPANIES = 4;

/** Short field key -> MultiplesInputs key, used to build/read the flat URL schema. */
const FIELD_KEYS = {
  p: "price",
  sh: "sharesOutstanding",
  nd: "netDebt",
  e: "earnings",
  eb: "ebitda",
  rev: "revenue",
  fcf: "fcf",
  bv: "bookValue",
} as const satisfies Record<string, keyof MultiplesInputs>;

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

/** The second built-in company (used when no `defaultCompanies` prop is given). */
const DEFAULT_COMPANY_2: MultiplesInputs = {
  ...DEFAULT_COMPANY,
  price: 60,
  earnings: 50,
  ebitda: 90,
  revenue: 400,
};

/** Numeric defaults for company slot `index` (0-based), used to build the URL schema. */
function defaultCompanyAt(index: number, defaultCompanies?: MultiplesInputs[]): MultiplesInputs {
  if (defaultCompanies?.[index]) return defaultCompanies[index];
  return index === 1 ? DEFAULT_COMPANY_2 : DEFAULT_COMPANY;
}

/** Default display name for company slot `index` (0-based). Never synced to the URL. */
function defaultNameAt(index: number, defaultCompanies?: MultiplesInputs[]): string {
  if (defaultCompanies?.[index]?.name) return defaultCompanies[index].name as string;
  if (index === 0) return "חברה א";
  if (index === 1) return "חברה ב";
  return `חברה ${index + 1}`;
}

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
    <div className="rounded-lg border border-border bg-background p-4">
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
            className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-red-700 dark:hover:text-red-300"
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
  syncUrl,
}: {
  defaultCompanies?: MultiplesInputs[];
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

  const initialCount =
    defaultCompanies && defaultCompanies.length >= 2 ? Math.min(defaultCompanies.length, MAX_COMPANIES) : 2;

  const schema: UrlStateSchema = useMemo(() => {
    const s: UrlStateSchema = {
      cnt: { default: initialCount, min: 2, max: MAX_COMPANIES },
    };
    for (let i = 0; i < MAX_COMPANIES; i++) {
      const d = defaultCompanyAt(i, defaultCompanies);
      for (const [fieldKey, inputKey] of Object.entries(FIELD_KEYS)) {
        s[`c${i + 1}${fieldKey}`] = { default: d[inputKey] as number };
      }
    }
    return s;
  }, [defaultCompanies, initialCount]);

  const [urlState, setUrlState] = useUrlSyncedState(schema, { enabled: effectiveSyncUrl });
  const [names, setNames] = useState<string[]>(() =>
    Array.from({ length: MAX_COMPANIES }, (_, i) => defaultNameAt(i, defaultCompanies))
  );

  const companyCount = Math.min(MAX_COMPANIES, Math.max(2, Math.round(urlState.cnt)));

  const companies: MultiplesInputs[] = useMemo(() => {
    const list: MultiplesInputs[] = [];
    for (let i = 0; i < companyCount; i++) {
      const d = defaultCompanyAt(i, defaultCompanies);
      list.push({
        name: names[i],
        price: urlState[`c${i + 1}p`] ?? d.price,
        sharesOutstanding: urlState[`c${i + 1}sh`] ?? d.sharesOutstanding,
        netDebt: urlState[`c${i + 1}nd`] ?? d.netDebt,
        earnings: urlState[`c${i + 1}e`] ?? d.earnings,
        ebitda: urlState[`c${i + 1}eb`] ?? d.ebitda,
        revenue: urlState[`c${i + 1}rev`] ?? d.revenue,
        fcf: urlState[`c${i + 1}fcf`] ?? d.fcf,
        bookValue: urlState[`c${i + 1}bv`] ?? d.bookValue,
      });
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- defaultCompanies identity is stable per mount
  }, [urlState, names, companyCount]);

  const { currency, seedDefaultCurrency } = useCurrency();

  useEffect(() => {
    if (defaultCurrency) seedDefaultCurrency(defaultCurrency);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once on mount
  }, []);

  const results = useMemo(() => compareMultiples(companies), [companies]);

  function updateCompany(index: number, next: MultiplesInputs) {
    if (next.name !== names[index]) {
      setNames((prev) => {
        const copy = [...prev];
        copy[index] = next.name ?? copy[index];
        return copy;
      });
    }
    setUrlState((prev) => {
      const nextState = { ...prev };
      for (const [fieldKey, inputKey] of Object.entries(FIELD_KEYS)) {
        nextState[`c${index + 1}${fieldKey}`] = next[inputKey] as number;
      }
      return nextState;
    });
  }

  function addCompany() {
    if (companyCount >= MAX_COMPANIES) return;
    // The new slot already carries its schema default (DEFAULT_COMPANY,
    // or defaultCompanies[companyCount] when provided) — just reveal it.
    setNames((prev) => {
      const copy = [...prev];
      copy[companyCount] = defaultNameAt(companyCount, defaultCompanies);
      return copy;
    });
    setUrlState((prev) => ({ ...prev, cnt: companyCount + 1 }));
  }

  function removeCompany(index: number) {
    if (companyCount <= 2) return;
    setUrlState((prev) => {
      const nextState = { ...prev };
      // Shift every later company's values down into the removed slot...
      for (let i = index; i < companyCount - 1; i++) {
        for (const fieldKey of Object.keys(FIELD_KEYS)) {
          nextState[`c${i + 1}${fieldKey}`] = prev[`c${i + 2}${fieldKey}`];
        }
      }
      // ...and reset the now-vacated last slot back to its schema default.
      const lastDefault = defaultCompanyAt(companyCount - 1, defaultCompanies);
      for (const [fieldKey, inputKey] of Object.entries(FIELD_KEYS)) {
        nextState[`c${companyCount}${fieldKey}`] = lastDefault[inputKey] as number;
      }
      nextState.cnt = companyCount - 1;
      return nextState;
    });
    setNames((prev) => {
      const copy = [...prev];
      copy.splice(index, 1);
      copy.push(defaultNameAt(companyCount - 1, defaultCompanies));
      return copy;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <CurrencyToggle />
        {effectiveSyncUrl && <ShareLinkButton />}
      </div>

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
                          <span className="h-2 w-16 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <span
                              className={`block h-full rounded-full ${v === best ? "bg-primary" : "bg-slate-400 dark:bg-slate-500"}`}
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

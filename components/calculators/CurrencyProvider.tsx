"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  readStoredCurrency,
  writeStoredCurrency,
  type Currency,
} from "@/lib/currency";

type CurrencyContextValue = {
  /** Hydration-safe: false until the persisted value has been read on mount. */
  hydrated: boolean;
  /** Whether the visitor has explicitly picked a currency (vs. a seeded default). */
  hasUserChoice: boolean;
  currency: Currency;
  /** Explicit user choice — persisted to localStorage. */
  setCurrency: (currency: Currency) => void;
  /**
   * Seeds the initial currency from a calculator's `defaultCurrency` prop.
   * A no-op once the visitor has made an explicit choice (or a previous
   * seed already applied), so the first calculator to mount on a page wins
   * and switching pages/currencies later isn't overridden.
   */
  seedDefaultCurrency: (currency: Currency) => void;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("ILS");
  const [hydrated, setHydrated] = useState(false);
  const [hasUserChoice, setHasUserChoice] = useState(false);
  const hasUserChoiceRef = useRef(false);
  const hasSeededRef = useRef(false);

  useEffect(() => {
    const stored = readStoredCurrency();
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage on mount
      setCurrencyState(stored);
      setHasUserChoice(true);
      hasUserChoiceRef.current = true;
    }
    setHydrated(true);
  }, []);

  const value = useMemo<CurrencyContextValue>(
    () => ({
      hydrated,
      hasUserChoice,
      currency,
      setCurrency: (next) => {
        hasUserChoiceRef.current = true;
        setHasUserChoice(true);
        setCurrencyState(next);
        writeStoredCurrency(next);
      },
      seedDefaultCurrency: (next) => {
        if (hasUserChoiceRef.current || hasSeededRef.current) return;
        hasSeededRef.current = true;
        setCurrencyState(next);
      },
    }),
    [currency, hydrated, hasUserChoice]
  );

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
}

export function useCurrency(): CurrencyContextValue {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}

"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { fetchUsdSekRate, type Currency } from "./currency";

interface CurrencyContextType {
  currency: Currency;
  rate: number;
  setCurrency: (c: Currency) => void;
  toggle: () => void;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  rate: 10.5,
  setCurrency: () => {},
  toggle: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [rate, setRate]              = useState(10.5);

  useEffect(() => {
    // Load saved preference
    const saved = localStorage.getItem("preferred_currency") as Currency | null;
    if (saved === "SEK" || saved === "USD") setCurrencyState(saved);

    // Fetch live rate
    fetchUsdSekRate().then(setRate);
  }, []);

  function setCurrency(c: Currency) {
    setCurrencyState(c);
    localStorage.setItem("preferred_currency", c);
  }

  function toggle() {
    setCurrency(currency === "USD" ? "SEK" : "USD");
  }

  return (
    <CurrencyContext.Provider value={{ currency, rate, setCurrency, toggle }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

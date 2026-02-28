/**
 * Currency context — USD/SEK toggle with live exchange rate.
 * Rate is fetched from exchangerate-api (free, no key needed for basic use).
 * Falls back to a hardcoded rate if fetch fails.
 */

const FALLBACK_RATE = 10.5; // USD → SEK fallback
const RATE_CACHE_KEY = "usd_sek_rate";
const RATE_CACHE_TIME_KEY = "usd_sek_rate_fetched";
const RATE_MAX_AGE_MS = 6 * 60 * 60 * 1000; // 6 hours

export type Currency = "USD" | "SEK";

export async function fetchUsdSekRate(): Promise<number> {
  // Return cached rate if fresh
  if (typeof window !== "undefined") {
    const cached    = localStorage.getItem(RATE_CACHE_KEY);
    const fetchedAt = localStorage.getItem(RATE_CACHE_TIME_KEY);
    if (cached && fetchedAt) {
      const age = Date.now() - parseInt(fetchedAt);
      if (age < RATE_MAX_AGE_MS) return parseFloat(cached);
    }
  }

  try {
    const res  = await fetch("https://open.er-api.com/v6/latest/USD");
    const data = await res.json();
    const rate = data?.rates?.SEK as number;
    if (rate && rate > 0) {
      if (typeof window !== "undefined") {
        localStorage.setItem(RATE_CACHE_KEY, rate.toString());
        localStorage.setItem(RATE_CACHE_TIME_KEY, Date.now().toString());
      }
      return rate;
    }
  } catch {}

  return FALLBACK_RATE;
}

export function convertAmount(
  amount: number | null | undefined,
  currency: Currency,
  rate: number
): number | null {
  if (amount == null) return null;
  return currency === "SEK" ? amount * rate : amount;
}

export function formatCurrencyWithRate(
  amount: number | null | undefined,
  currency: Currency,
  rate: number
): string {
  const converted = convertAmount(amount, currency, rate);
  if (converted == null) return "—";
  const symbol = currency === "SEK" ? "kr" : "$";
  const locale = currency === "SEK" ? "sv-SE" : "en-US";
  const formatted = Math.abs(converted).toLocaleString(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: currency === "SEK" ? 0 : (converted < 1 ? 4 : 0),
  });
  return currency === "SEK"
    ? `${formatted} ${symbol}`
    : `${symbol}${formatted}`;
}

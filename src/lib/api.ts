const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InsiderTrade {
  id: number;
  filing_date: string | null;
  trade_date: string | null;
  ticker: string;
  company_name: string | null;
  insider_name: string | null;
  insider_title: string | null;
  transaction_type: string | null;
  price: number | null;
  qty: number | null;
  owned: number | null;
  delta_own: string | null;
  value: number | null;
  scraped_at: string | null;
}

export interface MyTrade {
  id: number;
  ticker: string;
  trade_type: "buy" | "sell";
  trade_date: string;
  shares: number;
  price: number;
  total_value: number | null;
  notes: string | null;
  related_insider_trade_id: number | null;
  created_at: string | null;
  performance: Performance | null;
}

export interface MyTradeCreate {
  ticker: string;
  trade_type: "buy" | "sell";
  trade_date: string;
  shares: number;
  price: number;
  notes?: string;
  related_insider_trade_id?: number;
}

export interface Performance {
  id: number;
  ticker: string;
  price_at_trade: number | null;
  price_1w: number | null;
  price_2w: number | null;
  price_1m: number | null;
  price_3m: number | null;
  price_6m: number | null;
  price_1y: number | null;
  return_1w: number | null;
  return_2w: number | null;
  return_1m: number | null;
  return_3m: number | null;
  return_6m: number | null;
  return_1y: number | null;
  updated_at: string | null;
}

export interface DashboardStats {
  total_insider_trades: number;
  total_my_trades: number;
  tickers_tracked: number;
  best_performing_trade: string | null;
  avg_return_1m_all: number | null;
}

export interface TickerSummary {
  ticker: string;
  total_insider_purchases: number;
  total_insider_sales: number;
  total_insider_purchase_value: number;
  total_insider_sale_value: number;
  my_trade_count: number;
  avg_return_1m: number | null;
  avg_return_3m: number | null;
}

// ─── Insider Trades ───────────────────────────────────────────────────────────

export const insiderApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
    return apiFetch<InsiderTrade[]>(`/insider/${qs}`);
  },
  count: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<{ count: number }>(`/insider/count${qs}`);
  },
  tickers: () => apiFetch<string[]>("/insider/tickers"),
  tickerSummary: (ticker: string) => apiFetch<TickerSummary>(`/insider/ticker/${ticker}/summary`),
  get: (id: number) => apiFetch<InsiderTrade>(`/insider/${id}`),
};

// ─── My Trades ────────────────────────────────────────────────────────────────

export const myTradesApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<MyTrade[]>(`/my-trades/${qs}`);
  },
  create: (data: MyTradeCreate) =>
    apiFetch<MyTrade>("/my-trades/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<MyTrade>) =>
    apiFetch<MyTrade>(`/my-trades/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: number) =>
    apiFetch<void>(`/my-trades/${id}`, { method: "DELETE" }),
};

// ─── Performance ──────────────────────────────────────────────────────────────

export const performanceApi = {
  dashboard: () => apiFetch<DashboardStats>("/performance/dashboard"),
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return apiFetch<Performance[]>(`/performance/${qs}`);
  },
  get: (myTradeId: number) => apiFetch<Performance>(`/performance/${myTradeId}`),
  update: (myTradeId: number, data: Partial<Performance>) =>
    apiFetch<Performance>(`/performance/${myTradeId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error ${res.status}: ${error}`);
  }
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
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

export interface CompanyData {
  ticker: string;
  yahoo_url: string;
  prices: { date: string; close: number }[];
  insider_trades: {
    id: number;
    date: string | null;
    insider_name: string | null;
    insider_title: string | null;
    transaction_type: string | null;
    price: number | null;
    qty: number | null;
    value: number | null;
  }[];
  my_trades: {
    id: number;
    date: string | null;
    trade_type: "buy" | "sell";
    shares: number;
    price: number;
    total_value: number | null;
    notes: string | null;
    return_1m: number | null;
    return_3m: number | null;
  }[];
  summary: {
    total_insider_purchases: number;
    total_insider_sales: number;
    total_insider_purchase_value: number;
    total_insider_sale_value: number;
    my_trade_count: number;
    my_buy_count: number;
    my_sell_count: number;
  };
}

// ─── API clients ──────────────────────────────────────────────────────────────

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
  get: (id: number) => apiFetch<InsiderTrade>(`/insider/${id}`),
};

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

export const companyApi = {
  get: (ticker: string) => apiFetch<CompanyData>(`/company/${ticker}`),
};

export const priceApi = {
  refresh: (ticker: string) =>
    apiFetch<{ ticker: string; cached: number; message: string }>(
      `/company/prices/refresh/${ticker}`,
      { method: "POST" }
    ),
};

export interface PortfolioPosition {
  ticker: string;
  shares: number;
  avg_cost: number;
  cost_basis: number;
  current_price: number | null;
  price_date: string | null;
  current_value: number | null;
  unrealized_pnl: number | null;
  unrealized_pct: number | null;
  realized_pnl: number;
  total_pnl: number;
  trade_count: number;
  first_buy_date: string | null;
  last_trade_date: string | null;
  is_open: boolean;
}

export interface PortfolioSummary {
  total_portfolio_value: number;
  total_cost_basis: number;
  total_unrealized_pnl: number;
  total_unrealized_pct: number;
  total_realized_pnl: number;
  total_pnl: number;
  open_positions: number;
  closed_positions: number;
}

export interface PortfolioData {
  positions: PortfolioPosition[];
  summary: PortfolioSummary;
}

export const portfolioApi = {
  get: () => apiFetch<PortfolioData>("/portfolio/"),
};

export const performanceUpdateApi = {
  updateAll: () => apiFetch<{ trades_checked: number; trades_updated: number; snapshots_filled: number; message: string }>(
    "/performance/update-all",
    { method: "POST" }
  ),
};

// ── Watchlist types ───────────────────────────────────────────────────────────
export interface WatchlistSummary {
  id: number;
  name: string;
  item_count: number;
  created_at: string;
}

export interface WatchlistItem {
  id: number;
  ticker: string;
  notes: string | null;
  added_at: string;
  price: number | null;
  price_date: string | null;
  total_insider_buys: number;
  total_insider_sells: number;
  latest_buy_date: string | null;
  latest_buy_value: number | null;
  latest_sell_date: string | null;
}

export interface WatchlistDetail {
  id: number;
  name: string;
  created_at: string;
  items: WatchlistItem[];
}

export const watchlistApi = {
  list: () =>
    apiFetch<WatchlistSummary[]>("/watchlists/"),
  create: (name: string) =>
    apiFetch<WatchlistSummary>("/watchlists/", { method: "POST", body: JSON.stringify({ name }) }),
  get: (id: number) =>
    apiFetch<WatchlistDetail>(`/watchlists/${id}`),
  rename: (id: number, name: string) =>
    apiFetch<WatchlistSummary>(`/watchlists/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  delete: (id: number) =>
    apiFetch<void>(`/watchlists/${id}`, { method: "DELETE" }),
  addItem: (watchlistId: number, ticker: string, notes?: string) =>
    apiFetch<WatchlistItem>(`/watchlists/${watchlistId}/items`, { method: "POST", body: JSON.stringify({ ticker, notes }) }),
  removeItem: (watchlistId: number, itemId: number) =>
    apiFetch<void>(`/watchlists/${watchlistId}/items/${itemId}`, { method: "DELETE" }),
  // NEW: update notes on an existing item
  updateItemNotes: (watchlistId: number, itemId: number, notes: string) =>
    apiFetch<WatchlistItem>(`/watchlists/${watchlistId}/items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({ ticker: "", notes }), // ticker ignored by backend on PATCH
    }),
};


export interface ScreenerResult {
  ticker:            string;
  company_name:      string | null;
  conviction_score:  number;
  distinct_buyers:   number;
  total_trades:      number;
  total_value:       number;
  total_buys_ever:   number;
  total_sells_ever:  number;
  latest_trade_date: string | null;
  latest_insider:    string | null;
  latest_title:      string | null;
  price:             number | null;
  is_cluster:        boolean;
}

export interface ClusterBuyResult {
  ticker:          string;
  company_name:    string | null;
  distinct_buyers: number;
  total_trades:    number;
  total_value:     number;
  first_buy:       string | null;
  last_buy:        string | null;
  price:           number | null;
  insiders: Array<{
    name:  string | null;
    title: string | null;
    value: number | null;
    date:  string | null;
  }>;
}

export const signalsApi = {
  screener: (params: {
    days?: number;
    min_buyers?: number;
    min_value?: number;
    officer_only?: boolean;
    sort_by?: string;
    limit?: number;
  }) => {
    const p: Record<string, string> = {};
    if (params.days        != null) p.days         = String(params.days);
    if (params.min_buyers  != null) p.min_buyers    = String(params.min_buyers);
    if (params.min_value   != null) p.min_value     = String(params.min_value);
    if (params.officer_only)        p.officer_only  = "true";
    if (params.sort_by)             p.sort_by       = params.sort_by;
    if (params.limit       != null) p.limit         = String(params.limit);
    const qs = new URLSearchParams(p).toString();
    return apiFetch<ScreenerResult[]>(`/signals/screener?${qs}`);
  },

  clusterBuys: (params?: { days?: number; min_insiders?: number; min_value?: number }) => {
    const p: Record<string, string> = {};
    if (params?.days)         p.days         = String(params.days);
    if (params?.min_insiders) p.min_insiders = String(params.min_insiders);
    if (params?.min_value)    p.min_value    = String(params.min_value);
    const qs = new URLSearchParams(p).toString();
    return apiFetch<ClusterBuyResult[]>(`/signals/cluster-buys?${qs}`);
  },

  conviction: (params?: { days?: number; min_score?: number; officer_only?: boolean; limit?: number }) => {
    const p: Record<string, string> = {};
    if (params?.days)         p.days         = String(params.days);
    if (params?.min_score)    p.min_score    = String(params.min_score);
    if (params?.officer_only) p.officer_only = "true";
    if (params?.limit)        p.limit        = String(params.limit);
    const qs = new URLSearchParams(p).toString();
    return apiFetch<ScreenerResult[]>(`/signals/conviction?${qs}`);
  },
};

"use client";
import TickerLink from "@/components/ui/TickerLink";
import { useEffect, useState, useCallback } from "react";
import { insiderApi, type InsiderTrade } from "@/lib/api";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate } from "@/lib/currency";
import { formatCurrency, formatDate, tradeTypeBadge } from "@/lib/utils";
import { Search, Download, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal, X } from "lucide-react";
import clsx from "clsx";

const PAGE_SIZE = 50;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function InsiderPage() {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currency, rate } = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);
  const [showFilters, setShowFilters] = useState(false);

  const [ticker, setTicker]     = useState("");
  const [txType, setTxType]     = useState("");
  const [minValue, setMinValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  const [fetchTicker, setFetchTicker]   = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchResult, setFetchResult]   = useState<{ inserted: number; skipped: number } | null>(null);
  const [fetchError, setFetchError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = { limit: PAGE_SIZE, offset: page * PAGE_SIZE };
    if (ticker)   params.ticker = ticker.toUpperCase();
    if (txType)   params.transaction_type = txType;
    if (minValue) params.min_value = minValue;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to = dateTo;
    try {
      const [data, count] = await Promise.all([
        insiderApi.list(params),
        insiderApi.count(Object.fromEntries(
          Object.entries(params)
            .filter(([k]) => !["limit","offset"].includes(k))
            .map(([k,v]) => [k, String(v)])
        )),
      ]);
      setTrades(data);
      setTotal(count.count);
    } finally {
      setLoading(false);
    }
  }, [page, ticker, txType, minValue, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(0);
    setShowFilters(false);
    load();
  }

  function handleClear() {
    setTicker(""); setTxType(""); setMinValue(""); setDateFrom(""); setDateTo(""); setPage(0);
  }

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!fetchTicker.trim()) return;
    setFetchLoading(true);
    setFetchResult(null);
    setFetchError("");
    try {
      const res = await fetch(`${API_BASE}/insider/fetch/${fetchTicker.trim().toUpperCase()}?years=5`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to fetch");
      setFetchResult(data);
      setFetchTicker("");
      load();
    } catch (err: any) {
      setFetchError(err.message ?? "Something went wrong");
    } finally {
      setFetchLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100">Insider Trades</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">SEC Form 4 data</p>
        </div>
        <button onClick={() => setShowFilters(f => !f)} className="btn-secondary flex items-center gap-2 md:hidden">
          <SlidersHorizontal size={14} />
          Filters
        </button>
      </div>

      

      {/* Filters */}
      <form
        onSubmit={handleSearch}
        className={clsx(
          "card space-y-3",
          showFilters ? "block" : "hidden md:block"
        )}
      >
        <div className="flex items-center justify-between md:hidden">
          <span className="text-sm font-semibold text-gray-300">Filters</span>
          <button type="button" onClick={() => setShowFilters(false)}><X size={16} className="text-gray-500" /></button>
        </div>
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Ticker</label>
            <input className="input" placeholder="AAPL" value={ticker} onChange={e => setTicker(e.target.value)} autoCapitalize="characters" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Type</label>
            <select className="input" value={txType} onChange={e => setTxType(e.target.value)}>
              <option value="">All</option>
              <option value="P - Purchase">Purchase</option>
              <option value="S - Sale">Sale</option>
              <option value="F - Tax">Tax</option>
              <option value="X - Exercise">Exercise</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Min Value ($)</label>
            <input className="input" placeholder="50000" value={minValue} onChange={e => setMinValue(e.target.value)} inputMode="numeric" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">From</label>
            <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">To</label>
            <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex items-center gap-2">
            <Search size={14} /> Search
          </button>
          <button type="button" className="btn-secondary" onClick={handleClear}>Clear</button>
        </div>
      </form>


      {/* Fetch by ticker */}
      <div className="card border-green-900/50 bg-green-950/20">
        <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">Fetch company data</p>
        <form onSubmit={handleFetch} className="flex gap-2">
          <input
            className="input flex-1 min-w-0"
            placeholder="Ticker e.g. AAPL"
            value={fetchTicker}
            onChange={e => setFetchTicker(e.target.value)}
            disabled={fetchLoading}
            autoCapitalize="characters"
          />
          <button type="submit" disabled={fetchLoading || !fetchTicker.trim()} className="btn-primary flex items-center gap-2 shrink-0">
            {fetchLoading
              ? <Loader2 size={14} className="animate-spin" />
              : <Download size={14} />
            }
            <span className="hidden sm:inline">{fetchLoading ? "Fetching…" : "Fetch 5yr"}</span>
          </button>
        </form>
        {fetchResult && (
          <p className="text-sm text-green-400 mt-2">✅ {fetchResult.inserted} new, {fetchResult.skipped} skipped</p>
        )}
        {fetchError && (
          <p className="text-sm text-red-400 mt-2">❌ {fetchError}</p>
        )}
      </div>


      {/* Pagination bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-400">{total.toLocaleString()} results</span>
        <div className="flex items-center gap-2">
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary p-1.5 disabled:opacity-40">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-gray-500">{page + 1} / {totalPages || 1}</span>
          <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-secondary p-1.5 disabled:opacity-40">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {loading && <p className="text-center text-gray-600 py-8">Loading…</p>}
        {!loading && trades.length === 0 && <p className="text-center text-gray-600 py-8">No trades found.</p>}
        {!loading && trades.map((t) => (
          <div key={t.id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TickerLink ticker={t.ticker} />
                <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", tradeTypeBadge(t.transaction_type))}>
                  {t.transaction_type?.split(" - ")[1] ?? t.transaction_type ?? "—"}
                </span>
              </div>
              <span className="font-semibold text-gray-200">{fmt(t.value)}</span>
            </div>
            <p className="text-xs text-gray-400 truncate">{t.insider_name ?? "—"} · {t.insider_title ?? "—"}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{t.company_name ?? "—"}</span>
              <span>{formatDate(t.trade_date)}</span>
            </div>
            {t.price && t.qty && (
              <p className="text-xs text-gray-600">${t.price.toFixed(2)} × {t.qty.toLocaleString()} shares</p>
            )}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                {["Date","Ticker","Company","Insider","Title","Type","Price","Qty","Value"].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && <tr><td colSpan={9} className="td text-center text-gray-600 py-10">Loading…</td></tr>}
              {!loading && trades.length === 0 && <tr><td colSpan={9} className="td text-center text-gray-600 py-10">No trades found.</td></tr>}
              {!loading && trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="td whitespace-nowrap">{formatDate(t.trade_date)}</td>
                  <td className="td"><TickerLink ticker={t.ticker} /></td>
                  <td className="td max-w-[160px] truncate">{t.company_name ?? "—"}</td>
                  <td className="td max-w-[140px] truncate">{t.insider_name ?? "—"}</td>
                  <td className="td max-w-[120px] truncate text-gray-500">{t.insider_title ?? "—"}</td>
                  <td className="td">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap", tradeTypeBadge(t.transaction_type))}>
                      {t.transaction_type?.split(" - ")[1] ?? t.transaction_type ?? "—"}
                    </span>
                  </td>
                  <td className="td whitespace-nowrap">{t.price ? `$${t.price.toFixed(2)}` : "—"}</td>
                  <td className="td whitespace-nowrap">{t.qty?.toLocaleString() ?? "—"}</td>
                  <td className="td whitespace-nowrap font-semibold">{fmt(t.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

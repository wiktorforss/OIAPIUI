"use client";
import { useEffect, useState, useCallback } from "react";
import { insiderApi, type InsiderTrade } from "@/lib/api";
import { formatCurrency, formatDate, tradeTypeBadge } from "@/lib/utils";
import { Search, Download, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import clsx from "clsx";

const PAGE_SIZE = 50;
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function InsiderPage() {
  const [trades, setTrades] = useState<InsiderTrade[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ticker, setTicker]     = useState("");
  const [txType, setTxType]     = useState("");
  const [minValue, setMinValue] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");

  // Fetch-by-ticker
  const [fetchTicker, setFetchTicker]   = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);
  const [fetchResult, setFetchResult]   = useState<{ message: string; inserted: number; skipped: number } | null>(null);
  const [fetchError, setFetchError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params: Record<string, string | number> = {
      limit: PAGE_SIZE,
      offset: page * PAGE_SIZE,
    };
    if (ticker)   params.ticker = ticker.toUpperCase();
    if (txType)   params.transaction_type = txType;
    if (minValue) params.min_value = minValue;
    if (dateFrom) params.date_from = dateFrom;
    if (dateTo)   params.date_to = dateTo;

    try {
      const [data, count] = await Promise.all([
        insiderApi.list(params),
        insiderApi.count(
          Object.fromEntries(
            Object.entries(params)
              .filter(([k]) => !["limit", "offset"].includes(k))
              .map(([k, v]) => [k, String(v)])
          )
        ),
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
    load();
  }

  async function handleFetch(e: React.FormEvent) {
    e.preventDefault();
    if (!fetchTicker.trim()) return;
    setFetchLoading(true);
    setFetchResult(null);
    setFetchError("");
    try {
      const res = await fetch(
        `${API_BASE}/insider/fetch/${fetchTicker.trim().toUpperCase()}?years=5`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail ?? "Failed to fetch");
      setFetchResult(data);
      setFetchTicker("");
      // Reload table to show new data
      load();
    } catch (err: any) {
      setFetchError(err.message ?? "Something went wrong");
    } finally {
      setFetchLoading(false);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Insider Trades</h1>
        <p className="text-sm text-gray-500 mt-1">SEC Form 4 data from openinsider.com</p>
      </div>

      {/* Fetch by ticker */}
      <div className="card border-green-900/50 bg-green-950/20">
        <p className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-3">
          Fetch data for a specific company
        </p>
        <form onSubmit={handleFetch} className="flex items-center gap-3">
          <input
            className="input max-w-[160px]"
            placeholder="Ticker e.g. AAPL"
            value={fetchTicker}
            onChange={e => setFetchTicker(e.target.value)}
            disabled={fetchLoading}
          />
          <button type="submit" disabled={fetchLoading || !fetchTicker.trim()} className="btn-primary flex items-center gap-2">
            {fetchLoading
              ? <><Loader2 size={14} className="animate-spin" /> Fetching…</>
              : <><Download size={14} /> Fetch 5 Years</>
            }
          </button>
          {fetchResult && (
            <span className="text-sm text-green-400">
              ✅ {fetchResult.inserted} new trades added, {fetchResult.skipped} duplicates skipped
            </span>
          )}
          {fetchError && (
            <span className="text-sm text-red-400">❌ {fetchError}</span>
          )}
        </form>
      </div>

      {/* Filters */}
      <form onSubmit={handleSearch} className="card flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs text-gray-500">Ticker</label>
          <input className="input" placeholder="AAPL" value={ticker} onChange={e => setTicker(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs text-gray-500">Transaction Type</label>
          <select className="input" value={txType} onChange={e => setTxType(e.target.value)}>
            <option value="">All types</option>
            <option value="P - Purchase">Purchase</option>
            <option value="S - Sale">Sale</option>
            <option value="F - Tax">Tax</option>
            <option value="X - Exercise">Exercise</option>
            <option value="M - Options Exercise">Options Exercise</option>
          </select>
        </div>
        <div className="flex flex-col gap-1 min-w-[130px]">
          <label className="text-xs text-gray-500">Min Value ($)</label>
          <input className="input" placeholder="50000" value={minValue} onChange={e => setMinValue(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">From</label>
          <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">To</label>
          <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary flex items-center gap-2">
          <Search size={14} /> Search
        </button>
        <button type="button" className="btn-secondary" onClick={() => {
          setTicker(""); setTxType(""); setMinValue(""); setDateFrom(""); setDateTo(""); setPage(0);
        }}>
          Clear
        </button>
      </form>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <span className="text-sm text-gray-400">{total.toLocaleString()} results</span>
          <div className="flex items-center gap-2">
            <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="btn-secondary p-1.5 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs text-gray-500">Page {page + 1} of {totalPages || 1}</span>
            <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="btn-secondary p-1.5 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
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
              {loading && (
                <tr><td colSpan={9} className="td text-center text-gray-600 py-10">Loading…</td></tr>
              )}
              {!loading && trades.length === 0 && (
                <tr><td colSpan={9} className="td text-center text-gray-600 py-10">No trades found.</td></tr>
              )}
              {!loading && trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="td whitespace-nowrap">{formatDate(t.trade_date)}</td>
                  <td className="td font-bold text-gray-100">{t.ticker}</td>
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
                  <td className="td whitespace-nowrap font-semibold">{formatCurrency(t.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

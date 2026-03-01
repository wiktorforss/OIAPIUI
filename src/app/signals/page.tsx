"use client";
import { useEffect, useState, useCallback } from "react";
import { signalsApi, type ScreenerResult } from "@/lib/api";
import TickerLink from "@/components/ui/TickerLink";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate } from "@/lib/currency";
import { Zap, Users, TrendingUp, Filter, ChevronUp, ChevronDown } from "lucide-react";
import clsx from "clsx";

// ── Conviction badge ──────────────────────────────────────────────────────────
function ConvictionBadge({ score }: { score: number }) {
  const level =
    score >= 50  ? { label: "🔥 Very High", cls: "bg-orange-500/20 text-orange-300 border-orange-500/40" } :
    score >= 20  ? { label: "⚡ High",      cls: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40" } :
    score >= 5   ? { label: "✓ Medium",     cls: "bg-green-500/20  text-green-300  border-green-500/40"  } :
                   { label: "Low",          cls: "bg-gray-700/50   text-gray-400   border-gray-600"      };
  return (
    <span className={clsx("text-xs font-semibold px-2 py-0.5 rounded-full border", level.cls)}>
      {level.label}
    </span>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({ score, max }: { score: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (score / max) * 100) : 0;
  const color =
    pct >= 70 ? "bg-orange-400" :
    pct >= 40 ? "bg-yellow-400" :
    pct >= 15 ? "bg-green-400"  : "bg-gray-600";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div className={clsx("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-10 text-right font-mono">{score.toFixed(1)}</span>
    </div>
  );
}

type SortField = "conviction_score" | "total_value" | "distinct_buyers" | "latest_trade_date";
type SortDir   = "asc" | "desc";

export default function SignalsPage() {
  const [results, setResults]         = useState<ScreenerResult[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [days, setDays]               = useState(90);
  const [minBuyers, setMinBuyers]     = useState(1);
  const [minValue, setMinValue]       = useState("");
  const [officerOnly, setOfficerOnly] = useState(false);
  const [clusterOnly, setClusterOnly] = useState(false);
  const [sortField, setSortField]     = useState<SortField>("conviction_score");
  const [sortDir, setSortDir]         = useState<SortDir>("desc");
  const [expanded, setExpanded]       = useState<string | null>(null);

  const { currency, rate } = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await signalsApi.screener({
        days,
        min_buyers: clusterOnly ? Math.max(2, minBuyers) : minBuyers,
        officer_only: officerOnly,
        min_value: minValue ? parseFloat(minValue) : undefined,
        sort_by: "conviction",
        limit: 200,
      });
      setResults(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [days, minBuyers, officerOnly, minValue, clusterOnly]);

  useEffect(() => { load(); }, [load]);

  const sorted = [...results].sort((a, b) => {
    const av = a[sortField] ?? 0;
    const bv = b[sortField] ?? 0;
    return sortDir === "desc" ? (bv > av ? 1 : -1) : (av > bv ? 1 : -1);
  });

  const maxScore = Math.max(...results.map(r => r.conviction_score), 1);

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-gray-600" />;
    return sortDir === "desc"
      ? <ChevronDown size={12} className="text-green-400" />
      : <ChevronUp   size={12} className="text-green-400" />;
  }

  const clusterCount    = results.filter(r => r.is_cluster).length;
  const highConviction  = results.filter(r => r.conviction_score >= 20).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-100 flex items-center gap-2">
            <Zap size={20} className="text-yellow-400" /> Signals
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Conviction scoring and cluster buy detection</p>
        </div>
        {!loading && (
          <div className="flex gap-3 text-xs">
            <div className="card !p-2 text-center">
              <p className="text-orange-300 font-bold text-base">{clusterCount}</p>
              <p className="text-gray-500">Cluster Buys</p>
            </div>
            <div className="card !p-2 text-center">
              <p className="text-yellow-300 font-bold text-base">{highConviction}</p>
              <p className="text-gray-500">High Conviction</p>
            </div>
            <div className="card !p-2 text-center">
              <p className="text-green-300 font-bold text-base">{results.length}</p>
              <p className="text-gray-500">Total Tickers</p>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
          <Filter size={14} /> Filters
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Look-back period</label>
            <select
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="input w-full text-sm py-1.5"
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>6 months</option>
              <option value={365}>1 year</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min distinct buyers</label>
            <select
              value={minBuyers}
              onChange={e => setMinBuyers(Number(e.target.value))}
              className="input w-full text-sm py-1.5"
            >
              <option value={1}>Any (1+)</option>
              <option value={2}>2+ (cluster)</option>
              <option value={3}>3+ (strong cluster)</option>
              <option value={4}>4+</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Min purchase value (USD)</label>
            <input
              type="number"
              value={minValue}
              onChange={e => setMinValue(e.target.value)}
              placeholder="e.g. 100000"
              className="input w-full text-sm py-1.5"
            />
          </div>
          <div className="flex flex-col gap-2 justify-end">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={officerOnly}
                onChange={e => setOfficerOnly(e.target.checked)}
                className="rounded"
              />
              Officers only
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={clusterOnly}
                onChange={e => setClusterOnly(e.target.checked)}
                className="rounded"
              />
              Cluster buys only (2+)
            </label>
          </div>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No signals match your filters.</p>
          <p className="text-sm text-gray-600 mt-1">Try widening the look-back period or loosening filters.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card !p-0 overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="th text-left">Ticker</th>
                    <th className="th text-left">Company</th>
                    <th className="th cursor-pointer select-none" onClick={() => toggleSort("conviction_score")}>
                      <span className="flex items-center gap-1 justify-center">Conviction <SortIcon field="conviction_score" /></span>
                    </th>
                    <th className="th cursor-pointer select-none" onClick={() => toggleSort("distinct_buyers")}>
                      <span className="flex items-center gap-1 justify-center">Buyers <SortIcon field="distinct_buyers" /></span>
                    </th>
                    <th className="th cursor-pointer select-none" onClick={() => toggleSort("total_value")}>
                      <span className="flex items-center gap-1 justify-center">Total Value <SortIcon field="total_value" /></span>
                    </th>
                    <th className="th">All-time B/S</th>
                    <th className="th cursor-pointer select-none" onClick={() => toggleSort("latest_trade_date")}>
                      <span className="flex items-center gap-1 justify-center">Latest <SortIcon field="latest_trade_date" /></span>
                    </th>
                    <th className="th">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(r => (
                    <>
                      <tr
                        key={r.ticker}
                        className={clsx(
                          "border-b border-gray-800/50 hover:bg-gray-800/40 cursor-pointer transition-colors",
                          r.is_cluster && "bg-yellow-500/3"
                        )}
                        onClick={() => setExpanded(expanded === r.ticker ? null : r.ticker)}
                      >
                        <td className="td">
                          <div className="flex items-center gap-2">
                            <TickerLink ticker={r.ticker} />
                            {r.is_cluster && (
                              <span title="Cluster buy" className="text-yellow-400">
                                <Users size={12} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="td text-gray-400 text-xs max-w-[180px] truncate">{r.company_name || "—"}</td>
                        <td className="td">
                          <div className="min-w-[120px]">
                            <ScoreBar score={r.conviction_score} max={maxScore} />
                          </div>
                        </td>
                        <td className="td text-center">
                          <span className={clsx(
                            "font-bold",
                            r.distinct_buyers >= 3 ? "text-yellow-300" :
                            r.distinct_buyers >= 2 ? "text-green-300"  : "text-gray-300"
                          )}>
                            {r.distinct_buyers}
                          </span>
                          <span className="text-gray-600 text-xs ml-1">/ {r.total_trades} trades</span>
                        </td>
                        <td className="td text-gray-200 text-right font-medium">{fmt(r.total_value)}</td>
                        <td className="td text-center">
                          <span className="text-green-400 text-xs font-medium">{r.total_buys_ever}B</span>
                          <span className="text-gray-600 mx-1">/</span>
                          <span className="text-red-400 text-xs font-medium">{r.total_sells_ever}S</span>
                        </td>
                        <td className="td text-gray-500 text-xs">
                          <div>{formatDate(r.latest_trade_date)}</div>
                          <div className="text-gray-600 truncate max-w-[120px]">{r.latest_insider}</div>
                        </td>
                        <td className="td text-right text-gray-300">
                          {r.price != null ? `$${r.price.toFixed(2)}` : "—"}
                        </td>
                      </tr>
                      {expanded === r.ticker && (
                        <tr key={`${r.ticker}-detail`} className="bg-gray-900/60">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex items-start gap-6 flex-wrap">
                              <div>
                                <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Conviction</p>
                                <ConvictionBadge score={r.conviction_score} />
                                <p className="text-xs text-gray-600 mt-1">Score: {r.conviction_score.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Latest Insider</p>
                                <p className="text-sm text-gray-200">{r.latest_insider || "—"}</p>
                                <p className="text-xs text-gray-500">{r.latest_title || ""}</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">Activity window</p>
                                <p className="text-sm text-gray-300">{formatDate(r.latest_trade_date)}</p>
                                <p className="text-xs text-gray-600">{r.total_trades} purchase{r.total_trades !== 1 ? "s" : ""} in period</p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">All-time B/S ratio</p>
                                <p className="text-sm">
                                  <span className="text-green-400 font-medium">{r.total_buys_ever} buys</span>
                                  <span className="text-gray-600 mx-2">/</span>
                                  <span className="text-red-400 font-medium">{r.total_sells_ever} sells</span>
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {sorted.map(r => (
              <div
                key={r.ticker}
                className={clsx("card space-y-2 cursor-pointer", r.is_cluster && "border-yellow-500/20 border")}
                onClick={() => setExpanded(expanded === r.ticker ? null : r.ticker)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TickerLink ticker={r.ticker} className="text-base" />
                    {r.is_cluster && <Users size={12} className="text-yellow-400" />}
                  </div>
                  <ConvictionBadge score={r.conviction_score} />
                </div>
                <ScoreBar score={r.conviction_score} max={maxScore} />
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-gray-500">Buyers </span>
                    <span className={clsx("font-bold", r.distinct_buyers >= 2 ? "text-green-300" : "text-gray-300")}>
                      {r.distinct_buyers}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Value </span>
                    <span className="text-gray-200">{fmt(r.total_value)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Latest </span>
                    <span className="text-gray-400">{formatDate(r.latest_trade_date)}</span>
                  </div>
                  <div>
                    <span className="text-green-400 font-medium">{r.total_buys_ever}B</span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400 font-medium">{r.total_sells_ever}S</span>
                  </div>
                </div>
                {expanded === r.ticker && (
                  <div className="pt-2 border-t border-gray-800 text-xs space-y-1">
                    <p><span className="text-gray-500">Latest insider: </span><span className="text-gray-200">{r.latest_insider}</span></p>
                    <p><span className="text-gray-500">Title: </span><span className="text-gray-400">{r.latest_title || "—"}</span></p>
                    <p><span className="text-gray-500">Price: </span><span className="text-gray-300">{r.price != null ? `$${r.price.toFixed(2)}` : "—"}</span></p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
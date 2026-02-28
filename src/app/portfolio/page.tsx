"use client";
import { useEffect, useState } from "react";
import { portfolioApi, type PortfolioData } from "@/lib/api";
import TickerLink from "@/components/ui/TickerLink";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate, type Currency } from "@/lib/currency";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";

function PnlBadge({ value, pct, currency, rate }: {
  value: number | null;
  pct?: number | null;
  currency: Currency;
  rate: number;
}) {
  if (value === null || value === undefined) return <span className="text-gray-600">—</span>;
  const pos = value >= 0;
  const fmt = (v: number | null) => formatCurrencyWithRate(v, currency, rate);
  return (
    <span className={clsx("font-semibold", pos ? "text-green-400" : "text-red-400")}>
      {pos ? "+" : ""}{fmt(value)}
      {pct != null && <span className="text-xs ml-1 opacity-75">({pos ? "+" : ""}{pct.toFixed(2)}%)</span>}
    </span>
  );
}

export default function PortfolioPage() {
  const [data, setData]             = useState<PortfolioData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showClosed, setShowClosed] = useState(false);
  const { currency, rate }          = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);

  function load() {
    setLoading(true);
    portfolioApi.get()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (error) return <div className="card text-center py-10"><p className="text-red-400">{error}</p></div>;
  if (!data) return null;

  const { summary, positions } = data;
  const openPositions   = positions.filter(p => p.is_open);
  const closedPositions = positions.filter(p => !p.is_open);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Portfolio</h1>
        <button onClick={load} className="btn-secondary flex items-center gap-2 text-sm">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Portfolio Value</p>
          <p className="text-xl font-bold mt-1 text-gray-100">{fmt(summary.total_portfolio_value)}</p>
          <p className="text-xs text-gray-600 mt-0.5">Cost basis: {fmt(summary.total_cost_basis)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Unrealized P&L</p>
          <p className={clsx("text-xl font-bold mt-1", summary.total_unrealized_pnl >= 0 ? "text-green-400" : "text-red-400")}>
            {summary.total_unrealized_pnl >= 0 ? "+" : ""}{fmt(summary.total_unrealized_pnl)}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{summary.total_unrealized_pct >= 0 ? "+" : ""}{summary.total_unrealized_pct.toFixed(2)}%</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Realized P&L</p>
          <p className={clsx("text-xl font-bold mt-1", summary.total_realized_pnl >= 0 ? "text-green-400" : "text-red-400")}>
            {summary.total_realized_pnl >= 0 ? "+" : ""}{fmt(summary.total_realized_pnl)}
          </p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Total P&L</p>
          <p className={clsx("text-xl font-bold mt-1", summary.total_pnl >= 0 ? "text-green-400" : "text-red-400")}>
            {summary.total_pnl >= 0 ? "+" : ""}{fmt(summary.total_pnl)}
          </p>
          <p className="text-xs text-gray-600 mt-0.5">{summary.open_positions} open · {summary.closed_positions} closed</p>
        </div>
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-300 mb-3">
          Open Positions <span className="text-gray-600 font-normal">({openPositions.length})</span>
        </h2>
        {openPositions.length === 0 ? (
          <p className="text-sm text-gray-600 py-4 text-center">No open positions — log some trades on the My Trades page.</p>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800">
                    {["Ticker","Shares","Avg Cost","Current Price","Market Value","Unrealized P&L","Since"].map(h => (
                      <th key={h} className="th text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {openPositions.map(p => (
                    <tr key={p.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="td"><TickerLink ticker={p.ticker} /></td>
                      <td className="td text-gray-300">{p.shares.toLocaleString()}</td>
                      <td className="td text-gray-300">${p.avg_cost.toFixed(4)}</td>
                      <td className="td">
                        {p.current_price != null
                          ? <span className="text-gray-300">${p.current_price.toFixed(4)}<span className="text-gray-600 text-xs ml-1">{p.price_date}</span></span>
                          : <span className="text-gray-600 text-xs">Open company page to fetch</span>}
                      </td>
                      <td className="td text-gray-300">{fmt(p.current_value)}</td>
                      <td className="td"><PnlBadge value={p.unrealized_pnl} pct={p.unrealized_pct} currency={currency} rate={rate} /></td>
                      <td className="td text-gray-600">{formatDate(p.first_buy_date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="md:hidden space-y-3">
              {openPositions.map(p => (
                <div key={p.ticker} className="bg-gray-800/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <TickerLink ticker={p.ticker} className="text-lg" />
                    <PnlBadge value={p.unrealized_pnl} pct={p.unrealized_pct} currency={currency} rate={rate} />
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <div><span className="text-gray-500">Shares</span><span className="text-gray-300 ml-2">{p.shares.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Avg Cost</span><span className="text-gray-300 ml-2">${p.avg_cost.toFixed(4)}</span></div>
                    <div><span className="text-gray-500">Price</span><span className="text-gray-300 ml-2">{p.current_price != null ? `$${p.current_price.toFixed(4)}` : "—"}</span></div>
                    <div><span className="text-gray-500">Value</span><span className="text-gray-300 ml-2">{fmt(p.current_value)}</span></div>
                  </div>
                  <p className="text-xs text-gray-600">Since {formatDate(p.first_buy_date)}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {closedPositions.length > 0 && (
        <div className="card">
          <button onClick={() => setShowClosed(v => !v)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-300">
            <span>Closed Positions <span className="text-gray-600 font-normal">({closedPositions.length})</span></span>
            <span className="text-gray-500 text-xs">{showClosed ? "Hide ▲" : "Show ▼"}</span>
          </button>
          {showClosed && (
            <div className="mt-3">
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {["Ticker","Realized P&L","Trades","Last Trade"].map(h => (
                        <th key={h} className="th text-left">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closedPositions.map(p => (
                      <tr key={p.ticker} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                        <td className="td"><TickerLink ticker={p.ticker} /></td>
                        <td className="td"><PnlBadge value={p.realized_pnl} currency={currency} rate={rate} /></td>
                        <td className="td text-gray-500">{p.trade_count}</td>
                        <td className="td text-gray-600">{formatDate(p.last_trade_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-2 mt-2">
                {closedPositions.map(p => (
                  <div key={p.ticker} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                    <TickerLink ticker={p.ticker} />
                    <div className="text-right">
                      <PnlBadge value={p.realized_pnl} currency={currency} rate={rate} />
                      <p className="text-xs text-gray-600 mt-0.5">{formatDate(p.last_trade_date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {positions.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No trades logged yet.</p>
          <p className="text-sm text-gray-600 mt-1">Add trades on the My Trades page to see your portfolio here.</p>
        </div>
      )}
    </div>
  );
}

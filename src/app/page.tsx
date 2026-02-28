import TickerLink from "@/components/ui/TickerLink";
"use client";
import { useEffect, useState } from "react";
import { performanceApi, insiderApi, myTradesApi, type DashboardStats, type InsiderTrade, type MyTrade } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate } from "@/lib/currency";
import { formatCurrency, formatReturn, formatDate, returnColor, tradeTypeBadge } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInsider, setRecentInsider] = useState<InsiderTrade[]>([]);
  const [recentMine, setRecentMine] = useState<MyTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, rate } = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);

  async function load() {
    setLoading(true);
    try {
      const [s, insider, mine] = await Promise.all([
        performanceApi.dashboard(),
        insiderApi.list({ limit: 5 }),
        myTradesApi.list({ limit: "5" }),
      ]);
      setStats(s);
      setRecentInsider(insider);
      setRecentMine(mine);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Overview of insider activity and your trades</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Stat cards — 2 col on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Insider Trades" value={stats?.total_insider_trades.toLocaleString() ?? "—"} sub="in database" />
        <StatCard label="My Trades" value={stats?.total_my_trades ?? "—"} sub="logged" />
        <StatCard label="Tickers" value={stats?.tickers_tracked ?? "—"} sub="tracked" accent="blue" />
        <StatCard
          label="Avg 1M Return"
          value={stats?.avg_return_1m_all != null ? formatReturn(stats.avg_return_1m_all) : "—"}
          sub="my trades"
          accent={stats?.avg_return_1m_all != null && stats.avg_return_1m_all >= 0 ? "green" : "red"}
        />
      </div>

      {/* Best performer */}
      {stats?.best_performing_trade && (
        <div className="card flex items-center gap-3 bg-green-900/20 border-green-800">
          <span className="text-xl">🏆</span>
          <div>
            <p className="text-xs text-green-500 font-medium uppercase tracking-wide">Best trade</p>
            <p className="text-green-300 font-semibold text-sm">{stats.best_performing_trade}</p>
          </div>
        </div>
      )}

      {/* Recent feeds — stacked on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">Recent Insider Trades</h2>
          <div className="space-y-0">
            {recentInsider.length === 0 && !loading && (
              <p className="text-sm text-gray-600 py-2">No insider trades loaded yet.</p>
            )}
            {recentInsider.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <TickerLink ticker={t.ticker} />
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", tradeTypeBadge(t.transaction_type))}>
                      {t.transaction_type?.split(" - ")[1] ?? t.transaction_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{t.insider_name} · {formatDate(t.trade_date)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-300 ml-2 shrink-0">{fmt(t.value)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">My Recent Trades</h2>
          <div className="space-y-0">
            {recentMine.length === 0 && !loading && (
              <p className="text-sm text-gray-600 py-2">No trades logged yet.</p>
            )}
            {recentMine.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 border-b border-gray-800 last:border-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <TickerLink ticker={t.ticker} />
                    <span className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                    )}>
                      {t.trade_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{t.shares} @ {fmt(t.price)} · {formatDate(t.trade_date)}</p>
                </div>
                <div className="text-right ml-2 shrink-0">
                  <p className="text-sm font-semibold text-gray-300">{fmt(t.total_value)}</p>
                  {t.performance?.return_1m != null && (
                    <p className={clsx("text-xs font-medium", returnColor(t.performance.return_1m))}>
                      {formatReturn(t.performance.return_1m)} 1M
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

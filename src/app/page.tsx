"use client";
import { useEffect, useState } from "react";
import { performanceApi, insiderApi, myTradesApi, type DashboardStats, type InsiderTrade, type MyTrade } from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import { formatCurrency, formatReturn, formatDate, returnColor, tradeTypeBadge } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import clsx from "clsx";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentInsider, setRecentInsider] = useState<InsiderTrade[]>([]);
  const [recentMine, setRecentMine] = useState<MyTrade[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview of insider activity and your trades</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Insider Trades"
          value={stats?.total_insider_trades.toLocaleString() ?? "—"}
          sub="in database"
        />
        <StatCard
          label="My Trades"
          value={stats?.total_my_trades ?? "—"}
          sub="logged"
        />
        <StatCard
          label="Tickers Tracked"
          value={stats?.tickers_tracked ?? "—"}
          sub="unique symbols"
          accent="blue"
        />
        <StatCard
          label="Avg 1M Return"
          value={stats?.avg_return_1m_all != null ? formatReturn(stats.avg_return_1m_all) : "—"}
          sub="across all my trades"
          accent={stats?.avg_return_1m_all != null && stats.avg_return_1m_all >= 0 ? "green" : "red"}
        />
      </div>

      {/* Best performer */}
      {stats?.best_performing_trade && (
        <div className="card flex items-center gap-3 bg-green-900/20 border-green-800">
          <span className="text-green-400 text-xl">🏆</span>
          <div>
            <p className="text-xs text-green-500 font-medium uppercase tracking-wide">Best performing trade</p>
            <p className="text-green-300 font-semibold">{stats.best_performing_trade}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent insider trades */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">Recent Insider Trades</h2>
          <div className="space-y-3">
            {recentInsider.length === 0 && !loading && (
              <p className="text-sm text-gray-600">No insider trades loaded yet.</p>
            )}
            {recentInsider.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100">{t.ticker}</span>
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium", tradeTypeBadge(t.transaction_type))}>
                      {t.transaction_type?.split(" - ")[1] ?? t.transaction_type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t.insider_name} · {formatDate(t.trade_date)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-300">{formatCurrency(t.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* My recent trades */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">My Recent Trades</h2>
          <div className="space-y-3">
            {recentMine.length === 0 && !loading && (
              <p className="text-sm text-gray-600">No trades logged yet.</p>
            )}
            {recentMine.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-100">{t.ticker}</span>
                    <span className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                    )}>
                      {t.trade_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t.shares} shares @ {formatCurrency(t.price)} · {formatDate(t.trade_date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-300">{formatCurrency(t.total_value)}</p>
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

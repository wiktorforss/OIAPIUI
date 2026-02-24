"use client";
import { useEffect, useState, useCallback } from "react";
import { myTradesApi, performanceApi, type MyTrade } from "@/lib/api";
import { formatCurrency, formatDate, formatReturn, returnColor } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, ReferenceLine,
} from "recharts";
import clsx from "clsx";

export default function PerformancePage() {
  const [trades, setTrades] = useState<MyTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await myTradesApi.list({ limit: "200" });
      setTrades(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build chart data from trades that have 1m returns
  const chartData = trades
    .filter(t => t.performance?.return_1m != null)
    .map(t => ({
      name: `${t.ticker} ${formatDate(t.trade_date)}`,
      ticker: t.ticker,
      return_1m: t.performance!.return_1m!,
      return_3m: t.performance?.return_3m ?? null,
    }))
    .sort((a, b) => b.return_1m - a.return_1m);

  async function handleUpdatePerformance(tradeId: number) {
    setSaving(true);
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(updateForm)) {
      if (v !== "") payload[k] = Number(v);
    }
    try {
      await performanceApi.update(tradeId, payload);
      setSelectedId(null);
      setUpdateForm({});
      load();
    } finally {
      setSaving(false);
    }
  }

  const selectedTrade = trades.find(t => t.id === selectedId);

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Performance</h1>
        <p className="text-sm text-gray-500 mt-1">How your trades performed relative to insider activity</p>
      </div>

      {/* Returns chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-4">1-Month Returns by Trade</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="ticker" tick={{ fontSize: 11, fill: "#6b7280" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8 }}
                labelStyle={{ color: "#d1d5db" }}
                formatter={(val: number) => [`${val.toFixed(2)}%`, "1M Return"]}
              />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="return_1m" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.return_1m >= 0 ? "#16a34a" : "#dc2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Trade table with performance */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                {["Ticker","Type","Date","Entry","1W","2W","1M","3M","6M","1Y","Update"].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr><td colSpan={11} className="td text-center text-gray-600 py-10">Loading…</td></tr>
              )}
              {!loading && trades.length === 0 && (
                <tr><td colSpan={11} className="td text-center text-gray-600 py-10">No trades logged yet.</td></tr>
              )}
              {!loading && trades.map((t) => {
                const p = t.performance;
                return (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="td font-bold text-gray-100">{t.ticker}</td>
                    <td className="td">
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                      )}>
                        {t.trade_type.toUpperCase()}
                      </span>
                    </td>
                    <td className="td whitespace-nowrap">{formatDate(t.trade_date)}</td>
                    <td className="td">{formatCurrency(p?.price_at_trade)}</td>
                    <td className={clsx("td font-medium", returnColor(p?.return_1w))}>{formatReturn(p?.return_1w)}</td>
                    <td className={clsx("td font-medium", returnColor(p?.return_2w))}>{formatReturn(p?.return_2w)}</td>
                    <td className={clsx("td font-medium", returnColor(p?.return_1m))}>{formatReturn(p?.return_1m)}</td>
                    <td className={clsx("td font-medium", returnColor(p?.return_3m))}>{formatReturn(p?.return_3m)}</td>
                    <td className={clsx("td font-medium", returnColor(p?.return_6m))}>{formatReturn(p?.return_6m)}</td>
                    <td className={clsx("td font-medium", returnColor(p?.return_1y))}>{formatReturn(p?.return_1y)}</td>
                    <td className="td">
                      <button
                        onClick={() => { setSelectedId(t.id); setUpdateForm({}); }}
                        className="text-xs text-blue-400 hover:text-blue-300 underline"
                      >
                        Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Update prices modal */}
      {selectedId && selectedTrade && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-lg font-semibold text-gray-100 mb-1">Update Prices</h2>
            <p className="text-sm text-gray-500 mb-5">
              {selectedTrade.ticker} — entered @ ${selectedTrade.price.toFixed(2)}
            </p>
            <div className="space-y-3">
              {[["price_1w","1 Week"],["price_2w","2 Weeks"],["price_1m","1 Month"],
                ["price_3m","3 Months"],["price_6m","6 Months"],["price_1y","1 Year"]].map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-gray-400 w-24 shrink-0">{label}</label>
                  <input
                    type="number"
                    step="any"
                    className="input"
                    placeholder={`Current price`}
                    value={updateForm[key] ?? ""}
                    onChange={e => setUpdateForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => handleUpdatePerformance(selectedId)}
                disabled={saving}
                className="btn-primary flex-1"
              >
                {saving ? "Saving…" : "Save Prices"}
              </button>
              <button onClick={() => setSelectedId(null)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

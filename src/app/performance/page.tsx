"use client";
import TickerLink from "@/components/ui/TickerLink";
import { useEffect, useState, useCallback } from "react";
import { myTradesApi, performanceApi, performanceUpdateApi, type MyTrade } from "@/lib/api";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate } from "@/lib/currency";
import { formatCurrency, formatDate, formatReturn, returnColor } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, ReferenceLine } from "recharts";
import clsx from "clsx";
import { X, RefreshCw } from "lucide-react";

export default function PerformancePage() {
  const [trades, setTrades]     = useState<MyTrade[]>([]);
  const [loading, setLoading]   = useState(true);
  const { currency, rate } = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [updateForm, setUpdateForm] = useState<Record<string, string>>({});
  const [saving, setSaving]       = useState(false);
  const [updating, setUpdating]   = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setTrades(await myTradesApi.list({ limit: "200" })); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const chartData = trades
    .filter(t => t.performance?.return_1m != null)
    .map(t => ({ ticker: t.ticker, return_1m: t.performance!.return_1m! }))
    .sort((a, b) => b.return_1m - a.return_1m);

  async function handleUpdateAll() {
    setUpdating(true);
    setUpdateMsg("");
    try {
      const res = await performanceUpdateApi.updateAll();
      setUpdateMsg(res.message);
      load();
    } catch (e: any) {
      setUpdateMsg(e.message ?? "Update failed");
    } finally {
      setUpdating(false);
    }
  }

  async function handleUpdate(tradeId: number) {
    setSaving(true);
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(updateForm)) {
      if (v !== "") payload[k] = Number(v);
    }
    try {
      await performanceApi.update(tradeId, payload);
      setSelectedId(null); setUpdateForm({}); load();
    } finally { setSaving(false); }
  }

  const selectedTrade = trades.find(t => t.id === selectedId);

  const priceFields = [
    ["price_1w","1 Week"], ["price_2w","2 Weeks"], ["price_1m","1 Month"],
    ["price_3m","3 Months"], ["price_6m","6 Months"], ["price_1y","1 Year"],
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100">Performance</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">How your trades performed</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <button onClick={handleUpdateAll} disabled={updating}
            className="btn-primary flex items-center gap-2 text-sm">
            <RefreshCw size={14} className={updating ? "animate-spin" : ""} />
            {updating ? "Updating…" : "Auto-fill from Polygon"}
          </button>
          {updateMsg && <p className="text-xs text-green-400">{updateMsg}</p>}
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">1-Month Returns</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="ticker" tick={{ fontSize: 10, fill: "#6b7280" }} angle={-35} textAnchor="end" interval={0} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }}
                formatter={(val: number) => [`${val.toFixed(2)}%`, "1M Return"]}
              />
              <ReferenceLine y={0} stroke="#374151" />
              <Bar dataKey="return_1m" radius={[3, 3, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.return_1m >= 0 ? "#16a34a" : "#dc2626"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {loading && <p className="text-center text-gray-600 py-8">Loading…</p>}
        {!loading && trades.length === 0 && <p className="text-center text-gray-500 py-8 text-sm">No trades logged yet.</p>}
        {!loading && trades.map((t) => {
          const p = t.performance;
          return (
            <div key={t.id} className="card space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TickerLink ticker={t.ticker} />
                  <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
                    t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                  )}>{t.trade_type.toUpperCase()}</span>
                </div>
                <span className="text-xs text-gray-500">{formatDate(t.trade_date)}</span>
              </div>
              <p className="text-sm text-gray-400">Entry: {fmt(p?.price_at_trade)}</p>
              {/* Returns grid */}
              <div className="grid grid-cols-3 gap-2">
                {[["1W", p?.return_1w], ["2W", p?.return_2w], ["1M", p?.return_1m],
                  ["3M", p?.return_3m], ["6M", p?.return_6m], ["1Y", p?.return_1y]].map(([label, val]) => (
                  <div key={label as string} className="bg-gray-800 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className={clsx("text-sm font-semibold", returnColor(val as number | null))}>
                      {formatReturn(val as number | null)}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => { setSelectedId(t.id); setUpdateForm({}); }}
                className="w-full btn-secondary text-xs py-2"
              >
                Update Prices
              </button>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                {["Ticker","Type","Date","Entry","1W","2W","1M","3M","6M","1Y",""].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && <tr><td colSpan={11} className="td text-center text-gray-600 py-10">Loading…</td></tr>}
              {!loading && trades.length === 0 && <tr><td colSpan={11} className="td text-center text-gray-600 py-10">No trades logged yet.</td></tr>}
              {!loading && trades.map((t) => {
                const p = t.performance;
                return (
                  <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                    <td className="td"><TickerLink ticker={t.ticker} /></td>
                    <td className="td">
                      <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
                        t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                      )}>{t.trade_type.toUpperCase()}</span>
                    </td>
                    <td className="td whitespace-nowrap">{formatDate(t.trade_date)}</td>
                    <td className="td">{fmt(p?.price_at_trade)}</td>
                    {[p?.return_1w, p?.return_2w, p?.return_1m, p?.return_3m, p?.return_6m, p?.return_1y].map((r, i) => (
                      <td key={i} className={clsx("td font-medium", returnColor(r))}>{formatReturn(r)}</td>
                    ))}
                    <td className="td">
                      <button onClick={() => { setSelectedId(t.id); setUpdateForm({}); }}
                        className="text-xs text-blue-400 hover:text-blue-300 underline">
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

      {/* Update modal — slides up from bottom on mobile */}
      {selectedId && selectedTrade && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-100">Update Prices</h2>
              <button onClick={() => setSelectedId(null)} className="text-gray-500 hover:text-gray-300 p-1"><X size={18} /></button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {selectedTrade.ticker} — entered @ ${selectedTrade.price.toFixed(2)}
            </p>
            <div className="space-y-3">
              {priceFields.map(([key, label]) => (
                <div key={key} className="flex items-center gap-3">
                  <label className="text-sm text-gray-400 w-20 shrink-0">{label}</label>
                  <input
                    type="number" step="any" inputMode="decimal"
                    className="input"
                    placeholder="Current price"
                    value={updateForm[key] ?? ""}
                    onChange={e => setUpdateForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => handleUpdate(selectedId)} disabled={saving} className="btn-primary flex-1 py-3">
                {saving ? "Saving…" : "Save Prices"}
              </button>
              <button onClick={() => setSelectedId(null)} className="btn-secondary px-5">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

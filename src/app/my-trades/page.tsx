"use client";
import { useEffect, useState, useCallback } from "react";
import { myTradesApi, insiderApi, type MyTrade, type MyTradeCreate } from "@/lib/api";
import { formatCurrency, formatDate, formatReturn, returnColor } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";

const EMPTY_FORM: MyTradeCreate = {
  ticker: "", trade_type: "buy", trade_date: "", shares: 0, price: 0, notes: "",
};

export default function MyTradesPage() {
  const [trades, setTrades]   = useState<MyTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<MyTradeCreate>(EMPTY_FORM);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setTrades(await myTradesApi.list());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await myTradesApi.create({
        ...form,
        ticker: form.ticker.toUpperCase(),
        shares: Number(form.shares),
        price: Number(form.price),
      });
      setShowModal(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err: any) {
      setError(err.message ?? "Failed to save trade");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this trade?")) return;
    await myTradesApi.delete(id);
    load();
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">My Trades</h1>
          <p className="text-sm text-gray-500 mt-1">Your personal buy/sell log</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Log Trade
        </button>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800/50">
              <tr>
                {["Date","Ticker","Type","Shares","Price","Total","1W","1M","3M","Notes",""].map(h => (
                  <th key={h} className="th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {loading && (
                <tr><td colSpan={11} className="td text-center text-gray-600 py-10">Loading…</td></tr>
              )}
              {!loading && trades.length === 0 && (
                <tr>
                  <td colSpan={11} className="td text-center text-gray-600 py-10">
                    No trades logged yet. Hit &quot;Log Trade&quot; to add your first one.
                  </td>
                </tr>
              )}
              {!loading && trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="td whitespace-nowrap">{formatDate(t.trade_date)}</td>
                  <td className="td font-bold text-gray-100">{t.ticker}</td>
                  <td className="td">
                    <span className={clsx(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                    )}>
                      {t.trade_type.toUpperCase()}
                    </span>
                  </td>
                  <td className="td">{t.shares.toLocaleString()}</td>
                  <td className="td">${t.price.toFixed(2)}</td>
                  <td className="td font-semibold">{formatCurrency(t.total_value)}</td>
                  <td className={clsx("td font-medium", returnColor(t.performance?.return_1w))}>
                    {formatReturn(t.performance?.return_1w)}
                  </td>
                  <td className={clsx("td font-medium", returnColor(t.performance?.return_1m))}>
                    {formatReturn(t.performance?.return_1m)}
                  </td>
                  <td className={clsx("td font-medium", returnColor(t.performance?.return_3m))}>
                    {formatReturn(t.performance?.return_3m)}
                  </td>
                  <td className="td max-w-[200px] truncate text-gray-500">{t.notes ?? "—"}</td>
                  <td className="td">
                    <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add trade modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-100">Log a Trade</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ticker *</label>
                  <input className="input" placeholder="AAPL" required
                    value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Type *</label>
                  <select className="input" value={form.trade_type}
                    onChange={e => setForm(f => ({ ...f, trade_type: e.target.value as "buy"|"sell" }))}>
                    <option value="buy">Buy</option>
                    <option value="sell">Sell</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Date *</label>
                <input type="date" className="input" required
                  value={form.trade_date} onChange={e => setForm(f => ({ ...f, trade_date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Shares *</label>
                  <input type="number" className="input" placeholder="100" required min={0} step="any"
                    value={form.shares || ""} onChange={e => setForm(f => ({ ...f, shares: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Price *</label>
                  <input type="number" className="input" placeholder="189.50" required min={0} step="any"
                    value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">
                  Related Insider Trade ID <span className="text-gray-600">(optional)</span>
                </label>
                <input type="number" className="input" placeholder="e.g. 42"
                  value={form.related_insider_trade_id ?? ""}
                  onChange={e => setForm(f => ({ ...f, related_insider_trade_id: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <textarea className="input resize-none" rows={3} placeholder="Why did you make this trade?"
                  value={form.notes ?? ""}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? "Saving…" : "Log Trade"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

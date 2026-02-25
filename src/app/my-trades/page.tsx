"use client";
import { useEffect, useState, useCallback } from "react";
import { myTradesApi, type MyTrade, type MyTradeCreate } from "@/lib/api";
import { formatCurrency, formatDate, formatReturn, returnColor } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";
import clsx from "clsx";

const EMPTY_FORM: MyTradeCreate = {
  ticker: "", trade_type: "buy", trade_date: "", shares: 0, price: 0, notes: "",
};

export default function MyTradesPage() {
  const [trades, setTrades]     = useState<MyTrade[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState<MyTradeCreate>(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setTrades(await myTradesApi.list()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError("");
    try {
      await myTradesApi.create({ ...form, ticker: form.ticker.toUpperCase(), shares: Number(form.shares), price: Number(form.price) });
      setShowModal(false); setForm(EMPTY_FORM); load();
    } catch (err: any) {
      setError(err.message ?? "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this trade?")) return;
    await myTradesApi.delete(id); load();
  }

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-100">My Trades</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Your personal buy/sell log</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={14} /> Log Trade
        </button>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden space-y-2">
        {loading && <p className="text-center text-gray-600 py-8">Loading…</p>}
        {!loading && trades.length === 0 && (
          <div className="card text-center py-10">
            <p className="text-gray-500 text-sm">No trades logged yet.</p>
            <button onClick={() => setShowModal(true)} className="btn-primary mt-3">Log your first trade</button>
          </div>
        )}
        {!loading && trades.map((t) => (
          <div key={t.id} className="card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-100">{t.ticker}</span>
                <span className={clsx(
                  "text-xs px-2 py-0.5 rounded-full font-medium",
                  t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                )}>
                  {t.trade_type.toUpperCase()}
                </span>
              </div>
              <button onClick={() => handleDelete(t.id)} className="text-gray-600 hover:text-red-400 p-1">
                <Trash2 size={14} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">{t.shares.toLocaleString()} shares @ ${t.price.toFixed(2)}</p>
              <p className="font-semibold text-gray-200">{formatCurrency(t.total_value)}</p>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatDate(t.trade_date)}</span>
              <div className="flex gap-3">
                {t.performance?.return_1w != null && (
                  <span className={returnColor(t.performance.return_1w)}>1W: {formatReturn(t.performance.return_1w)}</span>
                )}
                {t.performance?.return_1m != null && (
                  <span className={returnColor(t.performance.return_1m)}>1M: {formatReturn(t.performance.return_1m)}</span>
                )}
                {t.performance?.return_3m != null && (
                  <span className={returnColor(t.performance.return_3m)}>3M: {formatReturn(t.performance.return_3m)}</span>
                )}
              </div>
            </div>
            {t.notes && <p className="text-xs text-gray-600 italic">{t.notes}</p>}
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block card p-0 overflow-hidden">
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
              {loading && <tr><td colSpan={11} className="td text-center text-gray-600 py-10">Loading…</td></tr>}
              {!loading && trades.length === 0 && (
                <tr><td colSpan={11} className="td text-center text-gray-600 py-10">No trades logged yet.</td></tr>
              )}
              {!loading && trades.map((t) => (
                <tr key={t.id} className="hover:bg-gray-800/40 transition-colors">
                  <td className="td whitespace-nowrap">{formatDate(t.trade_date)}</td>
                  <td className="td font-bold text-gray-100">{t.ticker}</td>
                  <td className="td">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
                      t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                    )}>{t.trade_type.toUpperCase()}</span>
                  </td>
                  <td className="td">{t.shares.toLocaleString()}</td>
                  <td className="td">${t.price.toFixed(2)}</td>
                  <td className="td font-semibold">{formatCurrency(t.total_value)}</td>
                  <td className={clsx("td font-medium", returnColor(t.performance?.return_1w))}>{formatReturn(t.performance?.return_1w)}</td>
                  <td className={clsx("td font-medium", returnColor(t.performance?.return_1m))}>{formatReturn(t.performance?.return_1m)}</td>
                  <td className={clsx("td font-medium", returnColor(t.performance?.return_3m))}>{formatReturn(t.performance?.return_3m)}</td>
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

      {/* Modal — full screen on mobile, centered on desktop */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-end md:items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-t-2xl md:rounded-2xl p-5 w-full md:max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-100">Log a Trade</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-300 p-1">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Ticker *</label>
                  <input className="input" placeholder="AAPL" required autoCapitalize="characters"
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
                  <input type="number" className="input" placeholder="100" required min={0} step="any" inputMode="decimal"
                    value={form.shares || ""} onChange={e => setForm(f => ({ ...f, shares: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Price *</label>
                  <input type="number" className="input" placeholder="189.50" required min={0} step="any" inputMode="decimal"
                    value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Related Insider Trade ID <span className="text-gray-600">(optional)</span></label>
                <input type="number" className="input" placeholder="e.g. 42" inputMode="numeric"
                  value={form.related_insider_trade_id ?? ""}
                  onChange={e => setForm(f => ({ ...f, related_insider_trade_id: e.target.value ? Number(e.target.value) : undefined }))} />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <textarea className="input resize-none" rows={3} placeholder="Why did you make this trade?"
                  value={form.notes ?? ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={saving} className="btn-primary flex-1 py-3">
                  {saving ? "Saving…" : "Log Trade"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary px-5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

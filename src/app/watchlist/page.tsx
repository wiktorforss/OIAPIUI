"use client";
import { useEffect, useState } from "react";
import { watchlistApi, type WatchlistSummary, type WatchlistDetail, type WatchlistItem } from "@/lib/api";
import TickerLink from "@/components/ui/TickerLink";
import { formatDate } from "@/lib/utils";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate } from "@/lib/currency";
import { Plus, Trash2, Pencil, X, Check, ChevronRight, ArrowLeft, StickyNote } from "lucide-react";
import clsx from "clsx";

// ── Small inline text input ───────────────────────────────────────────────────
function InlineInput({ placeholder, onConfirm, onCancel, initialValue = "" }: {
  placeholder: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
  initialValue?: string;
}) {
  const [val, setVal] = useState(initialValue);
  return (
    <div className="flex items-center gap-2">
      <input
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") onConfirm(val); if (e.key === "Escape") onCancel(); }}
        placeholder={placeholder}
        className="input flex-1 text-sm py-1.5"
      />
      <button onClick={() => onConfirm(val)} className="text-green-400 hover:text-green-300 p-1"><Check size={16} /></button>
      <button onClick={onCancel} className="text-gray-500 hover:text-gray-300 p-1"><X size={16} /></button>
    </div>
  );
}

// ── Inline textarea for notes ─────────────────────────────────────────────────
function NoteEditor({ initialValue = "", onConfirm, onCancel }: {
  initialValue?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState(initialValue);
  return (
    <div className="space-y-2 mt-2">
      <textarea
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value)}
        placeholder="Add a note about this company…"
        rows={3}
        className="input w-full text-sm py-1.5 resize-none"
      />
      <div className="flex gap-2">
        <button
          onClick={() => onConfirm(val)}
          className="btn-primary text-xs py-1 px-3 flex items-center gap-1"
        >
          <Check size={12} /> Save note
        </button>
        <button
          onClick={onCancel}
          className="btn-secondary text-xs py-1 px-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Watchlist list view ───────────────────────────────────────────────────────
function WatchlistList({ onSelect }: { onSelect: (id: number) => void }) {
  const [lists, setLists]       = useState<WatchlistSummary[]>([]);
  const [loading, setLoading]   = useState(true);
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<number | null>(null);
  const [error, setError]       = useState("");

  async function load() {
    setLoading(true);
    try { setLists(await watchlistApi.list()); }
    catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(name: string) {
    if (!name.trim()) return;
    const wl = await watchlistApi.create(name.trim());
    setCreating(false);
    setLists(prev => [...prev, { ...wl }]);
  }

  async function handleRename(id: number, name: string) {
    if (!name.trim()) return;
    await watchlistApi.rename(id, name.trim());
    setRenaming(null);
    load();
  }

  async function handleDelete(id: number, name: string) {
    if (!confirm(`Delete watchlist "${name}"?\n\nThis cannot be undone.`)) return;
    await watchlistApi.delete(id);
    setLists(prev => prev.filter(w => w.id !== id));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-100">Watchlists</h1>
        <button onClick={() => setCreating(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> New List
        </button>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {creating && (
        <div className="card">
          <InlineInput placeholder="List name e.g. Mining Plays" onConfirm={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {lists.length === 0 && !creating ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No watchlists yet.</p>
          <p className="text-sm text-gray-600 mt-1">Create one to start tracking tickers.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map(wl => (
            <div key={wl.id} className="card flex items-center gap-3 cursor-pointer hover:bg-gray-800/80 transition-colors"
              onClick={() => renaming !== wl.id && onSelect(wl.id)}>
              {renaming === wl.id ? (
                <div className="flex-1" onClick={e => e.stopPropagation()}>
                  <InlineInput
                    placeholder="Watchlist name"
                    initialValue={wl.name}
                    onConfirm={name => handleRename(wl.id, name)}
                    onCancel={() => setRenaming(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-100">{wl.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{wl.item_count} ticker{wl.item_count !== 1 ? "s" : ""} · Created {formatDate(wl.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                    <button onClick={() => setRenaming(wl.id)} className="p-1.5 text-gray-600 hover:text-gray-300 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(wl.id, wl.name)} className="p-1.5 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <ChevronRight size={16} className="text-gray-600 shrink-0" />
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Watchlist detail view ─────────────────────────────────────────────────────
function WatchlistDetailView({ id, onBack }: { id: number; onBack: () => void }) {
  const [detail, setDetail]           = useState<WatchlistDetail | null>(null);
  const [loading, setLoading]         = useState(true);
  const [adding, setAdding]           = useState(false);
  const [addError, setAddError]       = useState("");
  const [editingNote, setEditingNote] = useState<number | null>(null);
  const { currency, rate }            = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);

  async function load() {
    setLoading(true);
    try { setDetail(await watchlistApi.get(id)); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [id]);

  async function handleAdd(ticker: string) {
    if (!ticker.trim()) return;
    setAddError("");
    try {
      await watchlistApi.addItem(id, ticker.trim());
      setAdding(false);
      load();
    } catch (e: any) {
      setAddError(e.message);
    }
  }

  async function handleRemove(itemId: number) {
    await watchlistApi.removeItem(id, itemId);
    setDetail(prev => prev ? { ...prev, items: prev.items.filter(i => i.id !== itemId) } : prev);
  }

  async function handleSaveNote(itemId: number, note: string) {
    const updated = await watchlistApi.updateItemNotes(id, itemId, note);
    setDetail(prev =>
      prev ? { ...prev, items: prev.items.map(i => i.id === itemId ? { ...i, notes: updated.notes } : i) } : prev
    );
    setEditingNote(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!detail) return null;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="btn-secondary p-2"><ArrowLeft size={16} /></button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-100">{detail.name}</h1>
          <p className="text-xs text-gray-500">{detail.items.length} ticker{detail.items.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-primary flex items-center gap-2 text-sm">
          <Plus size={15} /> Add ticker
        </button>
      </div>

      {/* Add ticker form */}
      {adding && (
        <div className="card space-y-2">
          <InlineInput
            placeholder="Ticker symbol e.g. AAPL"
            onConfirm={handleAdd}
            onCancel={() => { setAdding(false); setAddError(""); }}
          />
          {addError && <p className="text-red-400 text-xs">{addError}</p>}
        </div>
      )}

      {detail.items.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">No tickers yet.</p>
          <p className="text-sm text-gray-600 mt-1">Add tickers to start tracking.</p>
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
                    <th className="th text-left">Notes</th>
                    <th className="th text-right">Price</th>
                    <th className="th text-center">Insider Buys</th>
                    <th className="th text-center">Insider Sells</th>
                    <th className="th text-left">Latest Buy</th>
                    <th className="th text-left">Added</th>
                    <th className="th"></th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items.map(item => (
                    <tr key={item.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="td"><TickerLink ticker={item.ticker} /></td>
                      <td className="td max-w-[260px]">
                        {editingNote === item.id ? (
                          <div onClick={e => e.stopPropagation()}>
                            <NoteEditor
                              initialValue={item.notes || ""}
                              onConfirm={note => handleSaveNote(item.id, note)}
                              onCancel={() => setEditingNote(null)}
                            />
                          </div>
                        ) : (
                          <div
                            className="flex items-start gap-2 group cursor-pointer"
                            onClick={() => setEditingNote(item.id)}
                            title="Click to edit note"
                          >
                            {item.notes ? (
                              <p className="text-xs text-gray-400 italic leading-relaxed">{item.notes}</p>
                            ) : (
                              <p className="text-xs text-gray-700 italic group-hover:text-gray-500 transition-colors">
                                Add a note…
                              </p>
                            )}
                            <Pencil size={11} className="text-gray-700 group-hover:text-gray-400 shrink-0 mt-0.5 transition-colors" />
                          </div>
                        )}
                      </td>
                      <td className="td text-right text-gray-300 font-medium">
                        {item.price != null ? `$${item.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="td text-center">
                        <span className={clsx("font-medium", item.total_insider_buys > 0 ? "text-green-400" : "text-gray-600")}>
                          {item.total_insider_buys}
                        </span>
                      </td>
                      <td className="td text-center">
                        <span className={clsx("font-medium", item.total_insider_sells > 0 ? "text-red-400" : "text-gray-600")}>
                          {item.total_insider_sells}
                        </span>
                      </td>
                      <td className="td text-gray-500 text-xs">
                        {item.latest_buy_date
                          ? <>{formatDate(item.latest_buy_date)} <span className="text-gray-600">({fmt(item.latest_buy_value)})</span></>
                          : "—"}
                      </td>
                      <td className="td text-gray-600 text-xs">{formatDate(item.added_at)}</td>
                      <td className="td">
                        <button onClick={() => handleRemove(item.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {detail.items.map(item => (
              <div key={item.id} className="card space-y-2">
                <div className="flex items-center justify-between">
                  <TickerLink ticker={item.ticker} className="text-lg" />
                  <div className="flex items-center gap-2">
                    {item.price != null && <span className="text-gray-300 font-medium">${item.price.toFixed(2)}</span>}
                    <button onClick={() => handleRemove(item.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Note section on mobile */}
                {editingNote === item.id ? (
                  <NoteEditor
                    initialValue={item.notes || ""}
                    onConfirm={note => handleSaveNote(item.id, note)}
                    onCancel={() => setEditingNote(null)}
                  />
                ) : (
                  <div
                    className="flex items-start gap-2 cursor-pointer group"
                    onClick={() => setEditingNote(item.id)}
                  >
                    <StickyNote size={12} className="text-gray-600 group-hover:text-gray-400 mt-0.5 shrink-0 transition-colors" />
                    {item.notes ? (
                      <p className="text-xs text-gray-400 italic">{item.notes}</p>
                    ) : (
                      <p className="text-xs text-gray-700 italic group-hover:text-gray-500 transition-colors">Tap to add a note…</p>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  <div>
                    <span className="text-gray-500">Insider Buys</span>
                    <span className={clsx("ml-2 font-medium", item.total_insider_buys > 0 ? "text-green-400" : "text-gray-600")}>
                      {item.total_insider_buys}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Insider Sells</span>
                    <span className={clsx("ml-2 font-medium", item.total_insider_sells > 0 ? "text-red-400" : "text-gray-600")}>
                      {item.total_insider_sells}
                    </span>
                  </div>
                  {item.latest_buy_date && (
                    <div className="col-span-2">
                      <span className="text-gray-500">Latest Buy</span>
                      <span className="text-gray-400 ml-2">{formatDate(item.latest_buy_date)} · {fmt(item.latest_buy_value)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Page shell ────────────────────────────────────────────────────────────────
export default function WatchlistPage() {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  return selectedId === null
    ? <WatchlistList onSelect={setSelectedId} />
    : <WatchlistDetailView id={selectedId} onBack={() => setSelectedId(null)} />;
}
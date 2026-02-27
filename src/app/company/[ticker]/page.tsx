"use client";
import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { companyApi, priceApi, type CompanyData } from "@/lib/api";
import { formatDate, formatReturn, returnColor } from "@/lib/utils";
import { useCurrency } from "@/lib/CurrencyContext";
import { formatCurrencyWithRate } from "@/lib/currency";
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import clsx from "clsx";

const PERIODS = [
  { label: "7D",  days: 7   },
  { label: "14D", days: 14  },
  { label: "30D", days: 30  },
  { label: "90D", days: 90  },
  { label: "1Y",  days: 365 },
  { label: "All", days: 0   },
] as const;

// ── Custom dot ────────────────────────────────────────────────────────────────
const CustomDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const elements: JSX.Element[] = [];
  if (payload.insiderBuys?.length) elements.push(
    <g key="ib">
      <circle cx={cx} cy={cy} r={10} fill="#16a34a" fillOpacity={0.2} stroke="#16a34a" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={5}  fill="#16a34a" stroke="#0f172a" strokeWidth={1.5} />
    </g>
  );
  if (payload.insiderSells?.length) elements.push(
    <g key="is">
      <circle cx={cx} cy={cy} r={10} fill="#dc2626" fillOpacity={0.2} stroke="#dc2626" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={5}  fill="#dc2626" stroke="#0f172a" strokeWidth={1.5} />
    </g>
  );
  if (payload.myBuys?.length) elements.push(
    <g key="mb">
      <circle cx={cx} cy={cy} r={7} fill="#22c55e" stroke="#0f172a" strokeWidth={2} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#0f172a" fontWeight="bold">B</text>
    </g>
  );
  if (payload.mySells?.length) elements.push(
    <g key="ms">
      <circle cx={cx} cy={cy} r={7} fill="#ef4444" stroke="#0f172a" strokeWidth={2} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle" fontSize={7} fill="#0f172a" fontWeight="bold">S</text>
    </g>
  );
  return elements.length ? <g>{elements}</g> : null;
};

// ── Tooltip — always USD since it's on the chart ──────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;
  const fmtVal = (v: number | null) =>
    v == null ? "—" : `$${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-2xl max-w-[240px] space-y-1">
      <p className="text-gray-400">{label}</p>
      {d.close != null && <p className="text-gray-100 font-bold text-sm">${d.close.toFixed(2)}</p>}
      {d.insiderBuys?.map((t: any, i: number) => (
        <p key={i} className="text-green-400">🟢 {t.name}<br /><span className="text-gray-500">{t.title} — {fmtVal(t.value)}</span></p>
      ))}
      {d.insiderSells?.map((t: any, i: number) => (
        <p key={i} className="text-red-400">🔴 {t.name}<br /><span className="text-gray-500">{t.title} — {fmtVal(t.value)}</span></p>
      ))}
      {d.myBuys?.map((t: any, i: number) => (
        <p key={i} className="text-green-300">✅ My Buy: {t.shares} @ ${t.price?.toFixed(2)}<br /><span className="text-gray-500">{fmtVal(t.total_value)}</span></p>
      ))}
      {d.mySells?.map((t: any, i: number) => (
        <p key={i} className="text-red-300">❌ My Sell: {t.shares} @ ${t.price?.toFixed(2)}<br /><span className="text-gray-500">{fmtVal(t.total_value)}</span></p>
      ))}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────
export default function CompanyPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const router     = useRouter();

  const [data, setData]             = useState<CompanyData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [period, setPeriod]         = useState<number>(365);
  const [refreshing, setRefreshing] = useState(false);
  const [priceMsg, setPriceMsg]     = useState("");

  const { currency, rate } = useCurrency();
  const fmt = (v: number | null | undefined) => formatCurrencyWithRate(v, currency, rate);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    companyApi.get(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  async function handleRefreshPrices() {
    if (!ticker) return;
    setRefreshing(true);
    setPriceMsg("");
    try {
      const res   = await priceApi.refresh(ticker as string);
      setPriceMsg(res.message);
      const fresh = await companyApi.get(ticker as string);
      setData(fresh);
    } catch (e: any) {
      setPriceMsg(e.message ?? "Failed to refresh");
    } finally {
      setRefreshing(false);
    }
  }

  const filteredPrices = useMemo(() => {
    if (!data?.prices?.length) return [];
    if (period === 0) return data.prices;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return data.prices.filter(p => p.date >= cutoffStr);
  }, [data, period]);

  const yDomain = useMemo((): [number, number] => {
    const closes = filteredPrices.map(p => p.close).filter((c): c is number => c != null);
    if (!closes.length) return [0, 100];
    const min = Math.min(...closes);
    const max = Math.max(...closes);
    const pad = Math.max((max - min) * 0.12, max * 0.05);
    return [parseFloat((min - pad).toFixed(4)), parseFloat((max + pad).toFixed(4))];
  }, [filteredPrices]);

  const chartData = useMemo(() => {
    if (!data || !filteredPrices.length) return [];
    const startDate     = filteredPrices[0]?.date ?? "";
    const insiderByDate = new Map<string, any[]>();
    const myByDate      = new Map<string, any[]>();

    for (const t of data.insider_trades) {
      if (!t.date || t.date < startDate) continue;
      if (!insiderByDate.has(t.date)) insiderByDate.set(t.date, []);
      insiderByDate.get(t.date)!.push({
        name: t.insider_name, title: t.insider_title, value: t.value,
        isBuy: (t as any).is_purchase,
      });
    }
    for (const t of data.my_trades) {
      if (!t.date || t.date < startDate) continue;
      if (!myByDate.has(t.date)) myByDate.set(t.date, []);
      myByDate.get(t.date)!.push({
        shares: t.shares, price: t.price, total_value: t.total_value,
        isBuy: t.trade_type === "buy",
      });
    }

    return filteredPrices.map(p => {
      const insiders = insiderByDate.get(p.date) ?? [];
      const mine     = myByDate.get(p.date) ?? [];
      return {
        date:         p.date,
        close:        p.close,
        insiderBuys:  insiders.filter(t => t.isBuy).length  ? insiders.filter(t => t.isBuy)  : undefined,
        insiderSells: insiders.filter(t => !t.isBuy).length ? insiders.filter(t => !t.isBuy) : undefined,
        myBuys:       mine.filter(t => t.isBuy).length      ? mine.filter(t => t.isBuy)      : undefined,
        mySells:      mine.filter(t => !t.isBuy).length     ? mine.filter(t => !t.isBuy)     : undefined,
      };
    });
  }, [data, filteredPrices]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="max-w-6xl mx-auto space-y-4">
      <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2">
        <ArrowLeft size={14} /> Back
      </button>
      <div className="card text-center py-10">
        <p className="text-red-400">{error || "Failed to load company data"}</p>
      </div>
    </div>
  );

  const s = data.summary;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-100">{data.ticker}</h1>
            <a href={data.yahoo_url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Yahoo Finance <ExternalLink size={12} />
            </a>
            <button onClick={handleRefreshPrices} disabled={refreshing}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors">
              <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
              {data.prices?.length > 0 ? `${data.prices.length} days cached` : "No price data — click to fetch"}
            </button>
          </div>
          {priceMsg && <p className="text-xs text-green-400 mt-1">{priceMsg}</p>}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Insider Buys",  val: s.total_insider_purchases, sub: fmt(s.total_insider_purchase_value), color: "text-green-400" },
          { label: "Insider Sells", val: s.total_insider_sales,     sub: fmt(s.total_insider_sale_value),     color: "text-red-400"   },
          { label: "My Buys",       val: s.my_buy_count,            sub: null,                                color: "text-green-400" },
          { label: "My Sells",      val: s.my_sell_count,           sub: null,                                color: "text-red-400"   },
        ].map(({ label, val, sub, color }) => (
          <div key={label} className="card">
            <p className="text-xs text-gray-500 uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{val}</p>
            {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#22c55e"/><text x="7" y="8" textAnchor="middle" fontSize="6" fill="#0f172a" fontWeight="bold">B</text></svg>
              My Buy
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14"><circle cx="7" cy="7" r="5" fill="#ef4444"/><text x="7" y="8" textAnchor="middle" fontSize="6" fill="#0f172a" fontWeight="bold">S</text></svg>
              My Sell
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#16a34a" fillOpacity="0.3" stroke="#16a34a" strokeWidth="1"/><circle cx="7" cy="7" r="3" fill="#16a34a"/></svg>
              Insider Buy
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14"><circle cx="7" cy="7" r="6" fill="#dc2626" fillOpacity="0.3" stroke="#dc2626" strokeWidth="1"/><circle cx="7" cy="7" r="3" fill="#dc2626"/></svg>
              Insider Sell
            </span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 self-start sm:self-auto">
            {PERIODS.map(({ label, days }) => (
              <button key={label} onClick={() => setPeriod(days)}
                className={clsx(
                  "px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                  period === days ? "bg-gray-600 text-gray-100" : "text-gray-500 hover:text-gray-300"
                )}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm text-gray-500">
              {data.prices.length === 0
                ? "No price data yet — click the refresh button above to fetch from Polygon"
                : "No data in this time range"}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={v => period > 0 && period <= 30 ? v.slice(5) : v.slice(0, 7)}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={v => `$${Number(v).toFixed(2)}`}
                domain={yDomain}
                width={60}
                tickLine={false}
                axisLine={false}
                tickCount={6}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={<CustomDot />}
                activeDot={{ r: 4, fill: "#3b82f6", stroke: "#1e3a5f", strokeWidth: 2 }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Trade lists */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            Insider Trades <span className="text-gray-600 font-normal">({data.insider_trades.length})</span>
          </h2>
          <div className="max-h-72 overflow-y-auto">
            {data.insider_trades.length === 0 ? (
              <p className="text-sm text-gray-600 py-4">No insider trades found. Use Fetch on the Insider page.</p>
            ) : (
              [...data.insider_trades].reverse().map((t: any) => (
                <div key={t.id} className="py-2.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium shrink-0",
                        t.is_purchase ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                      )}>
                        {t.is_purchase ? "Buy" : "Sell"}
                      </span>
                      <span className="text-xs text-gray-400 truncate">{t.insider_name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-300 shrink-0">{fmt(t.value)}</span>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-gray-600">{t.insider_title}</span>
                    <span className="text-xs text-gray-600">{formatDate(t.date)}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            My Positions <span className="text-gray-600 font-normal">({data.my_trades.length})</span>
          </h2>
          <div className="max-h-72 overflow-y-auto">
            {data.my_trades.length === 0 ? (
              <p className="text-sm text-gray-600 py-4">No personal trades logged for {data.ticker} yet.</p>
            ) : (
              [...data.my_trades].reverse().map((t) => (
                <div key={t.id} className="py-2.5 border-b border-gray-800 last:border-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={clsx(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                      )}>{t.trade_type.toUpperCase()}</span>
                      <span className="text-sm text-gray-300">{t.shares} × ${t.price.toFixed(2)}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-300">{fmt(t.total_value)}</span>
                  </div>
                  <div className="flex justify-between mt-0.5 gap-2">
                    <span className="text-xs text-gray-600 truncate">{t.notes || "—"}</span>
                    <div className="flex gap-2 text-xs shrink-0">
                      {t.return_1m != null && <span className={returnColor(t.return_1m)}>1M: {formatReturn(t.return_1m)}</span>}
                      {t.return_3m != null && <span className={returnColor(t.return_3m)}>3M: {formatReturn(t.return_3m)}</span>}
                      <span className="text-gray-600">{formatDate(t.date)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

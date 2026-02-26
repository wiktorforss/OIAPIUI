"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { companyApi, type CompanyData } from "@/lib/api";
import { formatCurrency, formatDate, formatReturn, returnColor, tradeTypeBadge } from "@/lib/utils";
import {
  ComposedChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine, Scatter, Legend,
} from "recharts";
import { ArrowLeft, ExternalLink } from "lucide-react";
import clsx from "clsx";

// Custom dot for trade markers on the chart
const TradeDot = (props: any) => {
  const { cx, cy, payload } = props;
  if (!cx || !cy) return null;
  const isBuy = payload.type === "buy" || payload.type === "insider_buy";
  const isInsider = payload.type?.startsWith("insider");
  const color = isBuy ? "#22c55e" : "#ef4444";
  const size  = isInsider ? 8 : 10;
  return (
    <g>
      <circle cx={cx} cy={cy} r={size} fill={color} fillOpacity={0.85} stroke="#111827" strokeWidth={1.5} />
      {isInsider && <circle cx={cx} cy={cy} r={size + 4} fill="none" stroke={color} strokeWidth={1} strokeOpacity={0.4} />}
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-3 text-xs shadow-xl max-w-[220px]">
      <p className="text-gray-400 mb-1">{d.date}</p>
      {d.close && <p className="text-gray-100 font-semibold">${d.close.toFixed(2)}</p>}
      {d.label && <p className="text-gray-300 mt-1">{d.label}</p>}
      {d.value && <p className="text-gray-400">{formatCurrency(d.value)}</p>}
    </div>
  );
};

export default function CompanyPage() {
  const { ticker } = useParams<{ ticker: string }>();
  const router = useRouter();
  const [data, setData]     = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    companyApi.get(ticker)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <button onClick={() => router.back()} className="btn-secondary flex items-center gap-2">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="card text-center py-10">
          <p className="text-red-400">{error || "Failed to load company data"}</p>
        </div>
      </div>
    );
  }

  // Build chart data — merge price history with trade markers
  const priceMap = new Map(data.prices.map(p => [p.date, p.close]));

  // All dates with prices
  const chartData = data.prices.map(p => ({ date: p.date, close: p.close }));

  // Insider trade markers
  const insiderMarkers = data.insider_trades
    .filter(t => t.date && priceMap.has(t.date))
    .map(t => ({
      date:   t.date!,
      close:  priceMap.get(t.date!) ?? null,
      type:   (t.transaction_type?.includes("Purchase") ? "insider_buy" : "insider_sell"),
      label:  `${t.insider_name} (${t.insider_title}) — ${t.transaction_type}`,
      value:  t.value,
    }));

  // My trade markers
  const myMarkers = data.my_trades
    .filter(t => t.date && priceMap.has(t.date))
    .map(t => ({
      date:  t.date!,
      close: priceMap.get(t.date!) ?? t.price,
      type:  t.trade_type,
      label: `My ${t.trade_type}: ${t.shares} shares @ $${t.price}`,
      value: t.total_value,
    }));

  const s = data.summary;

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="btn-secondary p-2">
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-100">{data.ticker}</h1>
            <a
              href={data.yahoo_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Yahoo Finance <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Insider Buys</p>
          <p className="text-xl font-bold text-green-400 mt-1">{s.total_insider_purchases}</p>
          <p className="text-xs text-gray-600 mt-0.5">{formatCurrency(s.total_insider_purchase_value)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Insider Sells</p>
          <p className="text-xl font-bold text-red-400 mt-1">{s.total_insider_sales}</p>
          <p className="text-xs text-gray-600 mt-0.5">{formatCurrency(s.total_insider_sale_value)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">My Buys</p>
          <p className="text-xl font-bold text-green-400 mt-1">{s.my_buy_count}</p>
        </div>
        <div className="card">
          <p className="text-xs text-gray-500 uppercase tracking-wider">My Sells</p>
          <p className="text-xl font-bold text-red-400 mt-1">{s.my_sell_count}</p>
        </div>
      </div>

      {/* Price chart */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-300">Price History + Trade Activity</h2>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Buy</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Sell</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500/40 border border-green-500 inline-block" />Insider</span>
          </div>
        </div>
        {data.prices.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">No price data available from Yahoo Finance for {data.ticker}</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={v => v.slice(0, 7)}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6b7280" }}
                tickFormatter={v => `$${v}`}
                domain={["auto", "auto"]}
                width={55}
              />
              <Tooltip content={<CustomTooltip />} />

              {/* Price line */}
              <Line
                type="monotone"
                dataKey="close"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                activeDot={{ r: 4, fill: "#3b82f6" }}
              />

              {/* Insider trade markers */}
              <Scatter
                data={insiderMarkers}
                shape={<TradeDot />}
                name="Insider trades"
              />

              {/* My trade markers */}
              <Scatter
                data={myMarkers}
                shape={<TradeDot />}
                name="My trades"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Insider trades list */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            Insider Trades <span className="text-gray-600 font-normal">({data.insider_trades.length})</span>
          </h2>
          <div className="space-y-0 max-h-80 overflow-y-auto">
            {data.insider_trades.length === 0 && (
              <p className="text-sm text-gray-600 py-4">No insider trades found. Use the fetch button on the Insider page.</p>
            )}
            {[...data.insider_trades].reverse().map((t) => (
              <div key={t.id} className="py-2.5 border-b border-gray-800 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium shrink-0", tradeTypeBadge(t.transaction_type))}>
                      {t.transaction_type?.includes("Purchase") ? "Buy" : "Sell"}
                    </span>
                    <span className="text-xs text-gray-400 truncate">{t.insider_name}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-300 ml-2 shrink-0">{formatCurrency(t.value)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-600">{t.insider_title}</span>
                  <span className="text-xs text-gray-600">{formatDate(t.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* My trades list */}
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-300 mb-3">
            My Positions <span className="text-gray-600 font-normal">({data.my_trades.length})</span>
          </h2>
          <div className="space-y-0 max-h-80 overflow-y-auto">
            {data.my_trades.length === 0 && (
              <p className="text-sm text-gray-600 py-4">No personal trades logged for {data.ticker} yet.</p>
            )}
            {[...data.my_trades].reverse().map((t) => (
              <div key={t.id} className="py-2.5 border-b border-gray-800 last:border-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={clsx("text-xs px-2 py-0.5 rounded-full font-medium",
                      t.trade_type === "buy" ? "bg-green-900 text-green-300" : "bg-red-900 text-red-300"
                    )}>
                      {t.trade_type.toUpperCase()}
                    </span>
                    <span className="text-sm text-gray-300">{t.shares} × ${t.price.toFixed(2)}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-300">{formatCurrency(t.total_value)}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs text-gray-600">{t.notes || "—"}</span>
                  <div className="flex items-center gap-3 text-xs">
                    {t.return_1m != null && (
                      <span className={returnColor(t.return_1m)}>1M: {formatReturn(t.return_1m)}</span>
                    )}
                    {t.return_3m != null && (
                      <span className={returnColor(t.return_3m)}>3M: {formatReturn(t.return_3m)}</span>
                    )}
                    <span className="text-gray-600">{formatDate(t.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "—";
  return "$" + Math.abs(value).toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export function formatReturn(value: number | null | undefined): string {
  if (value == null) return "—";
  return (value >= 0 ? "+" : "") + value.toFixed(1) + "%";
}

export function returnColor(value: number | null | undefined): string {
  if (value == null) return "text-gray-500";
  return value >= 0 ? "text-green-400" : "text-red-400";
}

/** Normalise transaction_type — DB stores "P", "S", or longer strings */
export function isBuyType(type: string | null | undefined): boolean {
  const t = (type || "").toUpperCase();
  return t === "P" || t.includes("PURCHASE");
}

export function isSaleType(type: string | null | undefined): boolean {
  const t = (type || "").toUpperCase();
  return t === "S" || t.includes("SALE");
}

export function txLabel(type: string | null | undefined): string {
  if (isBuyType(type))  return "Buy";
  if (isSaleType(type)) return "Sell";
  return type?.split(" - ")[1] ?? type ?? "—";
}

export function tradeTypeBadge(type: string | null | undefined): string {
  if (isBuyType(type))  return "bg-green-900 text-green-300";
  if (isSaleType(type)) return "bg-red-900 text-red-300";
  return "bg-gray-800 text-gray-400";
}
